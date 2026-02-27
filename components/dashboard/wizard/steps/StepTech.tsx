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
        <TabsContent value="tech" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">WiFi y Tecnología</CardTitle>
                    <CardDescription className="text-xs">Datos de conexión e instrucciones de dispositivos.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nombre de la Red WiFi</Label>
                            <Input
                                placeholder="Ej: MiCasaWiFi"
                                className="h-11 border-slate-200"
                                value={data.tech?.wifi_ssid || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contraseña WiFi</Label>
                            <Input
                                placeholder="Ej: 12345678"
                                className="h-11 border-slate-200"
                                value={data.tech?.wifi_password || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Ubicación del Router / Notas adicionales</Label>
                        <Textarea
                            placeholder="Ej: El router está en el salón, detrás de la TV. Si tienes problemas de conexión, reinícialo desenchufándolo 10 segundos."
                            className="min-h-[100px] bg-slate-50/50 border-slate-200"
                            value={data.tech?.router_notes || ''}
                            onChange={e => setData({ ...data, tech: { ...data.tech, router_notes: e.target.value } })}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Esta información se mostrará en la guía del huésped.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
