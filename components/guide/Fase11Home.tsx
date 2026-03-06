'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ChevronRight,
    Key,
    Wifi,
    AlertTriangle,
    Utensils,
    Calendar,
    ShoppingBag,
    Info,
    FileText,
    Book,
    Clock,
    Star
} from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { LanguageSelector } from '@/components/guide/LanguageSelector';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { getGuideTheme } from '@/lib/guide-theme';
import { cn } from '@/lib/utils';
import supabaseLoader from '@/lib/image-loader';


interface Fase11HomeProps {
    propertyName: string;
    heroImage: string;
    location: string;
    onBack: () => void;
    onNavigate: (screen: string) => void;
    onChatQuery: (query: string) => void;
    currentLanguage?: string;
    onLanguageChange: (lang: string) => void;
    recommendations?: any[];
    guestName?: string;
    accessToken?: string;
    propertyId?: string;
    themeId?: string;
    context?: any[];
    sections?: any[];
    manuals?: any[];
    disabledLanguage?: boolean;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export function Fase11Home({
    propertyName,
    heroImage,
    location,
    onBack,
    onNavigate,
    onChatQuery,
    currentLanguage = 'es',
    onLanguageChange,
    recommendations = [],
    guestName,
    accessToken,
    propertyId,
    themeId = 'modern',
    context = [],
    sections = [],
    manuals = [],
    disabledLanguage = false,
}: Fase11HomeProps) {
    const t = getGuideTheme(themeId)

    const hasWifi = !!context?.find(c => c.category === 'tech')?.content?.wifi_ssid;
    const hasCheckin = !!context?.find(c => c.category === 'checkin')?.content?.steps?.length;

    // Evaluate if there are actual rules text inside the section
    const rulesSection = sections?.find(s => s.type === 'rules');
    const hasRules = !!(rulesSection?.content && rulesSection.content.length > 5);
    const hasManuals = manuals && manuals.length > 0;

    // Dynamic Translations
    const { content: localizedPropertyName } = useLocalizedContent(propertyName, currentLanguage, 'general', accessToken, propertyId);

    // Logic for Tip of the Day
    const { content: labelBuenosDias } = useLocalizedContent('BUENOS DÍAS', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBuenasTardes } = useLocalizedContent('BUENAS TARDES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBuenasNoches } = useLocalizedContent('BUENAS NOCHES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: greetingLabel } = useLocalizedContent('Hola', currentLanguage, 'ui_label', accessToken, propertyId);

    const timeInfo = useMemo(() => {
        const hour = new Date().getHours();
        const timeStr = new Date().toLocaleTimeString(currentLanguage === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        if (hour >= 5 && hour < 12) return { greeting: labelBuenosDias, time: timeStr, category: 'desayuno' };
        if (hour >= 12 && hour < 20) return { greeting: labelBuenasTardes, time: timeStr, category: 'restaurantes' };
        return { greeting: labelBuenasNoches, time: timeStr, category: 'restaurantes' };
    }, [currentLanguage, labelBuenosDias, labelBuenasTardes, labelBuenasNoches]);

    const tipRecommendation = useMemo(() => {
        if (!recommendations || recommendations.length === 0) return null;
        const filtered = recommendations.filter(r => r.type === timeInfo.category || r.category === timeInfo.category);
        if (filtered.length > 0) return filtered[0];
        return recommendations[0]; // Fallback
    }, [recommendations, timeInfo.category]);

    const hasRecommendations = recommendations && recommendations.length > 0;
    const EAT_SET = new Set(['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'restaurant', 'restaurante', 'cafe', 'bar', 'food', 'comida']);
    const DO_SET = new Set(['naturaleza', 'cultura', 'ocio', 'relax', 'activity', 'actividad', 'actividades', 'park', 'parque', 'museum', 'museo', 'landmark', 'experiencias', 'experience']);
    const SHOP_SET = new Set(['compras', 'shopping', 'market', 'mercado', 'pharmacy', 'farmacia', 'supermarket', 'supermercado', 'supermercados']);
    const getRType = (r: any) => (r.type || r.category || '').toLowerCase();
    const eatRecs = recommendations.filter(r => EAT_SET.has(getRType(r)));
    const doRecs = recommendations.filter(r => DO_SET.has(getRType(r)));
    const shopRecs = recommendations.filter(r => SHOP_SET.has(getRType(r)));

    const { content: localizedTipName } = useLocalizedContent(tipRecommendation?.name || '', currentLanguage, 'recommendations', accessToken, propertyId);
    const { content: localizedTipDesc } = useLocalizedContent(tipRecommendation?.personal_note || tipRecommendation?.description || '', currentLanguage, 'recommendations', accessToken, propertyId);

    const { content: labelTuGuia } = useLocalizedContent('Tu Guía', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRecomendacion } = useLocalizedContent('RECOMENDACIÓN', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelExploraZona } = useLocalizedContent('Explora la zona', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDescubreRincones } = useLocalizedContent('Descubre los mejores rincones cerca de ti.', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerRecomendaciones } = useLocalizedContent('Ver recomendaciones', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelLoIndispensable } = useLocalizedContent('Lo Indispensable', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSobreCasa } = useLocalizedContent('Sobre la Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGastronomia } = useLocalizedContent('Gastronomía', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRestaurantesLocales } = useLocalizedContent('Restaurantes locales', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelQueHacer } = useLocalizedContent('Qué Hacer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelActividades } = useLocalizedContent('Actividades', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCompras } = useLocalizedContent('Compras', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelTiendas } = useLocalizedContent('Tiendas y mercados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInfo } = useLocalizedContent('Info', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNormas } = useLocalizedContent('Normas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelManual } = useLocalizedContent('Manual', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: poweredByLabel } = useLocalizedContent('Desarrollado por', currentLanguage, 'ui_label', accessToken, propertyId);

    const locationName = location.split(',')[0].trim();
    const { content: labelDescubreLocation } = useLocalizedContent(`Descubre ${locationName}`, currentLanguage, 'ui_label', accessToken, propertyId);

    return (
        <motion.div
            className={cn('flex flex-col min-h-screen', t.pageBg)}
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header with Hero Image */}
            <div className="relative h-48 w-full overflow-hidden">
                {heroImage && heroImage.trim() !== '' ? (
                    <Image
                        loader={supabaseLoader}
                        src={heroImage}
                        alt={propertyName}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Star className="opacity-20" size={32} />
                    </div>
                )}

                <div className={cn('absolute inset-0', t.heroOverlay)} />

                <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <LanguageSelector
                        currentLanguage={currentLanguage}
                        onLanguageChange={onLanguageChange}
                        disabled={disabledLanguage}
                    />
                </div>

                <div className="absolute bottom-10 left-6">
                    <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1', t.heroSubLabel)}>
                        {guestName ? `${greetingLabel} ${guestName}` : labelTuGuia}
                    </p>
                    <h1 className={cn(
                        'text-2xl font-bold tracking-tight',
                        t.heroGreeting,
                        !localizedPropertyName && 'h-8 w-48 bg-white/20 animate-pulse rounded-lg mt-1'
                    )}>
                        {localizedPropertyName}
                    </h1>
                </div>
            </div>

            <div className="px-5 pb-10 -mt-6 relative z-10">
                {/* Time-based Suggestion */}
                {hasRecommendations && (
                    <motion.div variants={item} className="mb-8">
                        <Card className={cn('overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.08)]', t.cardBg)}>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn('flex items-center gap-2', t.chipIconColor)}>
                                        <Clock size={14} strokeWidth={2.5} />
                                        <span className="text-[10px] font-black tracking-widest uppercase">
                                            {timeInfo.time} • {timeInfo.greeting}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-[#f59e0b] text-white text-[9px] font-black rounded-full uppercase tracking-wider">
                                        {labelRecomendacion}
                                    </span>
                                </div>

                                {tipRecommendation ? (
                                    <>
                                        <h3 className={cn(
                                            "text-xl font-serif font-bold text-gray-900 mb-2 leading-tight",
                                            !localizedTipName && "h-7 w-40 bg-gray-100 animate-pulse rounded-md"
                                        )}>
                                            {localizedTipName}
                                        </h3>
                                        <div className={cn(
                                            "text-[13px] text-gray-500 mb-4 leading-relaxed line-clamp-2",
                                            !localizedTipDesc && "space-y-2"
                                        )}>
                                            {localizedTipDesc ? (
                                                localizedTipDesc
                                            ) : (
                                                <>
                                                    <div className="h-3 w-full bg-gray-50 animate-pulse rounded-sm" />
                                                    <div className="h-3 w-3/4 bg-gray-50 animate-pulse rounded-sm" />
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className={cn(
                                            "text-xl font-serif font-bold text-gray-900 mb-2 leading-tight",
                                            !localizedTipName && "h-7 w-40 bg-gray-100 animate-pulse rounded-md"
                                        )}>
                                            {labelExploraZona}
                                        </h3>
                                        <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
                                            {labelDescubreRincones}
                                        </p>
                                    </>
                                )}

                                <button
                                    onClick={() => onNavigate('eat')}
                                    className="text-xs font-black text-primary flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest"
                                >
                                    {labelVerRecomendaciones} <ChevronRight size={14} strokeWidth={3} />
                                </button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Essentials Grid */}
                <motion.div variants={item} className="mb-10">
                    <h3 className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2', t.sectionLabel)}>
                        <Star size={12} className="text-[#f59e0b]" fill="currentColor" />
                        {labelLoIndispensable}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {hasCheckin && (
                            <button
                                onClick={() => onNavigate('checkin')}
                                className={cn('flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg active:scale-95 transition-all', t.actionBtn)}
                            >
                                <Key size={24} className="mb-2 opacity-90" />
                                <span className="text-[9px] font-black tracking-widest uppercase">
                                    Check In
                                </span>
                            </button>
                        )}
                        {hasWifi && (
                            <button
                                onClick={() => onNavigate('wifi')}
                                className={cn('flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm active:scale-95 transition-all', t.chipBg, t.chipIconColor)}
                            >
                                <Wifi size={24} className="mb-2" />
                                <span className={cn('text-[9px] font-black tracking-widest uppercase', t.chipLabel)}>
                                    WiFi
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate('emergency')}
                            className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl shadow-sm active:scale-95 transition-all"
                        >
                            <AlertTriangle size={24} className="mb-2" />
                            <span className="text-[9px] font-black tracking-widest uppercase">
                                SOS
                            </span>
                        </button>
                    </div>
                </motion.div>

                {/* Explore Section */}
                {(eatRecs.length > 0 || doRecs.length > 0 || shopRecs.length > 0) && (
                    <motion.div variants={item} className="mb-10">
                        <h3 className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4', t.sectionLabel)}>
                            {labelDescubreLocation}
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'eat', icon: Utensils, label: labelGastronomia, sub: labelRestaurantesLocales, show: eatRecs.length > 0 },
                                { id: 'leisure', icon: Calendar, label: labelQueHacer, sub: labelActividades, show: doRecs.length > 0 },
                                { id: 'shopping', icon: ShoppingBag, label: labelCompras, sub: labelTiendas, show: shopRecs.length > 0 }
                            ].filter(a => a.show).map((action) => (
                                <div
                                    key={action.id}
                                    onClick={() => onNavigate(action.id)}
                                    className={cn('p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all group border', t.chipBg)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform', t.chipIconBg, t.chipIconColor)}>
                                            <action.icon size={18} />
                                        </div>
                                        <div>
                                            <p className={cn('font-bold text-sm', t.chipLabel)}>
                                                {action.label}
                                            </p>
                                            <p className={cn('text-[11px]', t.guideCardSubtitle)}>{action.sub}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={cn('group-hover:translate-x-1 transition-all', t.chipIconColor)} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Accommodation Info */}
                <motion.div variants={item} className="mb-8">
                    <h3 className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4', t.sectionLabel)}>
                        {labelSobreCasa}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'house-info', icon: Info, label: labelInfo, show: true },
                            { id: 'rules', icon: FileText, label: labelNormas, show: hasRules },
                            { id: 'manuals', icon: Book, label: labelManual, show: hasManuals }
                        ].filter(item => item.show).map((navItem) => (
                            <button
                                key={navItem.id}
                                onClick={() => onNavigate(navItem.id)}
                                className={cn('flex flex-col items-center justify-center p-4 rounded-xl active:scale-95 transition-all group border', t.chipBg)}
                            >
                                <navItem.icon size={20} className={cn('mb-2 group-hover:scale-110 transition-colors', t.chipIconColor)} />
                                <span className={cn('text-[9px] font-black uppercase tracking-widest', t.chipLabel)}>
                                    {navItem.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div variants={item} className="mt-8 text-center opacity-30">
                    <p className="text-[9px] font-black text-navy tracking-[0.4em] uppercase">
                        {poweredByLabel} GuideFlow
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
