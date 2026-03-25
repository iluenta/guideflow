'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { useWizard } from '../../WizardContext'

export default function StepWelcome({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    return (
        <TabsContent value="welcome" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                    <div className="space-y-4 w-full">
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Título del Saludo</Label>
                            <Input
                                placeholder="Ej: ¡Bienvenidos a vuestro hogar en Madrid!"
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium px-4"
                                value={data.welcome.title}
                                onChange={e => setData({ ...data, welcome: { ...data.welcome, title: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre del Anfitrión</Label>
                            <Input
                                placeholder="Ej: Lucía & Carlos (Vuestros anfitriones)"
                                className="h-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium px-4"
                                value={data.welcome?.host_name || ''}
                                onChange={e => setData({ ...data, welcome: { ...data.welcome, host_name: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mensaje Personal</Label>
                            <Textarea
                                placeholder="Ej: ¡Hola! Estamos encantados de teneros con nosotros. Hemos preparado esta guía con mucho cariño para que disfrutéis de la zona como auténticos locales. No dudéis en escribirnos si necesitáis cualquier cosa..."
                                className="min-h-[160px] rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 p-5 text-sm font-medium leading-relaxed"
                                value={data.welcome?.message || ''}
                                onChange={e => setData({ ...data, welcome: { ...data.welcome, message: e.target.value } })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
