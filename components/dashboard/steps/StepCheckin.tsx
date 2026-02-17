'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
    Clock, 
    Key, 
    Phone, 
    Plus, 
    Trash2, 
    AlertCircle, 
    Info, 
    MapPin, 
    Hash, 
    Archive, 
    DoorOpen, 
    Car, 
    Upload, 
    X, 
    Loader2,
    Lock,
    Sparkles,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface StepCheckinProps {
    data: any
    propertyAddress?: string
    onChange: (data: any) => void
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, stepId?: string) => void
    uploading?: boolean
    uploadingStepId?: string | null
}

const STEP_TYPES = [
    { value: 'key', label: 'Llave', icon: Key },
    { value: 'code', label: 'Código', icon: Hash },
    { value: 'box', label: 'Cajetín', icon: Archive },
    { value: 'door', label: 'Portal', icon: DoorOpen },
    { value: 'parking', label: 'Parking', icon: Car },
    { value: 'smartlock', label: 'Cerradura', icon: Lock },
]

export function StepCheckin({ 
    data, 
    propertyAddress, 
    onChange, 
    onImageUpload, 
    uploading,
    uploadingStepId 
}: StepCheckinProps) {
    const getStepIcon = (type: string) => {
        const stepType = STEP_TYPES.find(t => t.value === type)
        const Icon = stepType?.icon || Key
        return <Icon className="h-5 w-5" />
    }
    const handleAddStep = () => {
        const newSteps = [...(data.steps || [])]
        newSteps.push({
            id: Date.now().toString(),
            title: '',
            description: '',
            type: 'key',
            image_url: ''
        })
        onChange({ steps: newSteps })
    }

    const handleRemoveStep = (id: string) => {
        onChange({ steps: data.steps.filter((s: any) => s.id !== id) })
    }

    const handleUpdateStep = (id: string, updates: any) => {
        onChange({
            steps: data.steps.map((s: any) => s.id === id ? { ...s, ...updates } : s)
        })
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Horarios y Entrada</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Define cómo y cuándo pueden entrar tus huéspedes. Instrucciones claras reducen el estrés de la llegada.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <Label className="text-xs font-bold uppercase tracking-widest">Horario de Check-in</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="Ej: 15:00 - 22:00"
                                    value={data.checkin_time || ''}
                                    onChange={(e) => onChange({ checkin_time: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 shadow-sm"
                                />
                                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Phone className="w-4 h-4" />
                                <Label className="text-xs font-bold uppercase tracking-widest lowercase">Teléfono de Soporte para Check-in</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="Ej: +34 600 000 000"
                                    value={data.emergency_phone || ''}
                                    onChange={(e) => onChange({ emergency_phone: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 shadow-sm"
                                />
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/[0.03] border border-primary/10 rounded-[2rem] p-8 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Key className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
                        </div>
                        <div className="flex gap-4 text-sm text-slate-600 relative z-10">
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Sobre la Entrada</p>
                                <p className="mt-1 leading-relaxed text-xs text-slate-500">
                                    Si usas cerradura inteligente o cajetín, detalla los pasos a continuación. Estos aparecerán de forma secuencial y visual para el huésped.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Sparkles className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-widest">PASOS PARA ENTRAR</h3>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 gap-2 font-bold bg-white border-slate-200 rounded-xl px-4 hover:text-primary transition-all shadow-sm"
                            onClick={handleAddStep}
                        >
                            <Plus className="h-4 w-4" /> Añadir Paso
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {/* Fixed Step: Address */}
                        <div className="relative group bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xl ring-4 ring-white transition-transform group-hover:scale-110">
                                1
                            </div>
                            
                            <div className="ml-8 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-6 w-6 text-slate-400" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-bold text-slate-900">Dirección</p>
                                        <span className="bg-slate-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg text-slate-500">Fijo</span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">{propertyAddress || 'Cargando dirección...'}</p>
                                </div>
                            </div>
                        </div>

                        {(data.steps || []).map((step: any, index: number) => (
                            <div key={step.id} className="relative group bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-lg transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2">
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xl ring-4 ring-white transition-transform group-hover:scale-110">
                                    {index + 2}
                                </div>
                                
                                <div className="ml-8 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 flex gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                                                {getStepIcon(step.type)}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título del Paso</Label>
                                                <Input
                                                    placeholder="Ej: Código del portero automático"
                                                    value={step.title}
                                                    onChange={(e) => handleUpdateStep(step.id, { title: e.target.value })}
                                                    className="h-12 bg-slate-50 border-none shadow-none text-base font-bold focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo</Label>
                                                <Select
                                                    value={step.type || 'key'}
                                                    onValueChange={(val) => handleUpdateStep(step.id, { type: val })}
                                                >
                                                    <SelectTrigger className="w-[160px] h-12 bg-white border-slate-200 rounded-xl text-sm font-bold shadow-sm">
                                                        <SelectValue placeholder="Tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                                        {STEP_TYPES.map(t => (
                                                            <SelectItem key={t.value} value={t.value} className="focus:bg-primary/5 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <t.icon className="h-4 w-4" />
                                                                    {t.label}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-12 w-12 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all mb-0"
                                                onClick={() => handleRemoveStep(step.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 lowercase text-sm">Instrucciones detalladas</Label>
                                        <textarea
                                            placeholder="Describe qué debe hacer el huésped paso a paso..."
                                            value={step.description}
                                            onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                                            className="w-full min-h-[100px] rounded-2xl bg-slate-50 border-none shadow-inset text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/20 p-5 leading-relaxed font-semibold"
                                        />
                                    </div>

                                    {/* Image Section */}
                                    <div className="flex flex-col sm:flex-row gap-6 items-start pt-2">
                                        <div className="relative group w-40 aspect-square shrink-0">
                                            {step.image_url ? (
                                                <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden border-2 border-white shadow-lg">
                                                    <Image
                                                        src={step.image_url}
                                                        alt="Step"
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleUpdateStep(step.id, { image_url: '' })}
                                                            className="bg-white/90 p-2 rounded-xl shadow-lg hover:bg-red-50 hover:text-red-500 transition-all transform hover:scale-110"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-full rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-primary/30 cursor-pointer transition-all duration-300 group-image">
                                                    <div className="flex flex-col items-center justify-center p-4 text-center">
                                                        {uploading && uploadingStepId === step.id ? (
                                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                        ) : (
                                                            <>
                                                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-image-hover:scale-110 transition-transform">
                                                                    <Upload className="h-6 w-6 text-primary" />
                                                                </div>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Añadir Foto</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => onImageUpload?.(e, step.id)}
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4 pt-2">
                                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-[11px] leading-relaxed border border-emerald-100 flex gap-3">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                                <p className="font-medium">
                                                    <span className="font-bold">Pro Tip:</span> Sube una foto del portal, del cajetín de llaves o de la puerta exacta. Los huéspedes valoran mucho este recurso visual para orientarse.
                                                </p>
                                            </div>
                                            <p className="text-[10px] italic text-slate-400 px-1">Formato recomendado: JPG o PNG. Tamaño máximo: 5MB.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!data.steps || data.steps.length === 0) && (
                            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                                <div className="h-16 w-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                                    <DoorOpen className="h-8 w-8 text-slate-300" />
                                </div>
                                <h4 className="text-base font-bold text-slate-900 mb-1">Añade tu primer paso</h4>
                                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">Configura los pasos secuenciales para que tus huéspedes sepan exactamente qué hacer al llegar.</p>
                                <Button 
                                    variant="secondary" 
                                    className="mt-6 bg-primary text-white hover:bg-primary/90 rounded-xl px-6"
                                    onClick={handleAddStep}
                                >
                                    Comenzar ahora
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
