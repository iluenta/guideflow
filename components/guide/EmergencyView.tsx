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
import { motion, Variants } from 'framer-motion';

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    address?: string;
    type: string;
    distance?: string;
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
    onLanguageChange
}: EmergencyViewProps) {
    const isEs = currentLanguage === 'es';

    const getIcon = (type: string) => {
        switch (type) {
            case 'policia': return <ShieldAlert className="w-5 h-5" strokeWidth={2} />;
            case 'salud': return <HeartPulse className="w-5 h-5" strokeWidth={2} />;
            case 'farmacia': return <Plus className="w-5 h-5" strokeWidth={2} />;
            case 'bomberos': return <Phone className="w-5 h-5" strokeWidth={2} />;
            default: return <Phone className="w-5 h-5" strokeWidth={2} />;
        }
    };

    const handleCall = (phone: string) => {
        if (!phone) return;
        window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    };

    const handleWhatsApp = (phone: string) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleDirections = (name: string, address?: string) => {
        const query = encodeURIComponent(address || name);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS
            ? `http://maps.apple.com/?q=${query}`
            : `https://www.google.com/maps/search/?api=1&query=${query}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader
                title={isEs ? 'Emergencias' : 'Emergency'}
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
                            {isEs ? 'Servicio Nacional' : 'National Service'}
                        </h2>
                        <p className="text-rose-900 font-serif text-base font-bold leading-tight">
                            {isEs ? 'En caso de emergencia, llama al 112' : 'In case of emergency, call 112'}
                        </p>
                    </div>
                </motion.div>

                {/* Support Contact */}
                {(contactsData.support_phone || contactsData.support_mobile) && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {isEs ? 'Soporte Directo' : 'Direct Support'}
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
                                        {isEs ? 'Atención al huésped' : 'Guest support'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <button
                                    onClick={() => handleWhatsApp(contactsData.support_mobile || contactsData.support_phone || '')}
                                    className="w-10 h-10 bg-green-50 text-[#1FC170] rounded-full flex items-center justify-center hover:bg-green-100 transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageSquare className="w-4.5 h-4.5" strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleCall(contactsData.support_phone || contactsData.support_mobile || '')}
                                    className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <Phone className="w-4.5 h-4.5" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Local Emergency Contacts */}
                {contactsData.emergency_contacts && contactsData.emergency_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {isEs ? 'Servicios Locales' : 'Local Services'}
                        </h3>
                        <div className="space-y-3">
                            {contactsData.emergency_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="bg-surface rounded-3xl p-4 shadow-sm border border-primary/[0.01] flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-100/50">
                                            {getIcon(contact.type)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden text-left">
                                            <span className="text-slate-800 font-bold text-sm leading-tight truncate font-sans">{contact.name}</span>
                                            {contact.distance && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3 h-3 text-primary/20" />
                                                    <span className="text-[10px] text-primary/40 font-bold tracking-tight">{contact.distance}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10">
                                        <button
                                            onClick={() => handleDirections(contact.name, contact.address)}
                                            className="w-9 h-9 bg-primary/[0.04] text-primary rounded-full flex items-center justify-center hover:bg-primary/[0.08] transition-all active:scale-95 shrink-0 shadow-sm"
                                        >
                                            <MapPin className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                        <button
                                            onClick={() => handleCall(contact.phone)}
                                            className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 shrink-0"
                                        >
                                            <Phone className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Custom Contacts */}
                {contactsData.custom_contacts && contactsData.custom_contacts.length > 0 && (
                    <motion.div variants={itemVars} className="space-y-3">
                        <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] px-2">
                            {isEs ? 'Otros Contactos' : 'Other Contacts'}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {contactsData.custom_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="bg-surface rounded-3xl p-4 shadow-sm border border-primary/[0.01] flex items-center justify-between group"
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="text-slate-800 font-bold text-sm tracking-tight">{contact.name}</span>
                                        <span className="text-[11px] text-primary/40 font-medium mt-0.5">{contact.phone}</span>
                                    </div>
                                    <button
                                        onClick={() => handleCall(contact.phone)}
                                        className="w-9 h-9 bg-primary/[0.04] text-primary rounded-full flex items-center justify-center hover:bg-primary/[0.08] transition-all active:scale-95 shrink-0"
                                    >
                                        <Phone className="w-4 h-4" strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
