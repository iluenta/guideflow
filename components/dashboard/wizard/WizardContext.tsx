'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { saveWizardStep } from '@/app/actions/wizard'
import { getTenantId, updateInventoryStatus, verifyAndFixInventoryStatus, getUploadUrl } from '@/app/actions/properties'
import { processInventoryManuals } from '@/app/actions/ai-ingestion'
import { geocodeAddress, GeocodingResult } from '@/lib/geocoding'
import { validateLocation, ValidationResult } from '@/lib/geocoding-validation'
import { PRESET_THEMES, Theme } from '@/lib/themes'
import { harmonizeThemeFromPrimary } from '@/lib/color-harmonizer'
import { DEFAULT_ITEMS, matchesInventoryItem } from '@/components/dashboard/InventorySelector'
import { isValidUUID } from '@/lib/utils'

export const steps = ['property', 'appearance', 'access', 'welcome', 'contacts', 'checkin', 'rules', 'tech', 'visual-scanner', 'appliance-manuals', 'inventory', 'dining', 'faqs']

interface WizardContextType {
    // State
    propertyId: string | null
    tenantId: string | null
    activeTab: string
    loading: boolean
    aiLoading: string | null
    property: any
    data: any
    completedSteps: string[]
    uploading: boolean
    geocoding: boolean
    geocodingResult: GeocodingResult | null
    validationResult: ValidationResult | null
    aiProgress: number
    showRegenerateAlert: boolean
    manualEditDetected: boolean
    direction: number
    mounted: boolean
    isEditing: boolean

    // Refs
    lastGeocodedAddressRef: React.MutableRefObject<string>
    lastAIPositionRef: React.MutableRefObject<string>

    // Actions
    setData: React.Dispatch<React.SetStateAction<any>>
    setProperty: React.Dispatch<React.SetStateAction<any>>
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    setAiLoading: React.Dispatch<React.SetStateAction<string | null>>
    setUploading: React.Dispatch<React.SetStateAction<boolean>>
    setGeocoding: React.Dispatch<React.SetStateAction<boolean>>
    setGeocodingResult: React.Dispatch<React.SetStateAction<GeocodingResult | null>>
    setValidationResult: React.Dispatch<React.SetStateAction<ValidationResult | null>>
    setAiProgress: React.Dispatch<React.SetStateAction<number>>
    setShowRegenerateAlert: React.Dispatch<React.SetStateAction<boolean>>
    setManualEditDetected: React.Dispatch<React.SetStateAction<boolean>>
    setDirection: React.Dispatch<React.SetStateAction<number>>
    setCompletedSteps: React.Dispatch<React.SetStateAction<string[]>>

    // Compound Actions
    filteredSteps: string[]
    handleTabChange: (value: string) => void
    handleNext: () => Promise<void>
    handleBack: () => void
    saveStep: (category: string, stepData: any, forcedNextTab?: string) => Promise<void>
    handleGeocode: () => Promise<GeocodingResult | null>
    handleAIFill: (section: string, category?: string, overrideData?: { address?: string, coordinates?: GeocodingResult }) => Promise<void>
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleStepImageUpload: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    resolvedPropertyId: string | null
}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function WizardProvider({
    children,
    initialPropertyId,
    tenantId,
    onSuccess
}: {
    children: React.ReactNode,
    initialPropertyId?: string,
    tenantId?: string,
    onSuccess?: (id: string) => void
}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { toast } = useToast()
    const supabase = createClient()

    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'property')
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState<string | null>(null)
    const [property, setProperty] = useState<any>(null)
    const [data, setData] = useState<any>({
        property: { name: '', slug: '', guests: 2, beds: 1, baths: 1, has_parking: false, parking_number: '', description: '', primary_color: '#316263', main_image_url: '' },
        welcome: { title: '', host_name: '', message: '' },
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
        faqs: [
            { 
                question: '¿Qué hago si pierdo las llaves de la casa?', 
                answer: 'Mantén la calma y revisa tus pertenencias. Si realmente no las encuentras, contacta el anfitrión o la persona de soporte lo antes posible: muchos alojamientos tienen llaves de repuesto o cerraduras programables para este caso.\n\nPasos:\n1) Busca en ropa, mochila u otros lugares (bolsillo, toallas, bolsas) por si están extraviadas.\n2) Si no aparecen, llama al anfitrión, persona de soporte o portero para obtener copia de llave o nuevo código.\n3) Como último recurso, considera llamar un cerrajero local (solicita autorización previa).',
                category: 'urgente'
            },
            { 
                question: '¿Se ha ido la luz en el apartamento, qué hago?', 
                answer: 'Primero revisa el cuadro eléctrico (suele estar en la entrada): si algún interruptor está bajado, súbelo.\n\nSi el interruptor principal vuelve a caer, desconecta algunos electrodomésticos y vuélvelo a intentar. Si todos los interruptores están arriba pero no hay luz, podría ser un corte general de la zona.\n\nSi tras varios minutos sigue igual, contacta con nosotros o con la compañía eléctrica local.',
                category: 'urgente'
            },
            { 
                question: '¿Dónde tiro la basura y reciclaje?', 
                answer: 'En España, existen contenedores específicos en la calle. Por favor, separa los residuos y no los dejes dentro al salir.\n\nPasos:\n1) Identifica los contenedores cercanos (Orgánico, Envases, Papel/Cartón).\n2) Deposita la basura preferiblemente antes de las 22:00h.\n3) Usa las bolsas estándar que te hemos proporcionado.',
                category: 'normas'
            },
            { 
                question: '¿Cómo es el procedimiento para hacer el check-out?', 
                answer: 'El proceso general consiste en:\n1) Recoger tu equipaje y verificar pertenencias.\n2) Dejar las sábanas/toallas sucias amontonadas en un rincón.\n3) Sacar la basura.\n4) Dejar las llaves en el lugar acordado (caja de llaves o interior).\n5) Avisarnos con un mensaje final de salida.',
                category: 'salida'
            },
            { 
                question: '¿Cómo informo cualquier daño?', 
                answer: 'Si detectas un daño o avería, comunícalo lo antes posible para que podamos repararlo pronto. Es recomendable enviar una foto o mensaje para que ambos estemos de acuerdo en el estado inicial y final.',
                category: 'soporte'
            }
        ],
        branding: {
            theme_id: PRESET_THEMES[0].id,
            custom_primary_color: '',
            custom_logo_url: '',
            computed_theme: PRESET_THEMES[0]
        }
    })
    const [completedSteps, setCompletedSteps] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [geocoding, setGeocoding] = useState(false)
    const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [aiProgress, setAiProgress] = useState(0)
    const [showRegenerateAlert, setShowRegenerateAlert] = useState(false)
    const [manualEditDetected, setManualEditDetected] = useState(false)
    const [direction, setDirection] = useState(1)

    const lastGeocodedAddressRef = useRef<string>('')
    const lastAIPositionRef = useRef<string>('')
    const dataLoadedRef = useRef<boolean>(false)

    const effectivePropertyId = useMemo(() => {
        // Only accept real UUIDs from the URL — reject semantic slugs like "new"
        const urlPropertyId = pathname?.match(/\/dashboard\/properties\/([^\/]+)/)?.[1]
        const validUrlId = isValidUUID(urlPropertyId) ? urlPropertyId : null
        return (isValidUUID(initialPropertyId) ? initialPropertyId : null) || validUrlId || null
    }, [initialPropertyId, pathname])

    // Onboarding Mode: Hide "Appearance" and "Scanner" if we are in "Alta" mode
    const isAltaMode = searchParams.get('mode') === 'alta' || !effectivePropertyId
    const filteredSteps = useMemo(() => {
        if (isAltaMode) {
            return steps.filter(s => s !== 'appearance' && s !== 'visual-scanner' && s !== 'appliance-manuals')
        }
        return steps
    }, [isAltaMode])

    // Restore missing automated logic from monolithic version
    // 1. Auto-geocode when full_address changes
    useEffect(() => {
        if (!mounted || !data.access.full_address || data.access.full_address.length < 5 || activeTab !== 'access') return

        if (data.access.full_address === lastGeocodedAddressRef.current) return

        const timer = setTimeout(() => {
            handleGeocode()
        }, 1200)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.access.full_address, activeTab, mounted])

    // 2. Auto-generate transport when geocoding result changes
    useEffect(() => {
        if (!mounted || !geocodingResult || activeTab !== 'access') return

        const currentPosKey = `${geocodingResult.lat},${geocodingResult.lng}`
        if (currentPosKey === lastAIPositionRef.current) return

        // Check for existing data to avoid accidental overwrite
        const hasTransportData = !!(
            data.access.from_airport ||
            data.access.from_train ||
            data.access.parking?.info ||
            (Array.isArray(data.access.nearby_transport) && data.access.nearby_transport.length > 0)
        )

        // If data exists, we show an alert (this matches original logic)
        if (hasTransportData) {
            setShowRegenerateAlert(true)
            return
        }

        const timer = setTimeout(() => {
            handleAIFill('transport')
        }, 2000)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geocodingResult?.lat, geocodingResult?.lng, activeTab, mounted])

    useEffect(() => {
        setMounted(true)
    }, [])

    // Polling para el estado del inventario
    useEffect(() => {
        const status = property?.inventory_status
        if (!effectivePropertyId || (status !== 'identifying' && status !== 'generating')) return

        const MAX_POLLING_TIME = 10 * 60 * 1000
        const startTime = Date.now()

        const interval = setInterval(async () => {
            if (Date.now() - startTime > MAX_POLLING_TIME) {
                console.warn('[POLLING] Timeout reached for property:', effectivePropertyId)
                clearInterval(interval)
                return
            }

            const { data: prop, error } = await supabase
                .from('properties')
                .select('inventory_status, property_manuals(*)')
                .eq('id', effectivePropertyId)
                .single()

            if (error) {
                console.error('[POLLING] Error fetching status:', error.message)
                return
            }

            // SILENT RECOVERY: If we've been polling for > 30s and status is still generating, 
            // trigger a silent verification to see if the server is actually done.
            if (Date.now() - startTime > 30 * 1000 && prop.inventory_status === 'generating') {
                const check = await verifyAndFixInventoryStatus(effectivePropertyId)
                if (check.fixed) {
                    prop.inventory_status = 'completed'
                }
            }

            // In ALTA mode, we don't want the scanner to auto-update our inventory checkboxes
            // The scanner is hidden and inventory is a manual setup step.
            if (isAltaMode) {
                console.log('[POLLING] ALTA mode active - skipping inventory auto-sync')
                if (prop && prop.inventory_status !== property?.inventory_status) {
                    setProperty((prev: any) => ({ ...prev, inventory_status: prop.inventory_status }))
                }
                return
            }

            const hasStatusChanged = prop && prop.inventory_status !== status
            const hasNewManuals = prop && prop.property_manuals?.length !== (property?.manuals?.length || 0)

            if (prop && (hasStatusChanged || hasNewManuals)) {
                if (prop.inventory_status === 'failed') {
                    clearInterval(interval)
                    toast({
                        title: "Error en la generación",
                        description: "No se pudieron generar algunos manuales. Por favor, inténtalo de nuevo.",
                        variant: 'destructive'
                    })
                }

                const newManuals = prop.property_manuals || []
                const trulyDetectedManuals = newManuals.filter((m: any) => m.metadata?.source !== 'inventory_selector')

                setData((prev: any) => {
                    const currentSelected = prev.inventory?.selected_items || []
                    const updatedSelected = [...currentSelected]

                    trulyDetectedManuals.forEach((m: any) => {
                        const manualName = (m.appliance_name || '').trim()
                        if (manualName.length < 2) return

                        const matchedItem = DEFAULT_ITEMS.find(di => matchesInventoryItem(manualName, di))

                        if (matchedItem) {
                            const existingIndex = updatedSelected.findIndex(i => i.id === matchedItem.id)
                            if (existingIndex === -1) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectivePropertyId, property?.inventory_status, property?.manuals?.length])

    // Cargar datos iniciales
    useEffect(() => {
        if (!mounted || !effectivePropertyId) return

        async function loadData() {
            const completed: string[] = []

            const { data: propDetails } = await supabase
                .from('properties')
                .select('*, property_manuals(*)')
                .eq('id', effectivePropertyId)
                .single()

            if (propDetails) {
                setProperty({ ...propDetails, manuals: propDetails.property_manuals })
                completed.push('property')
                if (propDetails.full_address) {
                    lastGeocodedAddressRef.current = propDetails.full_address;
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
                        has_parking: propDetails.has_parking,
                        parking_number: propDetails.parking_number,
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
                    setValidationResult({ isValid: true, confidence: 1, warnings: [] });
                }

                if (propDetails.inventory_status === 'completed') {
                    completed.push('visual-scanner')
                    completed.push('inventory')
                }
            }

            const { data: propertyContext } = await supabase
                .from('property_context')
                .select('*')
                .eq('property_id', effectivePropertyId)

            const { data: faqs } = await supabase
                .from('property_faqs')
                .select('*')
                .eq('property_id', effectivePropertyId)

            const { data: recommendations } = await supabase
                .from('property_recommendations')
                .select('*')
                .eq('property_id', effectivePropertyId)

            if (propertyContext || faqs || recommendations) {
                setData((prev: any) => {
                    const newData = { ...prev }
                    propertyContext?.forEach((c: any) => {
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

                    // Auto-sync: merge scanner-detected manuals into inventory selected_items on load.
                    // The polling only fires on status/count changes, so we need this on initial load too.
                    if (!isAltaMode && propDetails?.property_manuals?.length) {
                        const currentSelected: any[] = newData.inventory?.selected_items || []
                        const updatedSelected = [...currentSelected]
                        const trulyDetected = (propDetails.property_manuals as any[]).filter(
                            (m: any) => m.metadata?.source !== 'inventory_selector'
                        )
                        trulyDetected.forEach((m: any) => {
                            const manualName = (m.appliance_name || '').trim()
                            if (manualName.length < 3) return
                            const matchedItem = DEFAULT_ITEMS.find(di => matchesInventoryItem(manualName, di))
                            if (!matchedItem) return
                            const idx = updatedSelected.findIndex(i => i.id === matchedItem.id)
                            if (idx === -1) {
                                updatedSelected.push({ ...matchedItem, isPresent: true, isFromScanner: true, customContext: '' })
                            } else if (!updatedSelected[idx].isFromScanner) {
                                // Newly detected (wasn't previously a scanner item) → mark present
                                updatedSelected[idx] = { ...updatedSelected[idx], isPresent: true, isFromScanner: true }
                            }
                            // If already isFromScanner: respect stored isPresent (user may have unchecked)
                        })
                        newData.inventory = { ...(newData.inventory || {}), selected_items: updatedSelected }
                    }

                    return newData
                })
            }
            const { data: branding } = await supabase
                .from('property_branding')
                .select('*')
                .eq('property_id', effectivePropertyId)
                .maybeSingle()

            if (branding) {
                setData((prev: any) => ({
                    ...prev,
                    branding: {
                        theme_id: branding.theme_id,
                        layout_theme_id: branding.layout_theme_id || (branding.computed_theme as any)?._layout_theme_id || 'modern',
                        custom_primary_color: branding.custom_primary_color || '',
                        custom_logo_url: branding.custom_logo_url || '',
                        computed_theme: branding.computed_theme || prev.branding.computed_theme
                    }
                }))
                completed.push('appearance')
            }

            setCompletedSteps([...new Set(completed)])
            dataLoadedRef.current = true
        }
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectivePropertyId, mounted])

    // Sincronizar activeTab con la URL
    useEffect(() => {
        if (!mounted) return
        const tab = searchParams.get('tab')
        if (tab && steps.includes(tab) && tab !== activeTab) {
            if (!effectivePropertyId && tab !== 'property') {
                setActiveTab('property')
                return
            }
            setActiveTab(tab)
        }
    }, [searchParams, mounted, effectivePropertyId, activeTab])

    const resolvedPropertyId: string | null = property?.id || effectivePropertyId
    const isEditing = !isAltaMode && !!resolvedPropertyId

    const handleTabChange = (value: string) => {
        // Only block if we are creating a brand new property AND trying to leave the first tab
        if (!resolvedPropertyId && value !== 'property') {
            toast({
                title: '⚠️ Guarda el Paso 1 primero',
                description: 'Rellena y guarda la información básica de la propiedad antes de continuar con los siguientes pasos.',
                variant: 'destructive'
            })
            return
        }

        // If it's an existing property, or we are in the first tab, allow navigation
        const index = filteredSteps.indexOf(value)
        const currentIndex = filteredSteps.indexOf(activeTab)
        setDirection(index > currentIndex ? 1 : -1)
        setActiveTab(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)
        router.replace(`${pathname}?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const saveStep = async (category: string, stepData: any, forcedNextTab?: string) => {
        setLoading(true)
        try {
            // Use the most up-to-date ID available. property?.id is set as soon as Step 1 returns,
            // even before the URL changes, so it works correctly when the URL still shows "new".
            const currentPropId = property?.id || effectivePropertyId

            // Defensive check for categories that don't need generic saving
            if ((category === 'visual-scanner' || category === 'appliance-manuals') && !stepData) {
                console.log(`[WIZARD-CONTEXT] Skipping generic save for ${category}`);
                setLoading(false);
                return;
            }

            let dataToSave = stepData;
            if (category === 'tech') {
                const { tv_instructions, ...sanitizedTech } = stepData;
                dataToSave = sanitizedTech;
            } else if (category === 'inventory' && stepData?.selected_items) {
                dataToSave = {
                    ...stepData,
                    selected_items: stepData.selected_items.map(({ icon, ...rest }: any) => rest)
                };
            }

            const result = await saveWizardStep(
                category,
                dataToSave,
                currentPropId!,
                tenantId!
            )

            if (result.success) {
                if (result.property) {
                    setProperty(result.property)
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

                    if (result.property.full_address) {
                        lastGeocodedAddressRef.current = result.property.full_address;
                    }
                    if (result.property.latitude && result.property.longitude) {
                        lastAIPositionRef.current = `${result.property.latitude},${result.property.longitude}`;
                    }
                }

                if (result.isNew) {
                    if (onSuccess) onSuccess(result.property.id)
                    // Use filteredSteps to redirect to the correct next step
                    const firstStep = filteredSteps[0]
                    const nextStep = filteredSteps[1] || 'access'
                    router.push(`/dashboard/properties/${result.property.id}/setup?tab=${nextStep}&mode=alta`)
                    return
                }

                toast({ title: 'Guardado', description: `${category} actualizado correctamente.` })

                if (category === 'inventory' && dataToSave.selected_items) {
                    setAiLoading('manuals-generation')
                    try {
                        const res = await processInventoryManuals(currentPropId, dataToSave.selected_items)
                        if (res.success && typeof res.processed === 'number' && res.processed > 0) {
                            toast({
                                title: 'IA: Generando manuales',
                                description: `Estamos creando ${res.processed} guías en segundo plano. Aparecerán pronto.`,
                                variant: 'default'
                            })
                        }
                    } catch (err) {
                        console.error('[INVENTORY] Processing failed:', err)
                    } finally {
                        setAiLoading(null)
                    }
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

                // Only auto-navigate to next step if we are in "Alta" mode (initial setup)
                // In edit mode (isEditing), we stay in the same tab unless forced.
                if (isAltaMode || forcedNextTab) {
                    const nextTab = forcedNextTab || steps[steps.indexOf(category) + 1]
                    if (nextTab && steps.includes(nextTab)) {
                        handleTabChange(nextTab)
                    }
                }
            }
        } catch (e: any) {
            console.error('Error in saveStep:', e)
            toast({ title: 'Error', description: e.message || 'Error desconocido al guardar', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

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
                const categoryToSave = activeTab === 'appearance' ? 'branding' : activeTab;
                await saveStep(categoryToSave, stepData);
            }

            const currentIndex = filteredSteps.indexOf(activeTab)
            if (currentIndex < filteredSteps.length - 1) {
                handleTabChange(filteredSteps[currentIndex + 1])
            } else {
                toast({ title: "Guía completada!", description: "Redirigiendo al panel principal..." })
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
        const currentIndex = filteredSteps.indexOf(activeTab)
        if (currentIndex > 0) {
            handleTabChange(filteredSteps[currentIndex - 1])
        }
    }

    const handleGeocode = async (): Promise<GeocodingResult | null> => {
        if (!data.access.full_address) {
            toast({ title: 'Atención', description: 'Por favor, introduce una dirección primero.' });
            return null;
        }

        setGeocoding(true);
        try {
            const result = await geocodeAddress(data.access.full_address);
            const validation = await validateLocation(result, data.access.full_address);

            setGeocodingResult(result);
            setValidationResult(validation);

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
            return result;
        } catch (error: any) {
            console.error('Geocoding error:', error);
            toast({
                title: 'Error de ubicación',
                description: 'No pudimos encontrar esa dirección. Intenta ser más específico.',
                variant: 'destructive'
            });
            return null;
        } finally {
            setGeocoding(false);
        }
    };

    const handleAIFill = async (section: string, category: string = 'todos', overrideData?: { address?: string, coordinates?: GeocodingResult }) => {
        const isTransport = ['transport', 'plane', 'train', 'road'].includes(section)

        // Ensure we have a valid property ID from any available source
        const currentPropId = effectivePropertyId || property?.id

        if (!currentPropId && !overrideData?.address) {
            toast({
                title: 'ID de propiedad no encontrado',
                description: 'Guarda el Paso 1 antes de usar la generación por IA.',
                variant: 'destructive'
            })
            return
        }

        if (aiLoading === section) return;

        const activeGeocodingResult = overrideData?.coordinates || geocodingResult;

        if (isTransport && activeGeocodingResult) {
            const currentPosKey = `${activeGeocodingResult.lat},${activeGeocodingResult.lng}`;
            lastAIPositionRef.current = currentPosKey;
        }

        if (isTransport) {
            setAiProgress(0)
            const interval = setInterval(() => {
                setAiProgress(prev => Math.min(prev + 5, 95))
            }, 600)
                ; (window as any)._aiInterval = interval
        }

        setAiLoading(section)
        const finalAddressToUse = overrideData?.address || data.access.full_address || property?.full_address || '';

        const payload: any = {
            propertyId: currentPropId,
            section,
            existingData: section === 'dining' || section === 'recommendations'
                ? (() => {
                    const isTodosMode = category === 'todos';
                    const TODOS_CATS = new Set([
                        'supermercados', 'restaurantes', 'desayuno', 'tapas',
                        'cultura', 'naturaleza', 'ocio'
                    ]);

                    const existingNames = isTodosMode
                        ? data.dining
                            .filter((r: any) => TODOS_CATS.has((r.type || '').toLowerCase()))
                            .map((r: any) => r.name)
                        : data.dining
                            .filter((r: any) => {
                                const cat = (r.type || '').toLowerCase();
                                if (category === 'ocio' || category === 'ocio_nocturno') {
                                    return cat === 'ocio' || cat === 'ocio_nocturno';
                                }
                                return cat === category.toLowerCase();
                            })
                            .map((r: any) => r.name);

                    return {
                        address: finalAddressToUse,
                        category,
                        existingNames,
                        coordinates: activeGeocodingResult ?? undefined
                    };
                })()
                : (isTransport || section === 'contacts'
                    ? {
                        address: finalAddressToUse,
                        coordinates: activeGeocodingResult,
                        // Parking de la propiedad — viene de data.property (Step 1)
                        propertyParking: isTransport ? {
                            has_parking: data.property.has_parking ?? false,
                            parking_number: data.property.parking_number ?? ''
                        } : undefined
                    }
                    : undefined)
        }

        if (section === 'faqs') {
            payload.existingData = {
                checkin_time: data.checkin.checkin_time,
                quiet_hours: data.rules.quiet_hours
            }
        }

        console.log(`[DEBUG][handleAIFill] Sending payload for ${section}:`, JSON.stringify(payload, null, 2));

        try {
            const t0 = performance.now();
            const res = await fetch('/api/ai-fill-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const t1 = performance.now();
            console.log(`[PERF][WizardContext] /api/ai-fill-context fetch took ${((t1 - t0) / 1000).toFixed(2)}s`);
            const text = await res.text()
            let result: any
            try {
                result = JSON.parse(text)
            } catch {
                const cleaned = text.replace(/^```(?:json)?\s*([\s\S]*?)```$/, '$1').trim()
                try {
                    result = JSON.parse(cleaned || '{}')
                } catch {
                    result = { error: `Error del servidor (${res.status}): ${res.statusText}` }
                }
            }

            if (!res.ok) {
                toast({
                    title: 'Error IA',
                    description: result?.error || `Error del servidor (${res.status})`,
                    variant: 'destructive'
                })
                return
            }

            console.log(`[AI-FILL] Result for ${section}:`, result);

            if (isTransport) {
                setData((prev: any) => {
                    const mergedAccess = { ...prev.access };
                    const incoming = result.access_info || {};

                    Object.entries(incoming).forEach(([key, val]) => {
                        if (val && typeof val === 'object') {
                            // Support both legacy (instructions/info) and new (train_ld/bus_interurban/last_mile) formats
                            const hasContent =
                                (val as any).instructions?.length > 10 ||
                                (val as any).info?.length > 10 ||
                                (val as any).train_ld?.length > 10 ||   // ← nuevo formato tren
                                (val as any).bus_interurban?.length > 10;
                            if (hasContent) {
                                mergedAccess[key] = val;
                            }
                        } else if (val !== null && val !== undefined) {
                            mergedAccess[key] = val;
                        }
                    });

                    console.log('[DEBUG transport full]', JSON.stringify(result.access_info, null, 2))
                    console.log('[DEBUG access keys]', Object.keys(mergedAccess))
                    console.log('[DEBUG from_airport]', JSON.stringify((mergedAccess as any).from_airport, null, 2))
                    console.log('[DEBUG from_train]', JSON.stringify((mergedAccess as any).from_train, null, 2))
                    return { ...prev, access: mergedAccess };
                });
            } else if (section === 'dining') {
                const rawRecs = Array.isArray(result.recommendations) ? result.recommendations : [];

                const TODOS_CATS = new Set([
                    'supermercados', 'restaurantes', 'desayuno', 'tapas',
                    'cultura', 'naturaleza', 'ocio'
                ]);

                setData((prev: any) => {
                    if (category === 'todos') {
                        // Modo todos: REEMPLAZAR las 7 MVP, conservar el resto (italiano, relax, etc.)
                        const kept = prev.dining.filter((r: any) => !TODOS_CATS.has((r.type || '').toLowerCase()));
                        return { ...prev, dining: [...kept, ...rawRecs] };
                    } else {
                        // Modo categoría individual: AÑADIR nuevos, deduplicando por place_id o nombre
                        const existingIds = new Set(prev.dining.map((r: any) => r.google_place_id).filter(Boolean));
                        const existingNames = new Set(prev.dining.map((r: any) => (r.name || '').toLowerCase().trim()));
                        const newRecs = rawRecs.filter((r: any) => {
                            if (r.google_place_id && existingIds.has(r.google_place_id)) return false;
                            const nameKey = (r.name || '').toLowerCase().trim();
                            if (existingNames.has(nameKey)) return false;
                            return true;
                        });
                        return { ...prev, dining: [...prev.dining, ...newRecs] };
                    }
                });
            } else if (section === 'faqs') {
                setData((prev: any) => ({ ...prev, faqs: [...prev.faqs, ...(result.faqs || [])] }));
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
            console.error('AI fill error:', e)
            toast({ title: 'Error IA', description: 'No pudimos generar sugerencias.', variant: 'destructive' })
        } finally {
            setAiLoading(null)
            if ((window as any)._aiInterval) {
                clearInterval((window as any)._aiInterval)
                setAiProgress(100)
            }
        }
    }

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

    return (
        <WizardContext.Provider value={{
            propertyId: effectivePropertyId,
            tenantId: tenantId || null,
            activeTab,
            loading,
            aiLoading,
            property,
            data,
            completedSteps,
            uploading,
            geocoding,
            geocodingResult,
            validationResult,
            aiProgress,
            showRegenerateAlert,
            manualEditDetected,
            direction,
            mounted,
            isEditing,
            resolvedPropertyId,
            lastGeocodedAddressRef,
            lastAIPositionRef,
            setData,
            setProperty,
            setLoading,
            setAiLoading,
            setUploading,
            setGeocoding,
            setGeocodingResult,
            setValidationResult,
            setAiProgress,
            setShowRegenerateAlert,
            setManualEditDetected,
            setDirection,
            setCompletedSteps,
            filteredSteps,
            handleTabChange,
            handleNext,
            handleBack,
            saveStep,
            handleGeocode,
            handleAIFill,
            handleImageUpload,
            handleStepImageUpload
        }}>
            {children}
        </WizardContext.Provider>
    )
}

export function useWizard() {
    const context = useContext(WizardContext)
    if (context === undefined) {
        throw new Error('useWizard must be used within a WizardProvider')
    }
    return context
}
