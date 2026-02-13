'use client'

import { useState } from 'react'
import { Plane, Train, Car, Bus, Pencil, Check, X, Sparkles, AlertTriangle, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
    onRegenerate?: (section: 'plane' | 'train' | 'road') => void
    isGenerating?: boolean
    progress?: number
}

export default function TransportInfo({
    data,
    onEdit,
    onRegenerate,
    isGenerating = false,
    progress = 0
}: TransportInfoProps) {
    const [editingSection, setEditingSection] = useState<string | null>(null)
    const [tempValue, setTempValue] = useState<string>('')
    const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)

    if (isGenerating && !regeneratingSection) {
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

    // Simplificamos: Mostramos siempre el contenedor si hay datos de acceso básicos
    // para permitir al usuario añadir o regenerar información.

    const handleEditStart = (section: string, currentText: string) => {
        setEditingSection(section)
        setTempValue(currentText)
    }

    const handleSave = (section: string) => {
        onEdit(section, tempValue)
        setEditingSection(null)
    }

    const handleRegenerate = async (section: 'plane' | 'train' | 'road') => {
        if (onRegenerate) {
            setRegeneratingSection(section)
            await onRegenerate(section)
            setRegeneratingSection(null)
        }
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
                    onRegenerate={() => handleRegenerate('plane')}
                    isRegenerating={regeneratingSection === 'plane'}
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
                    onRegenerate={() => handleRegenerate('train')}
                    isRegenerating={regeneratingSection === 'train'}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    metadata={`${data.from_train?.duration || '-'} • ${data.from_train?.price_range || '-'}`}
                />

                {/* Parking */}
                <TransportSection
                    icon={<Car className="w-4 h-4" />}
                    title="Aparcamiento / Coche"
                    content={data.parking?.info || ''}
                    isEditing={editingSection === 'parking'}
                    onEdit={() => handleEditStart('parking', data.parking?.info || '')}
                    onSave={() => handleSave('parking')}
                    onCancel={() => setEditingSection(null)}
                    onRegenerate={() => handleRegenerate('road')}
                    isRegenerating={regeneratingSection === 'road'}
                    tempValue={tempValue}
                    setTempValue={setTempValue}
                    metadata={`${data.parking?.distance || '-'} • ${data.parking?.price || '-'}`}
                />

                {/* Transporte Cercano */}
                {Array.isArray(data.nearby_transport) && (
                    <div className="bg-white/50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <Bus className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-tight">Transporte Cercano (Bus/Taxi/Metro)</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[10px] text-primary hover:text-primary-hover hover:bg-primary/5 flex items-center gap-1"
                                onClick={() => {
                                    const newList = [...(data.nearby_transport || []), { type: 'Bus', name: '', distance: '' }];
                                    onEdit('nearby_transport', newList);
                                }}
                            >
                                <Plus className="w-3 h-3" /> Añadir
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {Array.isArray(data.nearby_transport) && data.nearby_transport.map((item, idx) => (
                                <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-slate-100 shadow-sm gap-2 group relative">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={item.type}
                                            onChange={(e) => {
                                                const newList = [...(data.nearby_transport || [])];
                                                newList[idx] = { ...newList[idx], type: e.target.value };
                                                onEdit('nearby_transport', newList);
                                            }}
                                            className="text-[10px] font-bold uppercase tracking-tight bg-slate-50 border-none rounded p-1 outline-none text-primary"
                                        >
                                            <option value="Bus">Bus</option>
                                            <option value="Taxi">Taxi</option>
                                            <option value="Metro">Metro</option>
                                            <option value="Uber/Cabify">Uber/VTC</option>
                                            <option value="Tren">Tren</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                        <input
                                            value={item.name}
                                            placeholder="Nombre de la línea o estación"
                                            onChange={(e) => {
                                                const newList = [...(data.nearby_transport || [])];
                                                newList[idx] = { ...newList[idx], name: e.target.value };
                                                onEdit('nearby_transport', newList);
                                            }}
                                            className="text-[11px] font-medium text-slate-700 flex-1 border-none outline-none focus:ring-1 focus:ring-primary/20 rounded px-1"
                                        />
                                        <input
                                            value={item.distance}
                                            placeholder="Distancia (ej: 5 min)"
                                            onChange={(e) => {
                                                const newList = [...(data.nearby_transport || [])];
                                                newList[idx] = { ...newList[idx], distance: e.target.value };
                                                onEdit('nearby_transport', newList);
                                            }}
                                            className="text-[10px] text-slate-400 w-20 text-right border-none outline-none focus:ring-1 focus:ring-primary/20 rounded px-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-slate-300 hover:text-red-500"
                                            onClick={() => {
                                                const newList = (data.nearby_transport || []).filter((_, i) => i !== idx);
                                                onEdit('nearby_transport', newList);
                                            }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
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
    onRegenerate?: () => void
    isRegenerating?: boolean
    tempValue: string
    setTempValue: (v: string) => void
    metadata?: string
}

function TransportSection({
    icon, title, content, isEditing, onEdit, onSave, onCancel, onRegenerate, isRegenerating, tempValue, setTempValue, metadata
}: SectionProps) {
    // Solo ocultamos si no hay contenido Y no hay posibilidad de regenerar (evita secciones vacías inútiles)
    if (!content && !isEditing && !isRegenerating && !onRegenerate) return null

    return (
        <Card className="border-none shadow-sm bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl overflow-hidden group">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        {isRegenerating ? <Sparkles className="w-4 h-4 animate-pulse" /> : icon}
                        <span className="text-xs uppercase tracking-tight">{title}</span>
                        {isRegenerating && <span className="text-[9px] font-normal lowercase animate-pulse ml-1">Regenerando...</span>}
                    </div>
                    {!isEditing && !isRegenerating && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onRegenerate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-primary hover:bg-primary/5"
                                    onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
                                    title="Regenerar con IA"
                                >
                                    <Sparkles className="w-3 h-3" />
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
                                <Pencil className="w-3 h-3 text-slate-400" />
                            </Button>
                        </div>
                    )}
                    {isEditing && (
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

                {isRegenerating ? (
                    <div className="space-y-2 py-2">
                        <div className="h-2 bg-slate-200 rounded w-full animate-pulse" />
                        <div className="h-2 bg-slate-200 rounded w-3/4 animate-pulse" />
                    </div>
                ) : isEditing ? (
                    <Textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-xs min-h-[100px] bg-white border-slate-200 focus:ring-primary/20"
                        autoFocus
                    />
                ) : (
                    <div className="space-y-2">
                        <div className="text-[13px] text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                        {metadata && (
                            <div className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-2 mt-2">
                                {metadata}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
