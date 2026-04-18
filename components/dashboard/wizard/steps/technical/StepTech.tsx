'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Wifi, Lock, MapPin, Info } from 'lucide-react'
import { useWizard } from '../../WizardContext'

export default function StepTech({ value }: { value?: string }) {
    const { data, setData } = useWizard()

    return (
        <TabsContent value="tech" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">

                {/* WiFi Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#316263]/10 flex items-center justify-center shrink-0">
                            <Wifi className="h-4 w-4 text-[#316263]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Conexión WiFi</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Datos de acceso a la red</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-600 ml-1 flex items-center gap-1.5">
                                <Wifi className="h-3.5 w-3.5 text-slate-400" /> Nombre de la red (SSID)
                            </Label>
                            <Input
                                placeholder="Ej: MiCasaWiFi"
                                className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                value={data.tech?.wifi_ssid || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_ssid: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-600 ml-1 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-slate-400" /> Contraseña WiFi
                            </Label>
                            <Input
                                placeholder="Ej: 12345678"
                                className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 font-medium font-mono"
                                value={data.tech?.wifi_password || ''}
                                onChange={e => setData({ ...data, tech: { ...data.tech, wifi_password: e.target.value } })}
                            />
                        </div>
                    </div>

                    {/* Preview WiFi card */}
                    {(data.tech?.wifi_ssid || data.tech?.wifi_password) && (
                        <div className="bg-gradient-to-br from-[#316263]/5 to-teal-50 rounded-xl p-4 border border-[#316263]/10 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-[#316263] flex items-center justify-center shrink-0">
                                <Wifi className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Vista previa en la guía</p>
                                <p className="text-sm font-bold text-slate-900">{data.tech?.wifi_ssid || '—'}</p>
                                <p className="text-sm font-mono text-slate-600">{data.tech?.wifi_password || '—'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Router notes */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                            <MapPin className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Ubicación del router y notas</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Instrucciones para solucionar problemas de conexión</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder="Ej: El router está en el salón, detrás de la TV. Si tienes problemas de conexión, reinícialo desenchufándolo 10 segundos."
                        className="min-h-[120px] rounded-xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#316263]/20 p-4 text-sm leading-relaxed"
                        value={data.tech?.router_notes || ''}
                        onChange={e => setData({ ...data, tech: { ...data.tech, router_notes: e.target.value } })}
                    />
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>Esta información se mostrará en la guía del huésped.</span>
                    </div>
                </div>

            </div>
        </TabsContent>
    )
}
