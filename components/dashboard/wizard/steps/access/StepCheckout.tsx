'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Clock, Info, Upload, Trash2, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizard } from '../../WizardContext'
import { compressImage, createFileList } from '@/lib/compress-image'

/**
 * Pasos de salida. Misma mecánica que StepCheckin, pero sin horario propio:
 * la hora de salida ya vive en `rules.checkout_time` y duplicarla aquí crearía
 * dos versiones del mismo dato.
 */
export default function StepCheckout({ value }: { value?: string }) {
    const { data, setData, handleStepImageUpload } = useWizard()
    const [justUploadedIdx, setJustUploadedIdx] = useState<number | null>(null)

    const steps = data.checkout?.steps ?? []

    const addStep = () => {
        setData({ ...data, checkout: { ...data.checkout, steps: [...steps, { title: '', description: '', icon: 'LogOut' }] } })
    }

    const removeStep = (idx: number) => {
        const newSteps = [...steps]
        newSteps.splice(idx, 1)
        setData({ ...data, checkout: { ...data.checkout, steps: newSteps } })
    }

    const updateStep = (idx: number, field: string, val: string) => {
        const newSteps = [...steps]
        newSteps[idx] = { ...newSteps[idx], [field]: val }
        setData({ ...data, checkout: { ...data.checkout, steps: newSteps } })
    }

    const handleUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.files?.[0]
        if (!raw) return

        const file = raw.size > 300_000 && raw.type.startsWith('image/')
            ? await compressImage(raw, 1280, 0.78)
            : raw

        const localPreview = URL.createObjectURL(file)
        setData((prev: any) => {
            const updated = [...(prev.checkout?.steps ?? [])]
            updated[idx] = { ...updated[idx], image_url: localPreview, _uploading: true }
            return { ...prev, checkout: { ...prev.checkout, steps: updated } }
        })

        try {
            const compressedInput = { ...e, target: { ...e.target, files: createFileList(file) } }
            await handleStepImageUpload(idx, compressedInput as any, 'checkout')

            setData((prev: any) => {
                const updated = [...(prev.checkout?.steps ?? [])]
                if (updated[idx]) updated[idx] = { ...updated[idx], _uploading: false }
                return { ...prev, checkout: { ...prev.checkout, steps: updated } }
            })
            setJustUploadedIdx(idx)
            setTimeout(() => setJustUploadedIdx(null), 1500)
        } finally {
            URL.revokeObjectURL(localPreview)
        }
    }

    return (
        <TabsContent value="checkout" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6 space-y-6">

                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                        <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-700 leading-tight">
                            La <span className="font-bold">hora de salida ({data.rules?.checkout_time || '11:00'})</span> se
                            configura en la pestaña Normas. Aquí solo van las instrucciones de salida.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-600 ml-1 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Pasos de salida
                        </Label>

                        <div className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex items-start gap-3">
                            <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-slate-500 leading-tight">
                                Las descripciones admiten formato: <code className="font-mono">**negrita**</code>,
                                listas con <code className="font-mono">-</code> y avisos destacados empezando la línea
                                con <code className="font-mono">&gt;</code>.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {steps.map((step: any, idx: number) => {
                                const isUploading = step._uploading === true
                                const justUploaded = justUploadedIdx === idx && !isUploading

                                return (
                                    <div key={idx} className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 pt-4 pb-2 group">
                                            <div className="h-7 w-7 rounded-lg bg-[#316263] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                {idx + 1}
                                            </div>
                                            <Input
                                                placeholder="Título del paso (ej: Saca la basura)…"
                                                className="font-bold border-none bg-transparent focus-visible:ring-0 h-9 flex-1 p-0 text-sm placeholder:text-slate-300"
                                                value={step.title}
                                                onChange={e => updateStep(idx, 'title', e.target.value)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0 transition-all lg:opacity-0 lg:group-hover:opacity-100"
                                                onClick={() => removeStep(idx)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {step.title && (
                                            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                                <div className="px-4 pb-3">
                                                    <Textarea
                                                        placeholder="Instrucciones para el huésped…"
                                                        className="border-none bg-slate-50/60 focus-visible:ring-0 min-h-[80px] text-xs font-medium rounded-xl p-3 resize-none"
                                                        value={step.description}
                                                        onChange={e => updateStep(idx, 'description', e.target.value)}
                                                    />
                                                </div>

                                                <div className="px-4 pb-4">
                                                    {step.image_url ? (
                                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden group/img">
                                                            <Image
                                                                src={step.image_url}
                                                                alt="Vista previa"
                                                                fill
                                                                className={cn('object-cover transition-all duration-500', isUploading && 'blur-sm scale-105')}
                                                            />
                                                            {isUploading && (
                                                                <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center gap-2">
                                                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                                    <span className="text-white text-xs font-semibold bg-black/30 px-3 py-1 rounded-full">Guardando…</span>
                                                                </div>
                                                            )}
                                                            {justUploaded && (
                                                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                                                </div>
                                                            )}
                                                            {!isUploading && !justUploaded && (
                                                                <button
                                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center lg:opacity-0 lg:group-hover/img:opacity-100 transition-opacity"
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
                                                        <div
                                                            onClick={() => document.getElementById(`checkout-step-image-${idx}`)?.click()}
                                                            className="w-full rounded-xl border-2 border-dashed border-slate-200 hover:border-[#316263]/30 hover:bg-slate-50 flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-all"
                                                        >
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                                <Upload className="w-4 h-4 text-slate-400" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs font-semibold text-slate-600">Añadir foto</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Opcional: contenedores, cajetín, llaves</p>
                                                            </div>
                                                            <input
                                                                id={`checkout-step-image-${idx}`}
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={e => handleUpload(idx, e)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 border-dashed border-2 rounded-xl hover:bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest"
                            onClick={addStep}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Añadir paso de salida
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
