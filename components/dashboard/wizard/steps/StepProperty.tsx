'use client'

import React, { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Upload, X, Loader2, Home, Hash, CheckCircle2, AlertCircle, Globe, Car } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../WizardContext'

export default function StepProperty({ value }: { value?: string }) {
    const { data, setData, handleImageUpload } = useWizard()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [localUploading, setLocalUploading] = useState(false)
    const [justUploaded, setJustUploaded] = useState(false)
    const [slugTouched, setSlugTouched] = useState(false)

    const slugEmpty = !data.property?.slug
    const slugInvalid = slugTouched && slugEmpty

    const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const localPreview = URL.createObjectURL(file)
        setData((prev: any) => ({
            ...prev,
            property: { ...prev.property, main_image_url: localPreview }
        }))
        setLocalUploading(true)
        setJustUploaded(false)
        try {
            await handleImageUpload(e)
            setJustUploaded(true)
            setTimeout(() => setJustUploaded(false), 2500)
        } catch {
            setData((prev: any) => ({
                ...prev,
                property: { ...prev.property, main_image_url: '' }
            }))
        } finally {
            setLocalUploading(false)
            URL.revokeObjectURL(localPreview)
        }
    }

    return (
        <TabsContent value="property" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid gap-8 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-sm">

                {/* ── Imagen de portada ─────────────────────────── */}
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        Imagen de Portada
                    </Label>
                    <div
                        onClick={() => !localUploading && fileInputRef.current?.click()}
                        className={cn(
                            "relative aspect-[21/9] rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group",
                            data.property.main_image_url
                                ? "border border-slate-100"
                                : "border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-[#316263]/40 hover:bg-[#316263]/5"
                        )}
                    >
                        {data.property.main_image_url ? (
                            <>
                                <img
                                    src={data.property.main_image_url}
                                    alt="Portada"
                                    className={cn(
                                        "w-full h-full object-cover transition-all duration-700",
                                        localUploading && "blur-sm scale-105"
                                    )}
                                />
                                {localUploading && (
                                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 z-10">
                                        <Loader2 className="h-7 w-7 animate-spin text-white" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-white bg-black/30 px-4 py-1.5 rounded-full">
                                            Optimizando…
                                        </span>
                                    </div>
                                )}
                                {justUploaded && (
                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center z-10">
                                        <CheckCircle2 className="h-12 w-12 text-emerald-500 drop-shadow-lg" />
                                    </div>
                                )}
                                {!localUploading && !justUploaded && (
                                    <>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
                                                <Upload className="w-4 h-4 text-white" />
                                                <span className="text-white text-sm font-semibold">Cambiar foto</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setData({ ...data, property: { ...data.property, main_image_url: '' } }) }}
                                            className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-white/90 backdrop-blur-md text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-50 z-20"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-[#316263] group-hover:scale-110 transition-all duration-300">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-sm text-slate-700">Sube una fotografía de tu propiedad</p>
                                    <p className="text-xs text-slate-400 mt-0.5">JPEG o PNG · Máx. recomendado 5MB</p>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLocalImageUpload} />
                    </div>
                </div>

                {/* ── Nombre ───────────────────────────────────── */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                        Nombre del Alojamiento
                    </Label>
                    <div className="relative group">
                        <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#316263] transition-colors" />
                        <Input
                            placeholder="Ej: Villa Marítima Premium"
                            className="h-12 pl-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-base font-medium"
                            value={data.property?.name || ''}
                            onChange={e => setData({ ...data, property: { ...data.property, name: e.target.value } })}
                        />
                    </div>
                </div>

                {/* ── Slug — campo obligatorio destacado ───────── */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                                Identificador URL
                            </Label>
                            <span className="text-[10px] font-bold text-white bg-[#316263] px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Obligatorio
                            </span>
                        </div>
                        {slugInvalid && (
                            <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Requerido
                            </span>
                        )}
                    </div>

                    <div className={cn(
                        "relative group rounded-xl transition-all duration-200",
                        slugInvalid
                            ? "ring-2 ring-red-400/50"
                            : "focus-within:ring-2 focus-within:ring-[#316263]/25"
                    )}>
                        <Hash className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                            slugInvalid ? "text-red-400" : "text-slate-300 group-focus-within:text-[#316263]"
                        )} />
                        {/* URL completa a la que pertenece el slug. Necesita div que ocupe todo width con input sin bordes */}
                        <div className={cn(
                            "h-12 pl-12 pr-4 rounded-xl flex items-center",
                            slugInvalid ? "bg-red-50" : "bg-slate-50"
                        )}>
                            <Input
                                placeholder="villa-maritima"
                                className="border-none bg-transparent p-0 text-base font-mono font-medium focus-visible:ring-0 flex-1 truncate h-full"
                                value={data.property?.slug || ''}
                                onBlur={() => setSlugTouched(true)}
                                onChange={e => {
                                    setData({
                                        ...data,
                                        property: {
                                            ...data.property,
                                            slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
                                        }
                                    })
                                }}
                            />
                            {/* Preview de la URL final insertado directamente */}
                            {data.property?.slug && (
                                <div className="flex items-center gap-1 bg-slate-200/50 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                                    <Globe className="h-3 w-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">
                                        /{data.property.slug}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 ml-1">
                        Aparece en la URL de tu guía. Solo letras, números y guiones. <span className="font-semibold text-slate-500">No se puede cambiar después.</span>
                    </p>
                </div>

                {/* ── Stats ────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Huéspedes', key: 'guests' },
                        { label: 'Habitaciones', key: 'beds' },
                        { label: 'Baños', key: 'baths' },
                    ].map(({ label, key }) => (
                        <div key={key} className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block">{label}</Label>
                            <Input
                                type="number"
                                min={1}
                                className="h-12 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20 text-center text-xl font-bold"
                                value={data.property?.[key] || ''}
                                onChange={e => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                                    setData({ ...data, property: { ...data.property, [key]: isNaN(val) ? 0 : val } })
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* ── Parking ───────────────────────────────────── */}
                <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Car className="h-4 w-4 text-[#316263]" />
                                ¿Tiene plaza de Parking?
                            </Label>
                            <p className="text-[11px] text-slate-400">Indica si incluyes una plaza privada con el alojamiento.</p>
                        </div>
                        <Switch
                            checked={data.property?.has_parking || false}
                            onCheckedChange={val => setData({ ...data, property: { ...data.property, has_parking: val } })}
                        />
                    </div>

                    {data.property?.has_parking && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número de Plaza o Ubicación</Label>
                            <Input
                                placeholder="Ej: Plaza 42 (Planta -1)"
                                className="h-11 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-[#316263]/20"
                                value={data.property?.parking_number || ''}
                                onChange={e => setData({ ...data, property: { ...data.property, parking_number: e.target.value } })}
                            />
                        </div>
                    )}
                </div>
            </div>
        </TabsContent>
    )
}
