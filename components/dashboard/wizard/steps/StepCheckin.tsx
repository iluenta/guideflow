'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TabsContent } from '@/components/ui/tabs'
import { Clock, Info, MapPin, Upload, Trash2, Plus } from 'lucide-react'
import { useWizard } from '../WizardContext'

export default function StepCheckin({ value }: { value?: string }) {
    const { 
        data, 
        setData, 
        handleStepImageUpload 
    } = useWizard()

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

    const updateStep = (idx: number, field: string, value: string) => {
        const newSteps = [...data.checkin.steps]
        newSteps[idx] = { ...newSteps[idx], [field]: value }
        setData({ ...data, checkin: { ...data.checkin, steps: newSteps } })
    }

    return (
        <TabsContent value="checkin" className="mt-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-none shadow-lg bg-white rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4">
                    <CardTitle className="text-base">Pasos del Check-in</CardTitle>
                    <CardDescription className="text-xs">Define los pasos que debe seguir el huésped para entrar.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Horario de Check-in Disponible</Label>
                            <div className="relative">
                                <Input
                                    placeholder="Ej: 15:00 - 22:00"
                                    className="h-11 pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                    value={data.checkin.checkin_time}
                                    onChange={e => setData({ ...data, checkin: { ...data.checkin, checkin_time: e.target.value } })}
                                />
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-blue-700 leading-tight">
                                <span className="font-bold">Contacto de asistencia:</span> Sincronizado automáticamente con tu "Contacto Preferente". Puedes cambiarlo en la pestaña anterior.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Pasos Numerados
                        </Label>

                        {/* Paso 1 Fijo: Dirección */}
                        <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/30 flex gap-4 opacity-80">
                            <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 font-bold text-sm text-navy">
                                    <MapPin className="w-4 h-4" /> Dirección (Fijo)
                                </div>
                                <p className="text-sm text-slate-500">{data.access.full_address || 'Introduce la dirección en la pestaña Acceso'}</p>
                            </div>
                        </div>

                        {/* Pasos Dinámicos */}
                        <div className="space-y-3">
                            {data.checkin.steps.map((step: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex gap-4 animate-in slide-in-from-right-2 duration-200">
                                    <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm shrink-0">
                                        {idx + 2}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Título del paso (ej: Código del portero)"
                                                className="font-bold border-none bg-slate-50/50 focus-visible:ring-0 h-9 flex-1"
                                                value={step.title}
                                                onChange={e => updateStep(idx, 'title', e.target.value)}
                                            />
                                            <select
                                                className="h-9 px-2 rounded-md border-none bg-slate-50/50 text-xs font-semibold text-navy focus:ring-0"
                                                value={step.icon || 'Key'}
                                                onChange={e => updateStep(idx, 'icon', e.target.value)}
                                            >
                                                <option value="Key">Llave</option>
                                                <option value="Lock">Código</option>
                                                <option value="DoorOpen">Puerta</option>
                                                <option value="Phone">Teléfono</option>
                                                <option value="Info">Info</option>
                                                <option value="Wifi">WiFi</option>
                                            </select>
                                        </div>
                                        <Textarea
                                            placeholder="Descripción o instrucciones..."
                                            className="border-none bg-slate-50/30 focus-visible:ring-0 min-h-[60px] text-sm"
                                            value={step.description}
                                            onChange={e => updateStep(idx, 'description', e.target.value)}
                                        />

                                        {/* Image Upload for Step */}
                                        <div className="flex items-center gap-4 pt-2">
                                            {step.image_url ? (
                                                <div className="relative w-24 h-24 rounded-xl overflow-hidden group/img">
                                                    <img src={step.image_url} alt="Step preview" className="w-full h-full object-cover" />
                                                    <button
                                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        onClick={() => updateStep(idx, 'image_url', '')}
                                                    >
                                                        <Trash2 className="w-5 h-5 text-white" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-colors"
                                                    onClick={() => document.getElementById(`step-image-${idx}`)?.click()}
                                                >
                                                    <Upload className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-500">Añadir foto</span>
                                                    <input
                                                        id={`step-image-${idx}`}
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleStepImageUpload(idx, e)}
                                                    />
                                                </div>
                                            )}
                                            <p className="text-[10px] text-slate-400 max-w-[150px]">
                                                Sube una foto del portal, del cajetón de llaves o de la puerta para ayudar al huésped.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-300 hover:text-destructive self-start"
                                        onClick={() => removeStep(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                className="w-full h-12 border-dashed border-2 rounded-2xl hover:bg-slate-50 text-slate-500 font-semibold"
                                onClick={addStep}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Añadir otro paso
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
