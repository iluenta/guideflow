'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Save, BookOpen, ChevronRight, ChevronLeft, Check, Plus, Trash2, MapPin, Clock, Utensils, HelpCircle, ShieldAlert, Wifi, Package, Home as HomeIcon, Upload, X, Loader2, Phone, MessageSquare, AlertCircle, Info } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { saveWizardStep } from '@/app/actions/wizard'
import { getUploadUrl, getBrandingUploadUrl } from '@/app/actions/properties'
import { processInventoryManuals } from '@/app/actions/ai-ingestion'
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WizardStepper } from './WizardStepper'
import { WizardNavigation } from './WizardNavigation'
import { geocodeAddress, GeocodingResult } from '@/lib/geocoding'
import { validateLocation, ValidationResult } from '@/lib/geocoding-validation'
import MapPreview from './MapPreview'
import TransportInfo from './TransportInfo'
import { VisualScanner } from '@/components/guides/VisualScanner'
import { LocalRecommendations } from '@/components/guides/LocalRecommendations'
import { InventorySelector, InventoryItem, DEFAULT_ITEMS } from './InventorySelector'
import { ThemePreviewCard } from './ThemePreviewCard'
import { PRESET_THEMES, Theme } from '@/lib/themes'
import { harmonizeThemeFromPrimary } from '@/lib/color-harmonizer'

interface PropertySetupWizardProps {
    propertyId?: string // Opcional para creación
    tenantId?: string   // Requerido para creación
    onSuccess?: (id: string) => void
}

export function PropertySetupWizard({ propertyId, tenantId, onSuccess }: PropertySetupWizardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'property')
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState<string | null>(null)
    const [property, setProperty] = useState<any>(null)
    const [data, setData] = useState<any>({
        property: { name: '', slug: '', guests: 2, beds: 1, baths: 1, description: '', primary_color: '#316263', main_image_url: '' },
        welcome: { title: 'Welcome', host_name: '', message: 'Please enjoy your stay' },
        access: { full_address: '', checkin_type: 'lockbox' },
        checkin: { checkin_time: '15:00 - 22:00', emergency_phone: '', steps: [] },
        contacts: {
            support_name: '',
            support_phone: '',
            support_mobile: '',
            host_phone: '',
            host_mobile: '',
            emergency_contacts: [],
            custom_contacts: [],
            preferred_contact_id: 'support'
        },
        rules: { smoking: 'no', pets: 'no', quiet_hours: '22:00 - 08:00', checkout_time: '11:00', rules_items: [] },
        tech: { wifi_ssid: '', wifi_password: '', router_notes: '' },
        inventory: { selected_items: [] },
        dining: [],
        faqs: [],
        branding: {
            theme_id: PRESET_THEMES[0].id,
            custom_primary_color: '',
            custom_logo_url: '',
            computed_theme: PRESET_THEMES[0]
        }
    })
    const [completedSteps, setCompletedSteps] = useState<string[]>([])
    const { toast } = useToast()
    const supabase = createClient()
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [geocoding, setGeocoding] = useState(false)
    const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [aiProgress, setAiProgress] = useState(0)
    const [showRegenerateAlert, setShowRegenerateAlert] = useState(false)
    const [manualEditDetected, setManualEditDetected] = useState(false)

    // Referencias para evitar recalculos innecesarios
    const lastGeocodedAddressRef = useRef<string>('')
    const lastAIPositionRef = useRef<string>('')

    // Auto-geocode cuando el usuario termina de escribir
    useEffect(() => {
        if (!mounted || !data.access.full_address || data.access.full_address.length < 5 || activeTab !== 'access') return

        // Evitar recalculo si la dirección es exactamente la misma que la última geocodificada
        if (data.access.full_address === lastGeocodedAddressRef.current) return

        const timer = setTimeout(() => {
            handleGeocode()
        }, 1200)

        return () => clearTimeout(timer)
    }, [data.access.full_address, activeTab, mounted])

    // Auto-generar transporte cuando cambian las coordenadas
    useEffect(() => {
        if (!mounted || !geocodingResult || activeTab !== 'access') return

        const currentPosKey = `${geocodingResult.lat},${geocodingResult.lng}`

        // Evitar recalculo si la posición es la misma que la última procesada por IA
        if (currentPosKey === lastAIPositionRef.current) return

        // Verificar si ya existen datos de transporte
        const hasTransportData = !!(
            data.access.from_airport ||
            data.access.from_train ||
            data.access.parking?.info ||
            (Array.isArray(data.access.nearby_transport) && data.access.nearby_transport.length > 0)
        )

        // Si ya hay datos, preguntar antes de sobrescribir (independientemente de manualEditDetected)
        if (hasTransportData) {
            setShowRegenerateAlert(true)
            return
        }

        const timer = setTimeout(() => {
            handleAIFill('transport')
        }, 2000)

        return () => clearTimeout(timer)
    }, [geocodingResult?.lat, geocodingResult?.lng, activeTab, mounted])

    // Polling para el estado del inventario (Phase 1: identifying → generating, Phase 2: generating → completed)
    useEffect(() => {
        const status = property?.inventory_status
        if (!propertyId || (status !== 'identifying' && status !== 'generating')) return

        const MAX_POLLING_TIME = 5 * 60 * 1000 // 5 minutos de seguridad
        const startTime = Date.now()

        const interval = setInterval(async () => {
            // Check timeout
            if (Date.now() - startTime > MAX_POLLING_TIME) {
                console.warn('[POLLING] Timeout reached for property:', propertyId)
                clearInterval(interval)
                return
            }

            const { data: prop, error } = await supabase
                .from('properties')
                .select('inventory_status, property_manuals(*)')
                .eq('id', propertyId)
                .single()

            if (error) {
                console.error('[POLLING] Error fetching status:', error.message)
                return
            }

            // Si el estado ha cambiado o hay nuevos manuales, actualizamos
            const hasStatusChanged = prop && prop.inventory_status !== status
            const hasNewManuals = prop && prop.property_manuals?.length !== (property?.manuals?.length || 0)

            if (prop && (hasStatusChanged || hasNewManuals)) {
                // Si ha fallado, paramos el polling
                if (prop.inventory_status === 'failed') {
                    clearInterval(interval)
                    toast({
                        title: "Error en la generación",
                        description: "No se pudieron generar algunos manuales. Por favor, inténtalo de nuevo.",
                        variant: 'destructive'
                    })
                }

                // Sync detection to inventory state automatically
                const newManuals = prop.property_manuals || []
                const trulyDetectedManuals = newManuals.filter((m: any) => m.metadata?.source !== 'inventory_selector')

                setData((prev: any) => {
                    const currentSelected = prev.inventory?.selected_items || []
                    const updatedSelected = [...currentSelected]

                    trulyDetectedManuals.forEach((m: any) => {
                        const manualName = (m.appliance_name || '').toLowerCase().trim()
                        if (manualName.length < 3) return

                        // Find corresponding default item
                        const matchedItem = DEFAULT_ITEMS.find(di => {
                            const itemId = di.id.toLowerCase()
                            const itemName = di.name.toLowerCase()
                            return manualName.includes(itemId) || itemName.includes(manualName)
                        })

                        if (matchedItem) {
                            const existingIndex = updatedSelected.findIndex(i => i.id === matchedItem.id)
                            if (existingIndex === -1) {
                                // Add as newly detected
                                updatedSelected.push({ ...matchedItem, isPresent: true, isFromScanner: true, customContext: '' })
                            } else if (!updatedSelected[existingIndex].isPresent) {
                                updatedSelected[existingIndex] = { ...updatedSelected[existingIndex], isPresent: true, isFromScanner: true }
                            }
                        }
                    })

                    return { ...prev, inventory: { ...prev.inventory, selected_items: updatedSelected } }
                })

                setProperty((prev: any) => ({
                    ...prev,
                    inventory_status: prop.inventory_status,
                    manuals: prop.property_manuals
                }))

                if (prop.inventory_status === 'generating') {
                    setCompletedSteps(prev => Array.from(new Set([...prev, 'visual-scanner'])))
                }

                if (prop.inventory_status === 'completed') {
                    setCompletedSteps(prev => Array.from(new Set([...prev, 'visual-scanner', 'inventory'])))
                    toast({
                        title: "¡Manuales generados!",
                        description: "Los manuales técnicos ya están disponibles en tu guía.",
                    })
                }
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [propertyId, property?.inventory_status, property?.manuals?.length])

    // Calcular progreso
    const steps = ['property', 'appearance', 'access', 'welcome', 'contacts', 'checkin', 'rules', 'tech', 'visual-scanner', 'inventory', 'dining', 'faqs']
    const progress = ((steps.indexOf(activeTab) + 1) / steps.length) * 100

    // Sincronizar activeTab con la URL
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && steps.includes(tab) && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams])

    const handleTabChange = (value: string) => {
        const index = steps.indexOf(value)
        const currentIndex = steps.indexOf(activeTab)
        setDirection(index > currentIndex ? 1 : -1)
        setActiveTab(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.replace(`${pathname}?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const [direction, setDirection] = useState(1)

    const handleNext = async () => {
        setLoading(true)
        try {
            let stepData = null;
            switch (activeTab) {
                case 'property': stepData = data.property; break;
                case 'appearance': stepData = data.branding; break;
                case 'access': stepData = data.access; break;
                case 'welcome': stepData = data.welcome; break;
                case 'contacts': stepData = data.contacts; break;
                case 'checkin': stepData = data.checkin; break;
                case 'rules': stepData = data.rules; break;
                case 'tech': stepData = data.tech; break;
                case 'inventory': stepData = data.inventory; break;
                case 'dining': stepData = data.dining; break;
                case 'faqs': stepData = data.faqs; break;
            }

            if (stepData && activeTab !== 'visual-scanner') {
                await saveStep(activeTab, stepData);
            }

            const currentIndex = steps.indexOf(activeTab)
            if (currentIndex < steps.length - 1) {
                handleTabChange(steps[currentIndex + 1])
            } else {
                toast({ title: "¡Guía completada!", description: "Redirigiendo al panel principal..." })
                router.push(`/dashboard/properties`)
            }
        } catch (error) {
            console.error('Error saving step:', error)
            toast({ title: 'Error al guardar', description: 'Hubo un problema al guardar este paso.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        const currentIndex = steps.indexOf(activeTab)
        if (currentIndex > 0) {
            handleTabChange(steps[currentIndex - 1])
        }
    }

    // Cargar datos iniciales
    useEffect(() => {
        setMounted(true)
        if (!propertyId) return

        async function loadData() {
            const completed: string[] = []

            const { data: propDetails } = await supabase
                .from('properties')
                .select('*, property_manuals(*)')
                .eq('id', propertyId)
                .single()

            if (propDetails) {
                setProperty({ ...propDetails, manuals: propDetails.property_manuals })
                completed.push('property')
                // Initialize geocoding refs to avoid redundant triggers on load
                if (propDetails.full_address) {
                    lastGeocodedAddressRef.current = propDetails.full_address;
                }
                const currentPosKey = `${propDetails.latitude},${propDetails.longitude}`;
                if (propDetails.latitude && propDetails.longitude) {
                    lastAIPositionRef.current = currentPosKey;
                }

                setData((prev: any) => ({
                    ...prev,
                    property: {
                        name: propDetails.name,
                        slug: propDetails.slug,
                        full_address: propDetails.full_address,
                        guests: propDetails.guests,
                        beds: propDetails.beds,
                        baths: propDetails.baths,
                        description: propDetails.description,
                        primary_color: propDetails.theme_config?.primary_color || '#316263',
                        main_image_url: propDetails.main_image_url,
                        latitude: propDetails.latitude,
                        longitude: propDetails.longitude,
                        city: propDetails.city,
                        country: propDetails.country,
                        postal_code: propDetails.postal_code,
                        neighborhood: propDetails.neighborhood,
                        timezone: propDetails.timezone,
                        geocoding_confidence: propDetails.geocoding_confidence,
                        geocoding_source: propDetails.geocoding_source,
                        geocoding_accuracy: propDetails.geocoding_accuracy
                    },
                    access: {
                        ...prev.access,
                        full_address: propDetails.full_address || ''
                    }
                }))

                // Initialize geocoding result if we have coordinates
                if (propDetails.latitude && propDetails.longitude) {
                    setGeocodingResult({
                        lat: propDetails.latitude,
                        lng: propDetails.longitude,
                        city: propDetails.city || '',
                        country: propDetails.country || '',
                        countryCode: propDetails.country_code || '',
                        postalCode: propDetails.postal_code || undefined,
                        neighborhood: propDetails.neighborhood || undefined,
                        timezone: propDetails.timezone || 'Europe/Madrid',
                        confidence: Number(propDetails.geocoding_confidence) || 1,
                        accuracy: propDetails.geocoding_accuracy as any || 'rooftop',
                        source: propDetails.geocoding_source as any || 'mapbox',
                        formattedAddress: propDetails.full_address || ''
                    });
                    // Also set a default valid validation if it's already in DB
                    setValidationResult({ isValid: true, confidence: 1, warnings: [] });
                }

                if (propDetails.inventory_status === 'completed') {
                    completed.push('visual-scanner')
                    completed.push('inventory')
                }
            }

            const { data: context } = await supabase
                .from('property_context')
                .select('*')
                .eq('property_id', propertyId)

            const { data: faqs } = await supabase
                .from('property_faqs')
                .select('*')
                .eq('property_id', propertyId)

            const { data: recommendations } = await supabase
                .from('property_recommendations')
                .select('*')
                .eq('property_id', propertyId)

            if (context || faqs || recommendations) {
                setData((prev: any) => {
                    const newData = { ...prev }
                    context?.forEach((c: any) => {
                        // Merge objects instead of replacing to avoid losing structure
                        if (typeof c.content === 'object' && c.content !== null && !Array.isArray(c.content) && typeof newData[c.category] === 'object') {
                            newData[c.category] = { ...newData[c.category], ...c.content }
                        } else {
                            newData[c.category] = c.content
                        }
                        completed.push(c.category)
                    })
                    if (faqs && faqs.length > 0) {
                        newData.faqs = faqs
                        completed.push('faqs')
                    }
                    if (recommendations && recommendations.length > 0) {
                        newData.dining = recommendations
                        completed.push('dining')
                    }
                    return newData
                })
            }
            const { data: branding, error: brandingError } = await supabase
                .from('property_branding')
                .select('*')
                .eq('property_id', propertyId)
                .maybeSingle()

            if (brandingError) {
                console.error('[LOAD] Branding fetch error:', brandingError)
            } else if (branding) {
                setData((prev: any) => ({
                    ...prev,
                    branding: {
                        theme_id: branding.theme_id,
                        custom_primary_color: branding.custom_primary_color || '',
                        custom_logo_url: branding.custom_logo_url || '',
                        computed_theme: branding.computed_theme || prev.branding.computed_theme
                    }
                }))
                completed.push('appearance')
            }

            setCompletedSteps([...new Set(completed)])
        }
        loadData()
    }, [propertyId])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type)

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })

            if (!response.ok) throw new Error('Error al subir la imagen')

            setData((prev: any) => ({
                ...prev,
                property: { ...prev.property, main_image_url: publicUrl }
            }))
            toast({ title: 'Imagen subida', description: 'La foto principal se ha guardado.' })
        } catch (error) {
            console.error('Upload error:', error)
            toast({ title: 'Error de subida', description: 'No pudimos subir la imagen.', variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const handleStepImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type)

            const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            })

            if (!response.ok) throw new Error('Error al subir la imagen')

            const newSteps = [...data.checkin.steps]
            newSteps[idx] = { ...newSteps[idx], image_url: publicUrl }
            setData({ ...data, checkin: { ...data.checkin, steps: newSteps } })

            toast({ title: 'Imagen subida', description: 'La foto se ha añadido al paso.' })
        } catch (error) {
            console.error('Upload error:', error)
            toast({ title: 'Error de subida', description: 'No pudimos subir la imagen.', variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const handleGeocode = async () => {
        if (!data.access.full_address) {
            toast({ title: 'Atención', description: 'Por favor, introduce una dirección primero.' });
            return;
        }

        setGeocoding(true);
        try {
            const result = await geocodeAddress(data.access.full_address);
            const validation = await validateLocation(result, data.access.full_address);

            setGeocodingResult(result);
            setValidationResult(validation);

            // Guardar la dirección procesada para evitar bucles
            lastGeocodedAddressRef.current = data.access.full_address;

            setData((prev: any) => ({
                ...prev,
                access: {
                    ...prev.access,
                    lat: result.lat,
                    lng: result.lng,
                    latitude: result.lat,
                    longitude: result.lng,
                    city: result.city,
                    country: result.country,
                    postal_code: result.postalCode,
                    country_code: result.countryCode,
                    neighborhood: result.neighborhood,
                    timezone: result.timezone,
                    geocoding_confidence: result.confidence,
                    geocoding_source: result.source,
                    geocoding_accuracy: result.accuracy
                }
            }));

            toast({
                title: validation.isValid ? 'Ubicación detectada' : 'Ubicación detectada con avisos',
                description: 'Revisa el mapa para confirmar la exactitud.'
            });
        } catch (error: any) {
            console.error('Geocoding error:', error);
            toast({
                title: 'Error de ubicación',
                description: 'No pudimos encontrar esa dirección. Intenta ser más específico.',
                variant: 'destructive'
            });
        } finally {
            setGeocoding(false);
        }
    };

    const handleSaveAccess = async () => {
        const { access } = data;

        // Sanitizar datos para eliminar claves obsoletas y asegurar formato correcto
        const sanitizedData = {
            full_address: access.full_address,
            latitude: geocodingResult?.lat || access.lat || access.latitude,
            longitude: geocodingResult?.lng || access.lng || access.longitude,
            city: geocodingResult?.city || access.city,
            country: geocodingResult?.country || access.country,
            postal_code: geocodingResult?.postalCode || access.postal_code,
            country_code: geocodingResult?.countryCode || access.country_code,
            neighborhood: geocodingResult?.neighborhood || access.neighborhood,
            timezone: geocodingResult?.timezone || access.timezone,
            geocoding_confidence: geocodingResult?.confidence || access.geocoding_confidence,
            geocoding_source: geocodingResult?.source || access.geocoding_source,
            geocoding_accuracy: geocodingResult?.accuracy || access.geocoding_accuracy,
            checkin_type: access.checkin_type || 'lockbox',
            checkin_instructions: access.checkin_instructions || '',
            from_airport: access.from_airport,
            from_train: access.from_train,
            parking: access.parking,
            nearby_transport: access.nearby_transport
        };

        console.log('[WIZARD] Saving sanitized access data:', sanitizedData);
        await saveStep('access', sanitizedData, 'welcome');
    };

    const saveStep = async (category: string, stepData: any, forcedNextTab?: string) => {
        setLoading(true)
        try {
            const currentPropId = propertyId || property?.id

            // Sanitización específica para evitar objetos no planos (componentes React) en Server Actions
            let dataToSave = stepData;
            if (category === 'tech') {
                const { tv_instructions, ...sanitizedTech } = stepData;
                dataToSave = sanitizedTech;
                console.log('[WIZARD] Saving sanitized tech data (removed legacy fields):', dataToSave);
            } else if (category === 'inventory' && stepData?.selected_items) {
                // Eliminar el campo 'icon' de los elementos, ya que contiene componentes React no serializables
                dataToSave = {
                    ...stepData,
                    selected_items: stepData.selected_items.map(({ icon, ...rest }: any) => rest)
                };
                console.log('[WIZARD] Saving sanitized inventory data (removed React icons):', dataToSave);
            }

            const result = await saveWizardStep(
                category,
                dataToSave,
                currentPropId,
                tenantId
            )

            if (result.success) {
                if (result.property) {
                    setProperty(result.property)
                    // Sincronizar también el objeto data para que las previsualizaciones sean correctas
                    setData((prev: any) => ({
                        ...prev,
                        property: {
                            ...prev.property,
                            full_address: result.property.full_address,
                            latitude: result.property.latitude,
                            longitude: result.property.longitude,
                            city: result.property.city,
                            country: result.property.country,
                            postal_code: result.property.postal_code,
                            neighborhood: result.property.neighborhood,
                            timezone: result.property.timezone
                        },
                        access: {
                            ...prev.access,
                            full_address: result.property.full_address || prev.access.full_address
                        }
                    }))

                    // Actualizar refs para evitar disparos de IA inmediatos tras guardar
                    if (result.property.full_address) {
                        lastGeocodedAddressRef.current = result.property.full_address;
                    }
                    if (result.property.latitude && result.property.longitude) {
                        lastAIPositionRef.current = `${result.property.latitude},${result.property.longitude}`;
                    }
                }

                if (result.isNew) {
                    if (onSuccess) onSuccess(result.property.id)
                    router.push(`/dashboard/properties/${result.property.id}/setup?tab=appearance`)
                    return
                }

                toast({ title: 'Guardado', description: `${category} actualizado correctamente.` })

                // --- PROCESAMIENTO EN SEGUNDO PLANO PARA INVENTARIO ---
                if (category === 'inventory' && dataToSave.selected_items) {
                    // No bloqueamos el UI, lanzamos y avisamos
                    processInventoryManuals(currentPropId, dataToSave.selected_items).then(res => {
                        console.log('[INVENTORY] Background processing finished:', res)
                        if (res.processed && res.processed > 0) {
                            toast({
                                title: 'IA: Manuales Generados',
                                description: `Se han creado ${res.processed} nuevas guías basadas en tu selección.`,
                                variant: 'default'
                            })
                        }
                    }).catch(err => {
                        console.error('[INVENTORY] Background processing failed:', err)
                    })
                }

                const stepKey = category === 'branding' ? 'appearance' : category
                setCompletedSteps(prev => Array.from(new Set([...prev, stepKey])))

                if (category === 'faqs') {
                    router.push('/dashboard/properties')
                    return
                }

                if (forcedNextTab) {
                    handleTabChange(forcedNextTab)
                    return
                }

                const nextIdx = steps.indexOf(category) + 1
                if (nextIdx < steps.length) {
                    handleTabChange(steps[nextIdx])
                }
            }
        } catch (e: any) {
            console.error('Error in saveStep:', e)
            toast({ title: 'Error', description: e.message || 'Error desconocido al guardar', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleAIFill = async (section: string, category: string = 'todos') => {
        const isTransport = ['transport', 'plane', 'train', 'road'].includes(section);
        if (isTransport) {
            setAiProgress(0)
            const interval = setInterval(() => {
                setAiProgress(prev => Math.min(prev + 5, 95))
            }, 600)

                // Limpiar intervalo cuando la carga termine (esto se maneja en el finally)
                ; (window as any)._aiInterval = interval
        }

        const currentPropId = propertyId || property?.id
        if (!currentPropId) {
            console.warn('[WIZARD-AI] Cannot use AI fill without a saved property ID')
            return
        }

        setAiLoading(section)
        const finalAddressToUse = data.access.full_address;

        const payload: any = {
            propertyId: currentPropId,
            section,
            existingData: section === 'dining' || section === 'recommendations'
                ? {
                    address: finalAddressToUse,
                    category,
                    existingNames: data.dining.map((r: any) => r.name)
                }
                : (isTransport ? { address: finalAddressToUse, coordinates: geocodingResult } : undefined)
        }

        if (section === 'faqs') {
            payload.existingData = {
                checkin_time: data.checkin.checkin_time,
                quiet_hours: data.rules.quiet_hours
            }
        }

        // Registrar la posición que disparó la IA
        if (isTransport && geocodingResult) {
            lastAIPositionRef.current = `${geocodingResult.lat},${geocodingResult.lng}`;
        }

        console.log(`[WIZARD-AI] Requesting AI Fill for ${section}:`, payload)

        try {
            const res = await fetch('/api/ai-fill-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const result = await res.json()

            if (isTransport) {
                clearInterval((window as any)._aiInterval)
                setAiProgress(100)
                setManualEditDetected(false)
            }

            if (section === 'dining') {
                const incomingRecs = result.recommendations || [];

                // Deduplicate within the incoming results first (by name)
                const uniqueIncoming = incomingRecs.reduce((acc: any[], current: any) => {
                    const exists = acc.find(item => item.name.toLowerCase().trim() === current.name.toLowerCase().trim());
                    if (!exists) return [...acc, current];
                    return acc;
                }, []);

                // Deduplicate against existing data (by name)
                const newRecs = uniqueIncoming.filter((nr: any) =>
                    !data.dining.some((er: any) => er.name.toLowerCase().trim() === nr.name.toLowerCase().trim())
                );

                if (newRecs.length === 0 && incomingRecs.length > 0) {
                    toast({
                        title: 'Recomendaciones existentes',
                        description: 'Las sugerencias generadas ya están en tu lista.',
                    });
                } else {
                    setData((prev: any) => ({ ...prev, dining: [...prev.dining, ...newRecs] }));
                }
            } else if (section === 'faqs') {
                // Filter out duplicates
                const newFaqs = result.faqs.filter((nf: any) =>
                    !data.faqs.some((ef: any) => ef.question.toLowerCase().trim() === nf.question.toLowerCase().trim())
                );

                if (newFaqs.length === 0 && result.faqs && result.faqs.length > 0) {
                    toast({
                        title: 'FAQs duplicadas',
                        description: 'Las preguntas generadas por la IA ya están en tu lista.',
                        variant: 'default'
                    });
                } else {
                    setData((prev: any) => ({ ...prev, faqs: [...prev.faqs, ...newFaqs] }))
                }
            } else if (section === 'transport') {
                setData((prev: any) => ({
                    ...prev,
                    access: {
                        ...prev.access,
                        ...result.access_info,
                        full_address: prev.access.full_address || ''
                    }
                }))
            } else if (section === 'tech') {
                setData((prev: any) => ({
                    ...prev,
                    tech: {
                        ...prev.tech,
                        wifi_ssid: result.tech_info?.wifi?.ssid_example || '',
                        wifi_password: result.tech_info?.wifi?.password_hint || '',
                        router_notes: result.tech_info?.wifi?.router_location || ''
                    }
                }))
            } else if (section === 'inventory') {
                setData((prev: any) => ({ ...prev, inventory: result.inventory }))
            } else if (section === 'contacts') {
                setData((prev: any) => ({
                    ...prev,
                    contacts: {
                        ...prev.contacts,
                        emergency_contacts: result.emergency_contacts || []
                    }
                }))
            }

            toast({ title: 'IA Generada', description: 'Hemos añadido sugerencias reales basadas en tu ubicación.' })
        } catch (e: any) {
            toast({ title: 'Error IA', description: 'No pudimos generar sugerencias en este momento.', variant: 'destructive' })
        } finally {
            setAiLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col pt-12">
            {/* Header */}
            <header className="bg-transparent pt-8 pb-4 text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold text-navy mb-3 font-serif italic tracking-tighter">
                    Configura tu Guía Mágica
                </h1>
                <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto font-medium">
                    Rellena la información para que tu asistente IA pueda ayudar a tus huéspedes.
                </p>
            </header>

            {/* Stepper */}
            <WizardStepper
                activeTab={activeTab}
                onStepClick={handleTabChange}
                completedSteps={completedSteps}
            />

            {!mounted ? (
                <div className="w-full h-96 bg-slate-50 animate-pulse rounded-3xl" />
            ) : (
                <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-48 md:pb-12 mt-4">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            initial={{ x: direction * 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction * -20, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                                {/* --- PROPIEDAD --- */}
                                <TabsContent value="property" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <CardTitle className="text-base">Información Básica</CardTitle>
                                            <CardDescription className="text-xs">Configura los datos principales de tu alojamiento.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            {/* Zona de Subida de Imagen */}
                                            <div className="space-y-2">
                                                <Label>Imagen principal de tu alojamiento</Label>
                                                <div
                                                    className={cn(
                                                        "relative aspect-[16/6] md:aspect-[16/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary/50 group cursor-pointer",
                                                        data.property.main_image_url && "border-solid border-slate-100"
                                                    )}
                                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                                >
                                                    {data.property.main_image_url ? (
                                                        <>
                                                            <Image src={data.property.main_image_url} alt="Portada" fill className="object-cover transition-transform group-hover:scale-105 duration-700" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <Button type="button" variant="secondary" size="sm" className="h-8 gap-2 bg-white/90 hover:bg-white text-navy font-bold shadow-xl">
                                                                    <Upload className="w-3.5 h-3.5" /> Cambiar foto
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setData({ ...data, property: { ...data.property, main_image_url: '' } })
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 p-4 text-center">
                                                            <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                                                <Upload className="h-5 w-5" />
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <p className="font-bold text-xs">Subir foto destacada</p>
                                                                <p className="text-[10px] text-muted-foreground">Recomendado formato panorámico (JPEG, PNG)</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {uploading && (
                                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subiendo...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label>Nombre del alojamiento</Label>
                                                        <Input
                                                            placeholder="Ej: Villa Sol y Mar"
                                                            className="h-11"
                                                            value={data.property?.name || ''}
                                                            onChange={e => setData({ ...data, property: { ...data.property, name: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Slug (URL personalizada)</Label>
                                                        <Input
                                                            placeholder="villa-sol-mar"
                                                            className="h-11"
                                                            value={data.property?.slug || ''}
                                                            onChange={e => setData({ ...data, property: { ...data.property, slug: e.target.value.toLowerCase().replace(/ /g, '-') } })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Huéspedes</Label>
                                                            <Input
                                                                type="number"
                                                                className="h-11"
                                                                value={data.property?.guests || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                    setData({ ...data, property: { ...data.property, guests: isNaN(val) ? 0 : val } });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Hab.</Label>
                                                            <Input
                                                                type="number"
                                                                className="h-11"
                                                                value={data.property?.beds || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                    setData({ ...data, property: { ...data.property, beds: isNaN(val) ? 0 : val } });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Baños</Label>
                                                            <Input
                                                                type="number"
                                                                className="h-11"
                                                                value={data.property?.baths || ''}
                                                                onChange={e => {
                                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                    setData({ ...data, property: { ...data.property, baths: isNaN(val) ? 0 : val } });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Descripción de la propiedad</Label>
                                                <Textarea
                                                    placeholder="Una breve descripción que ayudará a la IA a entender mejor tu alojamiento..."
                                                    className="min-h-[100px]"
                                                    value={data.property?.description || ''}
                                                    onChange={e => setData({ ...data, property: { ...data.property, description: e.target.value } })}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- CHECK-IN --- */}
                                <TabsContent value="checkin" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <CardTitle className="text-base">Pasos del Check-in</CardTitle>
                                            <CardDescription className="text-xs">Define los pasos que debe seguir el huésped para entrar.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">Horario de Check-in Disponible</Label>
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="Ej: 15:00 - 22:00"
                                                            className="h-11 pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                                            value={data.checkin.checkin_time}
                                                            onChange={e => setData({ ...data, checkin: { ...data.checkin, checkin_time: e.target.value } })}
                                                        />
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    </div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                                                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                    <p className="text-[11px] text-blue-700 leading-tight">
                                                        <span className="font-bold">Contacto de asistencia:</span> Sincronizado automáticamente con tu "Contacto Preferente". Puedes cambiarlo en la pestaña anterior.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Pasos Numerados
                                                </Label>

                                                {/* Paso 1 Fijo: Dirección */}
                                                <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/30 flex gap-4 opacity-80">
                                                    <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 font-bold text-sm text-navy">
                                                            <MapPin className="w-4 h-4" /> Dirección (Fijo)
                                                        </div>
                                                        <p className="text-sm text-slate-500">{data.access.full_address || 'Introduce la dirección en la pestaña Acceso'}</p>
                                                    </div>
                                                </div>

                                                {/* Pasos Dinámicos */}
                                                <div className="space-y-3">
                                                    {data.checkin.steps.map((step: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex gap-4 animate-in slide-in-from-right-2 duration-200">
                                                            <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                                {idx + 2}
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Título del paso (ej: Código del portero)"
                                                                        className="font-bold border-none bg-slate-50/50 focus-visible:ring-0 h-9 flex-1"
                                                                        value={step.title}
                                                                        onChange={e => {
                                                                            const newSteps = [...data.checkin.steps];
                                                                            newSteps[idx].title = e.target.value;
                                                                            setData({ ...data, checkin: { ...data.checkin, steps: newSteps } });
                                                                        }}
                                                                    />
                                                                    <select
                                                                        className="h-9 px-2 rounded-md border-none bg-slate-50/50 text-xs font-semibold text-navy focus:ring-0"
                                                                        value={step.icon || 'Key'}
                                                                        onChange={e => {
                                                                            const newSteps = [...data.checkin.steps];
                                                                            newSteps[idx].icon = e.target.value;
                                                                            setData({ ...data, checkin: { ...data.checkin, steps: newSteps } });
                                                                        }}
                                                                    >
                                                                        <option value="Key">Llave</option>
                                                                        <option value="Lock">Código</option>
                                                                        <option value="DoorOpen">Puerta</option>
                                                                        <option value="Phone">Teléfono</option>
                                                                        <option value="Info">Info</option>
                                                                        <option value="Wifi">WiFi</option>
                                                                    </select>
                                                                </div>
                                                                <Textarea
                                                                    placeholder="Descripción o instrucciones..."
                                                                    className="border-none bg-slate-50/30 focus-visible:ring-0 min-h-[60px] text-sm"
                                                                    value={step.description}
                                                                    onChange={e => {
                                                                        const newSteps = [...data.checkin.steps];
                                                                        newSteps[idx].description = e.target.value;
                                                                        setData({ ...data, checkin: { ...data.checkin, steps: newSteps } });
                                                                    }}
                                                                />

                                                                {/* Image Upload for Step */}
                                                                <div className="flex items-center gap-4 pt-2">
                                                                    {step.image_url ? (
                                                                        <div className="relative w-24 h-24 rounded-xl overflow-hidden group/img">
                                                                            <img src={step.image_url} alt="Step preview" className="w-full h-full object-cover" />
                                                                            <button
                                                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                                onClick={() => {
                                                                                    const newSteps = [...data.checkin.steps];
                                                                                    newSteps[idx].image_url = '';
                                                                                    setData({ ...data, checkin: { ...data.checkin, steps: newSteps } });
                                                                                }}
                                                                            >
                                                                                <Trash2 className="w-5 h-5 text-white" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors"
                                                                            onClick={() => document.getElementById(`step-image-${idx}`)?.click()}
                                                                        >
                                                                            <Upload className="w-4 h-4 text-slate-400" />
                                                                            <span className="text-[10px] font-bold text-slate-500">Añadir foto</span>
                                                                            <input
                                                                                id={`step-image-${idx}`}
                                                                                type="file"
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={(e) => handleStepImageUpload(idx, e)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <p className="text-[10px] text-slate-400 max-w-[150px]">
                                                                        Sube una foto del portal, del cajetín de llaves o de la puerta para ayudar al huésped.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-300 hover:text-destructive self-start"
                                                                onClick={() => {
                                                                    const newSteps = [...data.checkin.steps];
                                                                    newSteps.splice(idx, 1);
                                                                    setData({ ...data, checkin: { ...data.checkin, steps: newSteps } });
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-12 border-dashed border-2 rounded-2xl hover:bg-slate-50 text-slate-500 font-semibold"
                                                        onClick={() => setData({
                                                            ...data,
                                                            checkin: {
                                                                ...data.checkin,
                                                                steps: [...data.checkin.steps, { title: '', description: '', icon: 'Key' }]
                                                            }
                                                        })}
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" /> Añadir otro paso
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- CONTACTOS --- */}
                                <TabsContent value="contacts" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle className="text-base">Contactos y Emergencias</CardTitle>
                                                    <CardDescription className="text-xs">Personas de contacto durante la estancia y servicios de emergencia.</CardDescription>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[10px] font-bold uppercase tracking-wider border-navy/20 text-navy hover:bg-navy/5"
                                                    onClick={() => handleAIFill('contacts')}
                                                    disabled={aiLoading === 'contacts' || !data.access.full_address}
                                                >
                                                    {aiLoading === 'contacts' ? (
                                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                    ) : (
                                                        <Sparkles className="w-3 h-3 mr-2" />
                                                    )}
                                                    {aiLoading === 'contacts' ? 'Generando...' : 'Autocompletar Emergencias'}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-6">
                                            {/* Contacto de Soporte */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldAlert className="w-3 h-3" /> Soporte Oficial
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 px-3 text-[10px] gap-1.5 rounded-full transition-all",
                                                            data.contacts.preferred_contact_id === 'support'
                                                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                        )}
                                                        onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'support' } })}
                                                    >
                                                        <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'support' ? "opacity-100" : "opacity-0")} />
                                                        {data.contacts.preferred_contact_id === 'support' ? 'CONTACTO PREFERENTE' : 'MARCAR COMO PREFERENTE'}
                                                    </Button>
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Nombre (Ej: Soporte GuideFlow)</Label>
                                                        <Input
                                                            placeholder="Ej: Atención al Cliente"
                                                            value={data.contacts.support_name}
                                                            onChange={e => setData({ ...data, contacts: { ...data.contacts, support_name: e.target.value } })}
                                                            className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="support_phone" className="text-xs font-bold text-navy/60">Teléfono Principal (Llamadas)</Label>
                                                        <Input
                                                            id="support_phone"
                                                            placeholder="Ej: 912345678"
                                                            value={data.contacts.support_phone}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setData((prev: any) => ({
                                                                    ...prev,
                                                                    contacts: { ...prev.contacts, support_phone: val },
                                                                    checkin: { ...prev.checkin, emergency_phone: val }
                                                                }));
                                                            }}
                                                            className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="support_mobile" className="text-xs font-bold text-navy/60">Teléfono Móvil (WhatsApp)</Label>
                                                        <Input
                                                            id="support_mobile"
                                                            placeholder="Ej: 666123456"
                                                            value={data.contacts.support_mobile}
                                                            onChange={(e) => setData((prev: any) => ({
                                                                ...prev,
                                                                contacts: { ...prev.contacts, support_mobile: e.target.value }
                                                            }))}
                                                            className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contacto del Anfitrión */}
                                            <div className="space-y-4 border-t pt-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2 flex-1">
                                                        <Sparkles className="w-3 h-3" /> Tu Contacto (Anfitrión)
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "h-7 px-3 text-[10px] gap-1.5 rounded-full transition-all ml-4",
                                                                data.contacts.preferred_contact_id === 'host'
                                                                    ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                            )}
                                                            onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: 'host' } })}
                                                        >
                                                            <Check className={cn("w-3 h-3", data.contacts.preferred_contact_id === 'host' ? "opacity-100" : "opacity-0")} />
                                                            {data.contacts.preferred_contact_id === 'host' ? 'CONTACTO PREFERENTE' : 'MARCAR COMO PREFERENTE'}
                                                        </Button>
                                                    </h3>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-[10px] h-6 px-2 text-primary hover:text-primary/80"
                                                        onClick={() => {
                                                            setData({
                                                                ...data,
                                                                contacts: {
                                                                    ...data.contacts,
                                                                    host_phone: data.contacts.support_phone || data.contacts.host_phone,
                                                                    host_mobile: data.contacts.support_mobile || data.contacts.host_mobile
                                                                }
                                                            })
                                                            toast({
                                                                title: "Teléfonos sincronizados",
                                                                description: "Se han copiado los números del soporte al anfitrión."
                                                            })
                                                        }}
                                                    >
                                                        Sincronizar Teléfono
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Nombre</Label>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 h-12">
                                                            <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-navy shadow-sm shrink-0">
                                                                <HomeIcon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-navy truncate">{data.welcome?.host_name || 'No definido'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="host_phone" className="text-xs font-bold text-navy/60">Teléfono Principal (Llamadas)</Label>
                                                        <Input
                                                            id="host_phone"
                                                            placeholder="Ej: 912345678"
                                                            value={data.contacts.host_phone}
                                                            onChange={(e) => setData((prev: any) => ({
                                                                ...prev,
                                                                contacts: { ...prev.contacts, host_phone: e.target.value }
                                                            }))}
                                                            className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="host_mobile" className="text-xs font-bold text-navy/60">Teléfono Móvil (WhatsApp)</Label>
                                                        <Input
                                                            id="host_mobile"
                                                            placeholder="Ej: 666123456"
                                                            value={data.contacts.host_mobile}
                                                            onChange={(e) => setData((prev: any) => ({
                                                                ...prev,
                                                                contacts: { ...prev.contacts, host_mobile: e.target.value }
                                                            }))}
                                                            className="bg-[#F9F6F2] border-none rounded-xl h-12"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Emergencias IA */}
                                            <div className="space-y-4 border-t pt-6">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2">
                                                    <AlertCircle className="w-3 h-3" /> Emergencias Locales
                                                </h3>

                                                <div className="space-y-3">
                                                    {data.contacts.emergency_contacts.map((contact: any, idx: number) => (
                                                        <div key={contact.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 group">
                                                            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                                                {contact.type === 'policia' && <ShieldAlert className="w-5 h-5" />}
                                                                {contact.type === 'salud' && <Plus className="w-5 h-5" />}
                                                                {contact.type === 'farmacia' && <AlertCircle className="w-5 h-5" />}
                                                                {(!contact.type || contact.type === 'bomberos') && <Phone className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <Input
                                                                        placeholder="Nombre del servicio"
                                                                        className="font-bold border-none bg-slate-50 h-9"
                                                                        value={contact.name}
                                                                        onChange={e => {
                                                                            const newContacts = [...data.contacts.emergency_contacts];
                                                                            newContacts[idx].name = e.target.value;
                                                                            setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } });
                                                                        }}
                                                                    />
                                                                    <Input
                                                                        placeholder="Teléfono (ej: +34...)"
                                                                        className="border-none bg-slate-50 h-9"
                                                                        value={contact.phone}
                                                                        onChange={e => {
                                                                            const newContacts = [...data.contacts.emergency_contacts];
                                                                            newContacts[idx].phone = e.target.value;
                                                                            setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                                    <div className="md:col-span-3">
                                                                        <Input
                                                                            placeholder="Dirección exacta para navegación"
                                                                            className="border-none bg-slate-50 h-9 text-xs"
                                                                            value={contact.address || ''}
                                                                            onChange={e => {
                                                                                const newContacts = [...data.contacts.emergency_contacts];
                                                                                newContacts[idx].address = e.target.value;
                                                                                setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <Input
                                                                        placeholder="Distancia (ej: 5 min)"
                                                                        className="border-none bg-slate-50 h-9 text-xs"
                                                                        value={contact.distance || ''}
                                                                        onChange={e => {
                                                                            const newContacts = [...data.contacts.emergency_contacts];
                                                                            newContacts[idx].distance = e.target.value;
                                                                            setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity"
                                                                onClick={() => {
                                                                    const newContacts = [...data.contacts.emergency_contacts];
                                                                    newContacts.splice(idx, 1);
                                                                    setData({ ...data, contacts: { ...data.contacts, emergency_contacts: newContacts } });
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500"
                                                        onClick={() => {
                                                            setData({
                                                                ...data,
                                                                contacts: {
                                                                    ...data.contacts,
                                                                    emergency_contacts: [
                                                                        ...data.contacts.emergency_contacts,
                                                                        { id: crypto.randomUUID(), name: '', phone: '', address: '', type: 'salud', distance: '' }
                                                                    ]
                                                                }
                                                            })
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-2" /> Añadir Emergencia
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Otros Contactos */}
                                            <div className="space-y-4 border-t pt-6">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-navy/40 flex items-center gap-2">
                                                    <Plus className="w-3 h-3" /> Otros Contactos (Taxi, Mantenimiento...)
                                                </h3>
                                                <div className="space-y-3">
                                                    {data.contacts.custom_contacts.map((contact: any, idx: number) => (
                                                        <div key={contact.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center gap-4 group">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <button
                                                                    onClick={() => setData({ ...data, contacts: { ...data.contacts, preferred_contact_id: contact.id } })}
                                                                    className={cn(
                                                                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                                        data.contacts.preferred_contact_id === contact.id
                                                                            ? "bg-green-500 text-white shadow-lg scale-110"
                                                                            : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                                                    )}
                                                                    title="Marcar como contacto preferente"
                                                                >
                                                                    <Check className={cn("w-5 h-5", data.contacts.preferred_contact_id === contact.id ? "opacity-100" : "opacity-20")} />
                                                                </button>
                                                                {data.contacts.preferred_contact_id === contact.id && (
                                                                    <span className="text-[7px] font-black text-green-600 uppercase tracking-tighter">PREFERENTE</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <Input
                                                                    placeholder="Etiqueta (ej: Radio Taxi)"
                                                                    className="font-bold border-none bg-slate-50/50 h-9"
                                                                    value={contact.name}
                                                                    onChange={e => {
                                                                        const newContacts = [...data.contacts.custom_contacts];
                                                                        newContacts[idx].name = e.target.value;
                                                                        setData({ ...data, contacts: { ...data.contacts, custom_contacts: newContacts } });
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="Teléfono"
                                                                    className="border-none bg-slate-50/50 h-9"
                                                                    value={contact.phone}
                                                                    onChange={e => {
                                                                        const newContacts = [...data.contacts.custom_contacts];
                                                                        newContacts[idx].phone = e.target.value;
                                                                        setData({ ...data, contacts: { ...data.contacts, custom_contacts: newContacts } });
                                                                    }}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-destructive transition-opacity"
                                                                onClick={() => {
                                                                    const newContacts = [...data.contacts.custom_contacts];
                                                                    newContacts.splice(idx, 1);
                                                                    setData({ ...data, contacts: { ...data.contacts, custom_contacts: newContacts } });
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        className="w-full h-10 border-dashed border-2 rounded-xl text-xs text-slate-500"
                                                        onClick={() => {
                                                            setData({
                                                                ...data,
                                                                contacts: {
                                                                    ...data.contacts,
                                                                    custom_contacts: [
                                                                        ...data.contacts.custom_contacts,
                                                                        { id: crypto.randomUUID(), name: '', phone: '' }
                                                                    ]
                                                                }
                                                            })
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-2" /> Añadir Contacto
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- BIENVENIDA --- */}
                                <TabsContent value="welcome" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <CardTitle className="text-base">Saludo de Bienvenida</CardTitle>
                                            <CardDescription className="text-xs">Lo primero que verán tus huéspedes al abrir la guía.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-4 w-full">
                                                <div className="space-y-2">
                                                    <Label>Título del Saludo</Label>
                                                    <Input
                                                        placeholder="Ej: ¡Bienvenidos a Casa Marina!"
                                                        className="h-11"
                                                        value={data.welcome.title}
                                                        onChange={e => setData({ ...data, welcome: { ...data.welcome, title: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nombre del Anfitrión</Label>
                                                    <Input
                                                        placeholder="Ej: María & Juan"
                                                        className="h-11"
                                                        value={data.welcome?.host_name || ''}
                                                        onChange={e => setData({ ...data, welcome: { ...data.welcome, host_name: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Mensaje Personal</Label>
                                                    <Textarea
                                                        placeholder="Ej: Estamos encantados de teneros aquí. Disfrutad de vuestra estancia..."
                                                        className="min-h-[140px]"
                                                        value={data.welcome?.message || ''}
                                                        onChange={e => setData({ ...data, welcome: { ...data.welcome, message: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- ACCESO --- */}
                                <TabsContent value="access" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle className="text-base">Llegada y Acceso</CardTitle>
                                                    <CardDescription className="text-xs">Cómo llegan tus huéspedes y cómo entran a la casa.</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-slate-700">Dirección Completa</Label>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Ej: Calle Mayor 123, Madrid"
                                                        className="h-12 flex-1 pr-10 shadow-sm border-slate-200 focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                                                        value={data.access?.full_address || ''}
                                                        onChange={e => {
                                                            setData((prev: any) => ({
                                                                ...prev,
                                                                access: { ...prev.access, full_address: e.target.value }
                                                            }));
                                                            // Ya no limpiamos el resultado aquí para permitir el debounce suave
                                                        }}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                        {geocoding ? (
                                                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                        ) : geocodingResult ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <MapPin className="w-4 h-4 text-slate-300" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1 duration-500">
                                                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                                                    <p className="text-[10px] text-blue-700 leading-tight">
                                                        <strong>Tip de IA:</strong> Introduce solo Calle, Número y Ciudad. Evita portal, piso o letra para que la IA proporcione transporte y parking más precisos.
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground italic pl-1">
                                                    💡 Incluye ciudad y país para mayor precisión (ej: Calle Mayor 1, Madrid, España)
                                                </p>
                                            </div>

                                            {/* Mapa */}
                                            {geocodingResult && (
                                                <div className="mt-2 group relative">
                                                    <MapPreview
                                                        lat={geocodingResult.lat}
                                                        lng={geocodingResult.lng}
                                                        onPositionChange={(lat, lng) => {
                                                            setGeocodingResult(prev => prev ? { ...prev, lat, lng } : null)
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Validación y Feedback */}
                                            {validationResult && (
                                                <div className={cn(
                                                    "p-4 rounded-xl border flex items-start gap-3 transition-colors",
                                                    validationResult.isValid ? "bg-green-50/50 border-green-100" : "bg-orange-50/50 border-orange-100"
                                                )}>
                                                    <div className={cn(
                                                        "p-1.5 rounded-full",
                                                        validationResult.isValid ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                                                    )}>
                                                        {validationResult.isValid ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className={cn("text-xs font-bold", validationResult.isValid ? "text-green-900" : "text-orange-900")}>
                                                            {validationResult.isValid ? 'Ubicación Verificada' : 'Ubicación Aproximada'}
                                                        </h4>
                                                        <p className={cn("text-[11px] mt-0.5", validationResult.isValid ? "text-green-700" : "text-orange-700")}>
                                                            {validationResult.warnings[0] || (validationResult.isValid ? 'La dirección parece correcta.' : 'Revisa los detalles de la ubicación.')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Alerta de Regeneración */}
                                            {showRegenerateAlert && (
                                                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="bg-primary/20 p-2 rounded-lg">
                                                            <Sparkles className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-primary-dark">¿Quieres actualizar las rutas?</p>
                                                            <p className="text-[11px] text-primary/70 mt-0.5">Has movido el marcador. Podemos regenerar la información de transporte para que coincida exactamente con la nueva ubicación.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 text-[10px] flex-1 font-bold"
                                                            onClick={() => {
                                                                handleAIFill('transport')
                                                                setShowRegenerateAlert(false)
                                                            }}
                                                        >
                                                            Sí, regenerar con IA
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-[10px] flex-1"
                                                            onClick={() => setShowRegenerateAlert(false)}
                                                        >
                                                            Mantener actuales
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Transporte */}
                                            <TransportInfo
                                                data={data.access}
                                                isGenerating={!!aiLoading && ['transport', 'plane', 'train', 'road'].includes(aiLoading)}
                                                progress={aiProgress}
                                                onRegenerate={(subSection) => handleAIFill(subSection)}
                                                onEdit={(section, newContent) => {
                                                    setManualEditDetected(true)
                                                    setData((prev: any) => ({
                                                        ...prev,
                                                        access: {
                                                            ...prev.access,
                                                            [section]: section === 'nearby_transport'
                                                                ? newContent
                                                                : (typeof prev.access[section] === 'object' && prev.access[section] !== null
                                                                    ? { ...prev.access[section], instructions: newContent, info: newContent }
                                                                    : newContent)
                                                        }
                                                    }))
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- NORMAS --- */}
                                <TabsContent value="rules" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <CardTitle className="text-base">Normas de la Casa</CardTitle>
                                            <CardDescription className="text-xs">Establece las reglas para una convivencia perfecta.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-6">
                                            {/* Sección de Horarios */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold flex items-center gap-2 text-navy">
                                                    <Clock className="w-4 h-4" /> Horarios Principales
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Hora de Salida (Check-out)</Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Ej: Antes de las 11:00"
                                                                className="h-10 pl-9"
                                                                value={data.rules?.checkout_time || ''}
                                                                onChange={e => setData({ ...data, rules: { ...data.rules, checkout_time: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Horario de Silencio</Label>
                                                        <div className="relative">
                                                            <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Ej: 22:00 - 08:00"
                                                                className="h-10 pl-9"
                                                                value={data.rules?.quiet_hours || ''}
                                                                onChange={e => setData({ ...data, rules: { ...data.rules, quiet_hours: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sección de Normas Detalladas */}
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-bold flex items-center gap-2 text-navy">
                                                    <Plus className="w-4 h-4" /> Normas Individuales
                                                </h3>

                                                <div className="space-y-3">
                                                    {(data.rules?.rules_items || []).map((rule: any, idx: number) => (
                                                        <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex gap-4 animate-in slide-in-from-right-2 duration-200">
                                                            <div className={cn(
                                                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                                                rule.type === 'allowed' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                                            )}>
                                                                {rule.type === 'allowed' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Ej: Mascotas permitidas (pequeñas)"
                                                                        className="font-bold border-none bg-slate-50/50 focus-visible:ring-0 h-9 flex-1"
                                                                        value={rule.text}
                                                                        onChange={e => {
                                                                            const newItems = [...data.rules.rules_items];
                                                                            newItems[idx].text = e.target.value;
                                                                            setData({ ...data, rules: { ...data.rules, rules_items: newItems } });
                                                                        }}
                                                                    />
                                                                    <select
                                                                        className={cn(
                                                                            "h-9 px-2 rounded-md border-none text-xs font-semibold focus:ring-0",
                                                                            rule.type === 'allowed' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                                                        )}
                                                                        value={rule.type}
                                                                        onChange={e => {
                                                                            const newItems = [...data.rules.rules_items];
                                                                            newItems[idx].type = e.target.value;
                                                                            setData({ ...data, rules: { ...data.rules, rules_items: newItems } });
                                                                        }}
                                                                    >
                                                                        <option value="allowed">Permitido</option>
                                                                        <option value="forbidden">Prohibido</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-300 hover:text-destructive self-start"
                                                                onClick={() => {
                                                                    const newItems = [...data.rules.rules_items];
                                                                    newItems.splice(idx, 1);
                                                                    setData({ ...data, rules: { ...data.rules, rules_items: newItems } });
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="h-10 border-dashed border-2 rounded-xl hover:bg-green-50 hover:border-green-200 text-[11px] font-bold"
                                                            onClick={() => setData({
                                                                ...data,
                                                                rules: {
                                                                    ...data.rules,
                                                                    rules_items: [...(data.rules.rules_items || []), { text: '', type: 'allowed' }]
                                                                }
                                                            })}
                                                        >
                                                            <Plus className="w-3 h-3 mr-2" /> Permitido
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="h-10 border-dashed border-2 rounded-xl hover:bg-red-50 hover:border-red-200 text-[11px] font-bold"
                                                            onClick={() => setData({
                                                                ...data,
                                                                rules: {
                                                                    ...data.rules,
                                                                    rules_items: [...(data.rules.rules_items || []), { text: '', type: 'forbidden' }]
                                                                }
                                                            })}
                                                        >
                                                            <Plus className="w-3 h-3 mr-2" /> Prohibido
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- APARIENCIA --- */}
                                <TabsContent value="appearance" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <CardTitle className="text-base">Apariencia de tu Guía</CardTitle>
                                            <CardDescription className="text-xs">Elige un tema y personaliza los colores de tu guía mágica.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-8">
                                            <div className="space-y-4">
                                                <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                                    🎨 ELIGE UN TEMA BASE
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {PRESET_THEMES.map((theme) => (
                                                        <ThemePreviewCard
                                                            key={theme.id}
                                                            theme={theme}
                                                            logoUrl={data.branding?.custom_logo_url}
                                                            propertyName={data.property?.name}
                                                            isSelected={data.branding?.theme_id === theme.id}
                                                            onSelect={() => {
                                                                setData((prev: any) => ({
                                                                    ...prev,
                                                                    branding: {
                                                                        ...prev.branding,
                                                                        theme_id: theme.id,
                                                                        computed_theme: prev.branding?.custom_primary_color
                                                                            ? harmonizeThemeFromPrimary(theme, prev.branding.custom_primary_color)
                                                                            : theme
                                                                    }
                                                                }))
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-navy/5">
                                                <div className="flex flex-col md:flex-row gap-8">
                                                    <div className="flex-1 space-y-4">
                                                        <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                                            🎨 COLOR DE MARCA (OPCIONAL)
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <Label className="text-xs font-bold text-navy">Color Principal</Label>
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    className="h-10 w-10 rounded-xl shadow-inner border border-navy/5 shrink-0"
                                                                    style={{ backgroundColor: data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary }}
                                                                />
                                                                <Input
                                                                    type="color"
                                                                    className="w-16 h-10 p-1 rounded-lg cursor-pointer bg-white border-navy/10"
                                                                    value={data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary || '#000000'}
                                                                    onChange={(e) => {
                                                                        const color = e.target.value
                                                                        const baseTheme = PRESET_THEMES.find(t => t.id === data.branding.theme_id) || PRESET_THEMES[0]
                                                                        const harmonized = harmonizeThemeFromPrimary(baseTheme, color)
                                                                        setData((prev: any) => ({
                                                                            ...prev,
                                                                            branding: {
                                                                                ...prev.branding,
                                                                                custom_primary_color: color,
                                                                                computed_theme: harmonized
                                                                            }
                                                                        }))
                                                                    }}
                                                                />
                                                                <Input
                                                                    type="text"
                                                                    className="flex-1 h-10 font-mono text-xs"
                                                                    value={data.branding?.custom_primary_color || data.branding?.computed_theme?.colors.primary}
                                                                    onChange={(e) => {
                                                                        const color = e.target.value
                                                                        if (/^#[0-9A-F]{6}$/i.test(color)) {
                                                                            const baseTheme = PRESET_THEMES.find(t => t.id === data.branding.theme_id) || PRESET_THEMES[0]
                                                                            const harmonized = harmonizeThemeFromPrimary(baseTheme, color)
                                                                            setData((prev: any) => ({
                                                                                ...prev,
                                                                                branding: {
                                                                                    ...prev.branding,
                                                                                    custom_primary_color: color,
                                                                                    computed_theme: harmonized
                                                                                }
                                                                            }))
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-navy/40 italic">
                                                                * El sistema ajustará automáticamente los colores secundarios para mantener la armonía visual.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <h3 className="px-1 text-[10px] font-black text-navy/30 tracking-[0.2em] uppercase">
                                                            🖼️ LOGO DE LA PROPIEDAD
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-navy/10 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                                                                {data.branding?.custom_logo_url ? (
                                                                    <div className="relative group">
                                                                        <img
                                                                            src={data.branding.custom_logo_url}
                                                                            alt="Logo"
                                                                            className="max-h-24 object-contain"
                                                                        />
                                                                        <button
                                                                            onClick={() => setData((prev: any) => ({ ...prev, branding: { ...prev.branding, custom_logo_url: '' } }))}
                                                                            className="absolute -top-2 -right-2 p-1 bg-white shadow-md rounded-full text-navy/40 hover:text-red-500"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center">
                                                                        <Upload className="w-8 h-8 text-navy/20 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                                                        <p className="text-xs font-bold text-navy">Sube tu logotipo</p>
                                                                        <p className="text-[10px] text-navy/30">PNG o SVG ligero (Max 500KB)</p>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="mt-4 h-8 text-[10px] font-bold uppercase tracking-wider"
                                                                            onClick={() => {
                                                                                const input = document.createElement('input');
                                                                                input.type = 'file';
                                                                                input.accept = 'image/*';
                                                                                input.onchange = async (e) => {
                                                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                                                    if (file) {
                                                                                        // Implement logo upload logic similar to handleImageUpload
                                                                                        try {
                                                                                            setUploading(true);
                                                                                            const { uploadUrl, publicUrl } = await getBrandingUploadUrl(file.name, file.type);
                                                                                            const response = await fetch(uploadUrl, {
                                                                                                method: 'PUT',
                                                                                                body: file,
                                                                                                headers: { 'Content-Type': file.type },
                                                                                            });
                                                                                            if (!response.ok) throw new Error('Error al subir el logo');
                                                                                            setData((prev: any) => ({
                                                                                                ...prev,
                                                                                                branding: { ...prev.branding, custom_logo_url: publicUrl }
                                                                                            }));
                                                                                            toast({ title: 'Logo subido', description: 'Tu logotipo se ha guardado.' });
                                                                                        } catch (error) {
                                                                                            console.error('Logo upload error:', error);
                                                                                            toast({ title: 'Error', description: 'No se pudo subir el logo.', variant: 'destructive' });
                                                                                        } finally {
                                                                                            setUploading(false);
                                                                                        }
                                                                                    }
                                                                                };
                                                                                input.click();
                                                                            }}
                                                                        >
                                                                            Seleccionar Archivo
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- TECNOLOGÍA --- */}
                                <TabsContent value="tech" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <CardTitle className="text-base">WiFi y Tecnología</CardTitle>
                                                    <CardDescription className="text-xs">Datos de conexión e instrucciones de dispositivos.</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nombre de la Red WiFi</Label>
                                                    <Input
                                                        placeholder="Ej: MiCasaWiFi"
                                                        className="h-11 border-slate-200"
                                                        value={data.tech?.wifi_ssid || ''}
                                                        onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Contraseña WiFi</Label>
                                                    <Input
                                                        placeholder="Ej: 12345678"
                                                        className="h-11 border-slate-200"
                                                        value={data.tech?.wifi_password || ''}
                                                        onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Ubicación del Router / Notas adicionales</Label>
                                                <Textarea
                                                    placeholder="Ej: El router está en el salón, detrás de la TV. Si tienes problemas de conexión, reinícialo desenchufándolo 10 segundos."
                                                    className="min-h-[100px] bg-slate-50/50 border-slate-200"
                                                    value={data.tech?.router_notes || ''}
                                                    onChange={e => setData({ ...data, tech: { ...data.tech, router_notes: e.target.value } })}
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">Esta información se mostrará en la guía del huésped.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- ESCÁNER VISUAL CON IA --- */}
                                <TabsContent value="visual-scanner" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardContent className="p-6">
                                            <VisualScanner
                                                propertyId={propertyId || ''}
                                                onStart={() => {
                                                    // Phase 1 starting: fast identification
                                                    setProperty((prev: any) => ({ ...prev, inventory_status: 'identifying' }))
                                                }}
                                                onSuccess={() => {
                                                    // Phase 1 done → appliances identified → Phase 2 running in background
                                                    setProperty((prev: any) => ({ ...prev, inventory_status: 'generating' }))
                                                    setCompletedSteps(prev => Array.from(new Set([...prev, 'visual-scanner'])))
                                                    toast({
                                                        title: "✅ Aparatos identificados",
                                                        description: "Los manuales detallados se están generando en segundo plano.",
                                                    })
                                                }}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- INVENTARIO DE LA PROPIEDAD --- */}
                                <TabsContent value="inventory" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                            <div>
                                                <CardTitle className="text-base">Inventario y Dotación</CardTitle>
                                                <CardDescription className="text-xs">Selecciona lo que tienes disponible para que la IA pueda guiar a tus huéspedes.</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            {/* Status-aware banner */}
                                            {property?.inventory_status === 'identifying' && (
                                                <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-blue-50 border border-blue-200 animate-in fade-in duration-300">
                                                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-blue-900">Identificando aparatos...</p>
                                                        <p className="text-xs text-blue-700">Analizando las fotos con IA. En unos segundos se actualizará el inventario.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {property?.inventory_status === 'generating' && (
                                                <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-amber-50 border border-amber-200 animate-in fade-in duration-300">
                                                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-900">Inventario actualizado ✨</p>
                                                        <p className="text-xs text-amber-700">Los manuales técnicos se están generando en segundo plano. Puedes continuar con la configuración.</p>
                                                    </div>
                                                </div>
                                            )}
                                            <InventorySelector
                                                items={data.inventory?.selected_items || []}
                                                existingManuals={property?.manuals || []}
                                                onChange={(items) => setData({ ...data, inventory: { ...data.inventory, selected_items: items } })}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- OCIO (RESTAURANTES) --- */}
                                <TabsContent value="dining" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <LocalRecommendations
                                        propertyId={propertyId || ''}
                                        recommendations={data.dining}
                                        onUpdate={(recs) => setData({ ...data, dining: recs })}
                                        onAISuggest={(category) => handleAIFill('dining', category)}
                                        aiLoading={aiLoading === 'dining'}
                                    />

                                </TabsContent>

                                {/* --- FAQs --- */}
                                <TabsContent value="faqs" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                                        <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center py-3 px-4">
                                            <div>
                                                <CardTitle className="text-base">Guía del Alojamiento</CardTitle>
                                                <CardDescription className="text-xs">Anticípate a las dudas de tus huéspedes y explica cómo funciona todo.</CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleAIFill('faqs')}
                                                disabled={aiLoading === 'faqs'}
                                            >
                                                {aiLoading === 'faqs' ? 'Generando...' : <><Sparkles className="w-4 h-4 mr-2" /> Auto-generar Guía</>}
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-4">
                                            {data.faqs.map((faq: any, idx: number) => (
                                                <div key={idx} className="space-y-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-4">
                                                            <Input
                                                                placeholder="Pregunta"
                                                                value={faq.question}
                                                                onChange={e => {
                                                                    const newFaqs = [...data.faqs];
                                                                    newFaqs[idx].question = e.target.value;
                                                                    setData({ ...data, faqs: newFaqs });
                                                                }}
                                                                className="font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-11"
                                                            />
                                                            <Textarea
                                                                placeholder="Respuesta..."
                                                                value={faq.answer}
                                                                onChange={e => {
                                                                    const newFaqs = [...data.faqs];
                                                                    newFaqs[idx].answer = e.target.value;
                                                                    setData({ ...data, faqs: newFaqs });
                                                                }}
                                                                className="border-none bg-transparent focus-visible:ring-0 px-0 min-h-[100px]"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-destructive"
                                                            onClick={() => {
                                                                const newFaqs = [...data.faqs];
                                                                newFaqs.splice(idx, 1);
                                                                setData({ ...data, faqs: newFaqs });
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                variant="ghost"
                                                className="w-full border-dashed border-2 hover:bg-primary/5"
                                                onClick={() => setData({ ...data, faqs: [...data.faqs, { question: '', answer: '', category: 'custom' }] })}
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Añadir Sección a la Guía
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </motion.div>
                    </AnimatePresence>
                </main>
            )
            }

            <WizardNavigation
                onNext={handleNext}
                onBack={handleBack}
                isFirstStep={activeTab === 'property'}
                isLastStep={activeTab === 'faqs'}
                loading={loading}
            />
        </div >
    )
}
