'use client'

import { useState, useEffect, useId } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Save, ChevronRight, ChevronLeft, Check, Plus, Trash2, MapPin, Clock, Utensils, HelpCircle, ShieldAlert, Wifi, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface PropertySetupWizardProps {
    propertyId: string
}

export function PropertySetupWizard({ propertyId }: PropertySetupWizardProps) {
    const [mounted, setMounted] = useState(false)
    const id = useId()
    const [activeTab, setActiveTab] = useState('access')
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState<string | null>(null)
    const [property, setProperty] = useState<any>(null)
    const [data, setData] = useState<any>({
        access: { full_address: '', checkin_type: 'lockbox', checkin_instructions: '' },
        rules: { smoking: 'no', pets: 'no', quiet_hours: '23:00 - 08:00', checkout_time: '11:00' },
        tech: { wifi_ssid: '', wifi_password: '', tv_instructions: '' },
        inventory: { bathroom: [], bedroom: [], kitchen: [], cleaning: [] },
        dining: [],
        faqs: []
    })
    const { toast } = useToast()
    const supabase = createClient()

    // Calcular progreso
    const steps = ['access', 'rules', 'tech', 'inventory', 'dining', 'faqs']
    const progress = ((steps.indexOf(activeTab) + 1) / steps.length) * 100

    // Cargar datos iniciales
    useEffect(() => {
        setMounted(true)
        async function loadData() {
            const { data: context } = await supabase
                .from('property_context')
                .select('*')
                .eq('property_id', propertyId)

            const { data: propDetails } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .single()

            if (propDetails) setProperty(propDetails)

            const { data: faqs } = await supabase
                .from('property_faqs')
                .select('*')
                .eq('property_id', propertyId)

            const { data: recommendations } = await supabase
                .from('property_recommendations')
                .select('*')
                .eq('property_id', propertyId)

            if (context || faqs || recommendations) {
                const newData = { ...data }
                context?.forEach((c: any) => { newData[c.category] = c.content })
                if (faqs) newData.faqs = faqs
                if (recommendations) newData.dining = recommendations
                setData(newData)
            }
        }
        loadData()
    }, [propertyId])

    const saveStep = async (category: string, stepData: any) => {
        setLoading(true)
        try {
            if (category === 'faqs') {
                // Guardar FAQs (requiere manejo especial de delete/insert o upsert)
                for (const faq of stepData) {
                    await supabase.from('property_faqs').upsert({
                        property_id: propertyId,
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category
                    })
                }
            } else if (category === 'dining') {
                // Guardar Recomendaciones
                for (const rec of stepData) {
                    await supabase.from('property_recommendations').upsert({
                        property_id: propertyId,
                        type: rec.type || 'restaurant',
                        name: rec.name,
                        description: rec.description || rec.specialty,
                        distance: rec.distance,
                        price_range: rec.price_range,
                        personal_note: rec.personal_note
                    })
                }
            } else {
                // Guardar Contexto General
                const { error } = await supabase
                    .from('property_context')
                    .upsert({
                        property_id: propertyId,
                        category: category,
                        content: stepData
                    }, { onConflict: 'property_id,category' })

                if (error) throw error
            }

            toast({ title: 'Guardado', description: `${category} actualizado correctamente.` })
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' })
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
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">Configura tu Guía Mágica</h1>
                <p className="text-muted-foreground">Rellena la información para que tu asistente IA pueda ayudar a tus huéspedes.</p>
                <Progress value={progress} className="h-2" />
            </div>

            {!mounted ? (
                <div className="w-full h-96 bg-slate-50 animate-pulse rounded-3xl" />
            ) : (
                <Tabs id={id} value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 h-12 bg-slate-100 rounded-xl p-1">
                        <TabsTrigger value="access" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Acceso
                        </TabsTrigger>
                        <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Normas
                        </TabsTrigger>
                        <TabsTrigger value="tech" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Tecnología
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Inventario
                        </TabsTrigger>
                        <TabsTrigger value="dining" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <Utensils className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Ocio
                        </TabsTrigger>
                        <TabsTrigger value="faqs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-[11px] sm:text-xs">
                            <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> FAQs
                        </TabsTrigger>
                    </TabsList>

                    {/* --- ACCESO --- */}
                    <TabsContent value="access" className="mt-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Llegada y Acceso</CardTitle>
                                        <CardDescription>Cómo llegan tus huéspedes y cómo entran a la casa.</CardDescription>
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
                            <CardContent className="p-6 space-y-6">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label>Dirección Completa</Label>
                                        <Input
                                            placeholder="Ej: Calle Mayor 123, 3º Izq"
                                            value={data.access.full_address}
                                            onChange={e => setData({ ...data, access: { ...data.access, full_address: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instrucciones de Check-in</Label>
                                        <Textarea
                                            placeholder="Describe dónde está la llave, códigos de seguridad, etc."
                                            className="min-h-[120px]"
                                            value={data.access.checkin_instructions}
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
                    <TabsContent value="rules" className="mt-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle>Normas de la Casa</CardTitle>
                                <CardDescription>Establece las reglas para una convivencia perfecta.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Hora de Salida (Check-out)</Label>
                                        <Input
                                            type="time"
                                            value={data.rules.checkout_time}
                                            onChange={e => setData({ ...data, rules: { ...data.rules, checkout_time: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Horario de Silencio</Label>
                                        <Input
                                            placeholder="Ej: 23:00 a 08:00"
                                            value={data.rules.quiet_hours}
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
                    <TabsContent value="tech" className="mt-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>WiFi y Tecnología</CardTitle>
                                        <CardDescription>Datos de conexión e instrucciones de dispositivos.</CardDescription>
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
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre de la Red WiFi</Label>
                                        <Input
                                            placeholder="Ej: MiCasaWiFi"
                                            value={data.tech.wifi_ssid || data.tech.wifi?.ssid_example || ''}
                                            onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contraseña WiFi</Label>
                                        <Input
                                            placeholder="Ej: 12345678"
                                            value={data.tech.wifi_password || data.tech.wifi?.password_hint || ''}
                                            onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Instrucciones de la TV / Dispositivos</Label>
                                    <Textarea
                                        placeholder="Cómo usar la Smart TV, altavoces Bluetooth, etc."
                                        className="min-h-[100px]"
                                        value={data.tech.tv_instructions || data.tech.tv?.instructions || ''}
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
                    <TabsContent value="inventory" className="mt-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Servicios e Inventario</CardTitle>
                                        <CardDescription>Qué equipos y servicios facilitas a tus huéspedes.</CardDescription>
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
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Baño</Label>
                                        <Textarea
                                            placeholder="Ej: Secador, Gel, Champú..."
                                            value={Array.isArray(data.inventory.bathroom) ? data.inventory.bathroom.join(', ') : data.inventory.bathroom}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, bathroom: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dormitorio</Label>
                                        <Textarea
                                            placeholder="Ej: Almohadas extra, Mantas..."
                                            value={Array.isArray(data.inventory.bedroom) ? data.inventory.bedroom.join(', ') : data.inventory.bedroom}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, bedroom: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cocina</Label>
                                        <Textarea
                                            placeholder="Ej: Nespresso, Aceite, Sal..."
                                            value={Array.isArray(data.inventory.kitchen) ? data.inventory.kitchen.join(', ') : data.inventory.kitchen}
                                            onChange={e => setData({ ...data, inventory: { ...data.inventory, kitchen: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Limpieza y Otros</Label>
                                        <Textarea
                                            placeholder="Ej: Plancha, Tabla, Tendedero..."
                                            value={Array.isArray(data.inventory.cleaning) ? data.inventory.cleaning.join(', ') : data.inventory.cleaning}
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
                    <TabsContent value="dining" className="mt-6">
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
                    <TabsContent value="faqs" className="mt-6">
                        <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="bg-slate-50 border-b flex flex-row justify-between items-center">
                                <div>
                                    <CardTitle>Preguntas Frecuentes</CardTitle>
                                    <CardDescription>Anticípate a las dudas de tus huéspedes.</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleAIFill('faqs')}
                                    disabled={aiLoading === 'faqs'}
                                >
                                    {aiLoading === 'faqs' ? 'Generando...' : <><Sparkles className="w-4 h-4 mr-2" /> Auto-generar FAQs</>}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
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
                                                    className="font-bold border-none bg-transparent focus-visible:ring-0 px-0"
                                                />
                                                <Textarea
                                                    placeholder="Respuesta..."
                                                    value={faq.answer}
                                                    onChange={e => {
                                                        const newFaqs = [...data.faqs];
                                                        newFaqs[idx].answer = e.target.value;
                                                        setData({ ...data, faqs: newFaqs });
                                                    }}
                                                    className="border-none bg-transparent focus-visible:ring-0 px-0 min-h-[80px]"
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
