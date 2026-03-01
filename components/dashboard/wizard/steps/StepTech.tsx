'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Sparkles, Loader2 } from 'lucide-react'
import { useWizard } from '../WizardContext'

export default function StepTech({ value }: { value?: string }) {
    const {
        data,
        setData,
        aiLoading,
        handleAIFill
    } = useWizard()

    return (
        <TabsContent value="tech" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de la Red WiFi</Label>
                            <Input
                                placeholder="Ej: MiCasaWiFi"
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                value={data.tech?.wifi_ssid || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña WiFi</Label>
                            <Input
                                placeholder="Ej: 12345678"
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                value={data.tech?.wifi_password || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2 text-left">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación del Router / Notas adicionales</Label>
                        <Textarea
                            placeholder="Ej: El router está en el salón, detrás de la TV. Si tienes problemas de conexión, reinícialo desenchufándolo 10 segundos."
                            className="min-h-[120px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium p-4"
                            value={data.tech?.router_notes || ''}
                            onChange={e => setData({ ...data, tech: { ...data.tech, router_notes: e.target.value } })}
                        />
                        <p className="text-[10px] text-slate-400 italic ml-1">Esta información se mostrará en la guía del huésped.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
