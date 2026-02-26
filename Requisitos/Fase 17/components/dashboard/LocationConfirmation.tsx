'use client';

import React from 'react';
import MapPreview from './MapPreview';
import { GeocodingResult } from '@/lib/geocoding';
import { ValidationResult } from '@/lib/geocoding-validation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LocationConfirmationProps {
    location: GeocodingResult;
    validation: ValidationResult;
    onPositionChange: (lat: number, lng: number) => void;
}

export function LocationConfirmation({
    location,
    validation,
    onPositionChange
}: LocationConfirmationProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Map Area */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate/40 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Mapa de Ubicación
                    </span>
                    <Badge variant="outline" className={cn(
                        "text-[9px] font-bold px-2 py-0",
                        location.accuracy === 'rooftop' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                        {location.accuracy === 'rooftop' ? 'PRECISIÓN: ALTA' : 'PRECISIÓN: MEDIA'}
                    </Badge>
                </div>
                <MapPreview
                    lat={location.lat}
                    lng={location.lng}
                    draggable={true}
                    onPositionChange={onPositionChange}
                />
            </div>

            {/* Validation Feedback */}
            {validation.warnings.length > 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        Avisos de Validación
                    </div>
                    <ul className="space-y-1">
                        {validation.warnings.map((w, i) => (
                            <li key={i} className="text-[11px] text-amber-700/80 leading-tight">• {w}</li>
                        ))}
                    </ul>
                    {validation.suggestions && (
                        <div className="pt-2 border-t border-amber-200/50">
                            <span className="text-[10px] font-black uppercase tracking-tight text-amber-900/60 block mb-1">💡 Sugerencias</span>
                            <ul className="space-y-1">
                                {validation.suggestions.map((s, i) => (
                                    <li key={i} className="text-[11px] text-amber-800 font-medium">{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-900">Ubicación Verificada</span>
                        <span className="text-[10px] text-emerald-800/60">La dirección es coherente con las coordenadas detectadas.</span>
                    </div>
                </div>
            )}

            {/* Rich Data Display */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">Ciudad</span>
                    <span className="text-xs font-bold text-navy truncate block">{location.city || 'Desconocida'}</span>
                </div>
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">CP / Vecindario</span>
                    <span className="text-xs font-bold text-navy truncate block">
                        {location.postalCode} {location.neighborhood ? `(${location.neighborhood})` : ''}
                    </span>
                </div>
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">Zona Horaria</span>
                    <span className="text-xs font-bold text-navy block">{location.timezone}</span>
                </div>
                <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate/40 uppercase tracking-widest block">País</span>
                    <span className="text-xs font-bold text-navy block">{location.country}</span>
                </div>
            </div>
        </div>
    );
}
