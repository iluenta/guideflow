'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wifi,
    Key,
    Clock,
    MapPin,
    ChevronRight,
    ArrowLeft,
    Car,
    Phone,
    Copy,
    Check,
    MessageCircle,
    DoorOpen,
    ExternalLink,
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
    latitude?: number | null;
    longitude?: number | null;
    showBack?: boolean;
    hasParking?: boolean;
    parkingNumber?: string;
    property?: any;
    checkinDate?: string;
    checkoutDate?: string;
}

const item = {
    hidden: { opacity: 0, y: 8 },
    show:   { opacity: 1, y: 0 },
};
const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function isCode(text: string): boolean {
    const trimmed = (text || '').trim();
    return /^[0-9A-Z]{3,8}$/.test(trimmed) || trimmed.includes('Código:');
}

// ── InfoCard ─────────────────────────────────────────────────────────────────

interface InfoCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    wide?: boolean;
    mono?: boolean;
    cardBg: string;
    labelColor: string;
    valueColor: string;
    subColor: string;
    iconColor: string;
    iconBg: string;
    actions?: React.ReactNode;
    onClick?: () => void;
}

function InfoCard({
    icon: Icon, label, value, sub, wide, mono, cardBg, labelColor, valueColor,
    subColor, iconColor, iconBg, actions, onClick,
}: InfoCardProps) {
    if (wide) {
        // wide = info-card--wide: icono cuadrado 40×40 | texto col | actions derecha
        return (
            <div
                className={cn(
                    'col-span-2 flex flex-row items-center gap-[14px] px-[16px] py-[14px] relative',
                    cardBg,
                    onClick && 'cursor-pointer active:scale-[0.98] transition-transform'
                )}
                onClick={onClick}
            >
                {/* Icono cuadrado 40×40 — igual al JSX original */}
                <div
                    className={cn('shrink-0 flex items-center justify-center rounded-[12px]', iconBg)}
                    style={{ width: 40, height: 40 }}
                >
                    <Icon size={20} className={iconColor} />
                </div>
                {/* Texto: label uppercase + value + sub */}
                <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                    <p className={cn('text-[11px] uppercase tracking-[.1em] font-bold', labelColor)}>
                        {label}
                    </p>
                    <p className={cn(
                        'text-[15px] font-bold leading-[1.25] break-words',
                        mono && 'font-mono tracking-wider',
                        valueColor
                    )}>
                        {value}
                    </p>
                    {sub && <p className={cn('text-[12px] font-medium', subColor)}>{sub}</p>}
                </div>
                {/* Acciones a la derecha */}
                {actions && (
                    <div className="flex gap-[6px] shrink-0" onClick={e => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </div>
        );
    }

    // Normal (info-card): flex-col, min-h 96px, label+icon arriba, value, sub, actions
    return (
        <div
            className={cn(
                'flex flex-col min-h-[96px] p-[14px] relative',
                cardBg,
                onClick && 'cursor-pointer active:scale-[0.98] transition-transform'
            )}
            onClick={onClick}
        >
            {/* Label row con icono pequeño inline */}
            <div className={cn(
                'flex items-center gap-[8px] text-[11px] uppercase tracking-[.1em] font-bold mb-[8px]',
                labelColor
            )}>
                <Icon size={14} className={iconColor} strokeWidth={2.2} />
                <span>{label}</span>
            </div>
            <p className={cn(
                'text-[17px] font-bold leading-[1.25] break-words',
                mono && 'font-mono tracking-wider',
                valueColor
            )}>
                {value}
            </p>
            {sub && <p className={cn('text-[12px] font-medium mt-[4px]', subColor)}>{sub}</p>}
            {actions && (
                <div className="flex gap-[6px] mt-[10px]" onClick={e => e.stopPropagation()}>
                    {actions}
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

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
    property,
    checkinDate,
    checkoutDate,
}: GuideWelcomeProps) {

    const t = getGuideTheme(themeId);
    const [copied, setCopied] = useState<string | null>(null);

    // ── Datos de contexto ────────────────────────────────────────────────
    const checkinData  = context?.find(c => c.category === 'checkin')?.content  || {};
    const accessData   = context?.find(c => c.category === 'access')?.content   || {};
    const techData     = context?.find(c => c.category === 'tech')?.content     || {};
    const rulesData    = context?.find(c => c.category === 'rules')?.content    || {};
    const contactsData = context?.find(c => c.category === 'contacts')?.content || {};
    const welcomeData  = context?.find(c => c.category === 'welcome')?.content  || {};

    const wifiSSID     = techData.wifi_ssid     || '';
    const wifiPass     = techData.wifi_password || '';
    const address      = accessData.full_address || property?.full_address || '';
    
    // Parking logic — must respect the global property.has_parking toggle
    const hasParkingEnabled = property?.has_parking === true;
    const rawParkingData = propParkingNumber || accessData.parking_number || accessData.garage_spot || accessData.parking_info || '';
    const parkingInfo = hasParkingEnabled ? rawParkingData : '';

    const checkoutTime = rulesData.checkout_time || rulesData.check_out_time || '';

    const supportPhone = contactsData.support_mobile || contactsData.support_phone || '';
    const supportName  = contactsData.support_name   || '';
    const hostPhone    = contactsData.host_mobile    || contactsData.host_phone    || '';
    const hostName     = contactsData.host_name      || welcomeData.host_name      || '';
    const contactPhone = supportPhone || hostPhone;
    const contactName  = supportPhone ? supportName : hostName;
    const contactDigits = contactPhone.replace(/\D/g, '');

    // Access code
    const hasAccessCodeEnabled = property?.has_access_code === true;
    const accessCodeStructured = property?.access_code || accessData.access_code || '';
    const accessCodeFromSteps  = (checkinData.steps as any[] | undefined)
        ?.map((s: any) => (s.description || '').trim())
        .find((d: string) => isCode(d)) || '';
    
    const finalAccessCode = (hasAccessCodeEnabled && (accessCodeStructured || accessCodeFromSteps)) ? (accessCodeStructured || accessCodeFromSteps) : '';
    const accessCode = finalAccessCode;
    const hasCheckinSteps = (checkinData.steps as any[] | undefined)?.length ? (checkinData.steps as any[]).length > 0 : false;

    // Contextual check row
    let checkRowType: 'checkin' | 'checkout-today' | 'checkout' = 'checkout';
    if (checkinDate && checkoutDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const cin   = new Date(checkinDate);  cin.setHours(0, 0, 0, 0);
        const cout  = new Date(checkoutDate); cout.setHours(0, 0, 0, 0);
        const daysFromCheckin = Math.floor((today.getTime() - cin.getTime()) / 86400000);
        if (daysFromCheckin <= 1) checkRowType = 'checkin';
        else if (today.getTime() === cout.getTime()) checkRowType = 'checkout-today';
    }

    const hasInfoData = !!(address || wifiSSID || wifiPass || parkingInfo || checkoutTime || contactPhone);

    // Clima
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

    // ── Labels ───────────────────────────────────────────────────────────
    const { content: localizedPropertyName } = useLocalizedContent(propertyName,               currentLanguage, 'general',  accessToken, propertyId);
    const { content: greetingLabel }         = useLocalizedContent('Hola',                     currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: welcomeToLabel }        = useLocalizedContent('Bienvenido a',             currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: conciergeLabel }        = useLocalizedContent('Tu asistente digital en',  currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCheckout }         = useLocalizedContent('Check-out',                currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelComoLlegar }       = useLocalizedContent('Cómo llegar',              currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDescubre }         = useLocalizedContent(`Descubre ${locationName}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGastronomia }      = useLocalizedContent('Dónde comer...',           currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelQueHacer }         = useLocalizedContent('Qué hacer',                currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelPoweredBy }        = useLocalizedContent('Desarrollado por',         currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDondePuedoAparcar }= useLocalizedContent('¿Dónde puedo aparcar?',   currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEntrada }          = useLocalizedContent('De un vistazo',            currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInformacion }      = useLocalizedContent('Información',              currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDescubrir }        = useLocalizedContent('Descubrir',                currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerInstrucciones } = useLocalizedContent('Ver instrucciones de acceso', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCodigoEntrada }    = useLocalizedContent('Código de entrada',        currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDisponible }       = useLocalizedContent('Disponible',               currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCopiar }           = useLocalizedContent('Copiar',                   currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCopiado }          = useLocalizedContent('Copiado',                  currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHostFallback }     = useLocalizedContent('Anfitrión',                currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWelcomeMsg }       = useLocalizedContent('Mensaje de bienvenida',    currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDireccion }        = useLocalizedContent('Dirección',                currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelParking }          = useLocalizedContent('Parking',                  currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWifi }             = useLocalizedContent('WiFi',                     currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCheckoutHoy }      = useLocalizedContent('Check-out hoy',            currentLanguage, 'ui_label', accessToken, propertyId);

    // ── Handlers ─────────────────────────────────────────────────────────
    const copy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
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

    // ── Shared InfoCard style tokens ──────────────────────────────────────
    // Override rounded para que las info cards usen 16px (maqueta: var(--radius))
    // t.cardBg puede incluir rounded-3xl (coastal) — lo sobreescribimos con rounded-2xl
    const infoBg         = t.cardBg.replace('rounded-3xl', 'rounded-2xl');
    const infoLabelColor = t.sectionLabel;
    const infoValueColor = t.guideCardTitle;
    const infoSubColor   = t.guideCardSubtitle;
    const infoIconColor  = t.iconBtnColor;   // color del icono (azul claro por tema)
    const infoIconBg     = t.iconBtnBg;      // fondo claro para cuadrado wide e icon-btns

    // Copy button for InfoCards
    const CopyBtn = ({ value, copyKey }: { value: string; copyKey: string }) => (
        <button
            aria-label={`Copiar ${copyKey}`}
            onClick={(e) => { e.stopPropagation(); copy(value, copyKey); }}
            className={cn(
                'w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all duration-200 active:scale-90',
                copied === copyKey
                    ? 'bg-green-100 text-green-600'
                    : cn(infoIconBg, infoIconColor)
            )}
        >
            {copied === copyKey ? <Check size={13} /> : <Copy size={13} />}
        </button>
    );

    return (
        <motion.div
            className={cn('min-h-screen pb-8', t.pageBg)}
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* ── 1. HERO — full width, rounded bottom ── */}
            <motion.div
                variants={item}
                className="relative w-full h-64 overflow-hidden"
                style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
            >
                {heroImage ? (
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
                    <div className="w-full h-full bg-gray-300" />
                )}

                {/* Veil */}
                <div className={cn('absolute inset-0 pointer-events-none', t.heroOverlay)} />

                {/* Top bar — superpuesto dentro del hero */}
                <div className="absolute top-0 left-0 right-0 px-5 pt-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        {showBack && (
                            <button
                                onClick={onBack}
                                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                    </div>
                    <LanguageSelector
                        currentLanguage={currentLanguage}
                        onLanguageChange={onLanguageChange}
                        disabled={disabledLanguage}
                    />
                </div>

                {/* Bottom text */}
                <div className="absolute left-6 z-10" style={{ bottom: 24 }}>
                    <p className={cn('text-[10px] font-bold tracking-[.14em] uppercase opacity-80 mb-2', t.heroSubLabel)}>
                        {new Intl.DateTimeFormat(currentLanguage, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date()).replace(/^\w/, c => c.toUpperCase())}
                    </p>
                    <h1 className={cn('text-[38px] font-black leading-[1.05] tracking-[-0.02em] mb-1.5', t.heroGreeting)}>
                        {guestName ? `${greetingLabel}, ${guestName}` : greetingLabel}
                    </h1>
                    <p className={cn('text-[14px] font-medium opacity-90', t.heroPropertyName)}>
                        {propertyName} {location ? `· ${location}` : ''}
                    </p>
                </div>
            </motion.div>

            {/* ── 2. STATUS PILL — flota sobre el hero ── */}
            <motion.div variants={item} className="mx-4 relative z-10" style={{ marginTop: -48 }}>
                <WeatherWidgetMini
                    lat={latitude}
                    lng={longitude}
                    locationType={locationType}
                    themeId={themeId}
                    currentLanguage={currentLanguage}
                    accessToken={accessToken}
                    propertyId={propertyId}
                    checkInTime={checkinData?.checkin_time || '15:00 - 22:00'}
                    locationName={location || property?.city}
                />
            </motion.div>

            {/* ── 3. SECCIÓN: ENTRADA ── */}
            {(accessCode || hasCheckinSteps) && (
                <motion.div variants={item} style={{ padding: '28px 16px 0' }}>
                    {/* Section title — igual a section__title del JSX original */}
                    <div className={cn('flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] mb-3', t.sectionLabel)}>
                        <span className="text-[#F7A24B]">✦</span>
                        {labelEntrada}
                    </div>

                    {/* Entry card gradiente */}
                    <div
                        className={cn('relative overflow-hidden text-white', t.entryCardGradient)}
                        style={{ borderRadius: 28, padding: '22px 22px 18px', boxShadow: '0 12px 40px rgba(13,124,184,.18)' }}
                    >
                        {/* Círculos decorativos */}
                        <div className="absolute rounded-full pointer-events-none"
                            style={{ width: 220, height: 220, top: -90, right: -60, background: 'rgba(255,255,255,.08)' }} />
                        <div className="absolute rounded-full pointer-events-none"
                            style={{ width: 140, height: 140, bottom: -70, left: -40, background: 'rgba(255,255,255,.06)' }} />

                        {/* Eyebrow: icono llave + "ACCESO" */}
                        <div className="flex items-center gap-[6px] mb-[16px] relative"
                            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .85 }}
                        >
                            <Key size={12} />
                            <span>Acceso</span>
                        </div>

                        {/* Sub-label + code + copy en misma fila */}
                        {accessCode && (
                            <div className="relative mb-[18px]">
                                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .8, marginBottom: 4 }}>
                                    {labelCodigoEntrada}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span style={{ fontFamily: 'monospace', fontSize: 44, fontWeight: 800, letterSpacing: '.12em', lineHeight: 1 }}>
                                        {accessCode}
                                    </span>
                                    <button
                                        onClick={() => copy(accessCode, 'entry')}
                                        className={cn(
                                            'ml-auto flex items-center gap-[6px] transition-all active:scale-95',
                                            copied === 'entry'
                                                ? 'bg-[#6CE9A6] text-[#0A5F8E]'
                                                : 'bg-white/[.18] border border-white/[.22] text-white'
                                        )}
                                        style={{ fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 999, backdropFilter: 'blur(8px)' }}
                                    >
                                        {copied === 'entry' ? <Check size={14} /> : <Copy size={14} />}
                                        {copied === 'entry' ? labelCopiado : labelCopiar}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* CTA blanco */}
                        <button
                            onClick={() => onNavigate('checkin')}
                            className="w-full bg-white flex items-center justify-between active:scale-[0.98] transition-transform"
                            style={{ fontWeight: 700, fontSize: 15, padding: '15px 18px', borderRadius: 16, boxShadow: '0 6px 16px rgba(0,0,0,.12)' }}
                        >
                            <div className="flex items-center gap-[10px]">
                                <div className={cn("flex items-center justify-center", t.iconBtnBg)} style={{ width: 32, height: 32, borderRadius: 10 }}>
                                    <Key size={16} className={t.iconBtnColor} />
                                </div>
                                <div className="text-left">
                                    <p className={t.iconBtnColor} style={{ fontWeight: 700 }}>{labelVerInstrucciones}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className={cn(t.iconBtnColor, "opacity-60")} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── 4. SECCIÓN: INFORMACIÓN — info grid ── */}
            {hasInfoData && (
                <motion.div variants={item} style={{ padding: '16px 16px 0' }}>
                    <p className={cn('text-[11px] font-bold uppercase tracking-[.14em] mb-3', t.sectionLabel)}>
                        {labelInformacion}
                    </p>

                    <div className="grid grid-cols-2 gap-[10px]">

                        {/* Fila 1: Dirección — wide horizontal */}
                        {address && (
                            <InfoCard
                                icon={MapPin} label={labelDireccion} value={address}
                                wide
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                                actions={
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        aria-label="Ver en Google Maps"
                                        className={cn('w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 transition-colors', infoIconBg, infoIconColor)}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                }
                            />
                        )}

                        {/* Fila 2: Parking (col 1) + Check row (col 2) — 2 columnas normales */}
                        {parkingInfo && (
                            <InfoCard
                                icon={Car} label={labelParking} value={parkingInfo}
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                            />
                        )}

                        {/* Col 2: checkout — si es hoy, con énfasis; si no, hora simple */}
                        {checkoutTime && (checkRowType === 'checkout-today' ? (
                            <InfoCard
                                icon={Clock} label={labelCheckoutHoy} value={checkoutTime}
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                                onClick={() => onNavigate('rules')}
                            />
                        ) : (
                            <InfoCard
                                icon={Clock} label={labelCheckout} value={checkoutTime}
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                            />
                        ))}

                        {/* Fila 3: WiFi (col 1) + Anfitrión (col 2) — 2 columnas normales */}
                        {wifiSSID && (
                            <InfoCard
                                icon={Wifi} label={labelWifi} value={wifiSSID}
                                sub={wifiPass || undefined}
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                                actions={
                                    <>
                                        <CopyBtn value={wifiSSID} copyKey="ssid" />
                                        {wifiPass && <CopyBtn value={wifiPass} copyKey="pass" />}
                                    </>
                                }
                            />
                        )}

                        {contactPhone && (
                            <InfoCard
                                icon={Phone} label={contactName || labelHostFallback} value={contactPhone}
                                cardBg={infoBg} labelColor={infoLabelColor} valueColor={infoValueColor}
                                subColor={infoSubColor} iconColor={infoIconColor} iconBg={infoIconBg}
                                actions={
                                    <>
                                        <a href={`tel:${contactDigits}`} aria-label="Llamar"
                                            className={cn('w-[30px] h-[30px] rounded-full flex items-center justify-center transition-colors', infoIconBg, infoIconColor)}>
                                            <Phone size={13} />
                                        </a>
                                        <a href={`https://wa.me/${contactDigits}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                                            className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                                            style={{ background: '#E6F8EF', color: '#128C7E' }}>
                                            <MessageCircle size={13} />
                                        </a>
                                    </>
                                }
                            />
                        )}
                    </div>

                    {/* Detail link dashed — ver todos los detalles */}
                    <button
                        onClick={() => onNavigate('house-info')}
                        className={cn(
                            'w-full flex items-center justify-between mt-[14px] px-[14px] py-[13px] transition-all active:scale-[0.99]',
                            t.accentText
                        )}
                        style={{ border: '2px dashed', borderColor: 'currentColor', borderRadius: 14, fontSize: 13, fontWeight: 800 }}
                    >
                        <span>{labelWelcomeMsg}</span>
                        <ChevronRight size={16} />
                    </button>
                </motion.div>
            )}

            {/* ── 5. ASSISTANT PILL ── */}
            <motion.div variants={item} style={{ margin: '22px 16px 0' }}>
                <button
                    onClick={() => onChatQuery('')}
                    className={cn(
                        'w-full flex items-center gap-3 transition-all active:scale-[0.98]',
                        t.searchBg, t.searchBorder
                    )}
                    style={{ borderRadius: 999, padding: '6px 6px 6px 18px', border: '1px solid', boxShadow: '0 1px 2px rgba(15,27,45,.04), 0 2px 6px rgba(15,27,45,.04)' }}
                >
                    <span className="text-[#F7A24B]">★</span>
                    <span className={cn('flex-1 text-[12px] font-bold uppercase tracking-[.12em] text-left', t.accentText)}>
                        {conciergeLabel} {locationName}
                    </span>
                    <div className={cn('w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0', t.actionBtn)}>
                        <ChevronRight size={16} />
                    </div>
                </button>
            </motion.div>



            {/* ── 8. DESCUBRE LA ZONA ── */}
            {(eatRecs.length > 0 || doRecs.length > 0) && (
                <motion.div variants={item} style={{ margin: '22px 16px 0' }}>
                    <p className={cn('text-[11px] font-bold uppercase tracking-[.14em] mb-[10px] mx-1', t.sectionLabel)}>
                        {labelDescubre || `${labelDescubrir} ${locationName}`}
                    </p>
                    <div className="grid grid-cols-2 gap-[10px]">
                        {eatRecs.length > 0 && (
                            <div
                                onClick={() => onNavigate('eat')}
                                className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                                style={{ height: 110, borderRadius: 18 }}
                            >
                                <Image
                                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop"
                                    fill className="object-cover" alt={labelGastronomia}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                                <span className="absolute bottom-[10px] left-3 text-white text-[14px] font-bold"
                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
                                    {labelGastronomia}
                                </span>
                            </div>
                        )}
                        {doRecs.length > 0 && (
                            <div
                                onClick={() => onNavigate('leisure')}
                                className="relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
                                style={{ height: 110, borderRadius: 18 }}
                            >
                                <Image
                                    src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop"
                                    fill className="object-cover" alt={labelQueHacer}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                                <span className="absolute bottom-[10px] left-3 text-white text-[14px] font-bold"
                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
                                    {labelQueHacer}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── 9. FOOTER ── */}
            <motion.div variants={item} className="text-center opacity-40 pt-7 pb-6">
                <p className={cn('text-[10px] font-black tracking-[.14em] uppercase', t.chipLabel)}>
                    {labelPoweredBy} Hospyia
                </p>
            </motion.div>
        </motion.div>
    );
}
