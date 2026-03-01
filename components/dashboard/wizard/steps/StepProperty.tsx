'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Upload, X, Loader2, Home, User, Info, Hash } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useWizard } from '../WizardContext'

export default function StepProperty({ value }: { value?: string }) {
    const {
        data,
        setData,
        uploading,
        handleImageUpload
    } = useWizard()

    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <TabsContent value="property" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                {/* Image Upload Zone */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Imagen de Portada</Label>
                    <div
                        className={cn(
                            "relative aspect-[21/9] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:border-[#316263]/50 group cursor-pointer",
                            data.property.main_image_url && "border-solid border-slate-100"
                        )}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {data.property.main_image_url ? (
                            <>
                                <Image src={data.property.main_image_url} alt="Portada" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                    <Button type="button" variant="secondary" className="h-10 px-6 rounded-xl bg-white text-slate-900 font-bold shadow-sm shadow-slate-200/40 border-none">
                                        <Upload className="w-4 h-4 mr-2 text-[#316263]" /> Cambiar foto
                                    </Button>
                                </div>
                                <button
                                    type="button"
                                    className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md text-red-500 shadow-sm shadow-slate-200/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-red-50"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setData({ ...data, property: { ...data.property, main_image_url: '' } })
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-center p-6">
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover:text-[#316263] group-hover:rotate-12 transition-all duration-500 shadow-sm">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="font-bold text-base text-slate-900">Sube una fotografía de tu propiedad</p>
                                    <p className="text-xs text-slate-400 font-medium">Formatos recomendados: JPEG o PNG</p>
                                </div>
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                <Loader2 className="h-8 w-8 animate-spin text-[#316263] mb-3" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#316263]">Optimizando imagen...</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Alojamiento</Label>
                            <div className="relative group">
                                <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#316263] transition-colors" />
                                <Input
                                    placeholder="Ej: Villa Marítima Premium"
                                    className="h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-base font-medium transition-all"
                                    value={data.property?.name || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, name: e.target.value } })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Identificador (Slug)</Label>
                            <div className="relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#316263] transition-colors" />
                                <Input
                                    placeholder="villa-maritima-premium"
                                    className="h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-base font-medium transition-all lowercase"
                                    value={data.property?.slug || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, slug: e.target.value.toLowerCase().replace(/ /g, '-') } })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Huéspedes</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-center text-lg font-bold transition-all"
                                    value={data.property?.guests || ''}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        setData({ ...data, property: { ...data.property, guests: isNaN(val) ? 0 : val } });
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Habitaciones</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-center text-lg font-bold transition-all"
                                    value={data.property?.beds || ''}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        setData({ ...data, property: { ...data.property, beds: isNaN(val) ? 0 : val } });
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-center block">Baños</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-center text-lg font-bold transition-all"
                                    value={data.property?.baths || ''}
                                    onChange={e => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        setData({ ...data, property: { ...data.property, baths: isNaN(val) ? 0 : val } });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción Breve</Label>
                            <div className="relative group">
                                <Info className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-[#316263] transition-colors" />
                                <Input
                                    placeholder="Casa con espectaculares vistas al Mediterráneo..."
                                    className="h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-base font-medium transition-all"
                                    value={data.property?.description || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, description: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TabsContent>
    )
}
