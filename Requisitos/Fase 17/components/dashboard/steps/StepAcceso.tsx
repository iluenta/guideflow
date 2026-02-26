'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, CheckCircle, Sparkles, Loader2, AlertTriangle, Plane, Train, Car, Bus, Navigation, Info } from 'lucide-react'
import MapPreview from '../MapPreview'
import TransportInfo from '../TransportInfo'
import { GeocodingResult } from '@/lib/geocoding'
import { ValidationResult } from '@/lib/geocoding-validation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepAccesoProps {
    data: any
    onChange: (data: any) => void
    geocoding: boolean
    geocodingResult: GeocodingResult | null
    validationResult: ValidationResult | null
    onGeocode: () => void
    onPositionChange: (lat: number, lng: number) => void
    onAIFill: (section: string) => void
    aiLoading: string | null
    aiProgress: number
}

export function StepAcceso({
    data,
    onChange,
    geocoding,
    geocodingResult,
    validationResult,
    onGeocode,
    onPositionChange,
    onAIFill,
    aiLoading,
    aiProgress
}: StepAccesoProps) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-3xl font-serif text-text-primary">Localización y Acceso</CardTitle>
                <CardDescription className="text-base text-slate-500">
                    Ubica tu propiedad en el mapa para que la IA genere automáticamente el transporte y parking.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-10 mt-8">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Navigation className="w-4 h-4" />
                            <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest">
                                Dirección Completa <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <div className="relative group">
                            <Input
                                id="address"
                                placeholder="Calle, Número, Ciudad, CP, País"
                                value={data.full_address || ''}
                                onChange={(e) => onChange({ full_address: e.target.value })}
                                className={cn(
                                    "h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium text-slate-900 shadow-sm pr-12",
                                    validationResult?.isValid && "border-emerald-200 bg-emerald-50/20"
                                )}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                {geocoding ? (
                                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                ) : validationResult?.isValid ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <MapPin className="h-5 w-5 text-slate-300" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/[0.03] border border-primary/10 rounded-[1.5rem] p-6 flex gap-4 text-sm text-slate-600 relative overflow-hidden group">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900">IA Geográfica</p>
                            <p className="leading-relaxed text-xs text-slate-500">
                                <span className="font-semibold text-primary">Tip:</span> Para mejores resultados, omite el piso o puerta. La IA necesita la ubicación exterior exacta para trazar rutas.
                            </p>
                        </div>
                    </div>

                    {geocodingResult && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Vista Previa del Mapa</h3>
                                </div>
                                <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-xl aspect-video relative group">
                                    <MapPreview
                                        lat={geocodingResult.lat}
                                        lng={geocodingResult.lng}
                                        onPositionChange={onPositionChange}
                                    />
                                    {validationResult?.isValid && (
                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                                                    <CheckCircle className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Ubicación Verificada</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">Marcador situado con precisión quirúrgica.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                                            <Navigation className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-black uppercase tracking-wider text-slate-900">Logística de Llegada (IA)</span>
                                    </div>
                                    {!data.from_airport && !aiLoading && (
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="h-9 gap-2 font-bold bg-white border-slate-200 text-primary hover:bg-primary/5 transition-all shadow-sm rounded-xl"
                                            onClick={() => onAIFill('transport')}
                                        >
                                            <Sparkles className="h-4 w-4" /> Generar con IA
                                        </Button>
                                    )}
                                </div>
                                <div className="p-8">
                                    {aiLoading === 'transport' ? (
                                        <div className="py-16 flex flex-col items-center justify-center space-y-6">
                                            <div className="relative">
                                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                                                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 animate-pulse" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-base font-bold text-slate-900">Consultando bases de datos locales...</p>
                                                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">Localizando aeropuertos, estaciones de tren y parkings públicos cercanos.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <TransportInfo 
                                            data={data} 
                                            onEdit={(section, newData) => onChange({ [section]: newData })}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white rounded-2xl p-5 flex gap-4 items-start shadow-xl shadow-slate-200">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="space-y-1 pr-2">
                                    <p className="text-sm font-bold">Verificación Necesaria</p>
                                    <p className="text-[11px] text-slate-400 leading-normal">
                                        La IA puede cometer errores en horarios o tarifas. Por favor, <span className="text-white font-bold underline underline-offset-2">revisa bien los textos</span> generados antes de finalizar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
