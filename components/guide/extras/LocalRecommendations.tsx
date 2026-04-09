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
    Search, ChevronLeft, ChevronRight, Check, Loader2,
    Info, Lightbulb, Pizza, Fish, Beef, Globe, UtensilsCrossed,
    Store, Sunrise, Sun, Sunset, Moon
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
    const [isEssentialModalOpen, setIsEssentialModalOpen] = useState(false)
    const [editingRec, setEditingRec] = useState<Partial<Recommendation> | null>(null)
    const [tagsInput, setTagsInput] = useState('')

    const essentialCategories = [
        { id: 'supermercados', label: 'Supermercados', icon: Store, color: 'bg-orange-100 text-orange-700', desc: 'Para la compra del primer día' },
        { id: 'restaurantes', label: 'Restaurantes', icon: Utensils, color: 'bg-blue-100 text-blue-700', desc: 'Si no quieren cocinar al llegar' },
        { id: 'desayuno', label: 'Desayunos', icon: Coffee, color: 'bg-yellow-100 text-yellow-700', desc: 'Cafeterías para la primera mañana' },
        { id: 'tapas', label: 'Tapas & Bares', icon: Pizza, color: 'bg-sky-100 text-sky-700', desc: 'Para salir a tomar algo la primera noche' },
        { id: 'cultura', label: 'Cultura', icon: Landmark, color: 'bg-amber-100 text-amber-700', desc: 'Qué ver cerca sin planificar mucho' },
        { id: 'naturaleza', label: 'Naturaleza', icon: Trees, color: 'bg-emerald-100 text-emerald-700', desc: 'Parques y zonas verdes cercanas' },
        { id: 'ocio', label: 'Ocio nocturno', icon: Music, color: 'bg-purple-100 text-purple-700', desc: 'Bares de copas y música' },
    ]

    const otherCategories = [
        { label: 'Italiano', icon: Pizza },
        { label: 'Asiático', icon: UtensilsCrossed },
        { label: 'Alta Cocina', icon: Star },
        { label: 'Internacional', icon: Globe },
        { label: 'Relax & Spa', icon: Coffee },
        { label: 'Compras', icon: ShoppingBag },
        { label: 'Hamburguesas', icon: Beef },
    ]

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
            // Normalize empty string to null so the fallback maps: link works
            google_place_id: editingRec.google_place_id || null,
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
                                La IA buscará en Google Places los <span className="text-[#316263] font-bold">7 tipos de sitios más útiles</span> para tus huéspedes al llegar: supermercados, restaurantes, desayunos, tapas, cultura, naturaleza y ocio nocturno.{' '}
                                <button
                                    onClick={() => setIsEssentialModalOpen(true)}
                                    className="text-[#316263] font-bold hover:underline inline-flex items-center gap-1"
                                >
                                    Ver detalle →
                                </button>
                            </p>
                            <p className="text-xs text-slate-400 font-medium italic">
                                ¿Quieres italiano, asiático, alta cocina u otras categorías? Selecciónalas en la barra inferior y usa "Sugerir con IA" para cada una por separado.
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

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                {categories.map((cat) => {
                    const Icon = cat.icon
                    const isActive = selectedCategory === cat.id
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border-2",
                                isActive
                                    ? "bg-[#316263] border-[#316263] text-white shadow-md shadow-teal-900/10 scale-105"
                                    : "bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <Icon className={cn("w-3 h-3 transition-transform", isActive && "scale-110")} />
                            {cat.label.toUpperCase()}
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
                className="w-full h-14 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#316263] hover:bg-[#316263]/5 transition-all flex items-center justify-center gap-2 group bg-white/50"
            >
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#316263]" />
                <span className="text-xs font-bold text-slate-500 group-hover:text-[#316263] transition-colors uppercase tracking-widest">Añadir otro sitio</span>
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
                <DialogContent className="max-w-2xl w-[95vw] h-[85dvh] md:h-auto md:max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white flex flex-col">
                    <DialogHeader className="p-6 md:p-10 pb-2 md:pb-2 text-left border-b border-slate-50 shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-900">{editingRec?.id ? 'Editar Sitio' : 'Nueva Recomendación'}</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-slate-500">
                            Completa los detalles para que tus huéspedes tengan la mejor información.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 text-left custom-scrollbar">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del sitio</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej: Restaurante El Mirador"
                                    value={editingRec?.name || ''}
                                    onChange={e => setEditingRec({ ...editingRec, name: e.target.value })}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 px-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Dirección / Ubicación (Para Maps)</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="address"
                                        placeholder="Ej: Calle Mayor 1, Madrid"
                                        value={editingRec?.address || ''}
                                        onChange={e => setEditingRec({ ...editingRec, address: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic ml-1">Añadir la dirección ayuda a que Google Maps localice el sitio con precisión.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Categoría</Label>
                                <select
                                    className="w-full h-12 rounded-xl bg-slate-50/50 border border-slate-100 px-4 font-bold text-[11px] focus:ring-2 focus:ring-[#316263]/20 outline-none uppercase tracking-wider"
                                    value={editingRec?.category || (selectedCategory !== 'todos' ? selectedCategory : 'restaurantes')}
                                    onChange={e => setEditingRec({ ...editingRec, category: e.target.value })}
                                >
                                    {categories.filter(c => c.id !== 'todos').map(c => (
                                        <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Precio</Label>
                                <Input
                                    id="price"
                                    placeholder="Ej: €€"
                                    value={editingRec?.price_range || ''}
                                    onChange={e => setEditingRec({ ...editingRec, price_range: e.target.value })}
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 px-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="distance" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Distancia</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="distance"
                                        placeholder="Ej: 500m"
                                        value={(editingRec?.distance && !editingRec.distance.toLowerCase().includes('distance')) ? editingRec.distance : ''}
                                        onChange={e => setEditingRec({ ...editingRec, distance: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Horario</Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="time"
                                        placeholder="Ej: 09:00 - 20:00"
                                        value={editingRec?.time || ''}
                                        onChange={e => setEditingRec({ ...editingRec, time: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {editingRec?.opening_hours && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Horarios (Google)</Label>
                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-600">
                                    {editingRec.opening_hours.always_open 
                                        ? 'Abierto 24 horas' 
                                        : `${editingRec.opening_hours.open || '--:--'} – ${editingRec.opening_hours.close || '--:--'}`}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Etiquetas (separadas por comas)</Label>
                            <Input
                                id="tags"
                                placeholder="Ej: Vistas, Romántico, Barato"
                                value={tagsInput}
                                onChange={e => {
                                    const val = e.target.value;
                                    setTagsInput(val);
                                    const newTags = val.split(',').map(t => t.trim()).filter(Boolean);
                                    setEditingRec({ ...editingRec, tags: newTags });
                                }}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 px-4 font-medium text-xs focus:ring-2 focus:ring-[#316263]/20"
                            />
                            {(editingRec?.tags && editingRec.tags.length > 0) && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {editingRec.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="bg-slate-50 border-slate-100 text-slate-500 text-[9px] font-bold py-1 px-2 rounded-lg">
                                            #{tag.toUpperCase()}
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
                                // Si autoSlots tiene contenido, lo añadimos (sin duplicar)
                                const newSlots = autoSlots.length > 0 
                                    ? Array.from(new Set([...currentSlots, ...autoSlots]))
                                    : currentSlots

                                setEditingRec({ 
                                    ...editingRec, 
                                    category: subcat,
                                    metadata: {
                                        ...(editingRec?.metadata || {}),
                                        best_time_slots: newSlots
                                    }
                                })
                            }}
                        />

                        <TimeSlotSelector
                            value={editingRec?.metadata?.best_time_slots || []}
                            onChange={(slots) => setEditingRec({
                                ...editingRec,
                                metadata: {
                                    ...(editingRec?.metadata || {}),
                                    best_time_slots: slots,
                                }
                            })}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Descripción</Label>
                            <Textarea
                                id="desc"
                                placeholder="Describe qué hace especial este sitio..."
                                value={editingRec?.description || ''}
                                onChange={e => setEditingRec({ ...editingRec, description: e.target.value })}
                                className="min-h-[100px] rounded-xl bg-slate-50/50 border-slate-100 p-4 font-medium text-xs leading-relaxed focus:ring-2 focus:ring-[#316263]/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nota personal (opcional)</Label>
                            <Input
                                id="note"
                                placeholder="Ej: Pide la tarta de queso, es increíble."
                                value={editingRec?.personal_note || ''}
                                onChange={e => setEditingRec({ ...editingRec, personal_note: e.target.value })}
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 px-4 font-medium italic text-xs focus:ring-2 focus:ring-[#316263]/20"
                            />
                        </div>

                        {/* Google Place ID — visible only when set, so host can verify/clear if wrong */}
                        {editingRec?.google_place_id && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Enlace Google Maps (asignado por IA)</Label>
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-[10px] text-slate-500 font-mono flex-1 truncate">{editingRec.google_place_id}</span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editingRec.name || '')}&query_place_id=${editingRec.google_place_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-[#316263] hover:underline shrink-0"
                                    >
                                        Verificar
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setEditingRec({ ...editingRec, google_place_id: '' })}
                                        className="text-[10px] font-bold text-red-400 hover:text-red-600 shrink-0"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 italic ml-1">Si Maps abre el sitio incorrecto, pulsa "Limpiar" para usar la búsqueda por nombre.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-row gap-3 shrink-0">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:text-slate-900">
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveManual} className="flex-1 bg-[#316263] hover:bg-[#254d4e] text-white font-bold rounded-xl h-12 shadow-lg shadow-teal-900/20 text-sm">
                            {editingRec?.id ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Guía Esencial */}
            <Dialog open={isEssentialModalOpen} onOpenChange={setIsEssentialModalOpen}>
                <DialogContent className="max-w-lg rounded-3xl bg-white p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-8 space-y-8">
                        <div className="flex gap-4 items-center">
                            <div className="bg-[#316263] p-3 rounded-2xl shadow-lg shadow-teal-900/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div className="space-y-1 text-left">
                                <DialogTitle className="text-xl font-bold text-slate-900">Guía esencial del primer día</DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 font-medium">
                                    La IA generará <span className="text-slate-900 font-bold">14 recomendaciones</span> en <span className="text-slate-900 font-bold">7 categorías imprescindibles</span> basándose en tu ubicación real.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Se generará automáticamente</p>
                            <div className="space-y-2">
                                {essentialCategories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-[#316263]/20 hover:bg-white transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl scale-90 group-hover:scale-100 transition-transform", cat.color)}>
                                                <cat.icon className="w-4 h-4" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{cat.desc}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-white border-slate-200 text-teal-700 text-[10px] font-bold rounded-lg py-1 px-2">2 SITIOS</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-[#f0f9f9] rounded-3xl border border-[#d1e9e9] space-y-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">¿Quieres más categorías?</p>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium text-left">
                                Después de generar, selecciona cualquier categoría de la barra y pulsa <span className="text-[#316263] font-bold">"Sugerir con IA"</span> para obtener 6 sugerencias específicas con más detalle.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {otherCategories.map((cat, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-500 shadow-sm">
                                        <cat.icon className="w-2.5 h-2.5" />
                                        {cat.label}
                                    </div>
                                ))}
                                <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 shadow-sm">+ más...</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsEssentialModalOpen(false)}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:text-slate-900"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                setIsEssentialModalOpen(false)
                                onAISuggest('todos')
                            }}
                            disabled={aiLoading}
                            className="flex-1 bg-[#316263] hover:bg-[#254d4e] text-white h-14 rounded-2xl font-bold shadow-lg shadow-teal-900/20 gap-2"
                        >
                            <Sparkles className="w-5 h-5 text-white/50" />
                            Generar guía esencial
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
