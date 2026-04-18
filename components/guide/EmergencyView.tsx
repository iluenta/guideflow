'use client';

import React from 'react';
import {
    Phone,
    MessageSquare,
    MessageCircle,
    ShieldAlert,
    AlertCircle,
    HeartPulse,
    MapPin,
    Navigation,
    Pill,
    PawPrint,
    Car,
    Shield,
    Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { motion, Variants } from 'framer-motion';

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    address?: string;
    type: string;
    distance?: string;
    place_id?: string;
}

interface EmergencyViewProps {
    onBack: () => void;
    contactsData: {
        support_name?: string;
        support_phone?: string;
        support_mobile?: string;
        host_phone?: string;
        host_mobile?: string;
        emergency_contacts?: EmergencyContact[];
        custom_contacts?: { id: string, name: string, phone: string }[];
    };
    hostName?: string;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    accessToken?: string;
    propertyId?: string;
    disabledLanguage?: boolean;
    themeId?: string;
}

type IconComp = React.ElementType;

function getIconComponent(type: string): IconComp {
    switch (type) {
        case 'policia': case 'guardia': return Shield;
        case 'salud': return HeartPulse;
        case 'farmacia': return Pill;
        case 'bomberos': return Flame;
        case 'taxi': return Car;
        case 'veterinario': return PawPrint;
        default: return Phone;
    }
}

function ContactItem({
    contact,
    currentLanguage,
    accessToken,
    getMapsUrl,
    isCustom = false,
    propertyId,
    isDark,
    isCoastal,
    isWarm,
    isLuxury,
}: {
    contact: any;
    currentLanguage: string;
    accessToken?: string;
    getMapsUrl: (name: string, address?: string, placeId?: string) => string;
    isCustom?: boolean;
    propertyId?: string;
    isDark: boolean;
    isCoastal: boolean;
    isWarm: boolean;
    isLuxury: boolean;
}) {
    const { content: localizedName } = useLocalizedContent(contact.name, currentLanguage, 'contact_name', accessToken, propertyId);
    const { content: labelNavigate } = useLocalizedContent('Cómo llegar', currentLanguage, 'ui_label', accessToken, propertyId);

    const hasLocation = contact.place_id || (
        contact.address && !['Servicio Nacional', 'Servicio Local', 'En todo el territorio nacional'].includes(contact.address)
    );
    const Icon = getIconComponent(contact.type);
    const mapsUrl = getMapsUrl(contact.name, contact.address, contact.place_id);
    const telHref = `tel:${(contact.phone || '').replace(/\s/g, '')}`;

    // ── Coastal open layout ────────────────────────────────────────────────
    if (isCoastal) {
        if (isCustom) {
            return (
                <div className="bg-white border-l-4 border-l-[#0EA5E9] border border-[#E0F2FE] rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#0EA5E9] flex items-center justify-center shrink-0 shadow-md shadow-[#0EA5E9]/20">
                            <Phone className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#0C4A6E] font-bold text-base leading-tight">{localizedName}</span>
                            {contact.phone && <span className="text-[#64748B] text-xs mt-0.5">{contact.phone}</span>}
                        </div>
                    </div>
                    <a href={telHref} className="w-10 h-10 bg-[#0EA5E9] text-white rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 shrink-0 shadow-md shadow-[#0EA5E9]/20 transition-all">
                        <Phone className="w-5 h-5" strokeWidth={2} />
                    </a>
                </div>
            );
        }
        return (
            <div className="bg-white border-l-4 border-l-[#0EA5E9] border border-[#E0F2FE] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0EA5E9] flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-[#0EA5E9]/20">
                        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col flex-1 pt-1">
                        <h3 className="text-[#0C4A6E] font-bold text-base leading-tight mb-1">{localizedName}</h3>
                        {contact.address && (
                            <div className="flex items-start gap-1.5 text-[#64748B] text-xs mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="leading-snug">{contact.address}</span>
                            </div>
                        )}
                        {!contact.address && contact.phone && (
                            <div className="flex items-center gap-1.5 text-[#0EA5E9] text-xs font-medium">
                                <MapPin className="w-3.5 h-3.5" /><span>{contact.phone}</span>
                            </div>
                        )}
                    </div>
                    {!hasLocation && contact.phone && (
                        <a href={telHref} className="bg-[#0EA5E9] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:opacity-90 active:scale-95 shrink-0 shadow-sm transition-all">
                            <Phone className="w-4 h-4" /><span>{contact.phone}</span>
                        </a>
                    )}
                </div>
                {hasLocation && (
                    <div className="flex gap-2 mt-1">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="flex-1 bg-[#E0F2FE] text-[#0369A1] py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-[#BAE6FD] transition-colors">
                            <Navigation className="w-4 h-4" /><span>{labelNavigate}</span>
                        </a>
                        {contact.phone ? (
                            <a href={telHref} className="flex-1 bg-[#0EA5E9] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:opacity-90 shadow-sm transition-colors">
                                <Phone className="w-4 h-4" /><span>{contact.phone}</span>
                            </a>
                        ) : (
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                                className="w-12 bg-[#0EA5E9] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-colors">
                                <Phone className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ── Compact layout — Urban Dark · Warm · Luxury · Modern ─────────────────
    const cardBg = isDark ? 'bg-[#1C1C1C]' : 'bg-white';
    const cardBorder = isDark
        ? 'border-l-2 border-l-[#00E5FF] border border-[#333]'
        : isWarm
            ? 'border-l-[3px] border-l-[#D4A054] border border-[#D4A054]/10 shadow-sm'
            : isLuxury
                ? 'border-l-2 border-l-[#C9A84C] border border-[#D4C5A9] shadow-sm'
                : 'border border-[#E4E4E7] shadow-sm';
    const iconBg = isDark
        ? 'bg-[#0F0F0F] border border-[#333]'
        : isWarm ? 'bg-[#FFF8F0]'
        : isLuxury ? 'bg-[#F9F7F4] border border-[#D4C5A9]'
        : 'bg-[#F4F4F5]';
    const iconColor = isDark ? 'text-[#00E5FF]' : isWarm ? 'text-[#D4A054]' : isLuxury ? 'text-[#C9A84C]' : 'text-[#52525B]';
    const btnBg = isDark ? 'bg-[#00E5FF]' : isWarm ? 'bg-[#D4A054]' : isLuxury ? 'bg-[#1B2A4A]' : 'bg-[#18181B]';
    const btnTextColor = isDark ? 'text-black' : isLuxury ? 'text-[#C9A84C]' : 'text-white';
    const dividerColor = isDark ? 'border-[#333]' : isWarm ? 'border-[#D4A054]/10' : isLuxury ? 'border-[#D4C5A9]' : 'border-[#E4E4E7]';
    const nameColor = isDark ? 'text-white' : isWarm ? 'text-[#431407]' : isLuxury ? 'text-[#1B2A4A]' : 'text-[#09090B]';
    const metaColor = isDark ? 'text-[#888]' : isWarm ? 'text-[#8C6B5D]' : isLuxury ? 'text-[#8A8070]' : 'text-[#52525B]';
    const hoverNavColor = isDark ? 'hover:text-[#00E5FF]' : isWarm ? 'hover:text-[#D4A054]' : isLuxury ? 'hover:text-[#C9A84C]' : 'hover:text-[#18181B]';
    const luxuryFont = isLuxury ? { fontFamily: 'var(--font-heading)' } : undefined;

    if (isCustom) {
        return (
            <div className={cn('rounded-xl p-4 flex items-center justify-between', cardBg, cardBorder)}>
                <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
                        <Phone className={cn('w-5 h-5', iconColor)} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <span className={cn('font-bold text-sm uppercase tracking-wider leading-tight', nameColor)} style={luxuryFont}>{localizedName}</span>
                        {contact.phone && <span className={cn('text-[10px] mt-0.5', metaColor)}>{contact.phone}</span>}
                    </div>
                </div>
                <a href={telHref} className={cn('w-8 h-8 rounded-full flex items-center justify-center active:scale-95 shrink-0 transition-all', btnBg, btnTextColor)}>
                    <Phone className="w-4 h-4" strokeWidth={2} />
                </a>
            </div>
        );
    }

    return (
        <div className={cn('rounded-xl p-4 flex flex-col gap-3', cardBg, cardBorder)}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
                        <Icon className={cn('w-5 h-5', iconColor)} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className={cn('font-bold text-sm uppercase tracking-wider leading-tight mb-1', nameColor)} style={luxuryFont}>{localizedName}</h3>
                        {contact.address && (
                            <div className={cn('flex items-start gap-1 text-[10px] mt-0.5', metaColor)}>
                                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="leading-tight">{contact.address}</span>
                            </div>
                        )}
                        {!contact.address && contact.phone && (
                            <div className={cn('flex items-center gap-1 text-[10px]', metaColor)}>
                                <MapPin className="w-3 h-3" /><span>{contact.phone}</span>
                            </div>
                        )}
                    </div>
                </div>
                {!hasLocation && contact.phone && (
                    <a href={telHref} className={cn('px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shrink-0 active:scale-95 transition-all', btnBg, btnTextColor)}>
                        <Phone className="w-3 h-3" /><span>{contact.phone}</span>
                    </a>
                )}
            </div>

            {hasLocation && (
                <div className={cn('flex items-center justify-between pt-3 border-t', dividerColor)}>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                        className={cn('flex items-center gap-1.5 text-xs transition-colors', metaColor, hoverNavColor)}>
                        <Navigation className="w-3 h-3" /><span>{labelNavigate}</span>
                    </a>
                    {contact.phone ? (
                        <a href={telHref} className={cn('px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all', btnBg, btnTextColor)}>
                            <Phone className="w-3 h-3" /><span>{contact.phone}</span>
                        </a>
                    ) : (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                            className={cn('w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all', btnBg, btnTextColor)}>
                            <Phone className="w-4 h-4" />
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVars: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'circOut' } }
};

export function EmergencyView({
    onBack,
    contactsData,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false,
    themeId = 'modern_v2',
}: EmergencyViewProps) {
    const isDark = themeId === 'urban';
    const isCoastal = themeId === 'coastal';
    const isWarm = themeId === 'warm';
    const isLuxury = themeId === 'luxury';

    const { content: labelEmergencyTitle } = useLocalizedContent('Emergencias', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNationalService } = useLocalizedContent('Servicio Nacional', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEmergencyCall112 } = useLocalizedContent('En caso de emergencia, llama al 112', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDirectSupport } = useLocalizedContent('Soporte Directo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuestSupport } = useLocalizedContent('Atención al huésped', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelLocalServices } = useLocalizedContent('Servicios Locales', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOtherContacts } = useLocalizedContent('Otros Contactos', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAsistencia } = useLocalizedContent('Asistencia', currentLanguage, 'ui_label', accessToken, propertyId);

    const getMapsUrl = (name: string, address?: string, placeId?: string) => {
        const query = encodeURIComponent(address || name);
        let url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        if (placeId) url += `&query_place_id=${placeId}`;
        return url;
    };

    const sharedProps = { currentLanguage, accessToken, propertyId, getMapsUrl, isDark, isCoastal, isWarm, isLuxury };

    // Support card icon/button sizes differ: coastal → large circle; compact → small square
    const supportIconClass = isCoastal
        ? 'w-12 h-12 rounded-full bg-[#0EA5E9] shadow-md shadow-[#0EA5E9]/20'
        : isDark
            ? 'w-10 h-10 rounded-xl bg-[#0F0F0F] border border-[#333]'
            : isWarm
                ? 'w-10 h-10 rounded-xl bg-[#FFF8F0]'
                : isLuxury
                    ? 'w-10 h-10 rounded-xl bg-[#F9F7F4] border border-[#D4C5A9]'
                    : 'w-10 h-10 rounded-xl bg-[#F4F4F5]';
    const supportIconInner = isCoastal ? 'text-white' : isDark ? 'text-[#00E5FF]' : isWarm ? 'text-[#D4A054]' : isLuxury ? 'text-[#C9A84C]' : 'text-[#52525B]';
    const supportBtnSize = isCoastal ? 'w-10 h-10' : 'w-8 h-8';
    const supportCardClass = isCoastal
        ? 'bg-white border border-[#E0F2FE] rounded-2xl p-5 shadow-sm'
        : isDark
            ? 'bg-[#1C1C1C] border border-[#333] rounded-xl p-4'
            : isWarm
                ? 'bg-white border border-[#D4A054]/10 rounded-xl p-4 shadow-sm'
                : isLuxury
                    ? 'bg-white border border-[#D4C5A9] rounded-xl p-4 shadow-sm'
                    : 'bg-white border border-[#E4E4E7] rounded-xl p-4 shadow-sm';
    const waBtnClass = isCoastal
        ? `${supportBtnSize} rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0EA5E9] hover:bg-[#BAE6FD] active:scale-95 transition-all`
        : isDark
            ? `${supportBtnSize} rounded-full bg-[#1C1C1C] border border-[#00E5FF] flex items-center justify-center text-[#00E5FF] hover:bg-[#00E5FF] hover:text-black active:scale-95 transition-all`
            : isWarm
                ? `${supportBtnSize} rounded-full bg-white border border-[#D4A054]/30 flex items-center justify-center text-[#D4A054] hover:bg-[#FFF8F0] active:scale-95 transition-all`
                : isLuxury
                    ? `${supportBtnSize} rounded-full bg-[#F9F7F4] border border-[#D4C5A9] flex items-center justify-center text-[#C9A84C] hover:border-[#C9A84C]/60 active:scale-95 transition-all`
                    : `${supportBtnSize} rounded-full bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center text-[#52525B] hover:bg-[#E4E4E7] active:scale-95 transition-all`;
    const phoneBtnClass = isCoastal
        ? `${supportBtnSize} rounded-full bg-[#0EA5E9] flex items-center justify-center text-white hover:opacity-90 shadow-md shadow-[#0EA5E9]/20 active:scale-95 transition-all`
        : isDark
            ? `${supportBtnSize} rounded-full bg-[#00E5FF] flex items-center justify-center text-black hover:opacity-80 active:scale-95 transition-all`
            : isWarm
                ? `${supportBtnSize} rounded-full bg-[#D4A054] flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all`
                : isLuxury
                    ? `${supportBtnSize} rounded-full bg-[#1B2A4A] flex items-center justify-center text-[#C9A84C] hover:opacity-90 active:scale-95 transition-all`
                    : `${supportBtnSize} rounded-full bg-[#18181B] flex items-center justify-center text-white hover:opacity-80 active:scale-95 transition-all`;
    const supportNameColor = isDark ? 'text-white' : isWarm ? 'text-[#431407]' : isLuxury ? 'text-[#1B2A4A]' : isCoastal ? 'text-[#0C4A6E]' : 'text-[#09090B]';
    const supportSubColor = isDark ? 'text-[#00E5FF]' : isWarm ? 'text-[#D4A054]' : isLuxury ? 'text-[#C9A84C]' : isCoastal ? 'text-[#0EA5E9]' : 'text-[#52525B]';

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader title={labelEmergencyTitle} onBack={onBack} currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} disabledLanguage={disabledLanguage} />

            <motion.div className="px-6 py-6 flex flex-col gap-6 pb-32 max-w-md mx-auto" variants={containerVars} initial="hidden" animate="show">

                {/* 112 Banner */}
                <motion.div variants={itemVars}>
                    {isDark ? (
                        <div className="bg-[#7F1D1D]/20 border border-[#7F1D1D] rounded-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#7F1D1D]/40 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">{labelNationalService}</div>
                                <div className="text-red-400 text-sm font-medium">{labelEmergencyCall112}</div>
                            </div>
                        </div>
                    ) : isCoastal ? (
                        <div className="bg-white border-l-4 border-l-red-500 border border-[#E0F2FE] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">{labelNationalService}</div>
                                <div className="text-[#0C4A6E] text-sm font-bold">{labelEmergencyCall112}</div>
                            </div>
                        </div>
                    ) : isWarm ? (
                        <div className="bg-white border-l-4 border-l-red-500 border border-[#D4A054]/10 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">{labelNationalService}</div>
                                <div className="text-[#431407] text-sm font-bold">{labelEmergencyCall112}</div>
                            </div>
                        </div>
                    ) : isLuxury ? (
                        <div className="bg-white border-l-4 border-l-red-500 border border-[#D4C5A9] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">{labelNationalService}</div>
                                <div className="text-[#1B2A4A] text-sm font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{labelEmergencyCall112}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border-l-4 border-l-red-500 border border-[#E4E4E7] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-0.5">{labelNationalService}</div>
                                <div className="text-[#09090B] text-sm font-bold">{labelEmergencyCall112}</div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Support Contact */}
                {(contactsData.support_phone || contactsData.support_mobile) && (
                    <motion.div variants={itemVars} className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{labelDirectSupport}</h3>
                        <div className={cn('flex items-center justify-between', supportCardClass)}>
                            <div className="flex items-center gap-3">
                                <div className={cn('flex items-center justify-center shrink-0', supportIconClass)}>
                                    <ShieldAlert className={cn('w-5 h-5', isCoastal ? 'w-6 h-6' : 'w-5 h-5', supportIconInner)} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn('font-bold text-sm leading-tight', supportNameColor)}>
                                        {contactsData.support_name || labelAsistencia}
                                    </span>
                                    <span className={cn('text-[10px] font-bold uppercase tracking-wider mt-0.5', supportSubColor)}>{labelGuestSupport}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={`https://wa.me/${(contactsData.support_mobile || contactsData.support_phone || '').replace(/\s+/g, '').replace('+', '')}`}
                                    target="_blank" rel="noopener noreferrer" className={waBtnClass}>
                                    {isCoastal ? <MessageCircle className="w-5 h-5" strokeWidth={2} /> : <MessageSquare className="w-4 h-4" strokeWidth={2} />}
                                </a>
                                <a href={`tel:${(contactsData.support_phone || contactsData.support_mobile || '').replace(/\s/g, '')}`} className={phoneBtnClass}>
                                    {isCoastal ? <Phone className="w-5 h-5" strokeWidth={2} /> : <Phone className="w-4 h-4" strokeWidth={2} />}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Local Emergency Contacts */}
                {contactsData.emergency_contacts && contactsData.emergency_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{labelLocalServices}</h3>
                        <div className="flex flex-col gap-3">
                            {(contactsData.emergency_contacts || []).filter(c => c.phone !== '112').map((contact, idx) => (
                                <ContactItem key={`${contact.id}-${idx}`} contact={contact} {...sharedProps} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Custom Contacts */}
                {contactsData.custom_contacts && contactsData.custom_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="flex flex-col gap-3">
                        <h3 className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{labelOtherContacts}</h3>
                        <div className="flex flex-col gap-3">
                            {(contactsData.custom_contacts || []).map((contact, idx) => (
                                <ContactItem key={`${contact.id}-${idx}`} contact={contact} {...sharedProps} isCustom />
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
