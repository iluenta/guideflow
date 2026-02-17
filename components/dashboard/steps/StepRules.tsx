'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, ShieldCheck, XCircle, CheckCircle2, Clock, Volume2, Sparkles, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepRulesProps {
    data: any
    onChange: (data: any) => void
}

export function StepRules({ data, onChange }: StepRulesProps) {
    const rules = data.rules_items || []

    const addRule = (type: 'allowed' | 'forbidden') => {
        onChange({ rules_items: [...rules, { text: '', type }] })
    }

    const removeRule = (index: number) => {
        onChange({ rules_items: rules.filter((_: any, i: number) => i !== index) })
    }

    const updateRule = (index: number, text: string) => {
        const newRules = [...rules]
        newRules[index] = { ...newRules[index], text }
        onChange({ rules_items: newRules })
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Normas de la Casa</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Establece los límites y horarios para que la convivencia sea perfecta.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <Label className="text-xs font-bold uppercase tracking-widest">Check-out (Hora de Salida)</Label>
                        </div>
                        <div className="relative">
                            <Input 
                                value={data.checkout_time || '11:00'} 
                                onChange={(e) => onChange({ checkout_time: e.target.value })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                            />
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Volume2 className="w-4 h-4" />
                            <Label className="text-xs font-bold uppercase tracking-widest">Horas de Silencio</Label>
                        </div>
                        <div className="relative">
                            <Input 
                                value={data.quiet_hours || '22:00 - 08:00'} 
                                onChange={(e) => onChange({ quiet_hours: e.target.value })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-bold text-slate-900 shadow-sm"
                            />
                            <Volume2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Allowed Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <h4 className="text-xs font-black uppercase tracking-widest font-serif">Permitido</h4>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addRule('allowed')} 
                                className="h-8 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 gap-1.5 text-[10px] font-bold"
                            >
                                <Plus className="h-3.5 w-3.5" /> REGLA
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {rules.filter((r: any) => r.type === 'allowed').map((rule: any, idx: number) => (
                                <div key={idx} className="flex gap-2 group animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1 relative">
                                        <Input 
                                            value={rule.text} 
                                            onChange={(e) => updateRule(rules.indexOf(rule), e.target.value)}
                                            placeholder="Ej: Mascotas pequeñas permitidas"
                                            className="h-12 rounded-xl bg-white border-slate-100 group-hover:border-emerald-200 transition-all font-medium text-slate-700 shadow-sm"
                                        />
                                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200" />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeRule(rules.indexOf(rule))} 
                                        className="h-12 w-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {rules.filter((r: any) => r.type === 'allowed').length === 0 && (
                                <div className="text-center py-6 bg-emerald-50/30 border-2 border-dashed border-emerald-100 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-emerald-800/40 tracking-wider">Sin reglas positivas añadidas</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Forbidden Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-600">
                                <Ban className="h-5 w-5" />
                                <h4 className="text-xs font-black uppercase tracking-widest font-serif">Prohibido</h4>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addRule('forbidden')} 
                                className="h-8 rounded-xl bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 gap-1.5 text-[10px] font-bold"
                            >
                                <Plus className="h-3.5 w-3.5" /> REGLA
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {rules.filter((r: any) => r.type === 'forbidden').map((rule: any, idx: number) => (
                                <div key={idx} className="flex gap-2 group animate-in slide-in-from-right-2 duration-200">
                                    <div className="flex-1 relative">
                                        <Input 
                                            value={rule.text} 
                                            onChange={(e) => updateRule(rules.indexOf(rule), e.target.value)}
                                            placeholder="Ej: Prohibido fumar en interiores"
                                            className="h-12 rounded-xl bg-white border-slate-100 group-hover:border-rose-200 transition-all font-medium text-slate-700 shadow-sm"
                                        />
                                        <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-200" />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeRule(rules.indexOf(rule))} 
                                        className="h-12 w-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {rules.filter((r: any) => r.type === 'forbidden').length === 0 && (
                                <div className="text-center py-6 bg-rose-50/30 border-2 border-dashed border-rose-100 rounded-2xl">
                                    <p className="text-[10px] uppercase font-bold text-rose-800/40 tracking-wider">Sin prohibiciones añadidas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex gap-6 mt-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShieldCheck className="w-24 h-24 -mr-4 -mt-4" />
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <p className="font-bold text-base">Protección y Respeto</p>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
                            Unas normas claras ayudan a evitar malentendidos y garantizan que tu propiedad se mantenga en perfecto estado. Se mostrarán de forma destacada en la guía.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
