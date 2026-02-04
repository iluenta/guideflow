'use client';

import React from 'react';
import {
    Phone,
    MessageSquare,
    ChevronLeft,
    ShieldAlert,
    Plus,
    AlertCircle,
    Home,
    User,
    Clock,
    HeartPulse,
    MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

export function EmergencyView({ onBack, contactsData, hostName, currentLanguage = 'es' }: EmergencyViewProps) {
    const isEs = currentLanguage === 'es';

    const getIcon = (type: string) => {
        switch (type) {
            case 'policia': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
            case 'salud': return <HeartPulse className="w-4 h-4 text-rose-500" />;
            case 'farmacia': return <Plus className="w-4 h-4 text-rose-500" />;
            case 'bomberos': return <Phone className="w-4 h-4 text-rose-500" />;
            default: return <Phone className="w-4 h-4 text-rose-500" />;
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
        <div className="min-h-screen bg-[#F5F1EB] animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-navy/5 px-4 h-14 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-1.5 -ml-1 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="font-serif text-xl text-[#1E3A5F] font-medium tracking-tight">
                    {isEs ? 'Emergencias' : 'Emergency'}
                </h1>
            </header>

            <div className="px-5 py-5 space-y-6 pb-32">
                {/* 112 Banner - More compact */}
                <div className="bg-[#FFF0F3] border border-rose-50 rounded-xl p-4 flex items-center gap-4 shadow-sm animate-in slide-in-from-top-2 duration-700">
                    <div className="w-10 h-10 bg-[#FF1E56] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[#FF1E56] font-bold text-sm leading-tight">
                            {isEs ? 'En caso de emergencia grave, llama al 112' : 'In case of serious emergency, call 112'}
                        </p>
                        <p className="text-[#FF1E56]/60 text-[9px] uppercase font-black tracking-widest mt-0.5">
                            {isEs ? 'SERVICIO NACIONAL' : 'NATIONAL SERVICE'}
                        </p>
                    </div>
                </div>

                {/* Support Contact */}
                {(contactsData.support_phone || contactsData.support_mobile) && (
                    <div className="space-y-2.5">
                        <h3 className="text-[9px] font-black text-navy/30 uppercase tracking-[0.2em] px-1">
                            {isEs ? 'SOPORTE' : 'SUPPORT'}
                        </h3>
                        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-navy/[0.01] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#F0F4F8] rounded-xl flex items-center justify-center text-[#1E3A5F] shrink-0">
                                    <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-navy font-bold text-[15px] leading-tight">
                                        {contactsData.support_name || 'Bianca'}
                                    </span>
                                    <span className="text-[12px] text-navy/60 font-medium">{isEs ? 'Atención al huésped' : 'Guest support'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleWhatsApp(contactsData.support_mobile || contactsData.support_phone || '')}
                                    className="w-10 h-10 bg-[#E8F8F0] text-[#1FC170] rounded-full flex items-center justify-center hover:bg-[#DCF1E8] transition-colors active:scale-95"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleCall(contactsData.support_phone || contactsData.support_mobile || '')}
                                    className="w-10 h-10 bg-[#1A2533] text-white rounded-full flex items-center justify-center hover:bg-navy/90 transition-colors active:scale-95 shadow-sm"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Host Contact */}
                {(contactsData.host_phone || contactsData.host_mobile) && (
                    <div className="space-y-2.5">
                        <h3 className="text-[9px] font-black text-navy/30 uppercase tracking-[0.2em] px-1">
                            {isEs ? 'TU ANFITRIÓN' : 'YOUR HOST'}
                        </h3>
                        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-navy/[0.01] flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#F0F4F8] rounded-xl flex items-center justify-center text-[#1E3A5F] shrink-0">
                                    <User className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-navy font-bold text-[15px] leading-tight">
                                        {isEs ? `Llamar a ${hostName}` : `Call ${hostName}`}
                                    </span>
                                    <span className="text-[12px] text-navy/60 font-medium">WhatsApp / Llamada</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleWhatsApp(contactsData.host_mobile || contactsData.host_phone || '')}
                                    className="w-10 h-10 bg-[#E8F8F0] text-[#1FC170] rounded-full flex items-center justify-center hover:bg-[#DCF1E8] transition-colors active:scale-95"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleCall(contactsData.host_phone || contactsData.host_mobile || '')}
                                    className="w-10 h-10 bg-[#1A2533] text-white rounded-full flex items-center justify-center hover:bg-navy/90 transition-colors active:scale-95 shadow-sm"
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Local Emergency Contacts (AI populated) */}
                {contactsData.emergency_contacts && contactsData.emergency_contacts.length > 0 ? (
                    <div className="space-y-2.5">
                        <h3 className="text-[9px] font-black text-navy/30 uppercase tracking-[0.2em] px-1">
                            {isEs ? 'SERVICIOS LOCALES' : 'LOCAL SERVICES'}
                        </h3>
                        <div className="space-y-2.5">
                            {contactsData.emergency_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="bg-white rounded-2xl p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-navy/[0.01] flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                                            {getIcon(contact.type)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-navy font-bold text-[15px] leading-tight truncate">{contact.name}</span>
                                            {contact.distance && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3 text-navy/20" />
                                                    <span className="text-[12px] text-navy/50 font-medium">{contact.distance}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDirections(contact.name, contact.address)}
                                            className="w-10 h-10 bg-[#F0F4F8] text-[#1E3A5F] rounded-full flex items-center justify-center hover:bg-[#E2E8F0] transition-colors active:scale-95 shadow-sm shrink-0"
                                            title={isEs ? 'Cómo llegar' : 'Get directions'}
                                        >
                                            <MapPin className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleCall(contact.phone)}
                                            className="w-10 h-10 bg-[#1A2533] text-white rounded-full flex items-center justify-center hover:bg-navy/90 transition-colors active:scale-95 shadow-sm shrink-0"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-10 text-center opacity-20">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs uppercase font-black tracking-widest">
                            {isEs ? 'Sin servicios locales' : 'No local services'}
                        </p>
                    </div>
                )}

                {/* Custom Contacts */}
                {contactsData.custom_contacts && contactsData.custom_contacts.length > 0 && (
                    <div className="space-y-2.5">
                        <h3 className="text-[9px] font-black text-navy/30 uppercase tracking-[0.2em] px-1">
                            {isEs ? 'OTROS CONTACTOS' : 'OTHER CONTACTS'}
                        </h3>
                        <div className="space-y-2">
                            {contactsData.custom_contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="bg-white rounded-xl p-3 shadow-sm border border-navy/[0.01] flex items-center justify-between"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-navy font-bold text-[14px] tracking-tight">{contact.name}</span>
                                        <span className="text-[11px] text-navy/40 font-medium">{contact.phone}</span>
                                    </div>
                                    <button
                                        onClick={() => handleCall(contact.phone)}
                                        className="w-9 h-9 bg-navy/5 text-navy rounded-full flex items-center justify-center hover:bg-navy/10 transition-colors active:scale-95 shrink-0"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
