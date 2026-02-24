'use client'

import React, { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Upload, X, Loader2 } from 'lucide-react'
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
        <TabsContent value="property" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">Información Básica</CardTitle>
                    <CardDescription className="text-xs">Configura los datos principales de tu alojamiento.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Zona de Subida de Imagen */}
                    <div className="space-y-2">
                        <Label>Imagen principal de tu alojamiento</Label>
                        <div
                            className={cn(
                                "relative aspect-[16/6] md:aspect-[16/4] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary/50 group cursor-pointer",
                                data.property.main_image_url && "border-solid border-slate-100"
                            )}
                            onClick={() => !uploading && fileInputRef.current?.click()}
                        >
                            {data.property.main_image_url ? (
                                <>
                                    <Image src={data.property.main_image_url} alt="Portada" fill className="object-cover transition-transform group-hover:scale-105 duration-700" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button type="button" variant="secondary" size="sm" className="h-8 gap-2 bg-white/90 hover:bg-white text-navy font-bold shadow-xl">
                                            <Upload className="w-3.5 h-3.5" /> Cambiar foto
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setData({ ...data, property: { ...data.property, main_image_url: '' } })
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-4 text-center">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-xs">Subir foto destacada</p>
                                        <p className="text-[10px] text-muted-foreground">Recomendado formato panorámico (JPEG, PNG)</p>
                                    </div>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subiendo...</span>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImageUpload}
                                accept="image/*"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Nombre del alojamiento</Label>
                                <Input
                                    placeholder="Ej: Villa Sol y Mar"
                                    className="h-11"
                                    value={data.property?.name || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, name: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (URL personalizada)</Label>
                                <Input
                                    placeholder="villa-sol-mar"
                                    className="h-11"
                                    value={data.property?.slug || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, slug: e.target.value.toLowerCase().replace(/ /g, '-') } })}
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Huéspedes</Label>
                                    <Input
                                        type="number"
                                        className="h-11"
                                        value={data.property?.guests || ''}
                                        onChange={e => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            setData({ ...data, property: { ...data.property, guests: isNaN(val) ? 0 : val } });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Hab.</Label>
                                    <Input
                                        type="number"
                                        className="h-11"
                                        value={data.property?.beds || ''}
                                        onChange={e => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            setData({ ...data, property: { ...data.property, beds: isNaN(val) ? 0 : val } });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Baños</Label>
                                    <Input
                                        type="number"
                                        className="h-11"
                                        value={data.property?.baths || ''}
                                        onChange={e => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            setData({ ...data, property: { ...data.property, baths: isNaN(val) ? 0 : val } });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción breve</Label>
                                <Input
                                    placeholder="Casa con vistas al mar..."
                                    className="h-11"
                                    value={data.property?.description || ''}
                                    onChange={e => setData({ ...data, property: { ...data.property, description: e.target.value } })}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
