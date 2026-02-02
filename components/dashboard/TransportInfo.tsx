'use client'

import { useState } from 'react'
import { Plane, Train, Car, Bus, Pencil, Check, X, Sparkles, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface TransportData {
    from_airport?: { instructions: string; duration: string; price_range: string }
    from_train?: { instructions: string; duration: string; price_range: string }
    parking?: { info: string; price: string; distance: string }
    nearby_transport?: Array<{ type: string; name: string; distance: string }>
}

interface TransportInfoProps {
    data: TransportData
    onEdit: (section: string, newData: any) => void
    isGenerating?: boolean
    progress?: number
}

export default function TransportInfo({
    data,
    onEdit,
    isGenerating = false,
    progress = 0
}: TransportInfoProps) {
    const [editingSection, setEditingSection] = useState<string | null>(null)
    const [tempValue, setTempValue] = useState<string>('')

    if (isGenerating) {
        return (
            <div className="mb-6 bg-primary/5 border border-primary/10 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="font-medium text-slate-800">
                            🤖 Generando rutas de transporte...
                        </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                        {progress}%
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-[11px] text-slate-500 mt-3 text-center italic">
                    ✨ Esto toma aproximadamente 10-15 segundos. Estamos analizando las mejores rutas para tus huéspedes.
                </p>
            </div>
        )
    }

    if (!data?.from_airport && !data?.from_train && !data?.parking && (!data?.nearby_transport || data?.nearby_transport?.length === 0)) {
        return null
    }

    const handleEditStart = (section: string, currentText: string) => {
        setEditingSection(section)
        setTempValue(currentText)
    }

    const handleSave = (section: string) => {
        onEdit(section, tempValue)
        setEditingSection(null)
    }

    return (
        <div className="space-y-4 pt-4 border-t border-slate-100 mt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
                        <Sparkles className="w-3 h-3" /> Cómo Llegar
                    </Badge>
                    <span className="text-[10px] text-slate-400 italic">Generado con IA</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Aeropuerto */}
                <TransportSection
                    icon={<Plane className="w-4 h-4" />}
                    title="Desde el Aeropuerto"
                    content={data.from_airport?.instructions || ''}
                    isEditing={editingSection === 'from_airport'}
                    onEdit={() => handleEditStart('from_airport', data.from_airport?.instructions || '')}
                    onSave={() => handleSave('from_airport')}
                    onCancel={() => setEditingSection(null)}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    metadata={`${data.from_airport?.duration || '-'} • ${data.from_airport?.price_range || '-'}`}
                />

                {/* Tren */}
                <TransportSection
                    icon={<Train className="w-4 h-4" />}
                    title="Desde la Estación de Tren"
                    content={data.from_train?.instructions || ''}
                    isEditing={editingSection === 'from_train'}
                    onEdit={() => handleEditStart('from_train', data.from_train?.instructions || '')}
                    onSave={() => handleSave('from_train')}
                    onCancel={() => setEditingSection(null)}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    metadata={`${data.from_train?.duration || '-'} • ${data.from_train?.price_range || '-'}`}
                />

                {/* Parking */}
                <TransportSection
                    icon={<Car className="w-4 h-4" />}
                    title="Aparcamiento"
                    content={data.parking?.info || ''}
                    isEditing={editingSection === 'parking'}
                    onEdit={() => handleEditStart('parking', data.parking?.info || '')}
                    onSave={() => handleSave('parking')}
                    onCancel={() => setEditingSection(null)}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    metadata={`${data.parking?.distance || '-'} • ${data.parking?.price || '-'}`}
                />

                {/* Transporte Cercano */}
                {data.nearby_transport && data.nearby_transport.length > 0 && (
                    <div className="bg-white/50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-primary font-bold mb-3">
                            <Bus className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-tight">Transporte Cercano</span>
                        </div>
                        <div className="space-y-2">
                            {data.nearby_transport.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="text-[11px] font-medium text-slate-700">{item.type}: {item.name}</span>
                                    <span className="text-[10px] text-slate-400">{item.distance}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Revisa los textos generados.</strong> La IA puede cometer errores. Puedes editar cualquier sección pulsando el icono del lápiz.
                </p>
            </div>
        </div>
    )
}

interface SectionProps {
    icon: React.ReactNode
    title: string
    content: string
    isEditing: boolean
    onEdit: () => void
    onSave: () => void
    onCancel: () => void
    tempValue: string
    setTempValue: (v: string) => void
    metadata?: string
}

function TransportSection({
    icon, title, content, isEditing, onEdit, onSave, onCancel, tempValue, setTempValue, metadata
}: SectionProps) {
    if (!content && !isEditing) return null

    return (
        <Card className="border-none shadow-sm bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl overflow-hidden">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        {icon}
                        <span className="text-xs uppercase tracking-tight">{title}</span>
                    </div>
                    {!isEditing ? (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
                            <Pencil className="w-3 h-3 text-slate-400" />
                        </Button>
                    ) : (
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={onSave}>
                                <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400" onClick={onCancel}>
                                <X className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <Textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-xs min-h-[100px] bg-white border-slate-200"
                        autoFocus
                    />
                ) : (
                    <div className="space-y-2">
                        <p className="text-[13px] text-slate-600 leading-relaxed">
                            {content}
                        </p>
                        {metadata && (
                            <div className="text-[10px] text-slate-400 font-medium">
                                {metadata}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
