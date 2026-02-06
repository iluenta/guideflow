'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Coffee,
    Utensils,
    Bath,
    Bed,
    Wind,
    Tv,
    Refrigerator,
    Microwave,
    WashingMachine,
    Flame,
    ShieldCheck,
    Edit2,
    CheckCircle2,
    Sparkles,
    Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InventoryItem {
    id: string
    name: string
    category: string
    icon: any
    isPresent: boolean
    customContext?: string
    isFromScanner?: boolean
}

interface InventorySelectorProps {
    items: InventoryItem[]
    onChange: (items: InventoryItem[]) => void
    existingManuals?: any[]
}

const CATEGORIES = [
    { id: 'small-appliances', name: 'Pequeños Electrodomésticos', icon: Wind },
    { id: 'kitchen', name: 'Cocina y Menaje', icon: Utensils },
    { id: 'bathroom', name: 'Baño y Aseo', icon: Bath },
    { id: 'bedroom', name: 'Dormitorio', icon: Bed },
    { id: 'living', name: 'Zona de Estar / Electrónica', icon: Tv },
    { id: 'comfort', name: 'Confort y Limpieza', icon: Refrigerator }, // Using Refrigerator as placeholder for large stuff
]

const DEFAULT_ITEMS: Omit<InventoryItem, 'isPresent'>[] = [
    // Pequeños Electrodomésticos
    { id: 'cafetera', name: 'Cafetera', category: 'small-appliances', icon: Coffee },
    { id: 'tostadora', name: 'Tostadora', category: 'small-appliances', icon: Wind },
    { id: 'batidora', name: 'Batidora', category: 'small-appliances', icon: Wind },
    { id: 'exprimidor', name: 'Exprimidor', category: 'small-appliances', icon: Wind },
    { id: 'secador', name: 'Secador de pelo', category: 'small-appliances', icon: Wind },
    { id: 'plancha', name: 'Plancha', category: 'small-appliances', icon: Wind },
    { id: 'hervidor', name: 'Hervidor eléctrico', category: 'small-appliances', icon: Wind },

    // Cocina
    { id: 'utensilios', name: 'Utensilios de cocina básicos', category: 'kitchen', icon: Utensils },
    { id: 'tuppers', name: 'Tuppers / Recipientes', category: 'kitchen', icon: Utensils },
    { id: 'fuente-horno', name: 'Fuentes de horno', category: 'kitchen', icon: Utensils },
    { id: 'sartenes', name: 'Sartenes y Ollas', category: 'kitchen', icon: Utensils },
    { id: 'vajilla', name: 'Vajilla completa', category: 'kitchen', icon: Utensils },
    { id: 'copas-vino', name: 'Copas de vino', category: 'kitchen', icon: Utensils },
    { id: 'cafetera-capsulas', name: 'Cafetera de cápsulas', category: 'kitchen', icon: Coffee },

    // Baño
    { id: 'toallas', name: 'Juego de toallas', category: 'bathroom', icon: Bath },
    { id: 'gel-champu', name: 'Gel y Champú', category: 'bathroom', icon: Bath },
    { id: 'papel-higienico', name: 'Papel higiénico de cortesía', category: 'bathroom', icon: Bath },
    { id: 'alfombra-bano', name: 'Alfombra de baño', category: 'bathroom', icon: Bath },

    // Dormitorio
    { id: 'ropa-cama', name: 'Ropa de cama extra', category: 'bedroom', icon: Bed },
    { id: 'almohadas', name: 'Almohadas extra', category: 'bedroom', icon: Bed },
    { id: 'perchas', name: 'Perchas', category: 'bedroom', icon: Bed },
    { id: 'cuna', name: 'Cuna / Parque para bebés', category: 'bedroom', icon: Bed },

    // Living
    { id: 'smart-tv', name: 'Smart TV', category: 'living', icon: Tv },
    { id: 'altavoz-bluetooth', name: 'Altavoz Bluetooth', category: 'living', icon: Tv },
    { id: 'juegos-mesa', name: 'Juegos de mesa', category: 'living', icon: Tv },
    { id: 'libros', name: 'Libros / Revistas', category: 'living', icon: Tv },

    // Confort / Otros
    { id: 'aire-acondicionado', name: 'Aire acondicionado', category: 'comfort', icon: Wind },
    { id: 'calefaccion', name: 'Calefacción', category: 'comfort', icon: Flame },
    { id: 'lavadora', name: 'Lavadora', category: 'comfort', icon: WashingMachine },
    { id: 'lavavajillas', name: 'Lavavajillas', category: 'comfort', icon: Utensils },
    { id: 'extintor', name: 'Extintor', category: 'comfort', icon: ShieldCheck },
    { id: 'botiquin', name: 'Botiquín de primeros auxilios', category: 'comfort', icon: ShieldCheck },
]

export function InventorySelector({ items = [], onChange, existingManuals = [] }: InventorySelectorProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [tempContext, setTempContext] = useState('')

    // Initialize items if none provided
    const displayItems = items.length > 0 ? items : DEFAULT_ITEMS.map(di => ({
        ...di,
        isPresent: false,
        isFromScanner: existingManuals.some(m =>
            m.appliance_name.toLowerCase().includes(di.id.toLowerCase()) ||
            di.name.toLowerCase().includes(m.appliance_name.toLowerCase())
        )
    }))

    const handleToggle = (id: string) => {
        const newItems = displayItems.map(item => {
            if (item.id === id) {
                // If it was from scanner, it's always true/fixed or at least prioritized
                if (item.isFromScanner) return item
                return { ...item, isPresent: !item.isPresent }
            }
            return item
        })
        onChange(newItems)
    }

    const startEditing = (item: InventoryItem) => {
        setEditingId(item.id)
        setTempContext(item.customContext || '')
    }

    const saveEdit = () => {
        const newItems = displayItems.map(item => {
            if (item.id === editingId) {
                return { ...item, customContext: tempContext }
            }
            return item
        })
        onChange(newItems)
        setEditingId(null)
    }

    const filteredCategories = CATEGORIES.map(cat => ({
        ...cat,
        items: displayItems.filter(item =>
            item.category === cat.id &&
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.items.length > 0)

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar elementos (ej: cafetera, toallas...)"
                    className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-8">
                {filteredCategories.map(cat => (
                    <div key={cat.id} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <cat.icon className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{cat.name}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cat.items.map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-3xl border transition-all duration-300",
                                        item.isPresent || item.isFromScanner
                                            ? "border-primary/20 bg-primary/[0.02] shadow-sm"
                                            : "border-slate-100 bg-white hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="relative flex items-center justify-center">
                                            <Checkbox
                                                id={item.id}
                                                checked={item.isPresent || item.isFromScanner}
                                                onCheckedChange={() => handleToggle(item.id)}
                                                disabled={item.isFromScanner}
                                                className="h-6 w-6 rounded-xl border-slate-300 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            {item.isFromScanner && (
                                                <div className="absolute -top-1 -right-1">
                                                    <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            <label
                                                htmlFor={item.id}
                                                className={cn(
                                                    "text-sm font-bold cursor-pointer select-none truncate block transition-colors",
                                                    (item.isPresent || item.isFromScanner) ? "text-slate-900" : "text-slate-400"
                                                )}
                                            >
                                                {item.name}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                {item.isFromScanner && (
                                                    <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight opacity-80">
                                                        Auto-detectado
                                                    </span>
                                                )}
                                                {item.customContext && (
                                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] italic">
                                                        "{item.customContext}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {(item.isPresent || item.isFromScanner) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-3 text-[11px] font-bold transition-all text-slate-400 hover:text-primary rounded-xl"
                                                onClick={() => startEditing(item)}
                                            >
                                                <Edit2 className="h-3.5 w-3.5 mr-1" />
                                                <span className="hidden md:inline">Nota</span>
                                            </Button>
                                        )}
                                        {item.isFromScanner ? (
                                            <div className="h-7 w-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-sm">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                        ) : item.isPresent ? (
                                            <div className="h-7 px-3 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-bold uppercase">SÍ</span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Context Dialog Refined to match 'Editar Sitio' */}
            <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
                <DialogContent className="max-w-md rounded-3xl bg-white p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-900">Contexto adicional</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">
                            Indica dónde se encuentra o detalles clave para el manual de <span className="text-primary font-bold">"{displayItems.find(i => i.id === editingId)?.name}"</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="note" className="text-slate-700 font-bold">Nota rápida del anfitrión</Label>
                            <Input
                                id="note"
                                className="h-12 rounded-xl bg-slate-50 border-none px-4 font-medium"
                                placeholder="Ej: Está en el armario de la cocina..."
                                value={tempContext}
                                onChange={e => setTempContext(e.target.value)}
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-400 italic">
                                Esta información personaliza la guía del asistente IA.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-6">
                        <Button variant="ghost" onClick={() => setEditingId(null)} className="rounded-xl font-bold">
                            Cancelar
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8 h-12"
                            onClick={saveEdit}
                        >
                            Guardar detalles
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
