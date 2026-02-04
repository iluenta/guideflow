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
    Search, ChevronLeft, ChevronRight, Check
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
    { id: 'todos', label: 'Todos', icon: Star },
    { id: 'restaurantes', label: 'Restaurantes', icon: Utensils },
    { id: 'compras', label: 'Compras', icon: ShoppingBag },
    { id: 'cultura', label: 'Cultura', icon: Landmark },
    { id: 'naturaleza', label: 'Naturaleza', icon: Trees },
    { id: 'ocio', label: 'Ocio', icon: Music },
    { id: 'relax', label: 'Relax', icon: Coffee }
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
            category: editingRec.category || (selectedCategory === 'todos' ? 'ocio' : selectedCategory)
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
        setEditingRec(rec || {
            name: '',
            category: selectedCategory === 'todos' ? 'restaurantes' : selectedCategory,
            distance: '',
            time: '',
            price_range: '€€',
            description: '',
            personal_note: ''
        })
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & AI Suggestion Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Recomendaciones Locales</h2>
                    <p className="text-slate-500 font-medium">Personaliza los mejores sitios cercanos para tus huéspedes.</p>
                </div>
                <Button
                    onClick={() => onAISuggest(selectedCategory)}
                    disabled={aiLoading}
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 shadow-xl shadow-slate-200 py-4 px-6 rounded-full transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {aiLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">Generando...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-200 transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white">Sugerir con IA</span>
                        </div>
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
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border-2",
                                isActive
                                    ? "bg-slate-800 border-slate-800 text-white shadow-md shadow-slate-100 scale-105"
                                    : "bg-white border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            <Icon className={cn("w-3.5 h-3.5 transition-transform", isActive && "scale-110")} />
                            {cat.label}
                        </button>
                    )
                })}
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredRecommendations.map((rec, idx) => (
                    <RecommendationCard
                        key={idx}
                        recommendation={rec}
                        onDelete={() => handleDelete(idx)}
                        onClick={() => openEdit(rec)}
                    />
                ))}
            </div>

            {/* Add Manual Button - Compact Style */}
            <button
                onClick={() => openEdit()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group bg-white/50"
            >
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                <span className="text-sm font-bold text-slate-500 group-hover:text-primary transition-colors">Añadir otro sitio</span>
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
                <DialogContent className="max-w-md rounded-3xl bg-white p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{editingRec?.id ? 'Editar Sitio' : 'Nueva Recomendación'}</DialogTitle>
                        <DialogDescription className="font-medium">
                            Completa los detalles para que tus huéspedes tengan la mejor información.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-700 font-bold">Nombre del sitio</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Restaurante El Mirador"
                                value={editingRec?.name || ''}
                                onChange={e => setEditingRec({ ...editingRec, name: e.target.value })}
                                className="h-12 rounded-xl bg-slate-50 border-none px-4 font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Categoría</Label>
                                <select
                                    className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm focus:ring-2 focus:ring-primary outline-none"
                                    value={editingRec?.category || selectedCategory}
                                    onChange={e => setEditingRec({ ...editingRec, category: e.target.value })}
                                >
                                    {categories.filter(c => c.id !== 'todos').map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-slate-700 font-bold">Precio</Label>
                                <Input
                                    id="price"
                                    placeholder="Ej: €€"
                                    value={editingRec?.price_range || ''}
                                    onChange={e => setEditingRec({ ...editingRec, price_range: e.target.value })}
                                    className="h-12 rounded-xl bg-slate-50 border-none px-4 font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="distance" className="text-slate-700 font-bold">Distancia</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="distance"
                                        placeholder="Ej: 500m"
                                        value={editingRec?.distance || ''}
                                        onChange={e => setEditingRec({ ...editingRec, distance: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 border-none pl-12 pr-4 font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time" className="text-slate-700 font-bold">Tiempo</Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="time"
                                        placeholder="Ej: 10 min"
                                        value={editingRec?.time || ''}
                                        onChange={e => setEditingRec({ ...editingRec, time: e.target.value })}
                                        className="h-12 rounded-xl bg-slate-50 border-none pl-12 pr-4 font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc" className="text-slate-700 font-bold">Descripción</Label>
                            <Textarea
                                id="desc"
                                placeholder="Describe qué hace especial este sitio..."
                                value={editingRec?.description || ''}
                                onChange={e => setEditingRec({ ...editingRec, description: e.target.value })}
                                className="min-h-[100px] rounded-xl bg-slate-50 border-none p-4 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note" className="text-slate-700 font-bold">Nota personal (opcional)</Label>
                            <Input
                                id="note"
                                placeholder="Ej: Pide la tarta de queso, es increíble."
                                value={editingRec?.personal_note || ''}
                                onChange={e => setEditingRec({ ...editingRec, personal_note: e.target.value })}
                                className="h-12 rounded-xl bg-slate-50 border-none px-4 font-medium italic"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-6">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button onClick={handleSaveManual} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 h-12">
                            {editingRec?.id ? 'Actualizar Site' : 'Guardar Site'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
