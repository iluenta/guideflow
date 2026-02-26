'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, User, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepWelcomeProps {
    data: any
    onChange: (data: any) => void
}

export function StepWelcome({ data, onChange }: StepWelcomeProps) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Saludo de Bienvenida</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Lo primero que verán tus huéspedes al abrir la guía. Haz que se sientan como en casa desde el primer segundo.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 group">
                                <MessageSquare className="w-4 h-4 transition-colors group-hover:text-primary" />
                                <Label className="text-xs font-bold uppercase tracking-widest">Título del Saludo</Label>
                            </div>
                            <Input 
                                value={data.welcome_title || ''} 
                                onChange={(e) => onChange({ welcome_title: e.target.value })}
                                placeholder="Ej: ¡Bienvenidos a vuestro hogar!"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 group">
                                <User className="w-4 h-4 transition-colors group-hover:text-primary" />
                                <Label className="text-xs font-bold uppercase tracking-widest">Nombre del Anfitrión</Label>
                            </div>
                            <Input 
                                value={data.host_name || ''} 
                                onChange={(e) => onChange({ host_name: e.target.value })}
                                placeholder="Ej: María & Juan"
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 group">
                            <Quote className="w-4 h-4 transition-colors group-hover:text-primary" />
                            <Label className="text-xs font-bold uppercase tracking-widest">Mensaje Personal</Label>
                        </div>
                        <Textarea 
                            value={data.welcome_message || ''} 
                            onChange={(e) => onChange({ welcome_message: e.target.value })}
                            placeholder="Cuéntales un poco sobre ti y el alojamiento..."
                            rows={6}
                            className="rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 leading-relaxed resize-none p-6"
                        />
                        <p className="text-[11px] text-slate-400 font-medium italic">
                            * Este mensaje se mostrará de forma prominente en la pantalla de inicio de la guía.
                        </p>
                    </div>
                </div>

                {/* Preview Tip */}
                <div className="bg-primary/[0.03] border border-primary/10 rounded-3xl p-6 mt-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900">Consejo del experto</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Un saludo personalizado y cálido aumenta las valoraciones de 5 estrellas. Menciona detalles locales o tu disposición para ayudar durante la estancia.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
