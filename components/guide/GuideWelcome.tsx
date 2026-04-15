'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Globe,
    Wifi,
    Key,
    Clock,
    MapPin,
    Info,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';
import Image from 'next/image';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';
import supabaseLoader from '@/lib/image-loader';
import { DynamicRecommendationWidget } from './DynamicRecommendationWidget';
import { WeatherWidgetMini } from './WeatherWidgetMini';
import { LanguageSelector } from './LanguageSelector';
import { getGuideTheme } from '@/lib/guide-theme';

interface GuideWelcomeProps {
    propertyName: string;
    heroImage: string;
    location: string;
    onBack: () => void;
    onOpenGuide: () => void;
    onNavigate: (screen: string, payload?: any) => void;
    onChatQuery: (query: string) => void;
    currentLanguage: string;
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
    /** Coords de la propiedad para el widget de clima */
    latitude?: number | null;
    longitude?: number | null;
    showBack?: boolean;
    hasParking?: boolean;
    parkingNumber?: string;
}

const item = {
    hidden: { opacity: 0, y: 8 },
    show:   { opacity: 1, y: 0 },
};
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

export function GuideWelcome({
    propertyName,
    heroImage,
    location,
    onBack,
    onOpenGuide,
    onNavigate,
    onChatQuery,
    currentLanguage = 'es',
    onLanguageChange,
    recommendations = [],
    guestName,
    accessToken,
    propertyId,
    themeId = 'modern_v2',
    context = [],
    sections = [],
    manuals = [],
    disabledLanguage = false,
    latitude,
    longitude,
    showBack = true,
    hasParking: propHasParking = false,
    parkingNumber: propParkingNumber = '',
}: GuideWelcomeProps) {

    const t = getGuideTheme(themeId);

    // ── Datos de contexto ────────────────────────────────────────────────────
    const checkinData = context?.find(c => c.category === 'checkin')?.content || {};
    const accessData  = context?.find(c => c.category === 'access')?.content  || {};
    const techData    = context?.find(c => c.category === 'tech')?.content    || {};
    const rulesData   = context?.find(c => c.category === 'rules')?.content   || {};

    const hasWifi    = !!techData.wifi_ssid;
    const hasCheckin = !!checkinData.steps?.length;

    // Parking
    const parkingNumber = propParkingNumber || accessData.parking_number || accessData.garage_spot || '';
    const hasParkingVisible = propHasParking || !!(
        parkingNumber ||
        accessData.parking_info?.trim() ||
        accessData.parking_instructions?.trim() ||
        accessData.parking?.info ||
        (typeof accessData.parking === 'string' && accessData.parking.trim())
    );

    // Checkout
    const checkoutTime = rulesData.checkout_time || rulesData.check_out_time || '';

    // Dirección
    const address = accessData.full_address || '';

    // Clima: tipo contextual inferido de la ubicación (se puede hacer más inteligente)
    // Por ahora 'urban' como default seguro — el anfitrión puede configurarlo en el futuro
    const locationType: 'coastal' | 'mountain' | 'urban' =
        location.toLowerCase().includes('playa') || location.toLowerCase().includes('costa') || location.toLowerCase().includes('beach')
            ? 'coastal'
            : location.toLowerCase().includes('sierra') || location.toLowerCase().includes('montaña')
                ? 'mountain'
                : 'urban';

    // Recomendaciones
    const EAT_SET  = new Set(['restaurantes','italiano','mediterraneo','hamburguesas','asiatico','alta_cocina','internacional','desayuno','restaurante','cafe','bar','food','comida','tapas']);
    const DO_SET   = new Set(['naturaleza','cultura','ocio','relax','activity','actividad','actividades','park','parque','museum','museo','landmark','experiencias','experience']);
    const getRType = (r: any) => (r.type || r.category || '').toLowerCase();
    const eatRecs  = recommendations.filter(r => EAT_SET.has(getRType(r)));
    const doRecs   = recommendations.filter(r => DO_SET.has(getRType(r)));

    const locationName = location.split(',')[0].trim();

    // ── Labels ───────────────────────────────────────────────────────────────
    const { content: localizedPropertyName }   = useLocalizedContent(propertyName,                currentLanguage, 'general',  accessToken, propertyId);
    const { content: greetingLabel }           = useLocalizedContent('Hola',                      currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: welcomeToLabel }          = useLocalizedContent('Bienvenido a',              currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: conciergeLabel }          = useLocalizedContent('Tu asistente digital en',   currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWifi }               = useLocalizedContent('Wifi',                      currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAcceso }             = useLocalizedContent('Acceso',                    currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelParking }            = useLocalizedContent('Parking',                   currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCheckout }           = useLocalizedContent('Check-out',                 currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelComoLlegar }         = useLocalizedContent('Cómo llegar',               currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDescubre }           = useLocalizedContent(`Descubre ${locationName}`,  currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGastronomia }        = useLocalizedContent('Dónde comer...',            currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelQueHacer }           = useLocalizedContent('Qué hacer',                 currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelPoweredBy }          = useLocalizedContent('Desarrollado por',          currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDondePuedoAparcar }  = useLocalizedContent('¿Dónde puedo aparcar?',    currentLanguage, 'ui_label', accessToken, propertyId);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleParkingClick = () => {
        onChatQuery(labelDondePuedoAparcar || '¿Dónde puedo aparcar?');
    };

    const handleComoLlegarClick = () => {
        if (address) {
            const isIOS = typeof window !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
            const url = isIOS
                ? `maps://?q=${encodeURIComponent(address)}`
                : `https://maps.google.com/?q=${encodeURIComponent(address)}`;
            window.open(url, '_blank');
        } else {
            onNavigate('checkin');
        }
    };

    return (
        <motion.div
            className={cn("min-h-screen pb-32", t.pageBg)}
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* ── Top bar ── */}
            <motion.div variants={item} className="px-5 pt-6 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={onBack}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <span className={cn("text-sm font-bold tracking-wide uppercase truncate max-w-[180px]", t.heroPropertyName)}>
                        {localizedPropertyName || propertyName}
                    </span>
                </div>
                <LanguageSelector
                    currentLanguage={currentLanguage}
                    onLanguageChange={onLanguageChange}
                    disabled={disabledLanguage}
                />
            </motion.div>

            {/* ── Hero ── */}
            <motion.div
                variants={item}
                className={cn(
                    "mx-5 relative h-64 overflow-hidden shadow-sm",
                    // Coastal/Modern = very rounded, Urban = square, Warm/Luxury = slightly rounded
                    themeId === 'urban' ? '' :
                    themeId === 'luxury' ? '' :
                    themeId === 'coastal' ? 'rounded-3xl' :
                    'rounded-3xl'
                )}
            >
                {heroImage ? (
                    <Image
                        loader={supabaseLoader}
                        src={heroImage}
                        alt={propertyName}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 448px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200" />
                )}
                <div className={cn("absolute inset-x-0 bottom-0 h-full pointer-events-none", t.heroOverlay)} />
                <div className="absolute bottom-6 left-6 z-10">
                    <p className={cn("text-[9px] font-bold tracking-[0.2em] uppercase mb-1.5", t.heroSubLabel)}>
                        {welcomeToLabel} {propertyName}
                    </p>
                    <h1 className={cn("text-3xl font-bold leading-none mb-1", t.heroGreeting)}>
                        {guestName ? `${greetingLabel}, ${guestName}` : greetingLabel}
                    </h1>
                    <p className={cn("text-sm opacity-90", t.heroPropertyName)}>{propertyName}</p>
                </div>
            </motion.div>

            {/* ── Widget clima ── */}
            <motion.div variants={item}>
                <WeatherWidgetMini
                    lat={latitude}
                    lng={longitude}
                    locationType={locationType}
                    themeId={themeId}
                    currentLanguage={currentLanguage}
                    accessToken={accessToken}
                    propertyId={propertyId}
                />
            </motion.div>

            {/* ── Concierge pill ── */}
            <motion.div variants={item} className="flex justify-center mt-6 px-5 w-full">
                <button
                    onClick={() => onChatQuery('')}
                    className={cn(
                        "w-full px-5 py-4 text-left shadow-sm border transition-colors flex items-center justify-between",
                        // Coastal = rounded-full pill, Urban = no radius, others = rounded-2xl
                        t.chipLayout === 'stacked' ? 'rounded-full' :
                        themeId === 'urban' ? '' :
                        'rounded-2xl',
                        t.searchBg,
                        t.searchBorder
                    )}
                >
                    <div className="flex items-center gap-3">
                        <span>✨</span>
                        <span className={cn("text-[13px] font-medium uppercase tracking-widest", t.searchText)}>
                            {conciergeLabel} {locationName}
                        </span>
                    </div>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", t.actionBtn)}>
                        <ChevronRight size={16} className="shrink-0" />
                    </div>
                </button>
            </motion.div>

            {/* ── Grid accesos ── */}
            <motion.div
                variants={item}
                className={cn(
                    "grid grid-cols-3 gap-3 px-5 mt-8",
                    t.chipLayout === 'stacked' ? 'gap-4' : 'gap-3'
                )}
            >
                {t.chipLayout === 'stacked' ? (
                    // ── Stacked layout: circular icon on top, label below ──
                    <>
                        {hasWifi && (
                            <button
                                onClick={() => onNavigate('wifi')}
                                className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-all outline-none"
                            >
                                <div className={cn(
                                    "h-14 w-14 rounded-full flex items-center justify-center shadow-md",
                                    t.perChipColors[0] || t.chipIconBg
                                )}>
                                    <Wifi className="h-6 w-6 text-white" strokeWidth={2} />
                                </div>
                                <span className={cn("text-[10px] font-extrabold", t.chipLabel)}>{labelWifi}</span>
                            </button>
                        )}
                        {hasCheckin && (
                            <button
                                onClick={() => onNavigate('checkin')}
                                className="flex flex-col items-center justify-center gap-2 active:scale-95 transition-all outline-none"
                            >
                                <div className={cn(
                                    "h-14 w-14 rounded-full flex items-center justify-center shadow-md",
                                    t.perChipColors[1] || t.chipIconBg
                                )}>
                                    <Key className="h-6 w-6 text-white" strokeWidth={2} />
                                </div>
                                <span className={cn("text-[10px] font-extrabold", t.chipLabel)}>{labelAcceso}</span>
                            </button>
                        )}
                        {hasParkingVisible && (
                            <button
                                onClick={handleParkingClick}
                                className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all outline-none"
                            >
                                <div className={cn(
                                    "h-14 w-14 rounded-full flex items-center justify-center shadow-md",
                                    t.perChipColors[2] || t.chipIconBg
                                )}>
                                    <span className="text-2xl font-extrabold text-white leading-none">P</span>
                                </div>
                                <span className={cn("text-[10px] font-extrabold", t.chipLabel)}>{labelParking}</span>
                                {parkingNumber && (
                                    <span className={cn("text-[8px] font-semibold opacity-70", t.chipLabel)}>{parkingNumber}</span>
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    // ── Inline layout: rectangular cards ──
                    <>
                        {hasWifi && (
                            <button
                                onClick={() => onNavigate('wifi')}
                                className={cn("rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all outline-none", t.chipBg)}
                            >
                                <Wifi className={cn("h-6 w-6", t.chipIconColor)} strokeWidth={1.5} />
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", t.chipLabel)}>{labelWifi}</span>
                            </button>
                        )}
                        {hasCheckin && (
                            <button
                                onClick={() => onNavigate('checkin')}
                                className={cn("rounded-2xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all outline-none", t.chipBg)}
                            >
                                <Key className={cn("h-6 w-6", t.chipIconColor)} strokeWidth={1.5} />
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", t.chipLabel)}>{labelAcceso}</span>
                            </button>
                        )}
                        {hasParkingVisible && (
                            <button
                                onClick={handleParkingClick}
                                className={cn("rounded-2xl p-4 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all h-full outline-none", t.chipBg)}
                            >
                                <span className={cn("text-2xl font-black leading-none", t.chipIconColor)}>P</span>
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest mt-0.5", t.chipLabel)}>{labelParking}</span>
                                {parkingNumber && (
                                    <span className={cn("text-[9px] font-medium opacity-70", t.chipLabel)}>{parkingNumber}</span>
                                )}
                            </button>
                        )}
                    </>
                )}
            </motion.div>

            {/* ── Recomendación dinámica ── */}
            <motion.div variants={item} className="px-5 mt-4">
                <DynamicRecommendationWidget
                    recommendations={recommendations}
                    currentLanguage={currentLanguage}
                    onNavigate={onNavigate}
                    accessToken={accessToken}
                    propertyId={propertyId}
                    theme={{
                        cardBg: t.guideCardBg,
                        chipIconColor: t.chipIconColor,
                        actionBtn: t.actionBtn,
                        guideCardTitle: t.guideCardTitle,
                        guideCardSubtitle: t.guideCardSubtitle,
                        guideCardTag: t.guideCardTag,
                        sectionLabel: t.sectionLabel,
                        chipLayout: t.chipLayout,
                        accentText: t.accentText,
                    }}
                />
            </motion.div>

            {/* ── Pills checkout + cómo llegar ── */}
            <motion.div variants={item} className="flex gap-3 px-5 mt-4">
                {checkoutTime && (
                    <button
                        onClick={() => onNavigate('rules')}
                        className={cn("flex-1 rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-all", t.chipBg)}
                    >
                        <Clock className={cn("h-3.5 w-3.5", t.chipIconColor)} strokeWidth={1.5} />
                        <span className={cn("text-xs font-semibold", t.chipLabel)}>
                            {labelCheckout} {checkoutTime}
                        </span>
                    </button>
                )}
                <button
                    onClick={handleComoLlegarClick}
                    className={cn("flex-1 rounded-full py-2.5 flex items-center justify-center gap-2 active:scale-95 transition-all", t.chipBg)}
                >
                    <MapPin className={cn("h-3.5 w-3.5", t.chipIconColor)} strokeWidth={1.5} />
                    <span className={cn("text-xs font-semibold", t.chipLabel)}>{labelComoLlegar}</span>
                </button>
            </motion.div>

            {/* ── Descubre la zona ── */}
            {(eatRecs.length > 0 || doRecs.length > 0) && (
                <motion.div variants={item} className="px-5 mt-10">
                    <h2 className={cn("text-[10px] font-bold tracking-widest uppercase mb-4", t.sectionLabel)}>
                        {labelDescubre}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {eatRecs.length > 0 && (
                            <div onClick={() => onNavigate('eat')} className={cn("relative h-28 overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-all", t.chipLayout === 'stacked' ? 'rounded-3xl' : themeId === 'urban' ? '' : 'rounded-2xl')}>
                                <Image src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop" fill className="object-cover" alt={labelGastronomia} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <span className="absolute bottom-3 left-3 text-white text-xs font-bold">{labelGastronomia}</span>
                            </div>
                        )}
                        {doRecs.length > 0 && (
                            <div onClick={() => onNavigate('leisure')} className={cn("relative h-28 overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-all", t.chipLayout === 'stacked' ? 'rounded-3xl' : themeId === 'urban' ? '' : 'rounded-2xl')}>
                                <Image src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop" fill className="object-cover" alt={labelQueHacer} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <span className="absolute bottom-3 left-3 text-white text-xs font-bold">{labelQueHacer}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}            {/* ── Footer ── */}
            <motion.div variants={item} className="mt-6 text-center opacity-40 pb-4">
                <p className={cn("text-[8px] font-black tracking-[0.4em] uppercase", t.chipLabel)}>
                    {labelPoweredBy} GuideFlow
                </p>
            </motion.div>
        </motion.div>
    );
}
