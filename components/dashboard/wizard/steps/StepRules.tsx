'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Clock, ShieldAlert, Plus, Check, X, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../WizardContext'

export default function StepRules({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    const addRule = (type: 'allowed' | 'forbidden') => {
        setData({
            ...data,
            rules: {
                ...data.rules,
                rules_items: [...(data.rules.rules_items || []), { text: '', type }]
            }
        })
    }

    const removeRule = (idx: number) => {
        const newItems = [...data.rules.rules_items]
        newItems.splice(idx, 1)
        setData({ ...data, rules: { ...data.rules, rules_items: newItems } })
    }

    const updateRule = (idx: number, field: string, value: string) => {
        const newItems = [...data.rules.rules_items]
        newItems[idx] = { ...newItems[idx], [field]: value }
        setData({ ...data, rules: { ...data.rules, rules_items: newItems } })
    }

    return (
        <TabsContent value="rules" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-8">
                    {/* Sección de Horarios */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" /> Horarios de Estancia
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Hora de Salida (Check-out)</Label>
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
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Horario de Silencio</Label>
                                <div className="relative">
                                    <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input
                                        placeholder="Ej: 22:00 - 08:00"
                                        className="h-12 pl-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                        value={data.rules?.quiet_hours || ''}
                                        onChange={e => setData({ ...data, rules: { ...data.rules, quiet_hours: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Normas Detalladas */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5" /> Normas Individuales
                        </Label>

                        <div className="space-y-3">
                            {(data.rules?.rules_items || []).map((rule: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center gap-4 group transition-all hover:bg-white hover:shadow-md animate-in slide-in-from-right-2 duration-200">
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                        rule.type === 'allowed' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                    )}>
                                        {rule.type === 'allowed' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 space-y-3 text-left">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: Mascotas permitidas (pequeñas)"
                                                className="font-bold border-slate-100 bg-white focus-visible:ring-0 h-10 flex-1 rounded-lg px-3"
                                                value={rule.text}
                                                onChange={e => updateRule(idx, 'text', e.target.value)}
                                            />
                                            <select
                                                className={cn(
                                                    "h-10 px-3 rounded-lg border-none text-xs font-bold focus:ring-0",
                                                    rule.type === 'allowed' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                                )}
                                                value={rule.type}
                                                onChange={e => updateRule(idx, 'type', e.target.value)}
                                            >
                                                <option value="allowed">Permitido</option>
                                                <option value="forbidden">Prohibido</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-300 hover:text-destructive self-start"
                                        onClick={() => removeRule(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-12 border-dashed border-2 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 text-[#316263] font-bold text-xs uppercase tracking-widest transition-all"
                                    onClick={() => addRule('allowed')}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Permitido
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 border-dashed border-2 rounded-xl hover:bg-rose-50 hover:border-rose-200 text-rose-600 font-bold text-xs uppercase tracking-widest transition-all"
                                    onClick={() => addRule('forbidden')}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Prohibido
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
