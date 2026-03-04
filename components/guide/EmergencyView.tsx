'use client';

import {
    Phone,
    MessageSquare,
    ShieldAlert,
    Plus,
    AlertCircle,
    User,
    Clock,
    HeartPulse,
    MapPin
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { cn } from '@/lib/utils';
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
    propertyId?: string; // FASE 17
}

function ContactItem({
    contact,
    idx,
    currentLanguage,
    accessToken,
    getIcon,
    getMapsUrl,
    isCustom = false,
    propertyId // FASE 17
}: {
    contact: any,
    idx: number,
    currentLanguage: string,
    accessToken?: string,
    getIcon: (type: string) => any,
    getMapsUrl: (name: string, address?: string, placeId?: string) => string,
    isCustom?: boolean,
    propertyId?: string // FASE 17
}) {
    const { content: localizedName } = useLocalizedContent(contact.name, currentLanguage, 'contact_name', accessToken, propertyId);
    const { content: localizedDistance } = useLocalizedContent(contact.distance || '', currentLanguage, 'contact_distance', accessToken, propertyId);

    if (isCustom) {
        return (
            <div
                key={`${contact.id}-${idx}`}
                className="bg-surface rounded-3xl p-4 shadow-sm border border-primary/[0.01] flex items-center justify-between group"
            >
                <div className="flex flex-col text-left">
                    <span className="text-slate-800 font-bold text-sm tracking-tight">{localizedName}</span>
                    <span className="text-[11px] text-primary/40 font-medium mt-0.5">{contact.phone}</span>
                </div>
                <a
                    href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
                    className="w-9 h-9 bg-primary/[0.04] text-primary rounded-full flex items-center justify-center hover:bg-primary/[0.08] transition-all active:scale-95 shrink-0"
                >
                    <Phone className="w-4 h-4" strokeWidth={2} />
                </a>
            </div>
        );
    }

    return (
        <div
            key={`${contact.id}-${idx}`}
            className="bg-surface rounded-3xl p-4 shadow-sm border border-primary/[0.01] flex items-center justify-between group"
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-100/50">
                    {getIcon(contact.type)}
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-slate-800 font-bold text-sm leading-tight truncate font-sans">{localizedName}</span>
                    {localizedDistance && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-primary/20" />
                            <span className="text-[10px] text-primary/40 font-bold tracking-tight">{localizedDistance}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 relative z-10">
                <a
                    href={getMapsUrl(contact.name, contact.address, contact.place_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 bg-primary/[0.04] text-primary rounded-full flex items-center justify-center hover:bg-primary/[0.08] transition-all active:scale-95 shrink-0 shadow-sm"
                >
                    <MapPin className="w-4 h-4" strokeWidth={2} />
                </a>
                <a
                    href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
                    className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 shrink-0"
                >
                    <Phone className="w-4 h-4" strokeWidth={2} />
                </a>
            </div>
        </div>
    );
}

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVars: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'circOut' } }
};

export function EmergencyView({
    onBack,
    contactsData,
    hostName,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId // FASE 17
}: EmergencyViewProps) {
    const isEs = currentLanguage === 'es';

    // Localize UI Labels
    const { content: labelEmergencyTitle } = useLocalizedContent('Emergencias', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNationalService } = useLocalizedContent('Servicio Nacional', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEmergencyCall112 } = useLocalizedContent('En caso de emergencia, llama al 112', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDirectSupport } = useLocalizedContent('Soporte Directo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuestSupport } = useLocalizedContent('Atención al huésped', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelLocalServices } = useLocalizedContent('Servicios Locales', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOtherContacts } = useLocalizedContent('Otros Contactos', currentLanguage, 'ui_label', accessToken, propertyId);

    const getIcon = (type: string) => {
        switch (type) {
            case 'policia': return <ShieldAlert className="w-5 h-5" strokeWidth={2} />;
            case 'salud': return <HeartPulse className="w-5 h-5" strokeWidth={2} />;
            case 'farmacia': return <Plus className="w-5 h-5" strokeWidth={2} />;
            case 'bomberos': return <Phone className="w-5 h-5" strokeWidth={2} />;
            default: return <Phone className="w-5 h-5" strokeWidth={2} />;
        }
    };

    // getMapsUrl: same logic as GuestChat — Apple Maps on iOS, Google Maps elsewhere
    const getMapsUrl = (name: string, address?: string, placeId?: string) => {
        const query = encodeURIComponent(address || name);
        const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(window.navigator.userAgent);

        if (isIOS) {
            return `maps://?q=${query}`;
        }

        if (placeId) {
            return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${placeId}`;
        }

        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader
                title={labelEmergencyTitle}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <motion.div
                className="px-6 py-6 space-y-6 pb-32 max-w-md mx-auto"
                variants={containerVars}
                initial="hidden"
                animate="show"
            >
                {/* 112 Banner - Restored to red for high visibility */}
                <motion.div
                    variants={itemVars}
                    className="bg-rose-50/50 border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
                >
                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-200 animate-pulse">
                        <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <h2 className="text-rose-600 font-black text-[10px] uppercase tracking-widest mb-0.5">
                            {labelNationalService}
                        </h2>
                        <p className="text-rose-900 font-serif text-base font-bold leading-tight">
                            {labelEmergencyCall112}
                        </p>
                    </div>
                </motion.div>

                {/* Support Contact */}
                {(contactsData.support_phone || contactsData.support_mobile) && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {labelDirectSupport}
                        </h3>
                        <div className="bg-surface rounded-3xl p-5 shadow-card border border-primary/[0.02] flex items-center justify-between group overflow-hidden relative">
                            <div className="absolute inset-0 bg-primary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-primary/[0.04] rounded-2xl flex items-center justify-center text-primary shrink-0 transition-transform duration-500 group-hover:scale-105">
                                    <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-800 font-serif text-lg font-bold leading-tight">
                                        {contactsData.support_name || 'Bianca'}
                                    </span>
                                    <span className="text-[11px] text-primary/50 font-medium uppercase tracking-wider mt-0.5">
                                        {labelGuestSupport}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <a
                                    href={`https://wa.me/${(contactsData.support_mobile || contactsData.support_phone || '').replace(/\s+/g, '').replace('+', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-green-50 text-[#1FC170] rounded-full flex items-center justify-center hover:bg-green-100 transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageSquare className="w-4.5 h-4.5" strokeWidth={2.5} />
                                </a>
                                <a
                                    href={`tel:${(contactsData.support_phone || contactsData.support_mobile || '').replace(/\s/g, '')}`}
                                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <Phone className="w-4.5 h-4.5" strokeWidth={2} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Local Emergency Contacts */}
                {contactsData.emergency_contacts && contactsData.emergency_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {labelLocalServices}
                        </h3>
                        <div className="space-y-3">
                            {(contactsData.emergency_contacts || []).map((contact, idx) => (
                                <ContactItem
                                    key={`${contact.id}-${idx}`}
                                    contact={contact}
                                    idx={idx}
                                    currentLanguage={currentLanguage}
                                    accessToken={accessToken}
                                    propertyId={propertyId}
                                    getIcon={getIcon}
                                    getMapsUrl={getMapsUrl}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Custom Contacts */}
                {contactsData.custom_contacts && contactsData.custom_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {labelOtherContacts}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {(contactsData.custom_contacts || []).map((contact, idx) => (
                                <ContactItem
                                    key={`${contact.id}-${idx}`}
                                    contact={contact}
                                    idx={idx}
                                    currentLanguage={currentLanguage}
                                    accessToken={accessToken}
                                    propertyId={propertyId}
                                    getIcon={getIcon}
                                    getMapsUrl={getMapsUrl}
                                    isCustom={true}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
