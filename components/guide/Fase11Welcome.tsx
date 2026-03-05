'use client';

import React from 'react';
import { Variants, motion } from 'framer-motion';
import {
    Search,
    Wifi,
    Utensils,
    Key,
    MapPin,
    ChevronRight,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { LanguageSelector } from '@/components/guide/LanguageSelector';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { getGuideTheme } from '@/lib/guide-theme';
import { cn } from '@/lib/utils';


interface Fase11WelcomeProps {
    propertyName: string;
    heroImage: string;
    location: string;
    onOpenGuide: () => void;
    onNavigate: (page: string) => void;
    onChatQuery: (query: string) => void;
    currentLanguage?: string;
    onLanguageChange: (lang: string) => void;
    guestName?: string;
    accessToken?: string;
    propertyId?: string;
    themeId?: string;
    context?: any[];
    recommendations?: any[];
    disabledLanguage?: boolean;
}

const container: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 50
        }
    }
};

export function Fase11Welcome({
    propertyName,
    heroImage,
    location,
    onOpenGuide,
    onNavigate,
    onChatQuery,
    currentLanguage = 'es',
    onLanguageChange,
    guestName,
    accessToken,
    propertyId,
    themeId = 'modern',
    context = [],
    recommendations = [],
    disabledLanguage = false,
}: Fase11WelcomeProps) {
    const t = getGuideTheme(themeId)
    const hasWifi = !!context?.find(c => c.category === 'tech')?.content?.wifi_ssid;
    const accessData = context?.find(c => c.category === 'access')?.content || {};
    const hasParking = Boolean(
        (accessData.parking_info && accessData.parking_info.trim() !== '') ||
        (accessData.garage_spot && accessData.garage_spot.trim() !== '') ||
        (accessData.parking_instructions && accessData.parking_instructions.trim() !== '') ||
        (accessData.parking && typeof accessData.parking === 'string' && accessData.parking.trim() !== '')
    );

    // Eat recommendations logic
    const EAT_TYPES = new Set(['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'restaurant', 'cafe', 'bar']);
    const getRecType = (r: any) => (r.type || r.category || '').toLowerCase();
    const eatRecs = recommendations.filter(r => EAT_TYPES.has(getRecType(r)));
    const hasEat = eatRecs.length > 0;

    const { content: localizedPropertyName } = useLocalizedContent(propertyName, currentLanguage, 'general', accessToken, propertyId);
    const { content: welcomeHomeLabel } = useLocalizedContent('Bienvenido a casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: greetingLabel } = useLocalizedContent('Hola', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: conciergePlaceholder } = useLocalizedContent('¿En qué puedo ayudarte hoy?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: conciergeLabel } = useLocalizedContent('Tu concierge digital en', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: commonQuestionsLabel } = useLocalizedContent('Preguntas Frecuentes', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: yourStayLabel } = useLocalizedContent('Tu Estancia', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: houseGuideLabel } = useLocalizedContent('Guía de la Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: everythingYouNeedLabel } = useLocalizedContent('Todo lo que necesitas saber', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: poweredByLabel } = useLocalizedContent('Desarrollado por', currentLanguage, 'ui_label', accessToken, propertyId);

    // Chip Labels
    const { content: labelAcceso } = useLocalizedContent('Acceso', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelParking } = useLocalizedContent('Parking', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelComer } = useLocalizedContent('Comer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: queryParking } = useLocalizedContent('¿Dónde puedo aparcar?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: queryComer } = useLocalizedContent('¿Dónde puedo comer cerca?', currentLanguage, 'ui_label', accessToken, propertyId);

    const localizedGreeting = guestName ? `${greetingLabel} ${guestName}` : greetingLabel;

    return (
        <motion.div
            className={cn('flex flex-col min-h-full relative', t.pageBg)}
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Hero Section */}
            <div className="relative h-[45vh] w-full overflow-hidden">
                {heroImage && heroImage.trim() !== '' ? (
                    <Image
                        src={heroImage}
                        alt={propertyName}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                        loading="eager"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-700" />
                )}

                <div className={cn('absolute inset-0', t.heroOverlay)} />

                <div className="absolute top-4 right-4 z-20">
                    <LanguageSelector
                        currentLanguage={currentLanguage}
                        onLanguageChange={onLanguageChange}
                        disabled={disabledLanguage}
                    />
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 pb-12">
                    <motion.div variants={item}>
                        <p className={cn('text-sm font-medium tracking-widest uppercase opacity-90 mb-2 flex items-center gap-2', t.heroSubLabel)}>
                            <Sparkles size={14} className="text-amber-400" />
                            {welcomeHomeLabel}
                        </p>
                        <h1 className={cn('text-4xl font-bold mb-1 leading-tight', t.heroGreeting)}>
                            {localizedGreeting}
                        </h1>
                        <p className={cn('text-lg opacity-90', t.heroPropertyName)}>
                            {localizedPropertyName}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Container - Overlapping Hero */}
            <div className="flex-1 px-6 -mt-8 relative z-10 pb-8">
                {/* Search Bar */}
                <motion.div variants={item} className="mb-8">
                    <div
                        className={cn('relative group shadow-[0_15px_40px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden cursor-pointer border', t.searchBg, t.searchBorder)}
                        onClick={() => onChatQuery('')}
                    >
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary">
                            <Search size={20} />
                        </div>
                        <div className={cn('w-full h-16 pl-12 pr-14 flex items-center text-base', t.searchBg, t.searchText)}>
                            {conciergePlaceholder}
                        </div>

                        <div className="absolute inset-y-0 right-2 flex items-center">
                            <button className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95', t.actionBtn)}>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                    <p className={cn('text-center text-xs mt-3 font-medium uppercase tracking-[0.1em]', t.conciergeText)}>
                        {conciergeLabel} {location}
                    </p>
                </motion.div>

                {/* Quick Actions - FAQs */}
                <motion.div variants={item} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={cn('text-[10px] font-black uppercase tracking-widest', t.sectionLabel)}>
                            {commonQuestionsLabel}
                        </h3>
                    </div>

                    {t.chipLayout === 'stacked' ? (
                        // ── Stacked layout: 4-col circular badge + label below (Coastal) ──
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'wifi', icon: Wifi, label: 'WiFi', type: 'nav', target: 'wifi', show: hasWifi },
                                { id: 'access', icon: Key, label: labelAcceso, type: 'nav', target: 'checkin', show: true },
                                { id: 'parking', icon: MapPin, label: labelParking, type: 'chat', query: queryParking, show: hasParking },
                                { id: 'eat', icon: Utensils, label: labelComer, type: 'chat', query: queryComer, show: hasEat }
                            ].filter(c => c.show).map((chip, i) => (
                                <button
                                    key={chip.id}
                                    onClick={() => chip.type === 'nav' ? onNavigate(chip.target!) : onChatQuery(chip.query!)}
                                    className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
                                >
                                    <div className={cn(
                                        'w-14 h-14 rounded-full flex items-center justify-center shadow-md',
                                        t.perChipColors[i] ?? 'bg-sky-400',
                                    )}>
                                        <chip.icon size={22} className="text-white" />
                                    </div>
                                    <span className={cn('text-[11px] font-bold text-center leading-tight', t.chipLabel)}>
                                        {chip.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        // ── Inline layout: 2×2 icon-left (Modern / Urban) ──
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'wifi', icon: Wifi, label: 'WiFi', type: 'nav', target: 'wifi', show: hasWifi },
                                { id: 'access', icon: Key, label: labelAcceso, type: 'nav', target: 'checkin', show: true },
                                { id: 'parking', icon: MapPin, label: labelParking, type: 'chat', query: queryParking, show: hasParking },
                                { id: 'eat', icon: Utensils, label: labelComer, type: 'chat', query: queryComer, show: hasEat }
                            ].filter(c => c.show).map((chip) => (
                                <button
                                    key={chip.id}
                                    onClick={() => chip.type === 'nav' ? onNavigate(chip.target!) : onChatQuery(chip.query!)}
                                    className={cn('flex items-center gap-3 p-3.5 rounded-xl transition-colors text-left group', t.chipBg)}
                                >
                                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform', t.chipIconBg, t.chipIconColor)}>
                                        <chip.icon size={16} />
                                    </div>
                                    <span className={cn('text-sm font-bold', t.chipLabel)}>{chip.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>


                {/* Guide Link Card */}
                <motion.div variants={item} className="mt-auto">
                    <div
                        className={cn('rounded-2xl p-5 flex items-center justify-between shadow-md cursor-pointer group', t.guideCardBg)}
                        onClick={onOpenGuide}
                    >
                        <div>
                            <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', t.guideCardTag)}>
                                {yourStayLabel}
                            </p>
                            <h3 className={cn('text-xl font-bold mb-1', t.guideCardTitle)}>
                                {houseGuideLabel}
                            </h3>
                            <p className={cn('text-xs', t.guideCardSubtitle)}>
                                {everythingYouNeedLabel}
                            </p>
                        </div>
                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110', t.guideCardChevron)}>
                            <ChevronRight size={24} />
                        </div>
                    </div>
                </motion.div>


                {/* Footer */}
                <motion.div variants={item} className="mt-8 text-center">
                    <p className="text-[9px] font-black text-gray-300 tracking-[0.4em] uppercase">
                        {poweredByLabel} GuideFlow
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
