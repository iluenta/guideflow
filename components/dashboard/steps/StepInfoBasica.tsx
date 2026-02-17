'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, Home, Link2, Users, Bed, Bath, Sparkles, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface StepInfoBasicaProps {
    data: any
    onChange: (data: any) => void
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    uploading: boolean
}

export function StepInfoBasica({ data, onChange, onImageUpload, uploading }: StepInfoBasicaProps) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Tu Propiedad</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Comuniquemos lo esencial sobre tu alojamiento para que el huésped se sitúe.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-8 mt-8">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Home className="w-4 h-4" />
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">
                                Nombre de la Propiedad <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <Input
                            id="name"
                            placeholder="Ej: Villa Sol y Mar"
                            value={data.name || ''}
                            onChange={(e) => onChange({ name: e.target.value })}
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 border-none shadow-sm shadow-slate-200/50"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Link2 className="w-4 h-4" />
                            <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-widest">
                                URL personalizada de tu guía
                            </Label>
                        </div>
                        <div className="flex items-center gap-0 group">
                            <div className="h-14 px-5 rounded-l-2xl bg-slate-100 flex items-center text-slate-400 text-sm border border-slate-100 font-medium">
                                guideflow.es/
                            </div>
                            <Input
                                id="slug"
                                placeholder="villa-sol-mar"
                                value={data.slug || ''}
                                onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="h-14 rounded-r-2xl bg-white border-slate-100 focus:ring-0 focus:border-slate-200 transition-all font-bold text-primary flex-1 shadow-sm"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Este es el enlace directo. Usa guiones para separar palabras.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users className="w-3 h-3" />
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Huéspedes</Label>
                            </div>
                            <Input
                                type="number"
                                value={data.guests || 2}
                                onChange={(e) => onChange({ guests: parseInt(e.target.value) })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-center font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Bed className="w-3 h-3" />
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Habitaciones</Label>
                            </div>
                            <Input
                                type="number"
                                value={data.beds || 1}
                                onChange={(e) => onChange({ beds: parseInt(e.target.value) })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-center font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Bath className="w-3 h-3" />
                                <Label className="text-[10px] font-bold uppercase tracking-widest">Baños</Label>
                            </div>
                            <Input
                                type="number"
                                value={data.baths || 1}
                                onChange={(e) => onChange({ baths: parseInt(e.target.value) })}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-center font-bold text-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Sparkles className="w-4 h-4" />
                            <Label className="text-xs font-bold uppercase tracking-widest lowercase">Descripción de bienvenida</Label>
                        </div>
                        <Textarea
                            placeholder="Escribe una pequeña bienvenida o descripción de lo que hace único a tu alojamiento..."
                            value={data.description || ''}
                            onChange={(e) => onChange({ description: e.target.value })}
                            className="min-h-[140px] rounded-[1.5rem] bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 leading-relaxed p-6 border-none shadow-sm"
                        />
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Foto de Portada</Label>
                        <div className="relative group">
                            {data.main_image_url ? (
                                <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-500">
                                    <Image
                                        src={data.main_image_url}
                                        alt="Property"
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-10 rounded-xl gap-2 bg-red-500 hover:bg-red-600 shadow-lg"
                                            onClick={() => onChange({ main_image_url: '' })}
                                        >
                                            <Trash2 className="h-4 w-4" /> Eliminar y Cambiar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center aspect-video w-full rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 cursor-pointer transition-all duration-300 group">
                                    <div className="flex flex-col items-center justify-center p-8 text-center">
                                        {uploading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                                <p className="text-sm font-bold text-slate-600 animate-pulse">Subiendo tu obra maestra...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-20 w-20 rounded-3xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                                    <Upload className="h-8 w-8 text-primary" />
                                                </div>
                                                <p className="text-base font-bold text-slate-900">Sube la foto principal</p>
                                                <p className="text-xs text-slate-400 mt-2 max-w-[240px] leading-relaxed">Alta resolución (16:9) recomendada para que luzca increíble en móvil.</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={onImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
