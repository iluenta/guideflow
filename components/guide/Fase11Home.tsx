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
import { Card } from '@/components/ui/card';
import { LanguageSelector } from '@/components/guide/LanguageSelector';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';

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
    propertyId?: string; // FASE 17
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
    propertyId // FASE 17
}: Fase11HomeProps) {

    // Dynamic Translations
    const { content: localizedPropertyName } = useLocalizedContent(propertyName, currentLanguage, 'general', accessToken, propertyId);

    // Logic for Tip of the Day
    const { content: labelBuenosDias } = useLocalizedContent('BUENOS DÍAS', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBuenasTardes } = useLocalizedContent('BUENAS TARDES', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBuenasNoches } = useLocalizedContent('BUENAS NOCHES', currentLanguage, 'ui_label', accessToken, propertyId);

    const timeInfo = useMemo(() => {
        const hour = new Date().getHours();
        const timeStr = new Date().toLocaleTimeString(currentLanguage === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        if (hour >= 5 && hour < 12) return { greeting: labelBuenosDias, time: timeStr, category: 'desayuno' };
        if (hour >= 12 && hour < 20) return { greeting: labelBuenasTardes, time: timeStr, category: 'restaurantes' };
        return { greeting: labelBuenasNoches, time: timeStr, category: 'restaurantes' };
    }, [currentLanguage, labelBuenosDias, labelBuenasTardes, labelBuenasNoches]);

    const tipRecommendation = useMemo(() => {
        const filtered = recommendations.filter(r => r.type === timeInfo.category || r.category === timeInfo.category);
        if (filtered.length > 0) return filtered[0];
        return recommendations[0]; // Fallback
    }, [recommendations, timeInfo.category]);

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

    const locationName = location.split(',')[0].trim();
    const { content: labelDescubreLocation } = useLocalizedContent(`Descubre ${locationName}`, currentLanguage, 'ui_label', accessToken, propertyId);

    return (
        <motion.div
            className="flex flex-col min-h-screen bg-white"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header with Hero Image */}
            <div className="relative h-48 w-full overflow-hidden">
                <img
                    src={heroImage}
                    alt={propertyName}
                    className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40" />

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
                    />
                </div>

                <div className="absolute bottom-10 left-6 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">
                        {guestName ? (currentLanguage === 'es' ? `Hola ${guestName}` : `Hello ${guestName}`) : labelTuGuia}
                    </p>
                    <h1 className={cn(
                        "text-2xl font-serif font-bold tracking-tight",
                        !localizedPropertyName && "h-8 w-48 bg-white/20 animate-pulse rounded-lg mt-1"
                    )}>
                        {localizedPropertyName}
                    </h1>
                </div>
            </div>

            <div className="px-5 pb-10 -mt-6 relative z-10">
                {/* Time-based Suggestion */}
                <motion.div variants={item} className="mb-8">
                    <Card className="overflow-hidden border-none shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-primary">
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

                {/* Essentials Grid */}
                <motion.div variants={item} className="mb-10">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Star size={12} className="text-[#f59e0b]" fill="currentColor" />
                        {labelLoIndispensable}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => onNavigate('checkin')}
                            className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/10 active:scale-95 transition-all"
                        >
                            <Key size={24} className="mb-2 opacity-90" />
                            <span className="text-[9px] font-black tracking-widest uppercase">
                                Check In
                            </span>
                        </button>
                        <button
                            onClick={() => onNavigate('wifi')}
                            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-95 transition-all text-primary"
                        >
                            <Wifi size={24} className="mb-2" />
                            <span className="text-[9px] font-black tracking-widest uppercase text-gray-600">
                                WiFi
                            </span>
                        </button>
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
                <motion.div variants={item} className="mb-10">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        {labelDescubreLocation}
                    </h3>
                    <div className="space-y-3">
                        {[
                            { id: 'eat', icon: Utensils, label: labelGastronomia, sub: labelRestaurantesLocales },
                            { id: 'leisure', icon: Calendar, label: labelQueHacer, sub: labelActividades },
                            { id: 'shopping', icon: ShoppingBag, label: labelCompras, sub: labelTiendas }
                        ].map((action) => (
                            <div
                                key={action.id}
                                onClick={() => onNavigate(action.id)}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/20 transition-all hover:bg-gray-50/50 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <action.icon size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">
                                            {action.label}
                                        </p>
                                        <p className="text-[11px] text-gray-400">{action.sub}</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Accommodation Info */}
                <motion.div variants={item} className="mb-8">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                        {labelSobreCasa}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'house-info', icon: Info, label: labelInfo },
                            { id: 'rules', icon: FileText, label: labelNormas },
                            { id: 'manuals', icon: Book, label: labelManual }
                        ].map((navItem) => (
                            <button
                                key={navItem.id}
                                onClick={() => onNavigate(navItem.id)}
                                className="flex flex-col items-center justify-center p-4 bg-gray-50/50 rounded-xl border border-gray-100 active:scale-95 transition-all hover:bg-gray-100 group"
                            >
                                <navItem.icon size={20} className="mb-2 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                    {navItem.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div variants={item} className="mt-8 text-center opacity-30">
                    <p className="text-[9px] font-black text-navy tracking-[0.4em] uppercase">
                        Powered by GuideFlow
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
