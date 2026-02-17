'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft, Check, Loader2, Sparkles, Home, MapPin, Wifi, Key, Palette, MessageSquare, Phone } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Existing Logic & Utilities
import { saveWizardStep } from '@/app/actions/wizard'
import { getUploadUrl } from '@/app/actions/properties'
import { geocodeAddress, GeocodingResult } from '@/lib/geocoding'
import { validateLocation, ValidationResult } from '@/lib/geocoding-validation'

// New Step Components
import { QuickStartStepper } from './QuickStartStepper'
import { StepInfoBasica } from './steps/StepInfoBasica'
import { StepAcceso } from './steps/StepAcceso'
import { StepWifi } from './steps/StepWifi'
import { StepCheckin } from './steps/StepCheckin'
import { StepBranding } from './steps/StepBranding'
import { StepWelcome } from './steps/StepWelcome'
import { StepContacts } from './steps/StepContacts'

interface PropertySetupWizardProps {
    propertyId?: string // Opcional para creación
    tenantId?: string   // Requerido para creación
    onSuccess?: (id: string) => void
}

export function PropertySetupWizard({ propertyId: initialPropertyId, tenantId, onSuccess }: PropertySetupWizardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { toast } = useToast()
    const supabase = createClient()

    // State
    const [propertyId, setPropertyId] = useState(initialPropertyId)
    const [mounted, setMounted] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)
    const [direction, setDirection] = useState(1)

    // Data State (Unified structure)
    const [data, setData] = useState<any>({
        property: { name: '', slug: '', guests: 2, beds: 1, baths: 1, description: '', main_image_url: '' },
        access: { full_address: '' },
        tech: { wifi_ssid: '', wifi_password: '', router_notes: '' },
        checkin: { checkin_time: '15:00 - 22:00', emergency_phone: '', steps: [] },
        branding: { custom_primary_color: '#1A4D2E' },
        welcome: { host_name: '', message: '' },
        contacts: { support_name: '', support_phone: '', custom_contacts: [] }
    })

    // Geocoding & AI State
    const [geocoding, setGeocoding] = useState(false)
    const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [aiLoading, setAiLoading] = useState<string | null>(null)
    const [aiProgress, setAiProgress] = useState(0)

    const steps = [
        { id: 'property', label: 'Propiedad', icon: Home },
        { id: 'access', label: 'Acceso', icon: MapPin },
        { id: 'wifi', label: 'WiFi', icon: Wifi },
        { id: 'checkin', label: 'Check-in', icon: Key },
        { id: 'branding', label: 'Apariencia', icon: Palette },
        { id: 'welcome', label: 'Saludo', icon: MessageSquare },
        { id: 'contacts', label: 'Contactos', icon: Phone }
    ]

    // Refs for optimization
    const lastGeocodedAddressRef = useRef<string>('')

    useEffect(() => {
        setMounted(true)
        if (propertyId) loadInitialData()
    }, [propertyId])

    async function loadInitialData() {
        const { data: prop } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .single()

        if (prop) {
            setData((prev: any) => ({
                ...prev,
                property: {
                    name: prop.name || '',
                    slug: prop.slug || '',
                    guests: prop.guests || 2,
                    beds: prop.beds || 1,
                    baths: prop.baths || 1,
                    description: prop.description || '',
                    main_image_url: prop.main_image_url || ''
                },
                access: {
                    full_address: prop.full_address || '',
                    lat: prop.latitude,
                    lng: prop.longitude
                }
            }))

            if (prop.latitude && prop.longitude) {
                setGeocodingResult({
                    lat: prop.latitude,
                    lng: prop.longitude,
                    city: prop.city || '',
                    country: prop.country || '',
                    countryCode: prop.country_code || '',
                    formattedAddress: prop.full_address || '',
                    confidence: 1,
                    accuracy: 'rooftop',
                    source: 'mapbox',
                    timezone: prop.timezone || 'Europe/Madrid'
                })
                setValidationResult({ isValid: true, confidence: 1, warnings: [] })
            }
        }

        // Load context (WiFi and Checkin info are stored in property_context)
        const { data: context } = await supabase
            .from('property_context')
            .select('*')
            .eq('property_id', propertyId)

        if (context) {
            setData((prev: any) => {
                const newData = { ...prev }
                context.forEach((c: any) => {
                    if (c.category === 'tech') newData.tech = { ...newData.tech, ...c.content }
                    if (c.category === 'checkin') newData.checkin = { ...newData.checkin, ...c.content }
                    if (c.category === 'welcome') newData.welcome = { ...newData.welcome, ...c.content }
                    if (c.category === 'contacts') newData.contacts = { ...newData.contacts, ...c.content }
                })
                return newData
            })
        }

        const { data: branding } = await supabase
            .from('property_branding')
            .select('*')
            .eq('property_id', propertyId)
            .single()

        if (branding) {
            setData((prev: any) => ({ ...prev, branding: { ...prev.branding, ...branding } }))
        }
    }

    // Auto-geocode logic
    useEffect(() => {
        if (!mounted || currentStep !== 1 || !data.access.full_address || data.access.full_address.length < 5) return
        if (data.access.full_address === lastGeocodedAddressRef.current) return

        const timer = setTimeout(() => handleGeocode(), 1500)
        return () => clearTimeout(timer)
    }, [data.access.full_address, currentStep, mounted])

    const handleGeocode = async () => {
        setGeocoding(true)
        try {
            const result = await geocodeAddress(data.access.full_address)
            const validation = await validateLocation(result, data.access.full_address)
            setGeocodingResult(result)
            setValidationResult(validation)
            lastGeocodedAddressRef.current = data.access.full_address
            
            setData((prev: any) => ({
                ...prev,
                access: { 
                    ...prev.access, 
                    lat: result.lat, 
                    lng: result.lng,
                    city: result.city,
                    country: result.country,
                    country_code: result.countryCode,
                    postal_code: result.postalCode,
                    timezone: result.timezone
                }
            }))
        } catch (error) {
            toast({ title: 'Error de ubicación', description: 'No pudimos encontrar esa dirección.', variant: 'destructive' })
        } finally {
            setGeocoding(false)
        }
    }

    const handlePositionChange = (lat: number, lng: number) => {
        setGeocodingResult(prev => prev ? { ...prev, lat, lng } : { 
            lat, lng, city: '', country: '', countryCode: '', formattedAddress: '', confidence: 1, accuracy: 'rooftop', source: 'nominatim', timezone: 'UTC' 
        })
        setValidationResult({ isValid: true, confidence: 1, warnings: [] })
        setData((prev: any) => ({
            ...prev,
            access: { ...prev.access, lat, lng }
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepId?: string) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        setUploading(true)
        if (stepId) setUploadingStepId(stepId)
        
        try {
            const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type)
            const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
            
            if (!res.ok) throw new Error('Error upload')
            
            if (currentStep === 3 && stepId) { // Checkin step
                setData((prev: any) => ({
                    ...prev,
                    checkin: {
                        ...prev.checkin,
                        steps: (prev.checkin.steps || []).map((s: any) => s.id === stepId ? { ...s, image_url: publicUrl } : s)
                    }
                }))
            } else {
                setData((prev: any) => ({ ...prev, property: { ...prev.property, main_image_url: publicUrl } }))
            }
            
            toast({ title: 'Imagen subida' })
        } catch (error) {
            toast({ title: 'Error subida', variant: 'destructive' })
        } finally {
            setUploading(false)
            setUploadingStepId(null)
        }
    }

    const handleAIFill = async (section: string) => {
        if (!propertyId) return
        setAiLoading(section)
        setAiProgress(10)
        try {
            const res = await fetch('/api/ai-fill-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    propertyId, 
                    section, 
                    existingData: { address: data.access.full_address, coordinates: geocodingResult } 
                })
            })
            const result = await res.json()
            if (section === 'transport') {
                setData((prev: any) => ({ ...prev, access: { ...prev.access, ...result.access_info } }))
            }
            toast({ title: 'Sugerencias de IA incorporadas' })
        } catch (e) {
            toast({ title: 'Error IA', variant: 'destructive' })
        } finally {
            setAiLoading(null)
            setAiProgress(100)
        }
    }

    const handleNext = async () => {
        const stepId = steps[currentStep].id
        let stepData = null
        
        // Validation
        if (currentStep === 0 && !data.property.name) {
            toast({ title: 'Nombre requerido', description: 'Por favor, indica un nombre para tu propiedad.', variant: 'destructive' })
            return
        }
        if (currentStep === 1 && !validationResult?.isValid) {
            toast({ title: 'Ubicación requerida', description: 'Por favor, introduce una dirección válida y confírmala en el mapa antes de continuar.', variant: 'destructive' })
            return
        }
        if (currentStep === 2 && !data.tech.wifi_ssid) {
            toast({ title: 'WiFi requerido', description: 'Por favor, indica al menos el nombre de la red WiFi.', variant: 'destructive' })
            return
        }
        if (currentStep === 3 && (data.checkin.steps || []).length === 0) {
            toast({ title: 'Instrucciones requeridas', description: 'Añade al menos un paso para explicar cómo acceder a la propiedad.', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            switch (stepId) {
                case 'property': stepData = data.property; break;
                case 'access': 
                    stepData = {
                        ...data.access,
                        full_address: data.access.full_address,
                        latitude: geocodingResult?.lat,
                        longitude: geocodingResult?.lng,
                        city: geocodingResult?.city,
                        country: geocodingResult?.country,
                        timezone: geocodingResult?.timezone
                    }; 
                    break;
                case 'wifi': stepData = data.tech; break;
                case 'checkin': stepData = data.checkin; break;
                case 'branding': stepData = data.branding; break;
                case 'welcome': stepData = data.welcome; break;
                case 'contacts': stepData = data.contacts; break;
            }

            const result = await saveWizardStep(stepId === 'wifi' ? 'tech' : stepId, stepData, propertyId, tenantId)
            if (result.success) {
                if (result.isNew && result.property) {
                    setPropertyId(result.property.id)
                    if (onSuccess) onSuccess(result.property.id)
                }
                
                if (currentStep < steps.length - 1) {
                    setDirection(1)
                    setCurrentStep(prev => prev + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                    toast({ title: '¡Todo listo!', description: 'Has completado la configuración inicial.' })
                    router.push('/dashboard/properties')
                }
            }
        } catch (error) {
            toast({ title: 'Error al guardar', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1)
            setCurrentStep(prev => prev - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    if (!mounted) return null

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header & Stepper Section */}
            <div className="space-y-6 pt-4 px-4 md:px-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-text-primary leading-tight">Wizard de Configuración</h1>
                        <p className="text-sm text-text-secondary">Paso {currentStep + 1} de {steps.length}: {steps[currentStep].label}</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-3xl p-5 md:p-8 shadow-premium border border-gray-100">
                    <QuickStartStepper currentStep={currentStep} steps={steps} />
                </div>
            </div>

            {/* Step Content */}
            <main className="px-4 md:px-0 min-h-[400px]">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -40 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {currentStep === 0 && (
                            <StepInfoBasica 
                                data={data.property} 
                                onChange={(val) => setData({ ...data, property: { ...data.property, ...val } })}
                                onImageUpload={handleImageUpload}
                                uploading={uploading}
                            />
                        )}
                        {currentStep === 1 && (
                            <StepAcceso 
                                data={data.access} 
                                onChange={(val) => setData({ ...data, access: { ...data.access, ...val } })}
                                geocoding={geocoding}
                                geocodingResult={geocodingResult}
                                validationResult={validationResult}
                                onGeocode={handleGeocode}
                                onPositionChange={handlePositionChange}
                                onAIFill={handleAIFill}
                                aiLoading={aiLoading}
                                aiProgress={aiProgress}
                            />
                        )}
                        {currentStep === 2 && (
                            <StepWifi 
                                data={data.tech} 
                                onChange={(val) => setData({ ...data, tech: { ...data.tech, ...val } })}
                            />
                        )}
                        {currentStep === 3 && (
                            <StepCheckin 
                                data={data.checkin} 
                                propertyAddress={data.access.full_address}
                                onChange={(val) => setData({ ...data, checkin: { ...data.checkin, ...val } })}
                                onImageUpload={handleImageUpload}
                                uploading={uploading}
                                uploadingStepId={uploadingStepId}
                            />
                        )}
                        {currentStep === 4 && (
                            <StepBranding 
                                data={data.branding} 
                                onChange={(val) => setData({ ...data, branding: { ...data.branding, ...val } })}
                            />
                        )}
                        {currentStep === 5 && (
                            <StepWelcome 
                                data={data.welcome} 
                                onChange={(val) => setData({ ...data, welcome: { ...data.welcome, ...val } })}
                            />
                        )}
                        {currentStep === 6 && (
                            <StepContacts 
                                data={data.contacts} 
                                onChange={(val) => setData({ ...data, contacts: { ...data.contacts, ...val } })}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || loading}
                        className="h-12 md:px-8 font-bold gap-2 text-gray-500 hover:bg-gray-50"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="hidden md:inline">Anterior</span>
                    </Button>

                    <div className="flex-1 flex justify-center md:hidden">
                       <span className="text-xs font-black text-primary uppercase tracking-widest">{Math.round(((currentStep + 1) / steps.length) * 100)}% Completado</span>
                    </div>

                    <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="h-12 px-8 md:px-12 font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : currentStep === steps.length - 1 ? (
                            <>
                                <Check className="h-5 w-5" /> Finalizar
                            </>
                        ) : (
                            <>
                                Siguiente <ChevronRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
