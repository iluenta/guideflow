// @ts-nocheck — legacy component (not used in active app), kept for reference only
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    CheckCircle2, 
    Circle, 
    Eye, 
    Send, 
    Palette, 
    MessageSquare, 
    Phone, 
    ShieldCheck, 
    Package,
    ArrowRight,
    Sparkles,
    Check,
    Loader2,
    Home,
    MapPin,
    Wifi,
    Key
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { saveWizardStep } from '@/app/actions/wizard'
import { getUploadUrl } from '@/app/actions/properties'

// Sub-components
import { SetupCard } from '@/components/dashboard/SetupCard'
import { SetupHeader } from '@/components/dashboard/SetupHeader'

// Step Editors
import { StepInfoBasica } from '@/components/dashboard/steps/StepInfoBasica'
import { StepAcceso } from '@/components/dashboard/steps/StepAcceso'
import { StepWifi } from '@/components/dashboard/steps/StepWifi'
import { StepCheckin } from '@/components/dashboard/steps/StepCheckin'
import { StepBranding } from '@/components/dashboard/steps/StepBranding'
import { StepWelcome } from '@/components/dashboard/steps/StepWelcome'
import { StepContacts } from '@/components/dashboard/steps/StepContacts'
import { StepRules } from '@/components/dashboard/steps/StepRules'
import { StepInventory } from '@/components/dashboard/steps/StepInventory'

interface PropertySetupHubProps {
    propertyId: string
    tenantId: string
}

export function PropertySetupHub({ propertyId, tenantId }: PropertySetupHubProps) {
    const [property, setProperty] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [editorData, setEditorData] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepId?: string) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        setUploading(true)
        if (stepId) setUploadingStepId(stepId)
        
        try {
            const { uploadUrl, publicUrl } = await getUploadUrl(file.name, file.type)
            const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
            
            if (!res.ok) throw new Error('Error upload')
            
            if (activeSection === 'checkin' && stepId) {
                // Update specific step image
                setEditorData((prev: any) => ({
                    ...prev,
                    steps: (prev.steps || []).map((s: any) => s.id === stepId ? { ...s, image_url: publicUrl } : s)
                }))
            } else {
                // Main property image
                setEditorData((prev: any) => ({ ...prev, main_image_url: publicUrl }))
            }
            
            toast({ title: 'Imagen subida' })
        } catch (error) {
            toast({ title: 'Error subida', variant: 'destructive' })
        } finally {
            setUploading(false)
            setUploadingStepId(null)
        }
    }
    
    // Stats for progress
    const [stats, setStats] = useState({
        info: false,
        access: false,
        wifi: false,
        checkin: false,
        branding: false,
        welcome: false,
        contacts: false,
        rules: false,
        inventory: false
    })

    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        loadStatus()
    }, [propertyId])

    async function loadStatus() {
        setLoading(true)
        try {
            const { data: prop } = await supabase.from('properties').select('*').eq('id', propertyId).single()
            const { data: context } = await supabase.from('property_context').select('category').eq('property_id', propertyId)
            const { data: branding } = await supabase.from('property_branding').select('id').eq('property_id', propertyId).single()

            const contextCats = context?.map(c => c.category) || []

            setProperty(prop)
            setStats({
                info: !!prop?.name,
                access: !!prop?.full_address && !!prop?.latitude,
                wifi: contextCats.includes('tech'),
                checkin: contextCats.includes('checkin'),
                branding: !!branding,
                welcome: contextCats.includes('welcome'),
                contacts: contextCats.includes('contacts'),
                rules: contextCats.includes('rules'),
                inventory: contextCats.includes('inventory')
            })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const openEditor = async (section: string) => {
        if (!property) return
        let defaultData = {}
        
        // Fetch or prepare data for the section
        if (section === 'info') {
            defaultData = {
                name: property.name,
                slug: property.slug,
                guests: property.guests,
                beds: property.beds,
                baths: property.baths,
                description: property.description,
                main_image_url: property.main_image_url
            }
        } else if (section === 'access') {
            defaultData = {
                full_address: property.full_address,
                lat: property.latitude,
                lng: property.longitude
            }
        } else {
            // Context categories
            const category = section === 'wifi' ? 'tech' : section
            const { data: context } = await supabase
                .from('property_context')
                .select('content')
                .eq('property_id', propertyId)
                .eq('category', category)
                .single()
            
            if (context) {
                defaultData = context.content
            } else if (section === 'branding') {
                const { data: b } = await supabase.from('property_branding').select('*').eq('property_id', propertyId).single()
                defaultData = b || {}
            }
        }

        setEditorData(defaultData)
        setActiveSection(section)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            let category = activeSection === 'wifi' ? 'tech' : activeSection!
            if (category === 'info') category = 'property'
            const result = await saveWizardStep(category, editorData, propertyId, tenantId)
            
            if (result.success) {
                toast({ title: 'Cambios guardados correctamente' })
                await loadStatus()
                setActiveSection(null)
            }
        } catch (error) {
            toast({ title: 'Error al guardar', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    const progressValue = Math.round((Object.values(stats).filter(v => v).length / 9) * 100)

    const enrichmentCards = [
        { id: 'branding', title: 'Apariencia', description: 'Personaliza colores y logo', icon: Palette, points: '+10%', color: 'bg-purple-50 text-purple-600', status: stats.branding, actionLabel: stats.branding ? 'Editar' : 'Personalizar' },
        { id: 'welcome', title: 'Saludo', description: 'Mensaje de bienvenida', icon: Sparkles, points: '+5%', color: 'bg-amber-50 text-amber-600', status: stats.welcome, actionLabel: stats.welcome ? 'Editar' : 'Escribir' },
        { id: 'contacts', title: 'Contactos', description: 'Teléfonos de emergencia', icon: Phone, points: '+15%', color: 'bg-blue-50 text-blue-600', status: stats.contacts, actionLabel: stats.contacts ? 'Editar' : 'Añadir' },
        { id: 'rules', title: 'Normas', description: 'Reglas de la casa', icon: ShieldCheck, points: '+10%', color: 'bg-rose-50 text-rose-600', status: stats.rules, actionLabel: stats.rules ? 'Editar' : 'Configurar' },
        { id: 'inventory', title: 'Inventario', description: 'Electrodomésticos y menaje', icon: Package, points: '+20%', color: 'bg-emerald-50 text-emerald-600', status: stats.inventory, actionLabel: stats.inventory ? 'Editar' : 'Analizar' }
    ]

    const essentials = [
        { id: 'info', label: 'Información básica', status: stats.info },
        { id: 'access', label: 'Ubicación y Acceso', status: stats.access },
        { id: 'wifi', label: 'WiFi y Tecnología', status: stats.wifi },
        { id: 'checkin', label: 'Check-in', status: stats.checkin }
    ]

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary font-medium">Cargando tu panel...</p>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24">
            {/* Header section... (same as before) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button variant="ghost" className="w-fit text-text-secondary hover:bg-white/50 -ml-4" onClick={() => window.location.href='/dashboard/properties'}>
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Volver a propiedades
                </Button>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="bg-white hover:bg-gray-50 border-gray-100 shadow-sm gap-2"
                        onClick={() => property && window.open(`/${property.slug || property.id}`, '_blank')}
                    >
                        <Eye className="h-4 w-4" /> Vista Previa
                    </Button>
                    <Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg shadow-emerald-700/20 gap-2 px-6">
                        <Send className="h-4 w-4" /> Publicar Guía
                    </Button>
                </div>
            </div>

            <SetupHeader 
                name={property?.name || ''}
                location={`${property?.city || ''}, ${property?.country || ''}`}
                progress={progressValue}
                essentials={essentials}
                onEssentialClick={openEditor}
            />

            <div className="space-y-6">
                <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-1" />
                    <div>
                        <h2 className="text-2xl font-serif text-text-primary">Completa tu guía</h2>
                        <p className="text-text-secondary text-sm">Añade estos detalles para ofrecer una experiencia de 5 estrellas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrichmentCards.map((card) => (
                        <SetupCard key={card.id} {...card} onClick={() => openEditor(card.id)} />
                    ))}
                </div>
            </div>

            {/* Editing Dialog */}
            <Dialog open={!!activeSection} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Editar sección: {activeSection}</DialogTitle>
                    </DialogHeader>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            {activeSection === 'info' && <StepInfoBasica data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} onImageUpload={handleImageUpload} uploading={uploading} />}
                            {activeSection === 'access' && <StepAcceso data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} geocoding={false} geocodingResult={editorData} validationResult={{isValid: true, confidence:1, warnings:[]}} onGeocode={()=>{}} onPositionChange={(lat, lng) => setEditorData({...editorData, lat, lng})} onAIFill={()=>{}} aiLoading={null} aiProgress={0} />}
                            {activeSection === 'wifi' && <StepWifi data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} />}
                            {activeSection === 'checkin' && <StepCheckin data={editorData} propertyAddress={property?.full_address} onChange={(val) => setEditorData({ ...editorData, ...val })} onImageUpload={handleImageUpload} uploading={uploading} uploadingStepId={uploadingStepId} />}
                            {activeSection === 'branding' && <StepBranding data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} />}
                            {activeSection === 'welcome' && <StepWelcome data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} />}
                            {activeSection === 'contacts' && <StepContacts data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} />}
                            {activeSection === 'rules' && <StepRules data={editorData} onChange={(val) => setEditorData({ ...editorData, ...val })} />}
                            {activeSection === 'inventory' && <StepInventory data={editorData} onChange={(val) => setEditorData(val)} onAIFill={()=>{}} aiLoading={false} />}
                        </motion.div>
                    </AnimatePresence>
                    <DialogFooter className="mt-8 border-t pt-6 gap-3">
                        <Button variant="ghost" onClick={() => setActiveSection(null)} disabled={saving}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary-hover px-10">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
