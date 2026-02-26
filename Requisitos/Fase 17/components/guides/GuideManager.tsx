'use client'

import { useState, useEffect, useMemo } from 'react'
import { Property, GuideSection, saveGuideSection, deleteGuideSection, updateSectionsOrder, updateProperty, deleteManual } from '@/app/actions/properties'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    GripVertical,
    Edit2,
    Trash2,
    Sparkles,
    Wifi,
    Key,
    Car,
    MapPin,
    Phone,
    UtensilsCrossed,
    Info,
    Settings,
    MessageSquare,
    Save,
    ShoppingBag,
    Music,
    Ticket,
    Umbrella,
    Star,
    Loader2,
    Upload,
    Camera,
    FileText
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { AutoBuildDialog } from '@/components/properties/AutoBuildDialog'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ManualEnrichmentDialog } from './ManualEnrichmentDialog'
import { HITLValidation } from './HITLValidation'
import { VisualScanner } from './VisualScanner'
import { ManualEditDialog } from './ManualEditDialog'

interface GuideManagerProps {
    property: Property
    initialSections: GuideSection[]
    manuals: any[]
}

const RECOMMENDATION_CATEGORIES = [
    { id: 'all', label: 'Todos', icon: <Star className="h-3 w-3" /> },
    { id: 'restaurantes', label: 'Restaurantes', icon: <UtensilsCrossed className="h-3 w-3" /> },
    { id: 'compras', label: 'Compras', icon: <ShoppingBag className="h-3 w-3" /> },
    { id: 'cultura', label: 'Cultura', icon: <Ticket className="h-3 w-3" /> },
    { id: 'naturaleza', label: 'Naturaleza', icon: <Umbrella className="h-3 w-3" /> },
    { id: 'ocio', label: 'Ocio', icon: <Music className="h-3 w-3" /> },
]

export function GuideManager({ property, initialSections, manuals }: GuideManagerProps) {
    const [allSections, setAllSections] = useState<GuideSection[]>(initialSections)
    const [allManuals, setAllManuals] = useState<any[]>(manuals || [])
    const [editingSection, setEditingSection] = useState<Partial<GuideSection> | null>(null)
    const [enrichingManual, setEnrichingManual] = useState<any | null>(null)
    const [editingManualContent, setEditingManualContent] = useState<any | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [activeTab, setActiveTab] = useState('info')

    // Confirmation dialog state
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    })
    const [recCategory, setRecCategory] = useState('all')

    // Separate sections and recommendations
    const sections = useMemo(() => allSections.filter(s => s.content_type !== 'recommendation'), [allSections])
    const recommendations = useMemo(() => allSections.filter(s => s.content_type === 'recommendation'), [allSections])

    const filteredRecommendations = useMemo(() => {
        if (recCategory === 'all') return recommendations
        return recommendations.filter(r => (r.data?.category || '').toLowerCase() === recCategory.toLowerCase())
    }, [recommendations, recCategory])

    // Local state for property info
    const [propInfo, setPropInfo] = useState({
        name: property.name,
        host_name: property.theme_config?.host_name || '',
        welcome_title: property.theme_config?.welcome_title || '',
        welcome_message: property.theme_config?.welcome_message || '',
        ai_personality: property.theme_config?.ai_personality || '',
        ai_additional_info: property.theme_config?.ai_additional_info || ''
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    async function handleSavePropertyInfo() {
        setIsSaving(true)
        try {
            await updateProperty(property.id, {
                name: propInfo.name,
                theme_config: {
                    ...property.theme_config,
                    host_name: propInfo.host_name,
                    welcome_title: propInfo.welcome_title,
                    welcome_message: propInfo.welcome_message,
                    ai_personality: propInfo.ai_personality,
                    ai_additional_info: propInfo.ai_additional_info
                }
            })
            toast.success('Cambios guardados correctamente')
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleSaveSection() {
        if (!editingSection || !editingSection.title) return

        setIsSaving(true)
        try {
            const saved = await saveGuideSection(property.id, editingSection)
            setAllSections(prev => {
                const exists = prev.find(s => s.id === saved.id)
                if (exists) return prev.map(s => s.id === saved.id ? saved : s)
                return [...prev, saved]
            })
            setEditingSection(null)
            toast.success('Guardado correctamente')
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteSection(id: string) {
        setConfirmConfig({
            isOpen: true,
            title: '¿Eliminar elemento?',
            description: '¿Estás seguro de que quieres eliminar esta sección? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await deleteGuideSection(id, property.id)
                    setAllSections(prev => prev.filter(s => s.id !== id))
                    toast.success('Eliminado')
                } catch (error: any) {
                    toast.error('Error: ' + error.message)
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    async function handleDeleteManual(manualId: string) {
        setConfirmConfig({
            isOpen: true,
            title: '¿Eliminar manual?',
            description: '¿Estás seguro de que quieres eliminar este manual? El asistente de IA dejará de responder preguntas sobre este aparato.',
            onConfirm: async () => {
                try {
                    await deleteManual(manualId, property.id)
                    setAllManuals(prev => prev.filter(m => m.id !== manualId))
                    toast.success('Manual eliminado correctamente')
                    // Force refresh to ensure everything is in sync
                    window.location.reload()
                } catch (error: any) {
                    toast.error('Error al eliminar manual: ' + error.message)
                }
                setConfirmConfig(prev => ({ ...prev, isOpen: false }))
            }
        })
    }

    async function onDragEnd(result: DropResult) {
        if (!result.destination) return

        const items = Array.from(sections)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Combine back with recommendations to keep state consistent
        setAllSections([...items, ...recommendations])

        try {
            const sectionIds = items.map(i => i.id)
            await updateSectionsOrder(property.id, sectionIds)
        } catch (error: any) {
            toast.error('Error al reordenar')
            setAllSections(allSections)
        }
    }

    const getIcon = (title: string) => {
        const t = title.toLowerCase()
        if (t.includes('wifi')) return <Wifi className="h-4 w-4" />
        if (t.includes('llave') || t.includes('acceso') || t.includes('entrar')) return <Key className="h-4 w-4" />
        if (t.includes('parking') || t.includes('aparcamiento')) return <Car className="h-4 w-4" />
        if (t.includes('ubicación') || t.includes('llegar')) return <MapPin className="h-4 w-4" />
        if (t.includes('emergencia') || t.includes('teléfono')) return <Phone className="h-4 w-4" />
        if (t.includes('restaurante') || t.includes('comer')) return <UtensilsCrossed className="h-4 w-4" />
        return <Info className="h-4 w-4" />
    }

    const getRecIcon = (category: string) => {
        const c = category.toLowerCase()
        if (c.includes('restaurante')) return <UtensilsCrossed className="h-4 w-4" />
        if (c.includes('compra')) return <ShoppingBag className="h-4 w-4" />
        if (c.includes('ocio')) return <Music className="h-3 w-3" />
        if (c.includes('cultura')) return <Ticket className="h-4 w-4" />
        return <MapPin className="h-4 w-4" />
    }

    if (!isMounted) return null

    return (
        <Card className="border shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-4 md:px-8 pt-8 pb-4">
                <div>
                    <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                        Editando: <span className="text-primary bg-primary/10 px-4 py-1 rounded-full">{property.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm font-medium mt-1">Configura la experiencia premium del huésped</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="rounded-full h-10 w-10 p-0 hover:bg-muted">
                    ✕
                </Button>
            </CardHeader>
            <CardContent className="px-4 md:px-8 pb-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-8 w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-4 md:gap-8 overflow-x-auto overflow-y-hidden scrollbar-hide no-scrollbar flex-nowrap">
                        <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <Info className="h-4 w-4 md:hidden" />
                            <span className="hidden md:inline">Info General</span>
                            <span className="md:hidden">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="sections" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <Settings className="h-4 w-4 md:hidden" />
                            <span className="hidden md:inline">Secciones</span>
                            <span className="md:hidden">Guía</span>
                        </TabsTrigger>
                        <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <MapPin className="h-4 w-4 md:hidden" />
                            <span className="hidden md:inline">Recomendaciones</span>
                            <span className="md:hidden">Lugares</span>
                        </TabsTrigger>
                        <TabsTrigger value="visual" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <Camera className="h-4 w-4" />
                            <span className="hidden md:inline">Escáner Visual</span>
                            <span className="md:hidden">Escáner</span>
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <Sparkles className="h-4 w-4 md:hidden" />
                            <span className="hidden md:inline">Config IA</span>
                            <span className="md:hidden">IA</span>
                        </TabsTrigger>
                        <TabsTrigger value="manuals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-semibold text-sm transition-all flex items-center gap-2 shrink-0">
                            <FileText className="h-4 w-4 md:hidden" />
                            <span className="hidden md:inline">Manuales Técnicos</span>
                            <span className="md:hidden">Manuales</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Info General */}
                    <TabsContent value="info" className="space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
                        <div className="grid gap-8 sm:grid-cols-2">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium mb-2 block">Título de bienvenida</Label>
                                <Input
                                    placeholder="Ej: Bienvenido a tu estancia"
                                    value={propInfo.welcome_title}
                                    onChange={e => setPropInfo(prev => ({ ...prev, welcome_title: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium mb-2 block">Nombre del anfitrión</Label>
                                <Input
                                    placeholder="Ej: Maria"
                                    value={propInfo.host_name}
                                    onChange={e => setPropInfo(prev => ({ ...prev, host_name: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium mb-2 block">Mensaje de bienvenida</Label>
                            <Textarea
                                className="resize-none min-h-[120px]"
                                rows={5}
                                value={propInfo.welcome_message}
                                onChange={e => setPropInfo(prev => ({ ...prev, welcome_message: e.target.value }))}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSavePropertyInfo} disabled={isSaving} className="min-w-[140px]">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar cambios
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Secciones */}
                    <TabsContent value="sections" className="space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
                        <HITLValidation
                            propertyId={property.id}
                            sections={allSections}
                            onUpdate={() => window.location.reload()}
                        />

                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/40">Informacion basica</h3>
                            <div className="flex gap-3">
                                <AutoBuildDialog propertyId={property.id} onComplete={() => window.location.reload()} />
                            </div>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="sections">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {sections.map((section, index) => (
                                            <Draggable key={section.id} draggableId={section.id} index={index}>
                                                {(p, s) => (
                                                    <Card ref={p.innerRef} {...p.draggableProps} className={`group relative border shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl ${s.isDragging ? 'shadow-2xl scale-105 bg-background z-50' : 'bg-background hover:-translate-y-1'}`}>
                                                        <CardContent className="p-6">
                                                            <div className="flex items-start gap-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                                                    {getIcon(section.title)}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-6">
                                                                    <h4 className="font-semibold text-[15px] leading-tight mb-1">{section.title}</h4>
                                                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
                                                                        {section.data?.text || 'Toca para añadir instrucciones detalladas'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div {...p.dragHandleProps} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                                                <GripVertical className="h-4 w-4" />
                                                            </div>

                                                            <div className="mt-6 flex justify-end gap-1">
                                                                <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => setEditingSection(section)}>
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm" className="h-9 w-9 rounded-xl text-destructive/50 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteSection(section.id)}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <Card
                                            className="border-2 border-dashed border-muted bg-transparent hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer rounded-3xl group min-h-[160px] flex items-center justify-center"
                                            onClick={() => setEditingSection({ title: '', content_type: 'text', data: { text: '' }, order_index: sections.length })}
                                        >
                                            <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                                                    <Plus className="h-5 w-5" />
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary">Añadir seccion personalizada</span>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </TabsContent>

                    {/* Recomendaciones */}
                    <TabsContent value="recommendations" className="space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
                        <div className="bg-muted/10 border rounded-3xl p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">Recomendaciones locales</h3>
                                    <p className="text-sm text-muted-foreground">Añade tus lugares favoritos para que tus huéspedes descubran lo mejor de la zona</p>
                                </div>
                                <Button
                                    onClick={() => setEditingSection({
                                        title: '',
                                        content_type: 'recommendation',
                                        data: { category: 'Restaurantes', description: '', rating: 4.5, time: '5 min', price: '€€' }
                                    })}
                                    className="rounded-2xl h-12 px-6 bg-foreground text-background hover:opacity-90 font-semibold"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo lugar
                                </Button>
                            </div>

                            <div className="mt-10 flex flex-wrap gap-2">
                                {RECOMMENDATION_CATEGORIES.map(cat => (
                                    <Button
                                        key={cat.id}
                                        variant={recCategory === cat.id ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setRecCategory(cat.id)}
                                        className="rounded-full px-5 h-9 font-semibold text-xs gap-2 transition-all"
                                    >
                                        {cat.icon}
                                        {cat.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {filteredRecommendations.length === 0 ? (
                                <div className="text-center py-20 opacity-40">
                                    <UtensilsCrossed className="h-12 w-12 mx-auto mb-4" />
                                    <p className="font-bold">No hay recomendaciones en esta categoría</p>
                                </div>
                            ) : (
                                filteredRecommendations.map((rec) => (
                                    <Card key={rec.id} className="group border shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden">
                                        <CardContent className="p-0 flex items-stretch">
                                            <div className="w-1.5 bg-primary/20 group-hover:bg-primary transition-colors shrink-0" />
                                            <div className="p-8 flex flex-1 items-center gap-6">
                                                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform duration-500">
                                                    {getRecIcon(rec.data?.category || '')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-lg font-semibold">{rec.title}</h4>
                                                        <div className="flex items-center gap-1 text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                            <Star className="h-3 w-3 fill-current" />
                                                            {rec.data?.rating || '4.5'}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 opacity-70 italic">
                                                        {rec.data?.description || 'Sin descripción añadida'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold bg-muted/30 border-none">{rec.data?.category}</Badge>
                                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold bg-muted/30 border-none">{rec.data?.time} </Badge>
                                                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold bg-muted/30 border-none">{rec.data?.price}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/10" onClick={() => setEditingSection(rec)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteSection(rec.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Escáner Visual */}
                    <TabsContent value="visual" className="animate-in fade-in-50 zoom-in-95 duration-500">
                        <VisualScanner
                            propertyId={property.id}
                            onSuccess={() => {
                                window.location.reload()
                            }}
                        />
                    </TabsContent>

                    {/* Config IA */}
                    <TabsContent value="ai" className="space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
                        <div className="bg-primary shadow-2xl shadow-primary/20 rounded-[2rem] p-10 text-primary-foreground relative overflow-hidden">
                            <div className="relative z-10 flex gap-8 items-center">
                                <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                                    <MessageSquare className="h-12 w-12" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold mb-2">Cerebro del Asistente</h4>
                                    <p className="text-lg opacity-80 leading-relaxed font-medium">
                                        Entrena a la IA con una personalidad única. Usará toda la información de tus guías para dar respuestas impecables a tus huéspedes.
                                    </p>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium mb-2 block">Personalidad del asistente</Label>
                            <Textarea
                                className="rounded-[2rem] bg-muted/20 border-none focus:ring-2 focus:ring-primary/20 p-8 text-lg font-medium leading-relaxed resize-none"
                                rows={4}
                                placeholder="Ej: Eres un asistente entusiasta y servicial..."
                                value={propInfo.ai_personality}
                                onChange={e => setPropInfo(prev => ({ ...prev, ai_personality: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-sm font-medium mb-2 block">Información adicional para IA</Label>
                            <Textarea
                                className="rounded-[2rem] bg-muted/20 border-none focus:ring-2 focus:ring-primary/20 p-8 text-lg font-medium leading-relaxed resize-none"
                                rows={4}
                                placeholder="Añade contexto extra que el asistente debe conocer..."
                                value={propInfo.ai_additional_info}
                                onChange={e => setPropInfo(prev => ({ ...prev, ai_additional_info: e.target.value }))}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSavePropertyInfo} disabled={isSaving} className="min-w-[140px] h-11 px-8">
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Guardar configuración
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Manuales Técnicos */}
                    <TabsContent value="manuals" className="space-y-8 animate-in fade-in-50 zoom-in-95 duration-500">
                        <div className="bg-slate-900 shadow-2xl rounded-[2rem] p-10 text-white relative overflow-hidden">
                            <div className="relative z-10 flex gap-8 items-center">
                                <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                                    <FileText className="h-10 w-10" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold mb-2">Base de Conocimientos Técnica</h4>
                                    <p className="opacity-80 leading-relaxed font-medium">
                                        Manuales oficiales y notas del anfitrión. La IA usa esto para dar respuestas 100% precisas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {allManuals.length === 0 ? (
                            <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-center rounded-[2.5rem] bg-muted/5">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                    <Upload className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold">Añadir Manual Oficial (PDF)</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-8">
                                    La IA procesará el documento y lo dividirá en secciones funcionales automáticamente.
                                </p>
                                <Button className="rounded-2xl h-12 px-8 font-bold gap-2">
                                    <Plus className="h-5 w-5" />
                                    Subir Manual o Pegar Link
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {allManuals.map((manual) => (
                                    <Card key={manual.id} className="border shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300">
                                        <CardContent className="p-8 flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <FileText className="h-8 w-8" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-lg">{manual.appliance_name}</h4>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                                                        {manual.brand} {manual.model}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    ID: {manual.id} • Actualizado: {new Date(manual.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-2xl h-11 px-5 font-bold gap-2 border-slate-200"
                                                    onClick={() => setEnrichingManual(manual)}
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Añadir Notas
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 w-11 rounded-2xl text-slate-300 hover:text-slate-600"
                                                    onClick={() => setEditingManualContent(manual)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 w-11 rounded-2xl text-destructive/20 hover:text-destructive hover:bg-destructive/5"
                                                    onClick={() => handleDeleteManual(manual.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>

            {/* Modal de Edicion Refinado */}
            <Dialog open={!!editingSection} onOpenChange={(v) => !v && setEditingSection(null)}>
                <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-12 overflow-hidden bg-background/95 backdrop-blur-2xl">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-semibold">
                            {editingSection?.id ? 'Editar' : 'Nueva'} {editingSection?.content_type === 'recommendation' ? 'recomendación' : 'sección'}
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium opacity-60">
                            La precisión es el alma de un buen anfitrión.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium mb-2 block">Nombre / Título</Label>
                            <Input
                                placeholder="Ej: WiFi o Restaurante L'Albufera"
                                className="h-10"
                                value={editingSection?.title || ''}
                                onChange={e => setEditingSection(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        {editingSection?.content_type === 'recommendation' ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                    <Label className="font-medium">Categoría</Label>
                                    <select
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={editingSection?.data?.category || 'Restaurantes'}
                                        onChange={e => setEditingSection(prev => {
                                            if (!prev) return null;
                                            return { ...prev, data: { ...prev.data, category: e.target.value } };
                                        })}
                                    >
                                        {RECOMMENDATION_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                            <option key={c.id} value={c.label}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-medium">Precio / Nivel</Label>
                                    <Input
                                        placeholder="Ej: €€ o Económico"
                                        className="h-10"
                                        value={editingSection?.data?.price || ''}
                                        onChange={e => setEditingSection(prev => {
                                            if (!prev) return null;
                                            return { ...prev, data: { ...prev.data, price: e.target.value } };
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-medium">Distancia / Tiempo</Label>
                                    <Input
                                        placeholder="Ej: 5 min andando"
                                        className="h-10"
                                        value={editingSection?.data?.time || ''}
                                        onChange={e => setEditingSection(prev => {
                                            if (!prev) return null;
                                            return { ...prev, data: { ...prev.data, time: e.target.value } };
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-medium">Puntuación</Label>
                                    <Input
                                        type="number" step="0.1" max="5" min="0"
                                        className="h-10"
                                        value={editingSection?.data?.rating || ''}
                                        onChange={e => setEditingSection(prev => {
                                            if (!prev) return null;
                                            return { ...prev, data: { ...prev.data, rating: e.target.value } };
                                        })}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-3">
                            <Label className="text-sm font-medium mb-2 block">Descripción detallada</Label>
                            <Textarea
                                rows={6}
                                className="resize-none"
                                placeholder="Escribe aquí toda la información..."
                                value={editingSection?.data?.[editingSection?.content_type === 'recommendation' ? 'description' : 'text'] || ''}
                                onChange={e => setEditingSection(prev => {
                                    if (!prev) return null;
                                    return {
                                        ...prev,
                                        data: {
                                            ...prev?.data,
                                            [editingSection?.content_type === 'recommendation' ? 'description' : 'text']: e.target.value
                                        }
                                    };
                                })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-between items-center mt-12">
                        <Button variant="ghost" onClick={() => setEditingSection(null)} disabled={isSaving} className="rounded-full px-8 h-12 font-semibold opacity-40 hover:opacity-100">
                            Descartar
                        </Button>
                        <Button onClick={handleSaveSection} disabled={isSaving || !editingSection?.title} className="min-w-[140px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingSection?.id ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
                            {editingSection?.id ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {enrichingManual && (
                <ManualEnrichmentDialog
                    manual={enrichingManual}
                    isOpen={!!enrichingManual}
                    onOpenChange={(open) => !open && setEnrichingManual(null)}
                    onSuccess={() => {
                        window.location.reload() // Or fetch manuals again
                    }}
                />
            )}

            {editingManualContent && (
                <ManualEditDialog
                    manual={editingManualContent}
                    propertyId={property.id}
                    isOpen={!!editingManualContent}
                    onOpenChange={(open) => !open && setEditingManualContent(null)}
                    onSuccess={() => {
                        window.location.reload()
                    }}
                />
            )}

            <AlertDialog open={confirmConfig.isOpen} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmConfig.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    )
}
