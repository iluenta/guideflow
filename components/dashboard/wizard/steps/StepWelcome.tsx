'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { useWizard } from '../WizardContext'

export default function StepWelcome({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    return (
        <TabsContent value="welcome" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">Saludo de Bienvenida</CardTitle>
                    <CardDescription className="text-xs">Lo primero que verán tus huéspedes al abrir la guía.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-4 w-full">
                        <div className="space-y-2">
                            <Label>Título del Saludo</Label>
                            <Input
                                placeholder="Ej: ¡Bienvenidos a Casa Marina!"
                                className="h-11"
                                value={data.welcome.title}
                                onChange={e => setData({ ...data, welcome: { ...data.welcome, title: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre del Anfitrión</Label>
                            <Input
                                placeholder="Ej: María & Juan"
                                className="h-11"
                                value={data.welcome?.host_name || ''}
                                onChange={e => setData({ ...data, welcome: { ...data.welcome, host_name: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mensaje Personal</Label>
                            <Textarea
                                placeholder="Ej: Estamos encantados de teneros aquí. Disfrutad de vuestra estancia..."
                                className="min-h-[140px]"
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
