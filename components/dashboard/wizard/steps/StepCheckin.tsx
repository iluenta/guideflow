'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Clock, Info, MapPin, Upload, Trash2, Plus, Key, Lock, DoorOpen, Phone, Wifi, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../WizardContext'

const ICON_OPTIONS = [
    { value: 'Key', label: 'Llave', icon: Key },
    { value: 'Lock', label: 'Código', icon: Lock },
    { value: 'DoorOpen', label: 'Puerta', icon: DoorOpen },
    { value: 'Phone', label: 'Teléfono', icon: Phone },
    { value: 'Info', label: 'Info', icon: Info },
    { value: 'Wifi', label: 'WiFi', icon: Wifi },
]

export default function StepCheckin({ value }: { value?: string }) {
    const { data, setData, handleStepImageUpload } = useWizard()
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
    const [justUploadedIdx, setJustUploadedIdx] = useState<number | null>(null)

    const addStep = () => {
        setData({
            ...data,
            checkin: {
                ...data.checkin,
                steps: [...data.checkin.steps, { title: '', description: '', icon: 'Key' }]
            }
        })
    }

    const removeStep = (idx: number) => {
        const newSteps = [...data.checkin.steps]
        newSteps.splice(idx, 1)
        setData({ ...data, checkin: { ...data.checkin, steps: newSteps } })
    }

    const updateStep = (idx: number, field: string, val: string) => {
        const newSteps = [...data.checkin.steps]
        newSteps[idx] = { ...newSteps[idx], [field]: val }
        setData({ ...data, checkin: { ...data.checkin, steps: newSteps } })
    }

    const handleUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 1. Preview instantáneo — el usuario ve la imagen de inmediato
        const localPreview = URL.createObjectURL(file)
        setData((prev: any) => {
            const updated = [...prev.checkin.steps]
            updated[idx] = { ...updated[idx], image_url: localPreview, _uploading: true }
            return { ...prev, checkin: { ...prev.checkin, steps: updated } }
        })
        setUploadingIdx(idx)

        try {
            // 2. Subida real — cuando termina reemplaza la URL temporal por la de Supabase
            await handleStepImageUpload(idx, e)
            setData((prev: any) => {
                const updated = [...prev.checkin.steps]
                if (updated[idx]) updated[idx] = { ...updated[idx], _uploading: false }
                return { ...prev, checkin: { ...prev.checkin, steps: updated } }
            })
            setJustUploadedIdx(idx)
            setTimeout(() => setJustUploadedIdx(null), 2000)
        } catch {
            // Si falla, quitar el preview local
            setData((prev: any) => {
                const updated = [...prev.checkin.steps]
                if (updated[idx]) updated[idx] = { ...updated[idx], image_url: '', _uploading: false }
                return { ...prev, checkin: { ...prev.checkin, steps: updated } }
            })
        } finally {
            setUploadingIdx(null)
            URL.revokeObjectURL(localPreview)
        }
    }

    return (
        <TabsContent value="checkin" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6 space-y-6">

                    {/* Horario + aviso */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-2 text-left">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Horario de Check-in
                            </Label>
                            <div className="relative">
                                <Input
                                    placeholder="Ej: 15:00 - 22:00"
                                    className="h-12 pl-12 rounded-xl bg-slate-50/50 border-slate-100 focus:ring-2 focus:ring-[#316263]/20 font-medium"
                                    value={data.checkin.checkin_time}
                                    onChange={e => setData({ ...data, checkin: { ...data.checkin, checkin_time: e.target.value } })}
                                />
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-blue-700 leading-tight">
                                <span className="font-bold">Contacto de asistencia</span> sincronizado con tu contacto preferente.
                            </p>
                        </div>
                    </div>

                    {/* Pasos */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Pasos Numerados
                        </Label>

                        {/* Paso 1 fijo */}
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex gap-3 opacity-80">
                            <div className="h-7 w-7 rounded-lg bg-[#316263] text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                            <div className="space-y-0.5 text-left">
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                                    <MapPin className="w-3.5 h-3.5 text-[#316263]" /> Dirección (Automático)
                                </div>
                                <p className="text-xs text-slate-400">
                                    {data.access.full_address || 'Introduce la dirección en la pestaña Acceso'}
                                </p>
                            </div>
                        </div>

                        {/* Pasos dinámicos */}
                        {data.checkin.steps.map((step: any, idx: number) => {
                            const isUploading = step._uploading === true
                            const justUploaded = justUploadedIdx === idx && !isUploading

                            return (
                                <div key={idx} className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">

                                    {/* Cabecera: número + título */}
                                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                                        <div className="h-7 w-7 rounded-lg bg-[#316263] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                            {idx + 2}
                                        </div>
                                        <Input
                                            placeholder="Título del paso…"
                                            className="font-bold border-none bg-transparent focus-visible:ring-0 h-9 flex-1 p-0 text-sm placeholder:text-slate-300"
                                            value={step.title}
                                            onChange={e => updateStep(idx, 'title', e.target.value)}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-200 hover:text-red-400 shrink-0"
                                            onClick={() => removeStep(idx)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    {/* Chips de tipo */}
                                    <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                                        {ICON_OPTIONS.map(opt => {
                                            const Icon = opt.icon
                                            const isActive = (step.icon || 'Key') === opt.value
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateStep(idx, 'icon', opt.value)}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all",
                                                        isActive
                                                            ? "bg-[#316263]/10 text-[#316263] ring-1 ring-[#316263]/20"
                                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                                    )}
                                                >
                                                    <Icon className="w-3 h-3" />
                                                    {opt.label}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Descripción */}
                                    <div className="px-4 pb-3">
                                        <Textarea
                                            placeholder="Descripción o instrucciones para el huésped…"
                                            className="border-none bg-slate-50/60 focus-visible:ring-0 min-h-[80px] text-xs font-medium rounded-xl p-3 resize-none"
                                            value={step.description}
                                            onChange={e => updateStep(idx, 'description', e.target.value)}
                                        />
                                    </div>

                                    {/* Zona de imagen */}
                                    <div className="px-4 pb-4">
                                        {step.image_url ? (
                                            // Imagen: preview local inmediato + overlay de subida encima
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden group/img">
                                                <img
                                                    src={step.image_url}
                                                    alt="Vista previa"
                                                    className={cn(
                                                        "w-full h-full object-cover transition-all duration-500",
                                                        isUploading && "blur-sm scale-105"
                                                    )}
                                                />
                                                {/* Overlay subiendo */}
                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center gap-2">
                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                        <span className="text-white text-xs font-semibold bg-black/30 px-3 py-1 rounded-full">
                                                            Guardando…
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Tick éxito */}
                                                {justUploaded && (
                                                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                                    </div>
                                                )}
                                                {/* Eliminar */}
                                                {!isUploading && !justUploaded && (
                                                    <button
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        onClick={() => updateStep(idx, 'image_url', '')}
                                                    >
                                                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl">
                                                            <Trash2 className="w-4 h-4 text-white" />
                                                            <span className="text-white text-xs font-semibold">Eliminar foto</span>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            // Drop zone vacía
                                            <div
                                                onClick={() => document.getElementById(`step-image-${idx}`)?.click()}
                                                className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-[#316263]/30 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all"
                                            >
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-semibold text-slate-600">Añadir foto</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Portal, cajetón de llaves o puerta</p>
                                                </div>
                                                <input
                                                    id={`step-image-${idx}`}
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={e => handleUpload(idx, e)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        <Button
                            variant="outline"
                            className="w-full h-12 border-dashed border-2 rounded-xl hover:bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest"
                            onClick={addStep}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Añadir otro paso
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}