'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Save, ChevronRight, ChevronLeft, Check, Plus, Trash2, MapPin, Clock, Utensils, HelpCircle, ShieldAlert, Wifi, Package, Home as HomeIcon, Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { saveWizardStep } from '@/app/actions/wizard'
import { getUploadUrl } from '@/app/actions/properties'
import { useRef } from 'react'
import { geocodeAddress, GeocodingResult } from '@/lib/geocoding'
import { validateLocation, ValidationResult } from '@/lib/geocoding-validation'
import MapPreview from './MapPreview'
import TransportInfo from './TransportInfo'

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
        rules: { smoking: 'no', pets: 'no', quiet_hours: '22:00 - 08:00', checkout_time: '11:00', rules_items: [] },
        tech: { wifi_ssid: '', wifi_password: '', router_notes: '' },
        inventory: { bathroom: [], bedroom: [], kitchen: [], cleaning: [] },
        dining: [],
        faqs: []
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

        // Si ya hay datos y el usuario ha editado algo, preguntar antes de sobrescribir
        if (data.access.from_airport && manualEditDetected) {
            setShowRegenerateAlert(true)
            return
        }

        const timer = setTimeout(() => {
            handleAIFill('transport')
        }, 2000)

        return () => clearTimeout(timer)
    }, [geocodingResult?.lat, geocodingResult?.lng, activeTab, mounted])

    // Calcular progreso
    const steps = ['property', 'access', 'welcome', 'checkin', 'rules', 'tech', 'inventory', 'dining', 'faqs']
    const progress = ((steps.indexOf(activeTab) + 1) / steps.length) * 100

    // Sincronizar activeTab con la URL
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && steps.includes(tab) && tab !== activeTab) {
            setActiveTab(tab)
        }
    }, [searchParams])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.replace(`${pathname}?${params.toString()}`)
    }

    // Cargar datos iniciales
    useEffect(() => {
        setMounted(true)
        if (!propertyId) return

        async function loadData() {
            const completed: string[] = []

            const { data: propDetails } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .single()

            if (propDetails) {
                setProperty(propDetails)
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
        await saveStep('access', sanitizedData);
    };

    const saveStep = async (category: string, stepData: any) => {
        setLoading(true)
        try {
            const currentPropId = propertyId || property?.id

            // Sanitización específica para la categoría tech
            let dataToSave = stepData;
            if (category === 'tech') {
                const { tv_instructions, ...sanitizedTech } = stepData;
                dataToSave = sanitizedTech;
                console.log('[WIZARD] Saving sanitized tech data (removed legacy fields):', dataToSave);
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
                    router.push(`/dashboard/properties/${result.property.id}/setup?tab=access`)
                    return
                }

                toast({ title: 'Guardado', description: `${category} actualizado correctamente.` })
                setCompletedSteps(prev => Array.from(new Set([...prev, category])))

                if (category === 'faqs') {
                    router.push('/dashboard/properties')
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

    const handleAIFill = async (section: string) => {
        if (section === 'transport') {
            setAiProgress(0)
            const interval = setInterval(() => {
                setAiProgress(prev => Math.min(prev + 5, 95))
            }, 600)

                // Limpiar intervalo cuando la carga termine (esto se maneja en el finally)
                ; (window as any)._aiInterval = interval
        }

        setAiLoading(section)
        const finalAddressToUse = data.access.full_address;

        const payload = {
            propertyId,
            section,
            existingData: section === 'transport' ? { address: finalAddressToUse } : undefined
        }

        // Registrar la posición que disparó la IA
        if (section === 'transport' && geocodingResult) {
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

            if (section === 'transport') {
                clearInterval((window as any)._aiInterval)
                setAiProgress(100)
                setManualEditDetected(false)
            }

            if (section === 'dining') {
                setData((prev: any) => ({ ...prev, dining: [...prev.dining, ...result.recommendations] }))
            } else if (section === 'faqs') {
                setData((prev: any) => ({ ...prev, faqs: [...prev.faqs, ...result.faqs] }))
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
            }

            toast({ title: 'IA Generada', description: 'Hemos añadido sugerencias reales basadas en tu ubicación.' })
        } catch (e: any) {
            toast({ title: 'Error IA', description: 'No pudimos generar sugerencias en este momento.', variant: 'destructive' })
        } finally {
            setAiLoading(null)
        }
    }

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3 text-center">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
                    Configura tu Guía Mágica
                </h1>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Rellena la información para que tu asistente IA pueda ayudar a tus huéspedes.
                </p>
                <div className="max-w-3xl mx-auto pt-2">
                    <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold text-navy/40 mb-1.5">
                        <span>Progreso</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-white shadow-sm border border-navy/5" />
                </div>
            </div>

            {!mounted ? (
                <div className="w-full h-96 bg-slate-50 animate-pulse rounded-3xl" />
            ) : (
                <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-5xl mx-auto w-full px-4 sm:px-6">
                    <TabsList className="flex flex-wrap sm:flex-nowrap w-full h-auto bg-slate-100/50 backdrop-blur-sm rounded-xl p-1 gap-1 border border-slate-200">
                        <TabsTrigger
                            value="property"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('property') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('property') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <HomeIcon className="w-3 h-3 mr-1" />} Propiedad
                        </TabsTrigger>
                        <TabsTrigger
                            value="access"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('access') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('access') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <MapPin className="w-3 h-3 mr-1" />} Acceso
                        </TabsTrigger>
                        <TabsTrigger
                            value="welcome"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('welcome') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('welcome') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Sparkles className="w-3 h-3 mr-1" />} Saludo
                        </TabsTrigger>
                        <TabsTrigger
                            value="checkin"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('checkin') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('checkin') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Clock className="w-3 h-3 mr-1" />} Check-in
                        </TabsTrigger>
                        <TabsTrigger
                            value="rules"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('rules') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('rules') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <ShieldAlert className="w-3 h-3 mr-1" />} Normas
                        </TabsTrigger>
                        <TabsTrigger
                            value="tech"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('tech') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('tech') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Wifi className="w-3 h-3 mr-1" />} Tech
                        </TabsTrigger>
                        <TabsTrigger
                            value="inventory"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('inventory') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('inventory') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Package className="w-3 h-3 mr-1" />} Inventario
                        </TabsTrigger>
                        <TabsTrigger
                            value="dining"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('dining') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('dining') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Utensils className="w-3 h-3 mr-1" />} Ocio
                        </TabsTrigger>
                        <TabsTrigger
                            value="faqs"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('faqs') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('faqs') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <HelpCircle className="w-3 h-3 mr-1" />} FAQs
                        </TabsTrigger>
                    </TabsList>

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
                                        <div className="space-y-2">
                                            <Label>Color de marca</Label>
                                            <div className="flex gap-3">
                                                <Input type="color" className="p-1 h-11 w-20" value={data.property?.primary_color || '#316263'} onChange={e => setData({ ...data, property: { ...data.property, primary_color: e.target.value } })} />
                                                <Input value={data.property?.primary_color || '#316263'} className="h-11 font-mono" onChange={e => setData({ ...data, property: { ...data.property, primary_color: e.target.value } })} />
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => router.push('/dashboard/properties')}><ChevronLeft className="mr-2" /> Salir</Button>
                                <Button onClick={() => saveStep('property', data.property)} disabled={loading}>
                                    {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar y Continuar</>}
                                </Button>
                            </CardFooter>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Horario de Check-in Disponible</Label>
                                        <Input
                                            placeholder="Ej: 15:00 - 22:00"
                                            value={data.checkin.checkin_time}
                                            onChange={e => setData({ ...data, checkin: { ...data.checkin, checkin_time: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Teléfono de Asistencia (Llamar si hay problemas)</Label>
                                        <Input
                                            placeholder="Ej: 666 123 456"
                                            value={data.checkin.emergency_phone}
                                            onChange={e => setData({ ...data, checkin: { ...data.checkin, emergency_phone: e.target.value } })}
                                        />
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => handleTabChange('welcome')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('checkin', data.checkin)} disabled={loading}>
                                    {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar y Continuar</>}
                                </Button>
                            </CardFooter>
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => handleTabChange('access')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('welcome', data.welcome)} disabled={loading}>Guardar y Continuar <ChevronRight className="ml-2" /></Button>
                            </CardFooter>
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
                                    isGenerating={aiLoading === 'transport'}
                                    progress={aiProgress}
                                    onEdit={(section, newContent) => {
                                        setManualEditDetected(true)
                                        setData((prev: any) => ({
                                            ...prev,
                                            access: {
                                                ...prev.access,
                                                [section]: typeof prev.access[section] === 'object'
                                                    ? { ...prev.access[section], instructions: newContent, info: newContent }
                                                    : newContent
                                            }
                                        }))
                                    }}
                                />
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => handleTabChange('property')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={handleSaveAccess} disabled={loading}>
                                    {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar y Continuar</>}
                                </Button>
                            </CardFooter>
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => handleTabChange('checkin')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('rules', data.rules)} disabled={loading}>
                                    {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar y Continuar</>}
                                </Button>
                            </CardFooter>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                        onClick={() => handleAIFill('tech')}
                                        disabled={aiLoading === 'tech'}
                                    >
                                        {aiLoading === 'tech' ? 'Generando...' : <><Sparkles className="w-4 h-4 mr-2" /> Sugerir con IA</>}
                                    </Button>
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab('rules')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('tech', data.tech)} disabled={loading}>Guardar y Continuar <ChevronRight className="ml-2" /></Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* --- INVENTARIO / SERVICIOS --- */}
                    <TabsContent value="inventory" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b py-3 px-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-base">Servicios e Inventario</CardTitle>
                                        <CardDescription className="text-xs">Qué equipos y servicios facilitas a tus huéspedes.</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                        onClick={() => handleAIFill('inventory')}
                                        disabled={aiLoading === 'inventory'}
                                    >
                                        {aiLoading === 'inventory' ? 'Sugerencia...' : <><Sparkles className="w-4 h-4 mr-2" /> Sugerir con IA</>}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Baño</Label>
                                        <Textarea
                                            placeholder="Ej: Secador, Gel, Champú..."
                                            className="min-h-[100px]"
                                            value={Array.isArray(data.inventory?.bathroom) ? data.inventory.bathroom.join(', ') : (data.inventory?.bathroom || '')}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, bathroom: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dormitorio</Label>
                                        <Textarea
                                            placeholder="Ej: Almohadas extra, Mantas..."
                                            className="min-h-[100px]"
                                            value={Array.isArray(data.inventory?.bedroom) ? data.inventory.bedroom.join(', ') : (data.inventory?.bedroom || '')}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, bedroom: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cocina</Label>
                                        <Textarea
                                            placeholder="Ej: Nespresso, Aceite, Sal..."
                                            className="min-h-[100px]"
                                            value={Array.isArray(data.inventory?.kitchen) ? data.inventory.kitchen.join(', ') : (data.inventory?.kitchen || '')}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, kitchen: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Limpieza y Otros</Label>
                                        <Textarea
                                            placeholder="Ej: Plancha, Tabla, Tendedero..."
                                            className="min-h-[100px]"
                                            value={Array.isArray(data.inventory?.cleaning) ? data.inventory.cleaning.join(', ') : (data.inventory?.cleaning || '')}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, cleaning: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab('tech')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('inventory', data.inventory)} disabled={loading}>Guardar y Continuar <ChevronRight className="ml-2" /></Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* --- OCIO (RESTAURANTES) --- */}
                    <TabsContent value="dining" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Recomendaciones Locales</h2>
                                <Button
                                    onClick={() => handleAIFill('dining')}
                                    disabled={aiLoading === 'dining'}
                                    className="bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90"
                                >
                                    {aiLoading === 'dining' ? 'Analizando zona...' : <><Sparkles className="w-4 h-4 mr-2" /> Sugerir con IA</>}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.dining.map((rec: any, idx: number) => (
                                    <Card key={idx} className="relative overflow-hidden group">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{rec.name}</CardTitle>
                                                <Badge variant="secondary">{rec.type}</Badge>
                                            </div>
                                            <CardDescription>{rec.distance} • {rec.price_range}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-slate-600 line-clamp-2 italic">"{rec.personal_note}"</p>
                                        </CardContent>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive"
                                            onClick={() => {
                                                const newDining = [...data.dining];
                                                newDining.splice(idx, 1);
                                                setData({ ...data, dining: newDining });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </Card>
                                ))}

                                <Button
                                    variant="outline"
                                    className="h-full min-h-[140px] border-dashed rounded-3xl border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col gap-2"
                                    onClick={() => setData({ ...data, dining: [...data.dining, { name: 'Nuevo Sitio', type: 'Tipo', distance: '100m', price_range: '€€', personal_note: 'Escribe algo aquí' }] })}
                                >
                                    <Plus className="w-6 h-6 text-slate-400" />
                                    <span className="text-slate-500 font-medium">Añadir Recomendación</span>
                                </Button>
                            </div>

                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setActiveTab('inventory')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('dining', data.dining)} disabled={loading}>Guardar y Continuar <ChevronRight className="ml-2" /></Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- FAQs --- */}
                    <TabsContent value="faqs" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center py-3 px-4">
                                <div>
                                    <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
                                    <CardDescription className="text-xs">Anticípate a las dudas de tus huéspedes.</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleAIFill('faqs')}
                                    disabled={aiLoading === 'faqs'}
                                >
                                    {aiLoading === 'faqs' ? 'Generando...' : <><Sparkles className="w-4 h-4 mr-2" /> Auto-generar FAQs</>}
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
                                    <Plus className="w-4 h-4 mr-2" /> Añadir FAQ
                                </Button>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab('dining')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('faqs', data.faqs)} disabled={loading} className="font-bold px-8">
                                    {loading ? 'Finalizando...' : <><Check className="w-4 h-4 mr-2" /> Completar Configuración</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            )
            }
        </div >
    )
}
