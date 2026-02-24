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
        <TabsContent value="rules" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">Normas de la Casa</CardTitle>
                    <CardDescription className="text-xs">Establece las reglas para una convivencia perfecta.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    {/* Sección de Horarios */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-navy">
                            <Clock className="w-4 h-4" /> Horarios Principales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Hora de Salida (Check-out)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ej: Antes de las 11:00"
                                        className="h-10 pl-9"
                                        value={data.rules?.checkout_time || ''}
                                        onChange={e => setData({ ...data, rules: { ...data.rules, checkout_time: e.target.value } })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Horario de Silencio</Label>
                                <div className="relative">
                                    <ShieldAlert className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ej: 22:00 - 08:00"
                                        className="h-10 pl-9"
                                        value={data.rules?.quiet_hours || ''}
                                        onChange={e => setData({ ...data, rules: { ...data.rules, quiet_hours: e.target.value } })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección de Normas Detalladas */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-navy">
                            <Plus className="w-4 h-4" /> Normas Individuales
                        </h3>

                        <div className="space-y-3">
                            {(data.rules?.rules_items || []).map((rule: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex gap-4 animate-in slide-in-from-right-2 duration-200">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        rule.type === 'allowed' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                    )}>
                                        {rule.type === 'allowed' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ej: Mascotas permitidas (pequeñas)"
                                                className="font-bold border-none bg-slate-50/50 focus-visible:ring-0 h-9 flex-1"
                                                value={rule.text}
                                                onChange={e => updateRule(idx, 'text', e.target.value)}
                                            />
                                            <select
                                                className={cn(
                                                    "h-9 px-2 rounded-md border-none text-xs font-semibold focus:ring-0",
                                                    rule.type === 'allowed' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
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

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-10 border-dashed border-2 rounded-xl hover:bg-green-50 hover:border-green-200 text-[11px] font-bold"
                                    onClick={() => addRule('allowed')}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Permitido
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-10 border-dashed border-2 rounded-xl hover:bg-red-50 hover:border-red-200 text-[11px] font-bold"
                                    onClick={() => addRule('forbidden')}
                                >
                                    <Plus className="w-3 h-3 mr-2" /> Prohibido
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
