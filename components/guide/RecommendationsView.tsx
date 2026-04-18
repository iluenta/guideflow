'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
    ChevronLeft,
    UtensilsCrossed,
    CalendarDays,
    ShoppingBag,
    MapPin,
    Clock,
    Star,
    Navigation,
    Mountain,
    Trees,
    Landmark,
    Music,
    Wind,
    ArrowRight,
    Camera,
    Bike,
    Waves,
    Coffee,
    ChevronDown,
    ChevronUp,
    Pizza,
    Fish,
    Beef,
    Globe,
    Utensils,
    Store,
    Sunrise,
    Sunset,
    Sun,
    Moon,
    Telescope,
    Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface Recommendation {
    id: string;
    name: string;
    type: string;
    category?: string;
    description?: string;
    distance?: string;
    time?: string;
    price_range?: string;
    personal_note?: string;
    map_url?: string;
    google_place_id?: string;
    address?: string;
    rating?: number | null;
    tags?: string[];
    opening_hours?: {
        open: string | null;
        close: string | null;
        always_open?: boolean;
        open_now?: boolean;
        weekday_text?: string[];
    };
    metadata?: {
        photo_url?: string | null;
        rating_count?: number | null;
        editorial_summary?: string | null;
        time?: string;
        price_level?: number;
        price_range?: string;
        personal_note?: string;
        google_place_id?: string;
        tags?: string[];
        best_time_slots?: string[];
        availability?: {
            days: string[];
            notes?: string;
        };
        opening_hours?: {
            open: string | null;
            close: string | null;
            always_open?: boolean;
            open_now?: boolean;
            weekday_text?: string[];
        };
    };
}

interface RecommendationsViewProps {
    onBack: () => void;
    recommendations: Recommendation[];
    group: 'eat' | 'do' | 'shopping';
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    city?: string;
    accessToken?: string;
    propertyId?: string;
    disabledLanguage?: boolean;
    handleNavigate?: (path: string) => void;
    initialRecId?: string;
    themeId?: string;
}

function RecommendationCard({
    rec,
    isExpanded,
    toggleExpand,
    currentLanguage,
    accessToken,
    getMapsUrl,
    propertyId,
    isDark = false,
    isCoastal = false,
    isWarm = false,
    isLuxury = false,
}: {
    rec: Recommendation,
    isExpanded: boolean,
    toggleExpand: (id: string) => void,
    currentLanguage: string,
    accessToken?: string,
    getMapsUrl: (rec: Recommendation) => string,
    propertyId?: string,
    isDark?: boolean,
    isCoastal?: boolean,
    isWarm?: boolean,
    isLuxury?: boolean,
}) {
    const { content: localizedName } = useLocalizedContent(rec.name, currentLanguage, 'recommendation_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(rec.description || '', currentLanguage, 'recommendation_description', accessToken, propertyId);

    const metadata = rec.metadata || {};
    const photoUrl = metadata.photo_url || null;
    const rating = rec.rating || null;
    const editorialSummary = metadata.editorial_summary || null;
    const openNow = metadata.opening_hours?.open_now;

    const rawNote = rec.personal_note || metadata.personal_note || '';
    const openingHours = metadata.opening_hours || rec.opening_hours;

    const { content: localizedNote } = useLocalizedContent(rawNote, currentLanguage, 'recommendation_note', accessToken, propertyId);
    const { content: labelHostTip } = useLocalizedContent('Consejo del anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOpen } = useLocalizedContent('Abierto', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelClosed } = useLocalizedContent('Cerrado', currentLanguage, 'ui_label', accessToken, propertyId);

    const tags = metadata.tags || rec.tags || [];
    const distanceText = rec.distance && !rec.distance.toLowerCase().includes('distance') ? rec.distance : null;

    const catLabel = (rec.type || 'ocio').toLowerCase();
    const catStyle = categoryConfigs[catLabel] || categoryConfigs.todos;
    const Icon = catStyle.icon;

    const mapsUrl = getMapsUrl(rec);
    const openMaps = (e: React.MouseEvent) => {
        if (mapsUrl.startsWith('http')) { window.open(mapsUrl, '_blank', 'noopener,noreferrer'); e.preventDefault(); }
    };

    // ── Coastal open layout — circular image, full-width Maps button ────────
    if (isCoastal) {
        return (
            <div className="bg-white border-l-4 border-l-[#0EA5E9] border border-[#E0F2FE] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#E0F2FE] flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {photoUrl ? (
                            <Image src={photoUrl} alt={rec.name} width={56} height={56} unoptimized className="object-cover w-full h-full rounded-full" />
                        ) : (
                            <Icon className="w-6 h-6 text-[#0EA5E9]" strokeWidth={1.5} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-[#0C4A6E] font-bold text-base leading-tight mb-1 line-clamp-2">{localizedName}</h3>
                        {distanceText && (
                            <div className="flex items-center gap-1 text-[#0EA5E9] text-xs font-medium">
                                <MapPin className="w-3.5 h-3.5" /><span>{distanceText}</span>
                            </div>
                        )}
                        {openNow !== undefined && (
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-400")} />
                                <span className={cn("font-medium", openNow ? "text-emerald-600" : "text-rose-500")}>
                                    {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-[#64748B] text-sm leading-relaxed">{editorialSummary || localizedDescription}</p>
                {localizedNote && (
                    <p className="text-[#0369A1]/70 text-xs italic border-l-2 border-l-[#0EA5E9]/30 pl-3">&quot;{localizedNote}&quot;</p>
                )}
                {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-[#FFF7ED] text-[#EA580C] px-2 py-1 rounded-md text-[10px] font-medium">#{tag}</span>
                        ))}
                    </div>
                )}
                <a href={mapsUrl} onClick={openMaps}
                    className="w-full bg-[#0EA5E9] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                    <span>Ver en Maps</span><Navigation className="w-4 h-4" />
                </a>
            </div>
        );
    }

    // ── Warm compact layout — horizontal, exact hex colors from mockup ──────
    if (isWarm) {
        return (
            <div className="bg-white border-l-[3px] border-l-[#D4A054] border border-[#D4A054]/10 rounded-xl p-4 flex gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-[#FFF8F0] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {photoUrl ? (
                        <Image src={photoUrl} alt={rec.name} width={64} height={64} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        <Icon className="w-6 h-6 text-[#D4A054]" strokeWidth={1.5} />
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-[#431407] font-bold uppercase tracking-wider text-sm mb-1 truncate">
                        {localizedName}
                    </h3>
                    <p className="text-[#8C6B5D] text-xs leading-relaxed mb-2 line-clamp-2">
                        {editorialSummary || localizedDescription}
                    </p>
                    {distanceText && (
                        <div className="flex items-center gap-1 mb-2">
                            <span className="flex items-center gap-1 bg-[#FEF0EC] text-[#B5533C] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                <MapPin className="w-3 h-3" />{distanceText}
                            </span>
                        </div>
                    )}
                    {openNow !== undefined && (
                        <div className="flex items-center gap-1.5 text-[10px] mb-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-400")} />
                            <span className={cn("font-medium", openNow ? "text-emerald-600" : "text-rose-500")}>
                                {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1.5 flex-wrap">
                            {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[#B5533C] text-[10px] bg-[#FEF0EC] px-1.5 py-0.5 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <a href={mapsUrl} onClick={openMaps}
                            className="flex items-center gap-1 bg-[#FEF0EC] text-[#B5533C] text-[10px] font-bold px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity flex-shrink-0 ml-2">
                            <span>MAPS</span><Navigation className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Luxury Estate — refined horizontal card, navy+gold palette ───────────
    if (isLuxury) {
        return (
            <div className="bg-white border-l-2 border-l-[#C9A84C] border border-[#D4C5A9] rounded-xl p-4 flex gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-[#F9F7F4] border border-[#D4C5A9] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {photoUrl ? (
                        <Image src={photoUrl} alt={rec.name} width={64} height={64} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        <Icon className="w-6 h-6 text-[#C9A84C]" strokeWidth={1.5} />
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-[#1B2A4A] font-medium uppercase tracking-widest text-sm mb-1 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                        {localizedName}
                    </h3>
                    <p className="text-[#8A8070] text-xs leading-relaxed mb-2 line-clamp-2">
                        {editorialSummary || localizedDescription}
                    </p>
                    {distanceText && (
                        <div className="flex items-center gap-1 mb-2">
                            <span className="flex items-center gap-1 bg-[#F9F7F4] text-[#8A8070] text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-[#D4C5A9]">
                                <MapPin className="w-3 h-3" />{distanceText}
                            </span>
                        </div>
                    )}
                    {openNow !== undefined && (
                        <div className="flex items-center gap-1.5 text-[10px] mb-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-400")} />
                            <span className={cn("font-medium", openNow ? "text-emerald-600" : "text-rose-500")}>
                                {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1.5 flex-wrap">
                            {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#1B2A4A', backgroundColor: 'rgba(27,42,74,0.07)' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <a href={mapsUrl} onClick={openMaps}
                            className="flex items-center gap-1 text-[#8A8070] hover:text-[#1B2A4A] text-[10px] font-medium tracking-wider transition-colors flex-shrink-0 ml-2">
                            <span>MAPS</span><Navigation className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Modern Minimal compact layout — clean gray, no border-l accent ───────
    if (!isDark) {
        return (
            <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 flex gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-xl bg-[#F4F4F5] flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {photoUrl ? (
                        <Image src={photoUrl} alt={rec.name} width={64} height={64} unoptimized className="object-cover w-full h-full" />
                    ) : (
                        <Icon className="w-6 h-6 text-[#52525B]" strokeWidth={1.5} />
                    )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-[#09090B] font-bold uppercase tracking-wider text-sm mb-1 truncate">
                        {localizedName}
                    </h3>
                    <p className="text-[#52525B] text-xs leading-relaxed mb-2 line-clamp-2">
                        {editorialSummary || localizedDescription}
                    </p>
                    {distanceText && (
                        <div className="flex items-center gap-1 mb-2">
                            <span className="flex items-center gap-1 bg-[#F4F4F5] text-[#3F3F46] text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-[#E4E4E7]">
                                <MapPin className="w-3 h-3" />{distanceText}
                            </span>
                        </div>
                    )}
                    {openNow !== undefined && (
                        <div className="flex items-center gap-1.5 text-[10px] mb-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-400")} />
                            <span className={cn("font-medium", openNow ? "text-emerald-600" : "text-rose-500")}>
                                {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1.5 flex-wrap">
                            {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: '#3F3F46', backgroundColor: '#F4F4F5', border: '1px solid #E4E4E7' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <a href={mapsUrl} onClick={openMaps}
                            className="flex items-center gap-1 text-[#71717A] hover:text-[#09090B] text-[10px] font-bold transition-colors flex-shrink-0 ml-2">
                            <span>MAPS</span><Navigation className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Urban Dark card — expandable, black/cyan palette ─────────────────────
    return (
        <div
            onClick={() => toggleExpand(rec.id)}
            className={cn(
                "bg-[#1C1C1C] rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer border-l-2 border-l-[#00E5FF] border border-[#333]",
                isExpanded && "ring-1 ring-[#00E5FF]/20 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            )}
        >
            <div className="flex items-start p-3 sm:p-4 gap-3">
                {/* Left: Square Image / Icon Fallback */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-[#333] bg-[#0F0F0F]">
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt={rec.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0F0F0F]">
                            <Icon className="w-8 h-8 text-[#00E5FF]/50" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    {/* Title + Rating */}
                    <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className={cn(
                            "text-sm font-bold text-white leading-tight tracking-wide uppercase",
                            !isExpanded && "line-clamp-2"
                        )}>
                            {localizedName}
                        </h3>
                        {rating && (
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                <Star className="w-3 h-3 text-[#00E5FF] fill-current" />
                                <span className="text-[12px] font-bold text-[#00E5FF]">{rating}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <p className={cn(
                        "text-[11px] text-[#A1A1AA] leading-snug mb-2",
                        !isExpanded && "line-clamp-2"
                    )}>
                        {editorialSummary || localizedDescription}
                    </p>

                    {/* Meta: Distance + Status */}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-[#555] mb-2">
                        {distanceText && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#00E5FF]/50" />
                                <span className="text-[#00E5FF]/70">{distanceText}</span>
                            </div>
                        )}
                        {openNow !== undefined && (
                            <div className="flex items-center gap-1.5">
                                <div className={cn("w-1.5 h-1.5 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-500")} />
                                <span className={cn(openNow ? "text-emerald-500" : "text-rose-500")}>
                                    {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tags + Maps */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
                            {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.20)' }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <a
                            href={getMapsUrl(rec)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (getMapsUrl(rec).startsWith('http')) {
                                    window.open(getMapsUrl(rec), '_blank', 'noopener,noreferrer');
                                    e.preventDefault();
                                }
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#555] hover:text-[#00E5FF] transition-colors shrink-0 uppercase tracking-wider"
                        >
                            Maps <Navigation className="w-3 h-3" />
                        </a>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                        <div className="mt-4 space-y-3 pt-4 border-t border-[#333] animate-in fade-in slide-in-from-top-1">
                            {metadata.best_time_slots && metadata.best_time_slots.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">
                                        Mejor momento para visitar
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.best_time_slots.map(slot => {
                                            const timeSlotConfigs: any = {
                                                morning: { label: 'Mañana', icon: Sunrise },
                                                midday: { label: 'Mediodía', icon: Sun },
                                                afternoon: { label: 'Tarde', icon: Sunset },
                                                night: { label: 'Noche', icon: Moon }
                                            };
                                            const cfg = timeSlotConfigs[slot] || { label: slot, icon: Clock };
                                            const SlotIcon = cfg.icon;
                                            return (
                                                <div key={slot} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#0F0F0F] border border-[#333] text-[#00E5FF]">
                                                    <SlotIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                    {cfg.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {localizedNote && (
                                <div className="p-3 rounded-xl bg-[#0F0F0F] border border-[#333] relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00E5FF]/40" />
                                    <p className="text-[11px] italic text-[#A1A1AA] leading-relaxed pl-3">
                                        &quot;{localizedNote}&quot;
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#555] mt-2 pl-3">
                                        {labelHostTip}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const categoryConfigs: Record<string, { icon: any, color: string, bgColor: string, activeBg: string, hex: string }> = {
    restaurantes: { icon: UtensilsCrossed, color: 'text-orange-600', bgColor: 'bg-orange-50', activeBg: 'bg-orange-600', hex: '#EA580C' },
    italiano: { icon: Pizza, color: 'text-red-600', bgColor: 'bg-red-50', activeBg: 'bg-red-600', hex: '#DC2626' },
    mediterraneo: { icon: Fish, color: 'text-sky-600', bgColor: 'bg-sky-50', activeBg: 'bg-sky-600', hex: '#0284C7' },
    hamburguesas: { icon: Beef, color: 'text-amber-700', bgColor: 'bg-amber-50', activeBg: 'bg-amber-700', hex: '#B45309' },
    asiatico: { icon: UtensilsCrossed, color: 'text-rose-600', bgColor: 'bg-rose-50', activeBg: 'bg-rose-600', hex: '#E11D48' },
    alta_cocina: { icon: Star, color: 'text-violet-600', bgColor: 'bg-violet-50', activeBg: 'bg-violet-600', hex: '#7C3AED' },
    internacional: { icon: Globe, color: 'text-cyan-600', bgColor: 'bg-cyan-50', activeBg: 'bg-cyan-600', hex: '#0891B2' },
    naturaleza: { icon: Mountain, color: 'text-emerald-600', bgColor: 'bg-emerald-50', activeBg: 'bg-emerald-600', hex: '#059669' },
    cultura: { icon: Landmark, color: 'text-amber-600', bgColor: 'bg-amber-50', activeBg: 'bg-amber-600', hex: '#D97706' },
    ocio: { icon: Music, color: 'text-pink-600', bgColor: 'bg-pink-50', activeBg: 'bg-pink-600', hex: '#DB2777' },
    relax: { icon: Waves, color: 'text-teal-600', bgColor: 'bg-teal-50', activeBg: 'bg-teal-600', hex: '#0D9488' },
    compras: { icon: ShoppingBag, color: 'text-indigo-600', bgColor: 'bg-indigo-50', activeBg: 'bg-indigo-600', hex: '#4F46E5' },
    supermercados: { icon: Store, color: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600', hex: '#2563EB' },
    desayuno: { icon: Coffee, color: 'text-amber-700', bgColor: 'bg-amber-50', activeBg: 'bg-amber-700', hex: '#B45309' },
    todos: { icon: Star, color: 'text-[var(--color-text-secondary)]/60', bgColor: 'bg-surface', activeBg: 'bg-primary', hex: '#1E3A5F' }
};

const groupConfigs = {
    eat: {
        title: 'Dónde Comer',
        heroTitle: 'Sabores Locales',
        heroDesc: 'Mis recomendaciones personales para disfrutar de la mejor gastronomía de la zona.',
        categories: [
            'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico',
            'alta_cocina', 'internacional', 'desayuno', 'restaurante', 'cafe',
            'food', 'comida', 'gastronomia', 'gastronomía', 'tapas', 'taberna', 'tapas_bar', 'bar_restaurante'
        ],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'restaurantes', label: 'Restaurantes', type: 'restaurantes' },
            { id: 'italiano', label: 'Italiano', type: 'italiano' },
            { id: 'mediterraneo', label: 'Mediterráneo', type: 'mediterraneo' },
            { id: 'hamburguesas', label: 'Hamburguesas', type: 'hamburguesas' },
            { id: 'asiatico', label: 'Asiático', type: 'asiatico' },
            { id: 'alta_cocina', label: 'Alta Cocina', type: 'alta_cocina' },
            { id: 'internacional', label: 'Internacional', type: 'internacional' },
            { id: 'desayuno', label: 'Cafés', type: 'desayuno' },
        ]
    },
    do: {
        title: 'Qué Hacer',
        heroTitle: 'Descubre el entorno',
        heroDesc: 'Experiencias únicas y rincones especiales seleccionados para ti.',
        categories: [
            'naturaleza', 'cultura', 'ocio', 'relax', 'activity', 'actividad',
            'actividades', 'park', 'parque', 'museum', 'museo', 'landmark',
            'experiencias', 'experience', 'spa', 'ocio_nocturno', 'nightclub',
            'night_club', 'bar_copas', 'discoteca', 'pub',
            'ruta', 'trail'
        ],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'naturaleza', label: 'Naturaleza', type: 'naturaleza' },
            { id: 'cultura', label: 'Cultura', type: 'cultura' },
            { id: 'relax', label: 'Relax', type: 'relax' },
            { id: 'ocio', label: 'Ocio', type: 'ocio' },
        ]
    },
    shopping: {
        title: 'Compras',
        heroTitle: 'De Compras',
        heroDesc: 'Mercados tradicionales, tiendas de artesanía y todo lo necesario para tu estancia.',
        categories: ['compras', 'supermercados', 'shopping', 'market', 'mercado', 'tiendas', 'tienda', 'supermarket'],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'compras', label: 'Tiendas', type: 'compras' },
            { id: 'supermercados', label: 'Supermercados', type: 'supermercados' }
        ]
    }
};

export function RecommendationsView({
    onBack,
    recommendations,
    group,
    currentLanguage = 'es',
    city,
    accessToken,
    propertyId,
    disabledLanguage = false,
    handleNavigate,
    initialRecId,
    themeId = 'modern_v2',
}: RecommendationsViewProps) {
    const isDark = themeId === 'urban';
    const isCoastal = themeId === 'coastal';
    const isWarm = themeId === 'warm';
    const isLuxury = themeId === 'luxury';
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [expandedId, setExpandedId] = useState<string | null>(initialRecId || null);
    const config = groupConfigs[group];
    const recommendationRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Localize UI Labels
    const { content: localizedGroupTitle } = useLocalizedContent(config.title, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedHeroTitle } = useLocalizedContent(config.heroTitle, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedHeroDesc } = useLocalizedContent(config.heroDesc, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEmpty } = useLocalizedContent('Sin recomendaciones aún', currentLanguage, 'ui_label', accessToken, propertyId);

    // Pill Labels
    const { content: labelTodo } = useLocalizedContent('Todo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRestaurantes } = useLocalizedContent('Restaurantes', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDesayunos } = useLocalizedContent('Desayunos', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNaturaleza } = useLocalizedContent('Naturaleza', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCultura } = useLocalizedContent('Cultura', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRelax } = useLocalizedContent('Relax', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOcio } = useLocalizedContent('Ocio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCompras } = useLocalizedContent('Tiendas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSuper } = useLocalizedContent('Súper / Mercados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelItaliano } = useLocalizedContent('Italiano', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelMediterraneo } = useLocalizedContent('Mediterráneo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHamburguesas } = useLocalizedContent('Hamburguesas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAsiatico } = useLocalizedContent('Asiático', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAltaCocina } = useLocalizedContent('Alta Cocina', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInternacional } = useLocalizedContent('Internacional', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAmanecer } = useLocalizedContent('Amanecer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAtardecer } = useLocalizedContent('Atardecer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelFooter } = useLocalizedContent('Recomendaciones seleccionadas por el anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);

    const pillLabels: Record<string, string | undefined> = {
        todos: labelTodo,
        restaurantes: labelRestaurantes,
        desayuno: labelDesayunos,
        naturaleza: labelNaturaleza,
        cultura: labelCultura,
        relax: labelRelax,
        ocio: labelOcio,
        compras: labelCompras,
        supermercados: labelSuper,
        italiano: labelItaliano,
        mediterraneo: labelMediterraneo,
        hamburguesas: labelHamburguesas,
        asiatico: labelAsiatico,
        alta_cocina: labelAltaCocina,
        internacional: labelInternacional,
        amanecer: labelAmanecer,
        atardecer: labelAtardecer
    };

    const filteredRecommendations = useMemo(() => {
        let items = recommendations.filter(r => {
            const cat = (r.type || r.category || 'ocio').toLowerCase();
            return config.categories.includes(cat);
        });

        if (selectedCategory && selectedCategory !== 'todos') {
            items = items.filter(r => {
                const type = (r.type || r.category || '').toLowerCase();
                if (type === selectedCategory) return true;

                // Tapas/Taberna mapping for Restaurantes filter
                const RESTAURANTE_SUBTYPES = ['tapas', 'taberna', 'tapas_bar', 'bar_restaurante', 'restaurante', 'food', 'comida'];
                if (selectedCategory === 'restaurantes' && RESTAURANTE_SUBTYPES.includes(type)) return true;

                // Nightlife mapping for Ocio filter
                const OCIO_SUBTYPES = ['ocio_nocturno', 'nightclub', 'night_club', 'bar_copas', 'discoteca', 'pub'];
                if (selectedCategory === 'ocio' && OCIO_SUBTYPES.includes(type)) return true;

                return false;
            });
        }
        return items;
    }, [recommendations, selectedCategory, config.categories]);

    const getMapsUrl = (rec: Recommendation) => {
        // If there's a specific map_url, use it.
        if (rec.map_url && rec.map_url.startsWith('http')) return rec.map_url;

        // Use the specific address if available, otherwise fallback to name + city
        const queryBase = rec.address ? `${rec.name} ${rec.address}` : `${rec.name}${city ? ` ${city}` : ''}`;
        const query = encodeURIComponent(queryBase);
        
        const placeId = rec.google_place_id || rec.metadata?.google_place_id;

        // Universal Google Maps Search URL - Works on all platforms (Mobile App & Desktop)
        let url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        if (placeId) {
            url += `&query_place_id=${placeId}`;
        }
        return url;
    };

    useEffect(() => {
        if (initialRecId) {
            const targetRec = recommendations.find(r => r.id === initialRecId);
            if (targetRec) {
                const cat = (targetRec.type || targetRec.category || '').toLowerCase();
                let pillToSelect = 'todos';

                const exactPill = config.pills.find(p => p.id === cat);
                if (exactPill) {
                    pillToSelect = cat;
                } else {
                    const OCIO_SUBTYPES = ['ocio_nocturno', 'nightclub', 'night_club', 'bar_copas', 'discoteca', 'pub'];
                    if (group === 'do' && (cat === 'ocio' || OCIO_SUBTYPES.includes(cat))) {
                        pillToSelect = 'ocio';
                    }
                }

                setSelectedCategory(pillToSelect);
                setExpandedId(initialRecId);

                // 3. Scroll to it with a slight delay for hydration/rendering
                const scrollTimer = setTimeout(() => {
                    const element = recommendationRefs.current[initialRecId];
                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                        });
                    }
                }, 600); // Increased delay for stability

                return () => clearTimeout(scrollTimer);
            }
        }
    }, [initialRecId, recommendations, config.pills, group]);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => {
            const newExpandedId = prev === id ? null : id;
            if (newExpandedId) {
                // Scroll to the expanded card
                setTimeout(() => {
                    recommendationRefs.current[newExpandedId]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }, 100); // Small delay to allow expansion animation
            }
            return newExpandedId;
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-beige pb-8">
            {/* Header (Fase 5 Style) */}
            <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-navy/5 px-4 h-16 flex items-center">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:bg-primary/[0.05] rounded-full transition-colors active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-xl text-[var(--color-text-primary)] font-semibold tracking-tight">
                    {localizedGroupTitle}
                </h1>
            </header>

            <div className="flex-1">
                {/* Hero section */}
                <div className="px-6 py-8">
                    <h2 className={cn(
                        "leading-tight mb-2",
                        isDark ? "text-3xl font-bold text-white"
                            : isCoastal ? "text-2xl font-black text-[#0C4A6E]"
                            : isWarm ? "text-2xl font-black uppercase tracking-wider text-[#431407]"
                            : isLuxury ? "text-2xl font-medium uppercase tracking-[0.15em] text-[#1B2A4A]"
                            : "text-2xl font-black uppercase tracking-wider text-[#09090B]"
                    )} style={isLuxury ? { fontFamily: 'var(--font-heading)' } : undefined}>
                        {localizedHeroTitle}
                    </h2>
                    <p className={cn("text-sm leading-relaxed max-w-[90%]",
                        isDark ? "text-[#A1A1AA]"
                        : isCoastal ? "text-[#64748B]"
                        : isWarm ? "text-[#8C6B5D]"
                        : isLuxury ? "text-[#8A8070]"
                        : "text-[#52525B]"
                    )}>
                        {localizedHeroDesc}
                    </p>
                </div>

                <div className="px-6 mb-8">
                    <div className="flex flex-wrap gap-x-2 gap-y-3">
                        {config.pills.map((pill: { id: string, label: string, type: string }) => {
                            const isActive = selectedCategory === pill.id;
                            const catConfig = categoryConfigs[pill.type] || categoryConfigs.todos;
                            const Icon = catConfig.icon;

                            if (isDark) {
                                return (
                                    <button
                                        key={pill.id}
                                        onClick={() => setSelectedCategory(pill.id)}
                                        style={isActive ? { backgroundColor: '#00E5FF' } : {}}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                            isActive
                                                ? "text-black shadow-lg scale-105"
                                                : "bg-[#1C1C1C] text-[#A1A1AA] hover:bg-[#27272A] border border-[#333]"
                                        )}
                                    >
                                        {Icon && pill.id !== 'todos' && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
                                        {pillLabels[pill.id] || pill.label}
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={pill.id}
                                    onClick={() => setSelectedCategory(pill.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                                        isCoastal
                                            ? isActive
                                                ? "bg-[#0EA5E9] text-white shadow-md"
                                                : "bg-white text-[#0369A1] border border-[#E0F2FE] shadow-sm hover:border-[#BAE6FD]"
                                            : isWarm
                                                ? isActive
                                                    ? "bg-[#D4A054] text-white shadow-md"
                                                    : "bg-white text-[#8C6B5D] border border-[#D4A054]/30 hover:text-[#D4A054] hover:border-[#D4A054]/50"
                                                : isLuxury
                                                    ? isActive
                                                        ? "bg-[#1B2A4A] text-[#C9A84C] shadow-md"
                                                        : "bg-white text-[#8A8070] border border-[#D4C5A9] hover:text-[#1B2A4A] hover:border-[#C9A84C]/50"
                                                    : isActive
                                                        ? "bg-[#09090B] text-white shadow-md"
                                                        : "bg-white text-[#52525B] border border-[#E4E4E7] hover:text-[#09090B] hover:border-[#A1A1AA]"
                                    )}
                                >
                                    {pillLabels[pill.id] || pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendations List (Fase 5 Style) */}
                <div className="px-6 space-y-4">
                    {filteredRecommendations.length > 0 ? (
                        filteredRecommendations.map((rec) => (
                            <div key={rec.id} ref={el => { recommendationRefs.current[rec.id] = el; }}>
                                <RecommendationCard
                                    rec={rec}
                                    isExpanded={expandedId === rec.id}
                                    toggleExpand={toggleExpand}
                                    currentLanguage={currentLanguage}
                                    accessToken={accessToken}
                                    propertyId={propertyId}
                                    getMapsUrl={getMapsUrl}
                                    isDark={isDark}
                                    isCoastal={isCoastal}
                                    isWarm={isWarm}
                                    isLuxury={isLuxury}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center bg-surface/30 rounded-3xl border border-dashed border-primary/[0.15]">
                            <Star className="w-8 h-8 text-[var(--color-text-secondary)]/30 mx-auto mb-3" />
                            <p className="text-[var(--color-text-secondary)] text-sm font-bold uppercase tracking-widest">
                                {labelEmpty}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mockup powered text */}
            <div className="px-6 mt-8 mb-4 text-center opacity-40">
                <p className="text-[8px] text-[var(--color-text-secondary)] uppercase font-black tracking-[0.3em]">
                    {labelFooter}
                </p>
            </div>
        </div>
    );
}
