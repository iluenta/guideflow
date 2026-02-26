'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wifi, ShieldCheck, Info, Router, Signal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepWifiProps {
    data: any
    onChange: (data: any) => void
}

export function StepWifi({ data, onChange }: StepWifiProps) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Conectividad WiFi</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Asegúrate de que tus huéspedes puedan conectarse nada más llegar. Un buen WiFi es el servicio más valorado.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10 mt-8">
                <div className="bg-primary/[0.03] border border-primary/10 rounded-[2rem] p-8 flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wifi className="w-32 h-32 -mr-8 -mt-8" />
                    </div>
                    
                    <div className="h-20 w-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500">
                        <Wifi className="h-10 w-10 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900">Tu Red WiFi</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                        Esta información se mostrará de forma destacada en la pantalla principal de la guía digital para un acceso rápido.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 group">
                                <Signal className="w-4 h-4 transition-colors group-hover:text-primary" />
                                <Label htmlFor="wifi_ssid" className="text-xs font-bold uppercase tracking-widest">
                                    Nombre de la Red (SSID)
                                </Label>
                            </div>
                            <Input
                                id="wifi_ssid"
                                placeholder="Ej: MiCasa_WiFi"
                                value={data.wifi_ssid || ''}
                                onChange={(e) => onChange({ wifi_ssid: e.target.value })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 group">
                                <ShieldCheck className="w-4 h-4 transition-colors group-hover:text-primary" />
                                <Label htmlFor="wifi_password" className="text-xs font-bold uppercase tracking-widest">
                                    Contraseña WiFi
                                </Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="wifi_password"
                                    placeholder="Contraseña del router"
                                    value={data.wifi_password || ''}
                                    onChange={(e) => onChange({ wifi_password: e.target.value })}
                                    className="h-14 pl-12 pr-4 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900"
                                />
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 group">
                            <Router className="w-4 h-4 transition-colors group-hover:text-primary" />
                            <Label htmlFor="router_notes" className="text-xs font-bold uppercase tracking-widest">
                                Ubicación y Notas
                            </Label>
                        </div>
                        <Textarea
                            id="router_notes"
                            placeholder="Ej: El router está detrás de la TV del salón. Si falla, reinicia el botón trasero..."
                            value={data.router_notes || ''}
                            onChange={(e) => onChange({ router_notes: e.target.value })}
                            className="min-h-[160px] rounded-[1.5rem] bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 leading-relaxed p-6"
                        />
                    </div>
                </div>

                <div className="bg-amber-50/50 rounded-2xl p-6 flex gap-4 text-sm text-amber-700 border border-amber-100/50">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold text-amber-900">¿Sabías que...?</p>
                        <p className="text-xs leading-relaxed opacity-90">
                            Generamos automáticamente un código QR en tu guía física. Tus huéspedes podrán conectarse al WiFi con un solo escaneo sin tener que escribir la contraseña.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
