'use client'

import { useState } from 'react'
import { Plane, Train, Car, Bus, Pencil, Check, X, Sparkles, AlertTriangle, Plus, MapPin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface OtherAirport {
    name: string
    code: string
    distance_km: number
    options: string
}

interface TransportData {
    from_airport?: {
        instructions: string
        duration: string
        price_range: string
        main_airport_name?: string
        other_airports?: OtherAirport[]
    }
    from_train?: {
        instructions?: string  // legacy fallback
        train_ld?: string
        bus_interurban?: string
        last_mile?: string
        duration: string
        price_range: string
    }
    parking?: { info: string; price: string; distance: string; nearby_options?: string[] }
    nearby_transport?: Array<{ type: string; name: string; distance: string }>
}

interface TransportInfoProps {
    data: TransportData
    onEdit: (section: string, newData: any) => void
    onRegenerate?: (section: 'plane' | 'train' | 'road') => void
    isGenerating?: boolean
    progress?: number
}

function hasContent(data: TransportData): boolean {
    return !!(
        data.from_airport?.instructions ||
        data.from_train?.instructions ||
        data.parking?.info
    )
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
                        <span className="font-medium text-slate-800">🤖 Generando rutas de transporte...</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{progress}%</span>
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

    if (!hasContent(data) && !isGenerating) {
        return (
            <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="rounded-2xl border border-dashed border-[#316263]/30 bg-[#316263]/5 px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#316263]/10">
                        <MapPin className="h-5 w-5 text-[#316263]" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                        Escribe la dirección para generar las instrucciones
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        En cuanto introduzcas la dirección, generaremos automáticamente
                        el mapa y las instrucciones de llegada desde el aeropuerto, tren y en coche.
                    </p>
                </div>
            </div>
        )
    }

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

    const otherAirports = data.from_airport?.other_airports || []

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

                {/* ── Desde el Aeropuerto ── */}
                <TransportSection
                    icon={<Plane className="w-4 h-4" />}
                    title={data.from_airport?.main_airport_name
                        ? `Desde el Aeropuerto · ${data.from_airport.main_airport_name}`
                        : 'Desde el Aeropuerto'}
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
                    footer={
                        otherAirports.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">
                                    ✈️ Otros aeropuertos cercanos
                                </p>
                                <div className="flex flex-col gap-2">
                                    {otherAirports.map((ap, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 bg-slate-100/70 rounded-lg px-3 py-2"
                                        >
                                            <div className="flex-shrink-0 mt-0.5">
                                                <span className="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 min-w-[36px] text-center">
                                                    {ap.code || '?'}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold text-slate-700 leading-tight truncate">
                                                    {ap.name}
                                                    <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                                                        · {ap.distance_km} km
                                                    </span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                                    {ap.options}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null
                    }
                />

                {/* ── Transporte Público de Larga Distancia ── */}
                {(() => {
                    const ft = data.from_train
                    // Compose content: new 3-field format or legacy instructions fallback
                    const trainContent = ft?.train_ld || ft?.instructions || ''
                    const editContent = [ft?.train_ld, ft?.bus_interurban, ft?.last_mile]
                        .filter(Boolean).join('\n\n') || ft?.instructions || ''
                    return (
                        <TransportSection
                            icon={<Train className="w-4 h-4" />}
                            title="Transporte Público de Larga Distancia"
                            content={trainContent}
                            isEditing={editingSection === 'from_train'}
                            onEdit={() => handleEditStart('from_train', editContent)}
                            onSave={() => handleSave('from_train')}
                            onCancel={() => setEditingSection(null)}
                            onRegenerate={() => handleRegenerate('train')}
                            isRegenerating={regeneratingSection === 'train'}
                            tempValue={tempValue}
                            setTempValue={setTempValue}
                            metadata={`${ft?.duration || '-'} • ${ft?.price_range || '-'}`}
                            footer={
                                (ft?.bus_interurban || ft?.last_mile) ? (
                                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                                        {ft?.bus_interurban && (
                                            <div className="text-[13px] text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ft.bus_interurban}</ReactMarkdown>
                                            </div>
                                        )}
                                        {ft?.last_mile && (
                                            <div className="text-[13px] text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{ft.last_mile}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                ) : null
                            }
                        />
                    )
                })()}

                {/* ── Aparcamiento / Coche ── */}
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
                    footer={
                        data.parking?.nearby_options?.length ? (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-2">
                                    🅿️ Parkings cercanos
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.parking.nearby_options.map((p, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                                        >
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : null
                    }
                />

                {/* ── Transporte Cercano ── */}
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
                                    const newList = [...(data.nearby_transport || []), { type: 'Bus', name: '', distance: '' }]
                                    onEdit('nearby_transport', newList)
                                }}
                            >
                                <Plus className="w-3 h-3" /> Añadir
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {data.nearby_transport.map((item, idx) => (
                                <div key={idx} className="flex flex-col bg-white p-3 rounded-lg border border-slate-100 shadow-sm gap-2 group relative">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={item.type}
                                            onChange={(e) => {
                                                const newList = [...(data.nearby_transport || [])]
                                                newList[idx] = { ...newList[idx], type: e.target.value }
                                                onEdit('nearby_transport', newList)
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
                                                const newList = [...(data.nearby_transport || [])]
                                                newList[idx] = { ...newList[idx], name: e.target.value }
                                                onEdit('nearby_transport', newList)
                                            }}
                                            className="text-[11px] font-medium text-slate-700 flex-1 border-none outline-none focus:ring-1 focus:ring-primary/20 rounded px-1"
                                        />
                                        <input
                                            value={item.distance}
                                            placeholder="Distancia (ej: 5 min)"
                                            onChange={(e) => {
                                                const newList = [...(data.nearby_transport || [])]
                                                newList[idx] = { ...newList[idx], distance: e.target.value }
                                                onEdit('nearby_transport', newList)
                                            }}
                                            className="text-[10px] text-slate-400 w-20 text-right border-none outline-none focus:ring-1 focus:ring-primary/20 rounded px-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-slate-300 hover:text-red-500"
                                            onClick={() => {
                                                const newList = (data.nearby_transport || []).filter((_, i) => i !== idx)
                                                onEdit('nearby_transport', newList)
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
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Revisa los textos generados.</strong> La IA puede cometer errores.
                    Puedes editar cualquier sección pulsando el icono del lápiz ✏️
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
    footer?: React.ReactNode
}

function TransportSection({
    icon, title, content, isEditing, onEdit, onSave, onCancel,
    onRegenerate, isRegenerating, tempValue, setTempValue, metadata, footer
}: SectionProps) {
    if (!content && !isEditing && !isRegenerating && !onRegenerate) return null

    return (
        <Card className="border-none shadow-sm bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl overflow-hidden group">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold min-w-0">
                        {isRegenerating ? <Sparkles className="w-4 h-4 animate-pulse flex-shrink-0" /> : <span className="flex-shrink-0">{icon}</span>}
                        <span className="text-xs uppercase tracking-tight truncate">{title}</span>
                        {isRegenerating && <span className="text-[9px] font-normal lowercase animate-pulse ml-1 flex-shrink-0">Regenerando...</span>}
                    </div>
                    {!isEditing && !isRegenerating && (
                        <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                        <div className="flex gap-1 flex-shrink-0">
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
                        {footer}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}