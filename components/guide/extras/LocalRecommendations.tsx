'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Sparkles, Plus, Trash2, MapPin, Clock, Utensils,
    ShoppingBag, Landmark, Trees, Music, Coffee, Star,
    Search, ChevronRight, Loader2,
    Lightbulb, Pizza, Fish, Beef, Globe, UtensilsCrossed,
    Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecommendationCard, Recommendation } from './RecommendationCard'
import { TimeSlotSelector, ExperienceSubcategorySelector } from './TimeSlotSelector'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface LocalRecommendationsProps {
    propertyId: string
    recommendations: Recommendation[]
    onUpdate: (recs: Recommendation[]) => void
    onAISuggest: (category: string) => Promise<void>
    aiLoading: boolean
}

const categories = [
    { id: 'todos', label: 'Todos', icon: Star, group: 'general' },
    // Restaurantes y subcategorías
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils, group: 'eat' },
    { id: 'italiano', label: 'Italiano & Pizza', icon: Pizza, group: 'eat' },
    { id: 'mediterraneo', label: 'Mediterráneo', icon: Fish, group: 'eat' },
    { id: 'hamburguesas', label: 'Hamburguesas', icon: Beef, group: 'eat' },
    { id: 'asiatico', label: 'Asiático', icon: UtensilsCrossed, group: 'eat' },
    { id: 'alta_cocina', label: 'Alta Cocina', icon: Star, group: 'eat' },
    { id: 'internacional', label: 'Internacional', icon: Globe, group: 'eat' },
    { id: 'desayuno', label: 'Desayunos & Cafés', icon: Coffee, group: 'eat' },
    { id: 'tapas', label: 'Tapas & Bares', icon: Pizza, group: 'eat' },
    // Otras categorías
    { id: 'compras', label: 'Compras', icon: ShoppingBag, group: 'other' },
    { id: 'supermercados', label: 'Supermercados', icon: Store, group: 'other' },
    { id: 'cultura', label: 'Cultura', icon: Landmark, group: 'other' },
    { id: 'naturaleza', label: 'Naturaleza', icon: Trees, group: 'other' },
    { id: 'ocio', label: 'Ocio', icon: Music, group: 'other' },
    { id: 'relax', label: 'Relax', icon: Coffee, group: 'other' },
]

export function LocalRecommendations({
    propertyId,
    recommendations,
    onUpdate,
    onAISuggest,
    aiLoading
}: LocalRecommendationsProps) {
    const [selectedCategory, setSelectedCategory] = useState('todos')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRec, setEditingRec] = useState<Partial<Recommendation> | null>(null)
    const [tagsInput, setTagsInput] = useState('')

    const filteredRecommendations = useMemo(() => {
        if (selectedCategory === 'todos') return recommendations
        return recommendations.filter(r => {
            const cat = (r.category || r.type || 'ocio').toLowerCase()
            return cat === selectedCategory
        })
    }, [recommendations, selectedCategory])

    const handleDelete = (index: number) => {
        const newRecs = [...recommendations]
        newRecs.splice(index, 1)
        onUpdate(newRecs)
    }

    const handleSaveManual = () => {
        if (!editingRec?.name) return

        const recToSave = {
            ...editingRec,
            // Prioritize existing category, then selected category (if not 'todos'), then fallback to 'restaurantes'
            category: editingRec.category || (selectedCategory !== 'todos' ? selectedCategory : 'restaurantes'),
            metadata: {
                ...(editingRec.metadata || {}),
                best_time_slots: editingRec.metadata?.best_time_slots || [],
                // Sync top-level tags and time back to metadata
                tags: editingRec.tags || [],
                time: editingRec.time || '',
            }
        } as Recommendation

        const existingIdx = recommendations.findIndex(r => r.id === recToSave.id && r.id !== undefined)

        if (existingIdx >= 0) {
            const newRecs = [...recommendations]
            newRecs[existingIdx] = recToSave
            onUpdate(newRecs)
        } else {
            onUpdate([...recommendations, recToSave])
        }

        setIsDialogOpen(false)
        setEditingRec(null)
    }

    const openEdit = (rec?: Recommendation) => {
        if (rec) {
            // "Flatten" metadata fields if they are missing at the top level
            setEditingRec({
                ...rec,
                time: rec.time || rec.metadata?.time || '',
                price_range: rec.price_range || rec.metadata?.price_range || '',
                personal_note: rec.personal_note || rec.metadata?.personal_note || '',
                google_place_id: rec.google_place_id || rec.metadata?.google_place_id || '',
                address: rec.address || (rec.metadata as any)?.address || '',
                metadata: {
                    ...(rec.metadata || {}),
                    best_time_slots: rec.metadata?.best_time_slots || [],
                }
            })
            setTagsInput((rec.tags || rec.metadata?.tags || []).join(', '))

        } else {
            setEditingRec({
                name: '',
                category: 'restaurantes',
                distance: '',
                time: '',
                price_range: '',
                description: '',
                personal_note: '',
                address: '',
                tags: [],
                metadata: {
                    best_time_slots: []
                }
            })
            setTagsInput('')
        }
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Redesigned Header Panel */}
            <div className="bg-[#f0f9f9] border border-[#d1e9e9] rounded-2xl p-6 relative overflow-hidden group shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between relative z-10">
                    <div className="flex gap-5 items-start">
                        <div className="bg-[#316263] p-3 rounded-2xl shrink-0 shadow-lg shadow-teal-900/20">
                            <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-2 max-w-2xl">
                            <h4 className="text-lg font-bold text-slate-900">Genera la guía esencial del primer día</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                La IA buscará en Google Places <span className="text-[#316263] font-bold">14 sitios esenciales</span> (2 por categoría) para tus huéspedes al llegar: supermercados, restaurantes, desayunos, tapas, cultura, naturaleza y ocio nocturno.
                            </p>
                            <p className="text-xs text-slate-400 font-medium italic">
                                ¿Quieres añadir más sitios a las categorías italiano, asiático, alta cocina u otras? Selecciónalas individualmente en la barra inferior y usa &quot;Sugerir con IA&quot; para añadir más sitios a cada una por separado.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => onAISuggest(selectedCategory)}
                        disabled={aiLoading}
                        className="w-full md:w-auto bg-[#316263] hover:bg-[#254d4e] text-white rounded-xl h-14 px-8 font-bold transition-all shadow-lg shadow-teal-900/10 flex items-center justify-center gap-3 active:scale-95 shrink-0"
                    >
                        {aiLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generando...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Sugerir con IA</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
            </div>

            {/* Category Filter — select on mobile, pills on desktop */}
            <div className="md:hidden">
                {(() => {
                    const activeCat = categories.find(c => c.id === selectedCategory)
                    const ActiveIcon = activeCat?.icon || Star
                    return (
                        <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <ActiveIcon className="w-4 h-4 text-[#316263]" />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="w-full h-11 pl-9 pr-10 rounded-xl bg-white border-2 border-slate-100 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:border-[#316263]/40 focus:ring-2 focus:ring-[#316263]/10"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                        </div>
                    )
                })()}
            </div>

            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => {
                    const Icon = cat.icon
                    const isActive = selectedCategory === cat.id
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border-2",
                                isActive
                                    ? "bg-[#316263] border-[#316263] text-white shadow-md shadow-teal-900/10 scale-105"
                                    : "bg-white border-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <Icon className={cn("w-3 h-3 transition-transform", isActive && "scale-110")} />
                            {cat.label}
                        </button>
                    )
                })}
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredRecommendations.map((rec) => {
                    // Find the real index in the original (unfiltered) array
                    const realIdx = recommendations.findIndex(r => r === rec || (r.id && r.id === rec.id))
                    return (
                        <RecommendationCard
                            key={rec.id || realIdx}
                            recommendation={rec}
                            onDelete={() => handleDelete(realIdx)}
                            onClick={() => openEdit(rec)}
                        />
                    )
                })}
            </div>

            {/* Add Manual Button - Compact Style */}
            <button
                onClick={() => openEdit()}
                className="w-full rounded-xl border border-dashed border-slate-200 hover:border-[#316263]/40 bg-white hover:bg-[#316263]/5 transition-all flex items-center gap-3 px-4 py-3 group"
            >
                <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-[#316263] flex items-center justify-center transition-colors shrink-0">
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-semibold text-slate-600 group-hover:text-[#316263] transition-colors">Añadir sitio manualmente</p>
                    <p className="text-xs text-slate-400">Restaurante, tienda, parque...</p>
                </div>
            </button>

            {/* Empty State */}
            {filteredRecommendations.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No hay recomendaciones todavía</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Usa el botón de IA para encontrar sitios increíbles en {selectedCategory === 'todos' ? 'cualquier categoría' : selectedCategory} o añádelos tú mismo.
                    </p>
                </div>
            )}

            {/* Dialog for Manual Add/Edit */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg w-[95vw] h-[90dvh] md:h-auto md:max-h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white flex flex-col">

                    {/* Header */}
                    <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100 shrink-0 text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-[#316263]" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                                    {editingRec?.id ? 'Editar sitio' : 'Nuevo sitio'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                    Completa los datos para que tus huéspedes tengan la mejor información.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 text-left">

                        {/* Nombre */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-sm font-medium text-slate-600 ml-1">Nombre del sitio</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Restaurante El Mirador"
                                value={editingRec?.name || ''}
                                onChange={e => setEditingRec({ ...editingRec, name: e.target.value })}
                                className="h-11 rounded-xl bg-slate-50 border-none font-medium focus:ring-2 focus:ring-[#316263]/20"
                            />
                        </div>

                        {/* Dirección */}
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-sm font-medium text-slate-600 ml-1">Dirección</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <Input
                                    id="address"
                                    placeholder="Ej: Calle Mayor 1, Madrid"
                                    value={editingRec?.address || ''}
                                    onChange={e => setEditingRec({ ...editingRec, address: e.target.value })}
                                    className="h-11 rounded-xl bg-slate-50 border-none pl-10 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                />
                            </div>
                            <p className="text-xs text-slate-400 ml-1">Ayuda a Google Maps a localizar el sitio con precisión.</p>
                        </div>

                        {/* Categoría + Precio */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Categoría</Label>
                                <div className="relative">
                                    <select
                                        className="w-full h-11 rounded-xl bg-slate-50 border-none px-3 pr-8 font-medium text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#316263]/20"
                                        value={editingRec?.category || (selectedCategory !== 'todos' ? selectedCategory : 'restaurantes')}
                                        onChange={e => setEditingRec({ ...editingRec, category: e.target.value })}
                                    >
                                        {categories.filter(c => c.id !== 'todos').map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="price" className="text-sm font-medium text-slate-600 ml-1">Precio</Label>
                                <Input
                                    id="price"
                                    placeholder="Ej: €€"
                                    value={editingRec?.price_range || ''}
                                    onChange={e => setEditingRec({ ...editingRec, price_range: e.target.value })}
                                    className="h-11 rounded-xl bg-slate-50 border-none font-medium focus:ring-2 focus:ring-[#316263]/20"
                                />
                            </div>
                        </div>

                        {/* Distancia + Horario */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="distance" className="text-sm font-medium text-slate-600 ml-1">Distancia</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="distance"
                                        placeholder="Ej: 500m"
                                        value={(editingRec?.distance && !editingRec.distance.toLowerCase().includes('distance')) ? editingRec.distance : ''}
                                        onChange={e => setEditingRec({ ...editingRec, distance: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 border-none pl-10 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="time" className="text-sm font-medium text-slate-600 ml-1">Horario</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="time"
                                        placeholder="09:00 - 22:00"
                                        value={editingRec?.time || ''}
                                        onChange={e => setEditingRec({ ...editingRec, time: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 border-none pl-10 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {editingRec?.opening_hours && (
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-slate-600 ml-1">Horarios (Google)</Label>
                                <div className="h-11 px-3 bg-slate-50 rounded-xl flex items-center text-sm font-medium text-slate-600">
                                    {editingRec.opening_hours.always_open
                                        ? 'Abierto 24 horas'
                                        : `${editingRec.opening_hours.open || '--:--'} – ${editingRec.opening_hours.close || '--:--'}`}
                                </div>
                            </div>
                        )}

                        {/* Etiquetas */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tags" className="text-sm font-medium text-slate-600 ml-1">Etiquetas <span className="text-slate-400 font-normal">(separadas por comas)</span></Label>
                            <Input
                                id="tags"
                                placeholder="Ej: Vistas, Romántico, Barato"
                                value={tagsInput}
                                onChange={e => {
                                    const val = e.target.value
                                    setTagsInput(val)
                                    setEditingRec({ ...editingRec, tags: val.split(',').map(t => t.trim()).filter(Boolean) })
                                }}
                                className="h-11 rounded-xl bg-slate-50 border-none font-medium text-sm focus:ring-2 focus:ring-[#316263]/20"
                            />
                            {(editingRec?.tags && editingRec.tags.length > 0) && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {editingRec.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-[#316263]/5 border-[#316263]/15 text-[#316263] text-xs font-medium py-0.5 px-2.5 rounded-lg">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <ExperienceSubcategorySelector
                            currentCategory={editingRec?.category || 'restaurantes'}
                            value={editingRec?.category || ''}
                            onChange={(subcat, autoSlots) => {
                                const currentSlots = editingRec?.metadata?.best_time_slots || []
                                const newSlots = autoSlots.length > 0
                                    ? Array.from(new Set([...currentSlots, ...autoSlots]))
                                    : currentSlots
                                setEditingRec({
                                    ...editingRec,
                                    category: subcat,
                                    metadata: { ...(editingRec?.metadata || {}), best_time_slots: newSlots }
                                })
                            }}
                        />

                        <TimeSlotSelector
                            value={editingRec?.metadata?.best_time_slots || []}
                            onChange={(slots) => setEditingRec({
                                ...editingRec,
                                metadata: { ...(editingRec?.metadata || {}), best_time_slots: slots }
                            })}
                        />

                        {/* Descripción */}
                        <div className="space-y-1.5">
                            <Label htmlFor="desc" className="text-sm font-medium text-slate-600 ml-1">Descripción</Label>
                            <Textarea
                                id="desc"
                                placeholder="Describe qué hace especial este sitio..."
                                value={editingRec?.description || ''}
                                onChange={e => setEditingRec({ ...editingRec, description: e.target.value })}
                                className="min-h-[80px] rounded-xl bg-slate-50 border-none p-3 font-medium text-sm leading-relaxed focus:ring-2 focus:ring-[#316263]/20 resize-none"
                            />
                        </div>

                        {/* Nota personal */}
                        <div className="space-y-1.5">
                            <Label htmlFor="note" className="text-sm font-medium text-slate-600 ml-1">Nota personal <span className="text-slate-400 font-normal">(opcional)</span></Label>
                            <Input
                                id="note"
                                placeholder="Ej: Pide la tarta de queso, es increíble."
                                value={editingRec?.personal_note || ''}
                                onChange={e => setEditingRec({ ...editingRec, personal_note: e.target.value })}
                                className="h-11 rounded-xl bg-slate-50 border-none font-medium italic text-sm focus:ring-2 focus:ring-[#316263]/20"
                            />
                        </div>

                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-5 py-4 border-t border-slate-100 flex flex-row gap-3 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-11 rounded-xl font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveManual}
                            className="flex-1 bg-[#316263] hover:bg-[#316263]/90 text-white font-semibold rounded-xl h-11 shadow-sm shadow-[#316263]/20"
                        >
                            {editingRec?.id ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
