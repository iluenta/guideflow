'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, MapPin } from 'lucide-react';
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
        actionBtn?: string;
        guideCardTitle?: string;
        guideCardSubtitle?: string;
        guideCardTag?: string;
        sectionLabel?: string;
        searchBorder?: string;
        chipLayout?: string;
        accentText?: string;
    };
}

// ─── Categorías que NUNCA aparecen en el slot destacado ──────────────────────
const EXPERIENCE_BLACKLIST = new Set([
    'supermercados', 'supermercado', 'supermarket',
    'farmacia', 'pharmacy',
    'gasolinera', 'gas_station',
    'banco', 'bank', 'cajero', 'atm',
    'ferreteria', 'hardware_store',
    'lavanderia', 'laundry',
    'correos', 'post_office',
]);

// ─── Ventanas horarias estrictas para subcategorías de momento único ──────────
// Si una recomendación es de tipo 'amanecer' fuera de su ventana,
// recibe penalización fuerte aunque esté "abierta".
const STRICT_WINDOWS: Record<string, { from: number; to: number }> = {
    amanecer: { from: 5, to: 9 },  // 05:00–09:00
    sunrise: { from: 5, to: 9 },
    atardecer: { from: 18, to: 22 },  // 18:00–22:00
    sunset: { from: 18, to: 22 },
    puesta_de_sol: { from: 18, to: 22 },
};

// ─── Prioridades contextuales por franja ─────────────────────────────────────
// Orden = prioridad (primero = más puntos).
// Subcategorías específicas (amanecer, atardecer) van primero en su franja.
const CONTEXT_PRIORITY: Record<string, string[]> = {
    madrugada: [
        'amanecer', 'sunrise',                              // prepararse para salir al amanecer
        'naturaleza', 'experiencias', 'experience',
        'bar', 'pub', 'ocio_nocturno', 'nightclub',
    ],
    mañana: [
        // Subcategorías de momento único primero
        'amanecer', 'sunrise',                              // 6–8h aún tiene sentido
        // Desayuno y café
        'desayuno', 'cafe', 'café', 'cafeteria', 'cafetería', 'panaderia', 'panadería',
        // Actividad física / naturaleza matutina
        'parque', 'park', 'ruta', 'trail', 'naturaleza',
        // Cultura que abre pronto
        'mercado', 'market',
        'cultura', 'culture', 'museo', 'museum', 'landmark',
        'actividad', 'actividades', 'activity', 'experience', 'experiencias',
        'relax', 'spa',
    ],
    mediodia: [
        'tapas', 'restaurante', 'restaurantes', 'restaurant',
        'mediterraneo', 'italiano', 'hamburguesas', 'asiatico',
        'alta_cocina', 'internacional',
        'mercado', 'market',
        'parque', 'park',                                   // picnic / paseo post-comida
    ],
    tarde: [
        'atardecer', 'sunset', 'puesta_de_sol',             // subcategoría exacta primero
        'mirador', 'viewpoint',
        'cultura', 'culture', 'museo', 'museum', 'landmark',
        'parque', 'park', 'naturaleza', 'ruta', 'trail',
        'ocio', 'experience', 'experiencias', 'actividad',
        'compras', 'tiendas', 'shopping',
        'relax', 'spa',
        'bar', 'tapas',                                     // vermut de tarde
    ],
    noche: [
        'restaurante', 'restaurantes', 'restaurant',
        'tapas', 'bar', 'alta_cocina', 'mediterraneo', 'italiano', 'internacional',
        'ocio', 'ocio_nocturno', 'nightclub', 'bar_copas', 'discoteca', 'pub',
        'music', 'musica', 'música',
        'atardecer', 'sunset',                              // vistas nocturnas desde un mirador
    ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function isOpenNow(rec: any, hour: number, minute: number): boolean | null {
    const hours = rec.metadata?.opening_hours || rec.opening_hours;
    if (!hours) return null;
    if (hours.always_open) return true;

    const openStr = hours.open as string | undefined;
    const closeStr = hours.close as string | undefined;
    if (!openStr || !closeStr) return null;

    const [oh, om] = openStr.split(':').map(Number);
    const [ch, cm] = closeStr.split(':').map(Number);
    const nowMins = hour * 60 + minute;
    const openMins = oh * 60 + om;
    const closeMins = ch * 60 + cm;

    if (closeMins < openMins) return nowMins >= openMins || nowMins < closeMins;
    return nowMins >= openMins && nowMins < closeMins;
}

/**
 * Score multicapa — experiencias primero, servicios excluidos.
 *
 * Capa 0  Blacklist              → -Infinity
 * Capa 0b Ventana estricta       → -300 si fuera de ventana (amanecer a las 22h)
 * Capa 1  best_time_slots        → +200 coincide / -50 no coincide con slots definidos
 * Capa 2  Horario real           → +500 abierto / -800 cerrado
 * Capa 3  Relevancia contextual  → +100 × posición inversa en CONTEXT_PRIORITY
 * Capa 4  Disponibilidad día     → +20
 */
function scoreRecommendation(
    rec: any,
    slot: string,
    today: string,
    hour: number,
    minute: number
): number {
    const type = (rec.type || rec.category || '').toLowerCase();

    // Capa 0: blacklist
    if (EXPERIENCE_BLACKLIST.has(type)) return -Infinity;

    let score = 0;

    // Capa 0b: ventana estricta para subcategorías de momento único
    const window = STRICT_WINDOWS[type];
    if (window) {
        if (hour >= window.from && hour < window.to) {
            score += 150; // bonus por estar en su ventana ideal
        } else {
            score -= 300; // penalización fuerte pero no eliminación total
        }
    }

    // Capa 1: best_time_slots del anfitrión
    const bestSlots: string[] = rec.metadata?.best_time_slots || rec.best_time_slots || [];
    if (bestSlots.length > 0) {
        if (bestSlots.includes(slot)) score += 200;
        else score -= 50;
    }

    // Capa 2: horario real
    const open = isOpenNow(rec, hour, minute);
    if (open === true) score += 500;
    if (open === false) score -= 800;

    // Capa 3: relevancia contextual
    const priority = CONTEXT_PRIORITY[slot] || [];
    const idx = priority.findIndex(p => type.includes(p) || p.includes(type));
    if (idx !== -1) {
        score += 100 * (priority.length - idx);
    }

    // Capa 4: disponibilidad por día
    const days: string[] = (rec.metadata?.availability?.days || rec.availability?.days || ['todos']);
    if (days.includes('todos') || days.includes('variable') || days.includes(today)) {
        score += 20;
    }

    return score;
}

// ─── Routing ──────────────────────────────────────────────────────────────────
const EAT_SET = new Set(['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'restaurante', 'cafe', 'bar', 'tapas', 'food', 'comida', 'gastronomia', 'gastronomía']);
const DO_SET = new Set(['naturaleza', 'cultura', 'relax', 'activity', 'actividad', 'actividades', 'park', 'parque', 'museum', 'museo', 'landmark', 'experiencias', 'experience', 'spa', 'ocio', 'ocio_nocturno', 'nightclub', 'night_club', 'bar_copas', 'discoteca', 'pub', 'amanecer', 'sunrise', 'atardecer', 'sunset', 'puesta_de_sol', 'mirador', 'ruta', 'trail']);
const SHOP_SET = new Set(['compras', 'supermercados', 'shopping', 'market', 'mercado', 'tiendas', 'tienda', 'supermarket', 'farmacia', 'pharmacy']);

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

    const { content: labelRecomendacion } = useLocalizedContent('RECOMENDACIÓN', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerMas } = useLocalizedContent('VER RECOMENDACIONES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedGreeting } = useLocalizedContent(label, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelMasTarde } = useLocalizedContent('Disponible más tarde', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAbreALas } = useLocalizedContent('Abre a las', currentLanguage, 'ui_label', accessToken, propertyId);

    const { activeRec, isClosed } = useMemo(() => {
        if (!recommendations?.length) return { activeRec: null, isClosed: false };

        const scored = recommendations
            .map(rec => ({ rec, score: scoreRecommendation(rec, slot, today, hour, minute) }))
            .filter(s => s.score > -Infinity)
            .sort((a, b) => b.score - a.score);

        if (!scored.length) return { activeRec: null, isClosed: false };

        const topScore = scored[0].score;
        const topGroup = scored.filter(s => s.score === topScore);
        const dayOfYear = Math.floor(Date.now() / 86400000);
        const chosen = topGroup[dayOfYear % topGroup.length];

        return {
            activeRec: chosen.rec,
            isClosed: isOpenNow(chosen.rec, hour, minute) === false,
        };
    }, [recommendations, slot, today, hour, minute]);

    const { content: localizedName } = useLocalizedContent(activeRec?.name || '', currentLanguage, 'recommendations', accessToken, propertyId);
    const { content: localizedDesc } = useLocalizedContent(activeRec?.metadata?.personal_note || activeRec?.description || '', currentLanguage, 'recommendations', accessToken, propertyId);

    if (!activeRec) return null;

    const priceRange = activeRec.metadata?.price_range || activeRec.price_range;
    const tags = activeRec.metadata?.tags || activeRec.tags || [];
    const rawDistance = activeRec.distance || activeRec.metadata?.distance;
    const distanceText = rawDistance && !rawDistance.toLowerCase().includes('distance') ? rawDistance : null;
    const openingHours = activeRec.metadata?.opening_hours || activeRec.opening_hours;
    const rawNotes = activeRec.metadata?.availability?.notes || activeRec.availability?.notes;
    const availabilityNotes = (!openingHours && rawNotes && !rawNotes.toLowerCase().includes('horario')) ? rawNotes : null;
    const openingHoursStr = openingHours?.always_open
        ? '24 HORAS'
        : (openingHours?.open && openingHours?.close)
            ? `${openingHours.open} – ${openingHours.close}`
            : null;

    const handleNavigate = () => {
        const type = (activeRec.type || activeRec.category || '').toLowerCase();
        const payload = { recId: activeRec.id };
        if (SHOP_SET.has(type)) onNavigate('shop', payload);
        else if (DO_SET.has(type)) onNavigate('do', payload);
        else onNavigate('eat', payload);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className={cn('overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.08)]', theme.cardBg)}>
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn('flex items-center gap-2', theme.accentText || theme.chipIconColor)}>
                            <Clock size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black tracking-widest uppercase" suppressHydrationWarning>
                                {timeStr} • {localizedGreeting} {emoji}
                            </span>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider",
                            theme.chipLayout === 'stacked' ? 'bg-[#0EA5E9] text-white' : 'bg-[#f59e0b] text-amber-900'
                        )}>
                            {labelRecomendacion}
                        </span>
                    </div>

                    {isClosed && openingHours && !openingHours.always_open && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
                            <Clock size={12} className="text-amber-500 shrink-0" />
                            <span className="text-[11px] font-bold text-amber-700">
                                {labelMasTarde}{openingHours.open ? ` · ${labelAbreALas} ${openingHours.open}` : ''}
                            </span>
                        </div>
                    )}

                    <div className="space-y-2 mb-4">
                        <h3 className={cn('text-xl font-bold leading-tight', theme.guideCardTitle || 'text-gray-900 font-serif', !localizedName && 'h-7 w-40 bg-gray-100 animate-pulse rounded-md')}>
                            {localizedName}
                        </h3>
                        <div className={cn('text-[13px] leading-relaxed line-clamp-2', theme.guideCardSubtitle || 'text-gray-500', !localizedDesc && 'h-10 w-full bg-gray-50 animate-pulse rounded-sm')}>
                            {localizedDesc}
                        </div>
                        {availabilityNotes && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50/50 px-2 py-1 rounded-lg w-fit">
                                <Clock size={12} />{availabilityNotes}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                        {priceRange && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{priceRange}</span>}
                        {distanceText && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <MapPin size={10} className="opacity-50" />{distanceText}
                            </span>
                        )}
                        {openingHoursStr && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} className="opacity-50" />{openingHoursStr}
                            </span>
                        )}
                        {tags.slice(0, 2).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">#{tag}</span>
                        ))}
                    </div>

                    <button
                        onClick={handleNavigate}
                        className={cn(
                            theme.chipLayout === 'stacked'
                                ? cn('w-full py-3 rounded-full text-sm font-extrabold tracking-widest uppercase flex items-center justify-center gap-2', theme.actionBtn || 'bg-[#0EA5E9] text-white')
                                : cn('text-xs font-black flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest', theme.chipIconColor || 'text-primary')
                        )}
                    >
                        {labelVerMas} <ChevronRight size={14} strokeWidth={3} />
                    </button>
                </div>
            </Card>
        </motion.div>
    );
}