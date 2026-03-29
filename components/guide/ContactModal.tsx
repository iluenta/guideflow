'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { getGuideTheme } from '@/lib/guide-theme';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactsData: any;
    currentLanguage?: string;
    accessToken?: string;
    propertyId?: string;
    themeId?: string;
}

export function ContactModal({
    isOpen,
    onClose,
    contactsData = {},
    currentLanguage = 'es',
    accessToken,
    propertyId,
    themeId = 'modern_v2'
}: ContactModalProps) {
    const t = getGuideTheme(themeId);

    // Labels
    const { content: labelTitle } = useLocalizedContent('Contacto', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSubtitle } = useLocalizedContent('¿En qué podemos ayudarte?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHost } = useLocalizedContent('Anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSupport } = useLocalizedContent('Soporte', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelPreferred } = useLocalizedContent('Preferente', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCall } = useLocalizedContent('Llamar a', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWhatsapp } = useLocalizedContent('WhatsApp', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelMobile } = useLocalizedContent('Teléfono móvil', currentLanguage, 'ui_label', accessToken, propertyId);

    if (!isOpen) return null;

    const hostPhone = contactsData.host_mobile || contactsData.host_phone;
    const supportPhone = contactsData.support_mobile || contactsData.support_phone;
    const preferredId = contactsData.preferred_contact_id || 'host';

    const renderContactCard = (type: 'host' | 'support') => {
        const isHost = type === 'host';
        const name = isHost ? (contactsData.host_name || 'Anfitrión') : (contactsData.support_name || 'Soporte');
        const phone = isHost ? hostPhone : supportPhone;
        const isPreferred = preferredId === type;
        const label = isHost ? labelHost : labelSupport;

        if (!phone) return null;

        const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
        const telLink = `tel:${phone.replace(/\s+/g, '')}`;
        const waLink = `https://wa.me/${cleanPhone}`;

        return (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col gap-2">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </span>
                    {isPreferred && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#E8F8EE] text-[#14833D] rounded-full">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-[8px] font-bold tracking-wide">
                                {labelPreferred}
                            </span>
                        </div>
                    )}
                </div>

                {/* Name */}
                <span className="text-base font-bold text-slate-900 leading-none mt-1">
                    {name}
                </span>

                {/* Info */}
                <div className="flex items-center gap-2.5 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                        {name ? (
                            <span className="text-sm font-bold text-slate-500">
                                {name.charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 font-medium">
                            {labelMobile}
                        </span>
                        <span className="text-xs font-bold text-slate-800 tracking-tight">
                            {phone}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 mt-1.5">
                    <a
                        href={telLink}
                        className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.98] bg-[#111827] text-white hover:bg-slate-800"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider text-[10px]">{labelCall} {name.split(' ')[0]}</span>
                    </a>
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all active:scale-[0.98] bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
                    >
                        <MessageCircle className="w-3.5 h-3.5 text-[#14833D]" />
                        <span className="uppercase tracking-wider text-[10px]">{labelWhatsapp}</span>
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

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative bg-stone-50 w-full max-w-[340px] rounded-3xl p-4 shadow-2xl flex flex-col gap-3 overflow-y-auto max-h-[85vh] z-10"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1 px-1">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold font-sans text-slate-900 tracking-tight">
                                {labelTitle}
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {labelSubtitle}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 bg-slate-200/50 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-4">
                        {renderContactCard('host')}
                        {renderContactCard('support')}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
