'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { MapPin, Loader2, Check, Info, Sparkles, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import TransportInfo from '../../TransportInfo'
import { useWizard } from '../WizardContext'

const MapPreview = dynamic(() => import('../../MapPreview'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-48 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                <span className="text-[10px] text-slate-400 font-medium">Cargando mapa interactivo...</span>
            </div>
        </div>
    )
})

export default function StepAccess({ value }: { value?: string }) {
    const {
        data,
        setData,
        geocoding,
        geocodingResult,
        setGeocodingResult,
        validationResult,
        showRegenerateAlert,
        setShowRegenerateAlert,
        aiLoading,
        aiProgress,
        handleAIFill,
        handleGeocode,
        setManualEditDetected
    } = useWizard()

    return (
        <TabsContent value="access" className="mt-0 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">Dirección Completa</Label>
                        <div className="relative">
                            <Input
                                placeholder="Ej: Calle Mayor 123, Madrid"
                                className="h-12 flex-1 pr-10 shadow-sm border-slate-200 focus:border-primary focus:ring-primary/10 transition-all rounded-xl"
                                value={data.access?.full_address || ''}
                                onChange={e => {
                                    const newAddr = e.target.value
                                    setData((prev: any) => ({
                                        ...prev,
                                        access: { ...prev.access, full_address: newAddr }
                                    }))
                                    // Si cambia la dirección, ocultamos la alerta de regenerar 
                                    // para evitar que pulse "Regenerar" con coordenadas viejas
                                    if (showRegenerateAlert) setShowRegenerateAlert(false)
                                    if (geocodingResult) setGeocodingResult(null)
                                }}
                                onBlur={async () => {
                                    const result = await handleGeocode()
                                    if (result) {
                                        handleAIFill('transport', 'todos', {
                                            address: data.access.full_address,
                                            coordinates: result
                                        })
                                    }
                                }}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {geocoding ? (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                ) : geocodingResult ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <MapPin className="w-4 h-4 text-slate-300" />
                                )}
                            </div>
                        </div>
                        <div className="mt-1 flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1 duration-500">
                            <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                            <p className="text-[10px] text-blue-700 leading-tight">
                                <strong>Tip de IA:</strong> Introduce solo Calle, Número y Ciudad. Evita portal, piso o letra para que la IA proporcione transporte y parking más precisos.
                            </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic pl-1">
                            Incluye ciudad y país para mayor precisión (ej: Calle Mayor 1, Madrid, España)
                        </p>
                    </div>

                    {/* Mapa */}
                    {geocodingResult && (
                        <div className="mt-2 group relative">
                            <MapPreview
                                lat={geocodingResult.lat}
                                lng={geocodingResult.lng}
                                onPositionChange={(lat, lng) => {
                                    setGeocodingResult(prev => prev ? { ...prev, lat, lng } : null)
                                }}
                            />
                        </div>
                    )}

                    {/* Validación y Feedback */}
                    {validationResult && (
                        <div className={cn(
                            "p-4 rounded-xl border flex items-start gap-3 transition-colors",
                            validationResult.isValid ? "bg-green-50/50 border-green-100" : "bg-orange-50/50 border-orange-100"
                        )}>
                            <div className={cn(
                                "p-1.5 rounded-full",
                                validationResult.isValid ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                            )}>
                                {validationResult.isValid ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                                <h4 className={cn("text-xs font-bold", validationResult.isValid ? "text-green-900" : "text-orange-900")}>
                                    {validationResult.isValid ? 'Ubicación Verificada' : 'Ubicación Aproximada'}
                                </h4>
                                <p className={cn("text-[11px] mt-0.5", validationResult.isValid ? "text-green-700" : "text-orange-700")}>
                                    {validationResult.warnings[0] || (validationResult.isValid ? 'La dirección parece correcta.' : 'Revisa los detalles de la ubicación.')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Alerta de Regeneración */}
                    {showRegenerateAlert && (
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary-dark">¿Quieres actualizar las rutas?</p>
                                    <p className="text-[11px] text-primary/70 mt-0.5">Has movido el marcador. Podemos regenerar la información de transporte para que coincida exactamente con la nueva ubicación.</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="h-8 text-[10px] flex-1 font-bold"
                                    onClick={() => {
                                        setData((prev: any) => ({
                                            ...prev,
                                            access: {
                                                ...prev.access,
                                                from_airport: null,
                                                from_train: null,
                                                parking: null,
                                                nearby_transport: []
                                            }
                                        }))
                                        handleAIFill('transport')
                                        setShowRegenerateAlert(false)
                                    }}
                                >
                                    Sí, regenerar con IA
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-[10px] flex-1"
                                    onClick={() => setShowRegenerateAlert(false)}
                                >
                                    Mantener actuales
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Transporte */}
                    <TransportInfo
                        data={data.access}
                        isGenerating={!!aiLoading && ['transport', 'plane', 'train', 'road'].includes(aiLoading)}
                        progress={aiProgress}
                        onRegenerate={(subSection) => handleAIFill(subSection)}
                        onEdit={(section, newContent) => {
                            setManualEditDetected(true)
                            setData((prev: any) => ({
                                ...prev,
                                access: {
                                    ...prev.access,
                                    [section]: section === 'nearby_transport'
                                        ? newContent
                                        : (typeof prev.access[section] === 'object' && prev.access[section] !== null
                                            ? { ...prev.access[section], instructions: newContent, info: newContent }
                                            : newContent)
                                }
                            }))
                        }}
                    />
                </CardContent>
            </Card>
        </TabsContent>
    )
}
