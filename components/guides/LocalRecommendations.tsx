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
    Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RecommendationCard, Recommendation } from './RecommendationCard'
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
    const [editingRec, setEditingRec] = useState<Partial<Recommendation> | null>(null)

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
            category: editingRec.category || (selectedCategory !== 'todos' ? selectedCategory : 'restaurantes')
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
                personal_note: rec.personal_note || rec.metadata?.personal_note || ''
            })
        } else {
            setEditingRec({
                name: '',
                category: 'restaurantes',
                distance: '',
                time: '',
                price_range: '',
                description: '',
                personal_note: ''
            })
        }
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Instructions / Tips Section */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 sm:p-5 flex gap-4 items-start">
                <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                    <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-primary italic">Consejo para una guía 5 estrellas</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                        La IA busca sitios de interés turístico real basándose en tu ubicación. Si buscas en una categoría específica (ej: <strong>Cultura</strong>), obtendrás resultados mucho más profundos que en la vista general. ¡Añade tu toque personal editando la nota de cada sitio!
                    </p>
                </div>
            </div>

            {/* AI Suggestion Button */}
            <div className="flex justify-end items-center gap-4 text-left">
                <Button
                    onClick={() => onAISuggest(selectedCategory)}
                    disabled={aiLoading}
                    variant="outline"
                    className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-[#316263] hover:text-white rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                >
                    {aiLoading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            <span>Generando...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            <span>Sugerir con IA</span>
                        </>
                    )}
                </Button>
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
                <DialogContent className="max-w-md rounded-2xl bg-white p-6 md:p-8">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-xl font-bold text-slate-900">{editingRec?.id ? 'Editar Sitio' : 'Nueva Recomendación'}</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-slate-500">
                            Completa los detalles para que tus huéspedes tengan la mejor información.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 text-left">
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
                                        value={editingRec?.distance || ''}
                                        onChange={e => setEditingRec({ ...editingRec, distance: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tiempo</Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <Input
                                        id="time"
                                        placeholder="Ej: 10 min"
                                        value={editingRec?.time || ''}
                                        onChange={e => setEditingRec({ ...editingRec, time: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50/50 border-slate-100 pl-12 pr-4 font-medium focus:ring-2 focus:ring-[#316263]/20"
                                    />
                                </div>
                            </div>
                        </div>

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
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-xs">Cancelar</Button>
                        <Button onClick={handleSaveManual} className="bg-[#316263] hover:bg-[#316263]/90 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-teal-900/20 text-sm">
                            {editingRec?.id ? 'Actualizar Sitio' : 'Guardar Sitio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
