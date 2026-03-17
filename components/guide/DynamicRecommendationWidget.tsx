'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface DynamicRecommendationWidgetProps {
    recommendations: any[];
    currentLanguage: string;
    onNavigate: (type: string, payload: { recId: string }) => void;
    accessToken?: string;
    propertyId?: string;
    theme: {
        cardBg: string;
        chipIconColor: string;
    };
}

// ─── Tipos contextuales por franja horaria ────────────────────────────────────
// Define qué categorías son relevantes en cada momento del día.
// El orden importa: primero = mayor prioridad de score.

const CONTEXT_PRIORITY: Record<string, string[]> = {
    madrugada: [
        // A las 3-6am casi nada está abierto.
        // Si hay algo 24h (farmacia, gasolinera, comida rápida 24h) va primero.
        // Actividades de amanecer en segundo lugar.
        'farmacia', 'pharmacy', 'gasolinera', '24h',
        'naturaleza', 'amanecer', 'sunrise', 'experience', 'experiencias',
    ],
    mañana: [
        // 6-12h: desayuno, café, mercado, actividades matutinas
        'desayuno', 'cafe', 'café', 'cafeteria', 'cafetería', 'panaderia', 'panadería',
        'mercado', 'market', 'naturaleza', 'culture', 'cultura', 'museum', 'museo',
        'actividad', 'actividades', 'activity',
    ],
    mediodia: [
        // 12-15h: comer es la prioridad máxima
        'restaurante', 'restaurantes', 'restaurant', 'mediterraneo', 'italiano',
        'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'tapas',
        'mercado', 'market',
    ],
    tarde: [
        // 15-20h: cultura, tiendas, ocio
        'cultura', 'culture', 'museum', 'museo', 'compras', 'shopping', 'tiendas',
        'supermercado', 'supermercados', 'supermarket', 'mercado', 'market',
        'naturaleza', 'relax', 'spa', 'actividad', 'experience',
    ],
    noche: [
        // 20h+: cenar, bares, ocio nocturno
        'restaurante', 'restaurantes', 'restaurant', 'bar', 'tapas', 'alta_cocina',
        'mediterraneo', 'italiano', 'internacional',
        'ocio', 'ocio_nocturno', 'nightclub', 'bar_copas', 'discoteca', 'pub',
    ],
};

// ─── Helpers de horario ───────────────────────────────────────────────────────

function getTimeSlot(hour: number): string {
    if (hour >= 0 && hour < 6) return 'madrugada';
    if (hour >= 6 && hour < 12) return 'mañana';
    if (hour >= 12 && hour < 15) return 'mediodia';
    if (hour >= 15 && hour < 20) return 'tarde';
    return 'noche';
}

function getDaySlug(): string {
    return ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][new Date().getDay()];
}

function getDayGreeting(hour: number) {
    if (hour >= 6 && hour < 12) return { label: 'BUENOS DÍAS', emoji: '☀️' };
    if (hour >= 12 && hour < 15) return { label: 'BUENAS TARDES', emoji: '🌤️' };
    if (hour >= 15 && hour < 20) return { label: 'BUENAS TARDES', emoji: '🌅' };
    if (hour >= 20) return { label: 'BUENAS NOCHES', emoji: '🌙' };
    return { label: 'BIENVENIDO', emoji: '✨' };
}

/**
 * Comprueba si una recomendación está abierta ahora mismo.
 * Usa opening_hours del metadata si existe; si no, asume abierto.
 *
 * Formato esperado en metadata.opening_hours:
 *   { open: "08:00", close: "22:00" }
 *   { open: "08:00", close: "02:00" }  ← cierra pasada medianoche
 *   { always_open: true }              ← 24h
 */
function isOpenNow(rec: any, hour: number, minute: number): boolean | null {
    const hours = rec.metadata?.opening_hours || rec.opening_hours;
    if (!hours) return null; // desconocido → no penalizar

    if (hours.always_open) return true;

    const openStr = hours.open as string | undefined;
    const closeStr = hours.close as string | undefined;
    if (!openStr || !closeStr) return null;

    const [oh, om] = openStr.split(':').map(Number);
    const [ch, cm] = closeStr.split(':').map(Number);

    const nowMins = hour * 60 + minute;
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;

    // Si cierra después de medianoche (ej. 02:00 = 120 min)
    if (closeMins < openMins) {
        return nowMins >= openMins || nowMins < closeMins;
    }
    return nowMins >= openMins && nowMins < closeMins;
}

/**
 * Score multicapa para una recomendación dado el contexto actual.
 *
 * Capas (de mayor a menor peso):
 *   1. Disponibilidad horaria real  (+500 abierto, -1000 cerrado)
 *   2. Relevancia contextual        (+100 × posición inversa en CONTEXT_PRIORITY)
 *   3. best_time_slots del metadata (+50 si coincide)
 *   4. Disponibilidad por día       (+20 si coincide)
 */
function scoreRecommendation(rec: any, slot: string, today: string, hour: number, minute: number): number {
    let score = 0;
    const type = (rec.type || rec.category || '').toLowerCase();

    // Capa 1: horario real
    const open = isOpenNow(rec, hour, minute);
    if (open === true) score += 500;
    if (open === false) score -= 1000; // penalización fuerte pero no eliminación

    // Capa 2: relevancia contextual por tipo
    const priority = CONTEXT_PRIORITY[slot] || [];
    const idx = priority.findIndex(p => type.includes(p) || p.includes(type));
    if (idx !== -1) {
        score += 100 * (priority.length - idx); // primero en lista = más puntos
    }

    // Capa 3: best_time_slots del metadata
    const slots = rec.metadata?.best_time_slots || rec.best_time_slots || [];
    if (Array.isArray(slots) && slots.includes(slot)) score += 50;

    // Capa 4: disponibilidad por día
    const availability = rec.metadata?.availability || rec.availability || { days: ['todos'] };
    const days = availability.days || ['todos'];
    if (days.includes('todos') || days.includes('variable') || days.includes(today)) {
        score += 20;
    }

    return score;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

const EAT_SET = new Set([
    'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico',
    'alta_cocina', 'internacional', 'desayuno', 'restaurante', 'cafe', 'bar',
    'food', 'comida', 'gastronomia', 'gastronomía', 'tapas',
]);
const DO_SET = new Set([
    'naturaleza', 'cultura', 'relax', 'activity', 'actividad', 'actividades',
    'park', 'parque', 'museum', 'museo', 'landmark', 'experiencias', 'experience',
    'qué hacer', 'que hacer', 'spa', 'ocio', 'ocio_nocturno', 'nightclub',
    'night_club', 'bar_copas', 'discoteca', 'pub',
]);
const SHOP_SET = new Set([
    'compras', 'supermercados', 'shopping', 'market', 'mercado',
    'tiendas', 'tienda', 'supermarket', 'farmacia', 'pharmacy',
]);

// ─── Componente ───────────────────────────────────────────────────────────────

export function DynamicRecommendationWidget({
    recommendations,
    currentLanguage,
    onNavigate,
    accessToken,
    propertyId,
    theme
}: DynamicRecommendationWidgetProps) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const slot = getTimeSlot(hour);
    const today = getDaySlug();
    const { label, emoji } = getDayGreeting(hour);

    const timeStr = now.toLocaleTimeString(
        currentLanguage === 'es' ? 'es-ES' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
    );

    // UI labels
    const { content: labelRecomendacion } = useLocalizedContent('RECOMENDACIÓN', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerMas } = useLocalizedContent('VER RECOMENDACIONES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedGreeting } = useLocalizedContent(label, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelMasTarde } = useLocalizedContent('Disponible más tarde', currentLanguage, 'ui_label', accessToken, propertyId);

    // Selección de recomendación con scoring multicapa
    const { activeRec, isClosed } = useMemo(() => {
        if (!recommendations?.length) return { activeRec: null, isClosed: false };

        // Puntuar todas las recomendaciones
        const scored = recommendations.map(rec => ({
            rec,
            score: scoreRecommendation(rec, slot, today, hour, minute),
        }));

        // Ordenar por score descendente
        scored.sort((a, b) => b.score - a.score);

        // Desempate determinista para el mismo score (rota por día)
        const topScore = scored[0].score;
        const topGroup = scored.filter(s => s.score === topScore);
        const dayOfYear = Math.floor(Date.now() / 86400000);
        const chosen = topGroup[dayOfYear % topGroup.length];

        // Indicar si la mejor opción disponible está cerrada (para mostrar aviso)
        const open = isOpenNow(chosen.rec, hour, minute);
        return {
            activeRec: chosen.rec,
            isClosed: open === false,
        };
    }, [recommendations, slot, today, hour, minute]);

    // Localización del contenido de la recomendación seleccionada
    const { content: localizedName } = useLocalizedContent(
        activeRec?.name || '',
        currentLanguage, 'recommendations', accessToken, propertyId
    );
    const { content: localizedDesc } = useLocalizedContent(
        activeRec?.metadata?.personal_note || activeRec?.description || '',
        currentLanguage, 'recommendations', accessToken, propertyId
    );

    if (!activeRec) return null;

    const priceRange = activeRec.metadata?.price_range || activeRec.price_range;
    const tags = activeRec.metadata?.tags || activeRec.tags || [];
    const rawDistance = activeRec.distance || activeRec.metadata?.distance;
    const distanceText = rawDistance && !rawDistance.toLowerCase().includes('distance') ? rawDistance : null;
    const openingHours = activeRec.metadata?.opening_hours || activeRec.opening_hours;
    
    // Solo mostrar notas si no tenemos horario estructurado y no es la nota por defecto
    const rawNotes = activeRec.metadata?.availability?.notes || activeRec.availability?.notes;
    const availabilityNotes = (!openingHours && rawNotes && !rawNotes.toLowerCase().includes('horario')) ? rawNotes : null;
    const openingHoursStr = openingHours?.open && openingHours?.close ? `${openingHours.open} – ${openingHours.close}` : null;

    const handleNavigate = () => {
        const type = (activeRec.type || activeRec.category || '').toLowerCase();
        const payload = { recId: activeRec.id };
        if (SHOP_SET.has(type)) onNavigate('shop', payload);
        else if (DO_SET.has(type)) onNavigate('do', payload);
        else onNavigate('eat', payload);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <Card className={cn('overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.08)]', theme.cardBg)}>
                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn('flex items-center gap-2', theme.chipIconColor)}>
                            <Clock size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black tracking-widest uppercase">
                                {timeStr} • {localizedGreeting} {emoji}
                            </span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#f59e0b] text-amber-900 text-[9px] font-black rounded-full uppercase tracking-wider">
                            {labelRecomendacion}
                        </span>
                    </div>

                    {/* Aviso de cerrado — solo si tenemos datos de horario y está cerrado */}
                    {isClosed && openingHours && !openingHours.always_open && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                            <Clock size={12} className="text-amber-500 shrink-0" />
                            <span className="text-[11px] font-bold text-amber-700">
                                {labelMasTarde}
                                {openingHours.open ? ` · Abre a las ${openingHours.open}` : ''}
                            </span>
                        </div>
                    )}

                    {/* Contenido */}
                    <div className="space-y-2 mb-4">
                        <h3 className={cn(
                            'text-xl font-serif font-bold text-gray-900 leading-tight',
                            !localizedName && 'h-7 w-40 bg-gray-100 animate-pulse rounded-md'
                        )}>
                            {localizedName}
                        </h3>
                        <div className={cn(
                            'text-[13px] text-gray-500 leading-relaxed line-clamp-2',
                            !localizedDesc && 'h-10 w-full bg-gray-50 animate-pulse rounded-sm'
                        )}>
                            {localizedDesc}
                        </div>
                        {availabilityNotes && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50/50 px-2 py-1 rounded-lg w-fit">
                                <Clock size={12} />
                                {availabilityNotes}
                            </div>
                        )}
                    </div>

                    {/* Metadatos */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {priceRange && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                {priceRange}
                            </span>
                        )}
                        {distanceText && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} className="opacity-50" />
                                {distanceText}
                            </span>
                        )}
                        {openingHoursStr && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                                {openingHoursStr}
                            </span>
                        )}
                        {tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleNavigate}
                        className="text-xs font-black text-primary flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest"
                    >
                        {labelVerMas} <ChevronRight size={14} strokeWidth={3} />
                    </button>
                </div>
            </Card>
        </motion.div>
    );
}