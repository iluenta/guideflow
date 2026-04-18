'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { MessageSquare, User, Heart } from 'lucide-react'
import { useWizard } from '../../WizardContext'

export default function StepWelcome({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    return (
        <TabsContent value="welcome" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">

                {/* Título del saludo */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-4 w-4 text-[#316263]" />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-slate-800">Título del saludo</Label>
                            <p className="text-xs text-slate-400 mt-0.5">Lo primero que verán tus huéspedes</p>
                        </div>
                    </div>
                    <Input
                        placeholder="Ej: ¡Bienvenidos a vuestro hogar en Madrid!"
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                        value={data.welcome.title}
                        onChange={e => setData({ ...data, welcome: { ...data.welcome, title: e.target.value } })}
                    />
                </div>

                {/* Nombre del anfitrión */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-slate-800">Nombre del anfitrión</Label>
                            <p className="text-xs text-slate-400 mt-0.5">Tu nombre o el de tu equipo</p>
                        </div>
                    </div>
                    <Input
                        placeholder="Ej: Lucía & Carlos (Vuestros anfitriones)"
                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                        value={data.welcome?.host_name || ''}
                        onChange={e => setData({ ...data, welcome: { ...data.welcome, host_name: e.target.value } })}
                    />
                </div>

                {/* Mensaje personal */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                            <Heart className="h-4 w-4 text-rose-400" />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-slate-800">Mensaje personal</Label>
                            <p className="text-xs text-slate-400 mt-0.5">Un texto cálido y cercano para tus huéspedes</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder="Ej: ¡Hola! Estamos encantados de teneros con nosotros. Hemos preparado esta guía con mucho cariño para que disfrutéis de la zona como auténticos locales. No dudéis en escribirnos si necesitáis cualquier cosa..."
                        className="min-h-[140px] rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 p-4 text-sm leading-relaxed"
                        value={data.welcome?.message || ''}
                        onChange={e => setData({ ...data, welcome: { ...data.welcome, message: e.target.value } })}
                    />
                    <p className="text-xs text-slate-400">💡 Un mensaje personalizado aumenta la satisfacción del huésped.</p>
                </div>

            </div>
        </TabsContent>
    )
}
