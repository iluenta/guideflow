'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Utensils, Star, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface DynamicRecommendationWidgetProps {
    recommendations: any[]; // Define a more specific type if known
    currentLanguage: string;
    onNavigate: (type: string, payload: { recId: string }) => void;
    accessToken: string;
    propertyId: string;
    theme: {
        cardBg: string;
        chipIconColor: string;
    };
}

function getCurrentTimeSlot(): string {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return "madrugada";
    if (hour >= 6 && hour < 12) return "mañana";
    if (hour >= 12 && hour < 15) return "mediodia";
    if (hour >= 15 && hour < 20) return "tarde";
    return "noche";
}

function getDayGreeting(hour: number) {
    if (hour >= 6 && hour < 12) return { label: "BUENOS DÍAS", emoji: "☀️" };
    if (hour >= 12 && hour < 15) return { label: "BUENAS TARDES", emoji: "🌤️" };
    if (hour >= 15 && hour < 20) return { label: "BUENAS TARDES", emoji: "🌅" };
    if (hour >= 20) return { label: "BUENAS NOCHES", emoji: "🌙" };
    return { label: "BIENVENIDO", emoji: "✨" };
}

function getCurrentDaySlug(): string {
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    return days[new Date().getDay()];
}

export function DynamicRecommendationWidget({
    recommendations,
    currentLanguage,
    onNavigate,
    accessToken,
    propertyId,
    theme
}: DynamicRecommendationWidgetProps) {
    const hour = new Date().getHours();
    const slot = getCurrentTimeSlot();
    const today = getCurrentDaySlug();
    const { label, emoji } = getDayGreeting(hour);

    // UI Labels
    const { content: labelRecomendacion } = useLocalizedContent('RECOMENDACIÓN', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerMas } = useLocalizedContent('VER RECOMENDACIONES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedGreeting } = useLocalizedContent(label, currentLanguage, 'ui_label', accessToken, propertyId);

    const timeStr = new Date().toLocaleTimeString(currentLanguage === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const activeRec = useMemo(() => {
        if (!recommendations || recommendations.length === 0) return null;

        const relevant = recommendations.filter(r => {
            const m = r.metadata || {};
            const slots = m.best_time_slots || r.best_time_slots || [];
            const matchesTime = Array.isArray(slots) && slots.includes(slot);

            const availability = m.availability || r.availability || { days: ["todos"] };
            const days = availability.days || ["todos"];
            const matchesDay =
                days.includes("todos") ||
                days.includes("variable") ||
                days.includes(today);

            return matchesTime && matchesDay;
        });

        const pool = relevant.length > 0 ? relevant : recommendations;
        const dayOfYear = Math.floor(Date.now() / 86400000);
        return pool[dayOfYear % pool.length];
    }, [recommendations, slot, today]);

    const { content: localizedName } = useLocalizedContent(activeRec?.name || '', currentLanguage, 'recommendations', accessToken, propertyId);
    const { content: localizedDesc } = useLocalizedContent(activeRec?.metadata?.personal_note || activeRec?.description || '', currentLanguage, 'recommendations', accessToken, propertyId);

    if (!activeRec) return null;

    const priceRange = activeRec.metadata?.price_range || activeRec.price_range;
    const tags = activeRec.metadata?.tags || activeRec.tags || [];
    const availabilityNotes = activeRec.metadata?.availability?.notes || activeRec.availability?.notes;

    // ── Smart Routing Logic ───────────────────────────────────────────────────
    // eat → todo lo que se come, bebe o sale de noche (incluyendo ocio nocturno)
    // do  → actividades diurnas: naturaleza, cultura, relax, ocio diurno
    // shop → compras y supermercados
    const EAT_SET = new Set([
        // Comida
        'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico',
        'alta_cocina', 'internacional', 'desayuno', 'restaurante', 'cafe',
        'bar', 'food', 'comida', 'gastronomia', 'gastronomía',
        // Tapas
        'tapas',
    ]);

    const DO_SET = new Set([
        // Solo actividades diurnas
        'naturaleza', 'cultura', 'relax',
        'activity', 'actividad', 'actividades',
        'park', 'parque', 'museum', 'museo', 'landmark',
        'experiencias', 'experience', 'qué hacer', 'que hacer', 'spa',
        // Ocio y vida nocturna
        'ocio', 'ocio_nocturno', 'nightclub', 'night_club',
        'bar_copas', 'discoteca', 'pub',
    ]);

    const handleNavigate = () => {
        const type = (activeRec.type || activeRec.category || '').toLowerCase();
        const payload = { recId: activeRec.id };

        if (SHOP_SET.has(type)) {
            onNavigate('shop', payload);
        } else if (DO_SET.has(type)) {
            onNavigate('do', payload);
        } else {
            // eat como fallback seguro — cubre restaurantes, bares, ocio nocturno
            onNavigate('eat', payload);
        }
    };

    const SHOP_SET = new Set([
        'compras', 'supermercados', 'shopping', 'market',
        'mercado', 'tiendas', 'tienda', 'supermarket',
    ]);


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <Card className={cn('overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.08)]', theme.cardBg)}>
                <div className="p-5">
                    {/* Header Info */}
                    <div className="flex items-center justify-between mb-4">
                        <div className={cn('flex items-center gap-2', theme.chipIconColor)}>
                            <Clock size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black tracking-widest uppercase">
                                {timeStr} • {localizedGreeting} {emoji}
                            </span>
                        </div>
                        <span className="px-2 py-0.5 bg-[#f59e0b] text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                            {labelRecomendacion}
                        </span>
                    </div>

                    {/* Recommendation Content */}
                    <div className="space-y-2 mb-4">
                        <h3 className={cn(
                            "text-xl font-serif font-bold text-gray-900 leading-tight",
                            !localizedName && "h-7 w-40 bg-gray-100 animate-pulse rounded-md"
                        )}>
                            {localizedName}
                        </h3>

                        <div className={cn(
                            "text-[13px] text-gray-500 leading-relaxed line-clamp-2",
                            !localizedDesc && "h-10 w-full bg-gray-50 animate-pulse rounded-sm"
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

                    {/* Metadatos Rápidos */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {priceRange && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                💰 {priceRange}
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