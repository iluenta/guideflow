'use client'

import { useState, useEffect, useId } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Save, ChevronRight, ChevronLeft, Check, Plus, Trash2, MapPin, Clock, Utensils, HelpCircle, ShieldAlert, Wifi, Package, Home as HomeIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { saveWizardStep } from '@/app/actions/wizard'

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
        property: { name: '', slug: '', location: '', guests: 2, beds: 1, baths: 1, description: '', primary_color: '#ef4444' },
        welcome: { title: 'Welcome', host_name: '', message: 'Please enjoy your stay' },
        access: { full_address: '', checkin_type: 'lockbox', checkin_instructions: '' },
        rules: { smoking: 'no', pets: 'no', quiet_hours: '23:00 - 08:00', checkout_time: '11:00' },
        tech: { wifi_ssid: '', wifi_password: '', tv_instructions: '' },
        inventory: { bathroom: [], bedroom: [], kitchen: [], cleaning: [] },
        dining: [],
        faqs: []
    })
    const [completedSteps, setCompletedSteps] = useState<string[]>([])
    const { toast } = useToast()
    const supabase = createClient()

    // Calcular progreso
    const steps = ['property', 'welcome', 'access', 'rules', 'tech', 'inventory', 'dining', 'faqs']
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
                setData((prev: any) => ({
                    ...prev,
                    property: {
                        name: propDetails.name,
                        slug: propDetails.slug,
                        location: propDetails.location,
                        guests: propDetails.guests,
                        beds: propDetails.beds,
                        baths: propDetails.baths,
                        description: propDetails.description,
                        primary_color: propDetails.theme_config?.primary_color || '#ef4444'
                    }
                }))
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

    const saveStep = async (category: string, stepData: any) => {
        setLoading(true)
        try {
            const currentPropId = propertyId || property?.id

            const result = await saveWizardStep(
                category,
                stepData,
                currentPropId,
                tenantId
            )

            if (result.success) {
                if (result.property) {
                    setProperty(result.property)
                }

                if (result.isNew) {
                    if (onSuccess) onSuccess(result.property.id)
                    router.push(`/dashboard/properties/${result.property.id}/setup?tab=welcome`)
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
        setAiLoading(section)
        try {
            const res = await fetch('/api/ai-fill-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId, section })
            })
            const result = await res.json()

            if (section === 'dining') {
                setData({ ...data, dining: [...data.dining, ...result.recommendations] })
            } else if (section === 'faqs') {
                setData({ ...data, faqs: [...data.faqs, ...result.faqs] })
            } else if (section === 'transport') {
                setData({
                    ...data,
                    access: {
                        ...data.access,
                        full_address: data.access.full_address || property.location,
                        checkin_instructions: result.access_info.from_airport.instructions + '\n\n' + result.access_info.from_train.instructions
                    }
                })
            } else if (section === 'tech') {
                setData({
                    ...data,
                    tech: {
                        ...data.tech,
                        wifi_ssid: result.tech_info.wifi.ssid_example,
                        wifi_password: result.tech_info.wifi.password_hint,
                        tv_instructions: result.tech_info.tv.instructions + '\n\n' + result.tech_info.bluetooth_speaker.instructions
                    }
                })
            } else if (section === 'inventory') {
                setData({ ...data, inventory: result.inventory })
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
                            value="welcome"
                            className={cn(
                                "flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all text-[9px] sm:text-[10px] py-1.5 sm:py-2 font-semibold uppercase tracking-wide",
                                completedSteps.includes('welcome') && "bg-emerald-50/50 text-emerald-700 data-[state=active]:text-primary"
                            )}
                        >
                            {completedSteps.includes('welcome') ? <Check className="w-3 h-3 mr-1 text-emerald-500" /> : <Sparkles className="w-3 h-3 mr-1" />} Saludo
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
                                            <Label>Ubicación</Label>
                                            <Input
                                                placeholder="Ej: Marbella, España"
                                                className="h-11"
                                                value={data.property?.location || ''}
                                                onChange={e => setData({ ...data, property: { ...data.property, location: e.target.value } })}
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
                                                <Input type="color" className="p-1 h-11 w-20" value={data.property?.primary_color || '#ef4444'} onChange={e => setData({ ...data, property: { ...data.property, primary_color: e.target.value } })} />
                                                <Input value={data.property?.primary_color || '#ef4444'} className="h-11 font-mono" onChange={e => setData({ ...data, property: { ...data.property, primary_color: e.target.value } })} />
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
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-end">
                                <Button onClick={() => saveStep('property', data.property)} disabled={loading}>
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
                                <Button variant="ghost" onClick={() => setActiveTab('property')}><ChevronLeft className="mr-2" /> Anterior</Button>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                        onClick={() => handleAIFill('transport')}
                                        disabled={aiLoading === 'transport'}
                                    >
                                        {aiLoading === 'transport' ? 'Buscando...' : <><Sparkles className="w-4 h-4 mr-2" /> Ayuda con el transporte</>}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Dirección Completa</Label>
                                        <Input
                                            placeholder="Ej: Calle Mayor 123, 3º Izq"
                                            className="h-11"
                                            value={data.access?.full_address || ''}
                                            onChange={e => setData({ ...data, access: { ...data.access, full_address: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instrucciones de Check-in</Label>
                                        <Textarea
                                            placeholder="Describe dónde está la llave, códigos de seguridad, etc."
                                            className="min-h-[140px]"
                                            value={data.access?.checkin_instructions || ''}
                                            onChange={e => setData({ ...data, access: { ...data.access, checkin_instructions: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <div />
                                <Button onClick={() => saveStep('access', data.access)} disabled={loading}>
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
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Hora de Salida (Check-out)</Label>
                                        <Input
                                            type="time"
                                            className="h-11"
                                            value={data.rules?.checkout_time || ''}
                                            onChange={e => setData({ ...data, rules: { ...data.rules, checkout_time: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Horario de Silencio</Label>
                                        <Input
                                            placeholder="Ej: 23:00 a 08:00"
                                            className="h-11"
                                            value={data.rules?.quiet_hours || ''}
                                            onChange={e => setData({ ...data, rules: { ...data.rules, quiet_hours: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between">
                                <Button variant="ghost" onClick={() => setActiveTab('access')}><ChevronLeft className="mr-2" /> Anterior</Button>
                                <Button onClick={() => saveStep('rules', data.rules)} disabled={loading}>Guardar y Continuar <ChevronRight className="ml-2" /></Button>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre de la Red WiFi</Label>
                                        <Input
                                            placeholder="Ej: MiCasaWiFi"
                                            className="h-11"
                                            value={data.tech?.wifi_ssid || data.tech?.wifi?.ssid_example || ''}
                                            onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contraseña WiFi</Label>
                                        <Input
                                            placeholder="Ej: 12345678"
                                            className="h-11"
                                            value={data.tech?.wifi_password || data.tech?.wifi?.password_hint || ''}
                                            onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Instrucciones de la TV / Dispositivos</Label>
                                    <Textarea
                                        placeholder="Cómo usar la Smart TV, altavoces Bluetooth, etc."
                                        className="min-h-[120px]"
                                        value={data.tech?.tv_instructions || data.tech?.tv?.instructions || ''}
                                        onChange={e => setData({ ...data, tech: { ...data.tech, tv_instructions: e.target.value } })}
                                    />
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
            )}
        </div>
    )
}
