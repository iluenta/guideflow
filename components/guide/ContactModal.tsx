'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle, User } from 'lucide-react';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactsData: any;
    hostName?: string;
    currentLanguage?: string;
    accessToken?: string;
    propertyId?: string;
    themeId?: string;
}

interface HeroCardColors {
    bg: string;
    text: string;
    btnPrimary: string;
    btnSecondary: string;
    badge: string;
}

function getHeroCardColors(themeId?: string): HeroCardColors {
    switch (themeId) {
        case 'urban':
            return {
                bg: 'bg-zinc-900 border border-zinc-800',
                text: 'text-white',
                btnPrimary: 'bg-[#00E5FF] text-black',
                btnSecondary: 'bg-zinc-800 text-white border border-zinc-700',
                badge: 'text-[#00E5FF]/70',
            };
        case 'warm':
            return {
                bg: 'bg-[#8B5E3C]',
                text: 'text-white',
                btnPrimary: 'bg-white text-[#8B5E3C]',
                btnSecondary: 'bg-white/20 text-white border border-white/30',
                badge: 'text-white/70',
            };
        case 'luxury':
            return {
                bg: 'bg-[#1B2A4A]',
                text: 'text-white',
                btnPrimary: 'bg-[#C9A84C] text-[#1B2A4A]',
                btnSecondary: 'bg-white/10 text-white border border-white/20',
                badge: 'text-white/60',
            };
        case 'modern':
        case 'modern_v2':
            return {
                bg: 'bg-zinc-950',
                text: 'text-white',
                btnPrimary: 'bg-white text-black',
                btnSecondary: 'bg-zinc-900 text-white border border-zinc-800',
                badge: 'text-zinc-500',
            };
        case 'coastal':
        default:
            return {
                bg: 'bg-[#1593D2]',
                text: 'text-white',
                btnPrimary: 'bg-white text-[#1593D2]',
                btnSecondary: 'bg-white/20 text-white border border-white/30',
                badge: 'text-white/70',
            };
    }
}

export function ContactModal({
    isOpen,
    onClose,
    contactsData = {},
    hostName,
    currentLanguage = 'es',
    accessToken,
    propertyId,
    themeId = 'modern_v2',
}: ContactModalProps) {
    const { content: labelTitle } = useLocalizedContent('¿En qué podemos ayudarte?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSubtitle } = useLocalizedContent('Estamos para lo que necesitas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHost } = useLocalizedContent('Anfitriones', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSupport } = useLocalizedContent('Soporte', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRecommended } = useLocalizedContent('Recomendado', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCall } = useLocalizedContent('Llamar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWhatsapp } = useLocalizedContent('WhatsApp', currentLanguage, 'ui_label', accessToken, propertyId);

    if (!isOpen) return null;

    const hostPhone = contactsData.host_mobile || contactsData.host_phone;
    const supportPhone = contactsData.support_mobile || contactsData.support_phone;
    const preferredId = contactsData.preferred_contact_id || 'host';
    const heroColors = getHeroCardColors(themeId);

    const preferred: 'host' | 'support' = preferredId === 'support' ? 'support' : 'host';
    const secondary: 'host' | 'support' = preferred === 'support' ? 'host' : 'support';

    const getContactInfo = (type: 'host' | 'support') => ({
        name: type === 'host'
            ? (hostName || contactsData.host_name || 'Anfitrión')
            : (contactsData.support_name || 'Soporte'),
        phone: type === 'host' ? hostPhone : supportPhone,
        label: type === 'host' ? labelHost : labelSupport,
    });

    const renderPrimaryCard = (type: 'host' | 'support') => {
        const { name, phone, label } = getContactInfo(type);
        if (!phone) return null;

        const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
        const telLink = `tel:${phone.replace(/\s+/g, '')}`;
        const waLink = `https://wa.me/${cleanPhone}`;

        return (
            <div className={`${heroColors.bg} rounded-2xl p-4 flex flex-col gap-3`}>
                {/* Badge row */}
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${heroColors.badge}`}>
                        {label}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${heroColors.badge}`}>·</span>
                    <div className="flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${heroColors.badge}`}>
                            {labelRecommended}
                        </span>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <p className={`text-2xl font-bold leading-tight ${heroColors.text}`}>{name}</p>
                    <p className={`text-sm font-medium mt-0.5 ${heroColors.text} opacity-80`}>{phone}</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-1">
                    <a
                        href={telLink}
                        className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-[0.98] ${heroColors.btnPrimary}`}
                    >
                        <Phone className="w-3.5 h-3.5" />
                        {labelCall}
                    </a>
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-[0.98] ${heroColors.btnSecondary}`}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {labelWhatsapp}
                    </a>
                </div>
            </div>
        );
    };

    const renderSecondaryCard = (type: 'host' | 'support') => {
        const { name, phone, label } = getContactInfo(type);
        if (!phone) return null;

        const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
        const telLink = `tel:${phone.replace(/\s+/g, '')}`;
        const waLink = `https://wa.me/${cleanPhone}`;

        return (
            <div className="bg-surface rounded-2xl px-4 py-3 border border-primary/[0.06] flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/[0.08] flex items-center justify-center shrink-0 border border-primary/[0.05]">
                    {name ? (
                        <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {label}
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">{name}</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">{phone}</span>
                </div>

                {/* Icon buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <a
                        href={telLink}
                        className="w-8 h-8 rounded-full bg-primary/[0.06] hover:bg-primary/[0.12] flex items-center justify-center transition-colors active:scale-95"
                    >
                        <Phone className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                    </a>
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-primary/[0.06] hover:bg-primary/[0.12] flex items-center justify-center transition-colors active:scale-95"
                    >
                        <MessageCircle className="w-3.5 h-3.5 text-[#14833D]" />
                    </a>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative bg-surface w-full max-w-[340px] rounded-3xl p-4 shadow-2xl flex flex-col gap-3 overflow-y-auto max-h-[85vh] z-10"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between px-1">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/[0.06] flex items-center justify-center shrink-0">
                                <Phone className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base font-bold text-[var(--color-text-primary)] leading-tight">
                                    {labelTitle}
                                </h2>
                                <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                                    {labelSubtitle}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 bg-primary/[0.06] hover:bg-primary/[0.12] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] transition-colors shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2.5">
                        {renderPrimaryCard(preferred)}
                        {renderSecondaryCard(secondary)}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
