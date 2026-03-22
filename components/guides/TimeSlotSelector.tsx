'use client'

/**
 * TimeSlotSelector + ExperienceSubcategorySelector
 *
 * Uso en LocalRecommendations.tsx:
 *
 * 1. Importar ambos componentes:
 *    import { TimeSlotSelector, ExperienceSubcategorySelector } from './TimeSlotSelector'
 *
 * 2. En el <Dialog> de edición, añadir ANTES del campo de descripción:
 *
 *    <ExperienceSubcategorySelector
 *        value={editingRec?.category || 'restaurantes'}
 *        onChange={(cat) => setEditingRec({ ...editingRec, category: cat })}
 *    />
 *
 *    <TimeSlotSelector
 *        value={editingRec?.metadata?.best_time_slots || []}
 *        onChange={(slots) => setEditingRec({
 *            ...editingRec,
 *            metadata: { ...(editingRec?.metadata || {}), best_time_slots: slots }
 *        })}
 *    />
 *
 * 3. En handleSaveManual, preservar best_time_slots en metadata:
 *    const recToSave = {
 *        ...editingRec,
 *        category: editingRec.category || ...,
 *        metadata: {
 *            ...(editingRec.metadata || {}),
 *            best_time_slots: editingRec.metadata?.best_time_slots || [],
 *        }
 *    }
 *
 * 4. Etiquetado Temporal:
 *    Usa ExperienceSubcategorySelector para marcar sitios como 'Amanecer' o 'Atardecer'.
 *    Esto no crea categorías de búsqueda, sino que añade metadatos para el scoring del widget.
 */

import React from 'react'
import { Sunrise, Sun, Sunset, Moon, Telescope } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Franjas horarias ─────────────────────────────────────────────────────────
const TIME_SLOTS = [
    {
        id: 'mañana',
        label: 'Mañana',
        sublabel: '6–12h',
        icon: Sunrise,
        color: 'bg-amber-50 border-amber-200 text-amber-700',
        activeColor: 'bg-amber-500 border-amber-500 text-white',
    },
    {
        id: 'mediodia',
        label: 'Mediodía',
        sublabel: '12–15h',
        icon: Sun,
        color: 'bg-orange-50 border-orange-200 text-orange-700',
        activeColor: 'bg-orange-500 border-orange-500 text-white',
    },
    {
        id: 'tarde',
        label: 'Tarde',
        sublabel: '15–20h',
        icon: Sunset,
        color: 'bg-rose-50 border-rose-200 text-rose-700',
        activeColor: 'bg-rose-500 border-rose-500 text-white',
    },
    {
        id: 'noche',
        label: 'Noche',
        sublabel: '20h+',
        icon: Moon,
        color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        activeColor: 'bg-indigo-600 border-indigo-600 text-white',
    },
]

// ─── Subcategorías de experiencia especiales ──────────────────────────────────
// Solo se muestran cuando la categoría principal es 'naturaleza' o 'experiencias'
// ya que son los tipos donde tiene sentido distinguir el momento del día.
const EXPERIENCE_SUBCATEGORIES = [
    {
        id: 'amanecer',
        label: 'Amanecer',
        sublabel: '5–9h',
        icon: Sunrise,
        hint: 'Ver salir el sol desde este lugar',
        color: 'bg-amber-50 border-amber-200 text-amber-700',
        activeColor: 'bg-gradient-to-r from-amber-400 to-orange-400 border-amber-400 text-white',
        // Al seleccionar, fuerza best_time_slots a ['mañana'] automáticamente
        autoSlots: ['mañana'],
    },
    {
        id: 'atardecer',
        label: 'Atardecer',
        sublabel: '18–22h',
        icon: Sunset,
        hint: 'Ideal para ver la puesta de sol',
        color: 'bg-rose-50 border-rose-200 text-rose-700',
        activeColor: 'bg-gradient-to-r from-rose-400 to-orange-500 border-rose-400 text-white',
        autoSlots: ['tarde'],
    },
    {
        id: 'mirador',
        label: 'Mirador',
        sublabel: 'Mañana o tarde',
        icon: Telescope,
        hint: 'Vistas panorámicas del entorno',
        color: 'bg-sky-50 border-sky-200 text-sky-700',
        activeColor: 'bg-sky-500 border-sky-500 text-white',
        autoSlots: ['mañana', 'tarde'],
    },
]

// Categorías donde tiene sentido mostrar las subcategorías de experiencia
const NATURE_CATEGORIES = new Set(['naturaleza', 'experiencias', 'experience', 'actividad', 'actividades', 'relax'])

// ─── Componente: selector de franja horaria ───────────────────────────────────
interface TimeSlotSelectorProps {
    value: string[]
    onChange: (slots: string[]) => void
}

export function TimeSlotSelector({ value, onChange }: TimeSlotSelectorProps) {
    const toggle = (id: string) => {
        onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
    }

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                Mejor momento para visitar
                <span className="font-medium normal-case tracking-normal text-slate-300">
                    — mejora la recomendación automática
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map(slot => {
                    const isActive = value.includes(slot.id)
                    const Icon = slot.icon
                    return (
                        <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggle(slot.id)}
                            className={cn(
                                'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                isActive ? slot.activeColor : slot.color
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold leading-none">{slot.label}</p>
                                <p className={cn('text-[10px] font-medium mt-0.5', isActive ? 'opacity-80' : 'opacity-60')}>
                                    {slot.sublabel}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Componente: subcategorías de experiencia ─────────────────────────────────
interface ExperienceSubcategorySelectorProps {
    /** Categoría principal actual de la recomendación */
    currentCategory: string
    /** Subcategoría de experiencia seleccionada (puede ser la misma que category) */
    value: string
    onChange: (subcategory: string, autoSlots: string[]) => void
}

export function ExperienceSubcategorySelector({
    currentCategory,
    value,
    onChange,
}: ExperienceSubcategorySelectorProps) {
    // Solo mostrar si la categoría principal es de naturaleza/experiencias
    if (!NATURE_CATEGORIES.has(currentCategory.toLowerCase())) return null

    return (
        <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Tipo de experiencia
                <span className="ml-2 font-medium normal-case tracking-normal text-slate-300">
                    (opcional)
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_SUBCATEGORIES.map(sub => {
                    const isActive = value === sub.id
                    const Icon = sub.icon
                    return (
                        <button
                            key={sub.id}
                            type="button"
                            onClick={() => onChange(
                                isActive ? currentCategory : sub.id,  // toggle: si ya activo, volver a categoría base
                                isActive ? [] : sub.autoSlots
                            )}
                            title={sub.hint}
                            className={cn(
                                'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                                'hover:scale-[1.02] active:scale-[0.98]',
                                isActive ? sub.activeColor : sub.color
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                            <div>
                                <p className="text-[11px] font-bold leading-none">{sub.label}</p>
                                <p className={cn('text-[9px] font-medium mt-0.5', isActive ? 'opacity-80' : 'opacity-60')}>
                                    {sub.sublabel}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>
            {value && EXPERIENCE_SUBCATEGORIES.find(s => s.id === value) && (
                <p className="text-[10px] text-slate-400 ml-1">
                    {EXPERIENCE_SUBCATEGORIES.find(s => s.id === value)?.hint}
                </p>
            )}
        </div>
    )
}

export { TIME_SLOTS, EXPERIENCE_SUBCATEGORIES }