'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import {
    Clock, ShieldAlert, Plus, Trash2,
    Cigarette, PartyPopper, PawPrint, Volume2, Home, Key,
    BedDouble, Recycle, Car, Smile, Leaf, Sparkles,
    UtensilsCrossed, Baby, Moon, Handshake
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../../WizardContext'

// ─── Icon system ──────────────────────────────────────────────────────────────
const ICON_PRESETS = [
    { id: 'cigarette', icon: Cigarette, label: 'No fumar' },
    { id: 'party', icon: PartyPopper, label: 'No fiestas' },
    { id: 'volume', icon: Volume2, label: 'Ruidos' },
    { id: 'home', icon: Home, label: 'Casa' },
    { id: 'recycle', icon: Recycle, label: 'Orden' },
    { id: 'handshake', icon: Handshake, label: 'Respeto' },
    { id: 'key', icon: Key, label: 'Llaves' },
    { id: 'bed', icon: BedDouble, label: 'Habitaciones' },
    { id: 'car', icon: Car, label: 'Parking' },
    { id: 'paw', icon: PawPrint, label: 'Mascotas' },
    { id: 'smile', icon: Smile, label: 'Disfruta' },
    { id: 'leaf', icon: Leaf, label: 'Naturaleza' },
    { id: 'sparkles', icon: Sparkles, label: 'Limpieza' },
    { id: 'utensils', icon: UtensilsCrossed, label: 'Cocina' },
    { id: 'baby', icon: Baby, label: 'Niños' },
    { id: 'moon', icon: Moon, label: 'Silencio' },
]

// ─── Presets genéricos — válidos para cualquier alojamiento ──────────────────
const QUICK_PRESETS = [
    {
        iconId: 'cigarette',
        title: 'No fumadores',
        description: 'Por favor, no fume en el interior del alojamiento.',
    },
    {
        iconId: 'party',
        title: 'No eventos',
        description: 'No están permitidas fiestas ni reuniones de más personas.',
    },
    {
        iconId: 'volume',
        title: 'Respeta el descanso',
        description: 'Mantén el volumen bajo en el horario de silencio.',
    },
    {
        iconId: 'home',
        title: 'Cuida la casa',
        description: 'Trátala como si fuera tuya. Si algo se rompe, avísanos.',
    },
    {
        iconId: 'recycle',
        title: 'Deja todo en orden',
        description: 'Por favor, deja el alojamiento como lo encontraste.',
    },
    {
        iconId: 'handshake',
        title: 'Cuida el aforo',
        description: 'No se permite más personas de las contratadas.',
    },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPreset(iconId: string) {
    return ICON_PRESETS.find(p => p.id === iconId) ?? ICON_PRESETS[3] // fallback: home
}

function RuleIcon({ iconId, interactive = false }: {
    iconId: string
    interactive?: boolean
}) {
    const preset = getPreset(iconId)
    const Icon = preset.icon
    return (
        <div className={cn(
            'h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-400',
            interactive && 'hover:border-slate-300 hover:text-slate-500 transition-all hover:scale-105 active:scale-95 cursor-pointer'
        )}>
            <Icon className="w-4 h-4 stroke-[1.5]" />
        </div>
    )
}

function IconPicker({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="absolute top-12 left-0 z-20 bg-white rounded-2xl border border-slate-100 shadow-xl p-2.5 grid grid-cols-4 gap-1.5 w-52">
            {ICON_PRESETS.map(preset => {
                const Icon = preset.icon
                return (
                    <button
                        key={preset.id}
                        onClick={() => onSelect(preset.id)}
                        title={preset.label}
                        className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:scale-110 transition-all"
                    >
                        <Icon className="w-4 h-4 stroke-[1.5]" />
                    </button>
                )
            })}
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StepRules({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    const [addingNew, setAddingNew] = useState(false)
    const [newRule, setNewRule] = useState({ iconId: 'home', title: '', description: '' })
    const [pickerOpen, setPickerOpen] = useState<string | false>(false)

    const rules: any[] = data.rules?.rules_items || []
    const existingTitles = rules.map((r: any) => (r.title || r.text || '').toLowerCase())

    const addQuickPreset = (preset: typeof QUICK_PRESETS[0]) => {
        if (existingTitles.includes(preset.title.toLowerCase())) return
        setData({
            ...data,
            rules: {
                ...data.rules,
                rules_items: [...rules, {
                    id: crypto.randomUUID(),
                    iconId: preset.iconId,
                    title: preset.title,
                    text: preset.title,
                    description: preset.description,
                    type: 'forbidden',
                }]
            }
        })
    }

    const addCustomRule = () => {
        if (!newRule.title.trim()) return
        setData({
            ...data,
            rules: {
                ...data.rules,
                rules_items: [...rules, {
                    id: crypto.randomUUID(),
                    iconId: newRule.iconId,
                    title: newRule.title.trim(),
                    text: newRule.title.trim(),
                    description: newRule.description.trim(),
                    type: 'forbidden',
                }]
            }
        })
        setNewRule({ iconId: 'home', title: '', description: '' })
        setAddingNew(false)
        setPickerOpen(false)
    }

    const updateRule = (idx: number, field: string, val: string) => {
        const updated = [...rules]
        updated[idx] = { ...updated[idx], [field]: val, ...(field === 'title' ? { text: val } : {}) }
        setData({ ...data, rules: { ...data.rules, rules_items: updated } })
    }

    const removeRule = (idx: number) => {
        const updated = [...rules]
        updated.splice(idx, 1)
        setData({ ...data, rules: { ...data.rules, rules_items: updated } })
    }

    return (
        <TabsContent value="rules" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-3 sm:p-6 space-y-8">

                    {/* ── Horarios ── */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Horarios de Estancia
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">
                                    Check-out
                                </Label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input
                                        placeholder="Ej: Antes de las 11:00"
                                        className="h-12 pl-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                        value={data.rules?.checkout_time || ''}
                                        onChange={e => setData({ ...data, rules: { ...data.rules, checkout_time: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-sm font-medium text-slate-600 ml-1">
                                    Silencio nocturno
                                </Label>
                                <div className="relative">
                                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input
                                        placeholder="Ej: 22:00 – 08:00"
                                        className="h-12 pl-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                        value={data.rules?.quiet_hours || ''}
                                        onChange={e => setData({ ...data, rules: { ...data.rules, quiet_hours: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Presets rápidos ── */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Añadir rápido
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_PRESETS.map((preset) => {
                                const already = existingTitles.includes(preset.title.toLowerCase())
                                const p = getPreset(preset.iconId)
                                const Icon = p.icon
                                return (
                                    <button
                                        key={preset.title}
                                        onClick={() => addQuickPreset(preset)}
                                        disabled={already}
                                        className={cn(
                                            'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                                            already
                                                ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                                                : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm active:scale-95'
                                        )}
                                    >
                                        <div className={cn(
                                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0 border',
                                            already
                                                ? 'bg-slate-50 border-slate-100 text-slate-300'
                                                : 'bg-white border-slate-200 text-slate-400'
                                        )}>
                                            <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                                        </div>
                                        <span className={cn(
                                            'text-xs font-semibold leading-tight',
                                            already ? 'text-slate-400' : 'text-slate-600'
                                        )}>
                                            {preset.title}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Normas activas ── */}
                    {rules.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-slate-600">
                                Normas activas — {rules.length}
                            </Label>
                            <div className="space-y-2">
                                {rules.map((rule: any, idx: number) => (
                                    <div
                                        key={rule.id || idx}
                                        className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-visible group animate-in slide-in-from-bottom-1 duration-200"
                                    >
                                        <div className="flex items-center gap-3 p-3 pb-0">
                                            <div className="relative shrink-0">
                                                <button
                                                    onClick={() => setPickerOpen(pickerOpen === `r${idx}` ? false : `r${idx}`)}
                                                    title="Cambiar icono"
                                                >
                                                    <RuleIcon iconId={rule.iconId || 'home'} interactive />
                                                </button>
                                                {pickerOpen === `r${idx}` && (
                                                    <IconPicker onSelect={(id) => {
                                                        updateRule(idx, 'iconId', id)
                                                        setPickerOpen(false)
                                                    }} />
                                                )}
                                            </div>

                                            <Input
                                                className="flex-1 h-10 border-none bg-transparent focus-visible:ring-0 font-bold text-sm text-slate-900 p-0 placeholder:text-slate-300"
                                                placeholder="Título de la norma"
                                                value={rule.title || rule.text || ''}
                                                onChange={e => updateRule(idx, 'title', e.target.value)}
                                            />

                                            <button
                                                onClick={() => removeRule(idx)}
                                                className="h-9 w-9 flex items-center justify-center rounded-full text-slate-200 hover:text-rose-400 hover:bg-rose-50 transition-all lg:opacity-0 lg:group-hover:opacity-100 shrink-0"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="px-3 pt-2 pb-3 pl-16">
                                            <Textarea
                                                className="border-none bg-slate-50/60 focus-visible:ring-0 min-h-[52px] text-xs text-slate-500 font-medium rounded-lg p-2.5 resize-none placeholder:text-slate-300 w-full"
                                                placeholder="Descripción para el huésped (opcional)…"
                                                value={rule.description || ''}
                                                onChange={e => updateRule(idx, 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Nueva norma personalizada ── */}
                    {addingNew ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-visible animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center gap-3 p-3 pb-0">
                                <div className="relative shrink-0">
                                    <button
                                        onClick={() => setPickerOpen(pickerOpen === 'new' ? false : 'new')}
                                        title="Elegir icono"
                                    >
                                        <RuleIcon iconId={newRule.iconId} interactive />
                                    </button>
                                    {pickerOpen === 'new' && (
                                        <IconPicker onSelect={(id) => {
                                            setNewRule(r => ({ ...r, iconId: id }))
                                            setPickerOpen(false)
                                        }} />
                                    )}
                                </div>
                                <Input
                                    autoFocus
                                    className="flex-1 h-10 bg-white border-slate-100 font-bold text-sm rounded-xl"
                                    placeholder="Ej: No fumadores"
                                    value={newRule.title}
                                    onChange={e => setNewRule(r => ({ ...r, title: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && addCustomRule()}
                                />
                            </div>
                            <div className="px-3 pt-2 pb-3 pl-16 space-y-2">
                                <Textarea
                                    className="bg-white border-slate-100 focus-visible:ring-1 min-h-[52px] text-xs rounded-lg p-2.5 resize-none placeholder:text-slate-300 w-full"
                                    placeholder="Descripción para el huésped (opcional)…"
                                    value={newRule.description}
                                    onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex-1"
                                        onClick={addCustomRule}
                                        disabled={!newRule.title.trim()}
                                    >
                                        Añadir norma
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 px-3 rounded-xl text-slate-400 text-xs"
                                        onClick={() => {
                                            setAddingNew(false)
                                            setNewRule({ iconId: 'home', title: '', description: '' })
                                            setPickerOpen(false)
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            className="w-full h-11 border-dashed border-2 rounded-xl text-xs text-slate-400 font-semibold hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
                            onClick={() => setAddingNew(true)}
                        >
                            <Plus className="w-3.5 h-3.5 mr-2" /> Norma personalizada
                        </Button>
                    )}

                </CardContent>
            </Card>
        </TabsContent>
    )
}