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
    MapPin,
    ArrowRight,
    Navigation,
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
    propertyId?: string;
    disabledLanguage?: boolean;
}

const contactCategoryStyles: Record<string, { hex: string, bg: string, text: string }> = {
    policia: { hex: '#2563EB', bg: 'bg-blue-50', text: 'text-blue-600' },
    salud: { hex: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-600' },
    farmacia: { hex: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    bomberos: { hex: '#EA580C', bg: 'bg-orange-50', text: 'text-orange-600' },
    default: { hex: '#1E3A5F', bg: 'bg-slate-50', text: 'text-slate-600' }
};

function ContactItem({
    contact,
    idx,
    currentLanguage,
    accessToken,
    getIcon,
    getMapsUrl,
    isCustom = false,
    propertyId
}: {
    contact: any,
    idx: number,
    currentLanguage: string,
    accessToken?: string,
    getIcon: (type: string) => any,
    getMapsUrl: (name: string, address?: string, placeId?: string) => string,
    isCustom?: boolean,
    propertyId?: string
}) {
    const { content: localizedName } = useLocalizedContent(contact.name, currentLanguage, 'contact_name', accessToken, propertyId);
    const { content: localizedDistance } = useLocalizedContent(contact.distance || '', currentLanguage, 'contact_distance', accessToken, propertyId);
    const { content: labelNavigate } = useLocalizedContent('Cómo llegar', currentLanguage, 'ui_label', accessToken, propertyId);

    const style = contactCategoryStyles[contact.type] || contactCategoryStyles.default;

    if (isCustom) {
        return (
            <div
                key={`${contact.id}-${idx}`}
                className="bg-white rounded-3xl p-5 shadow-sm border border-navy/5 flex items-center justify-between group transition-all hover:shadow-md"
            >
                <div className="flex flex-col text-left">
                    <span className="text-navy font-bold text-base tracking-tight font-serif">{localizedName}</span>
                    <span className="text-[12px] text-slate/50 font-medium mt-1">{contact.phone}</span>
                </div>
                <a
                    href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
                    className="w-11 h-11 bg-primary/10 text-primary rounded-full flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 shrink-0 shadow-sm"
                >
                    <Phone className="w-5 h-5" strokeWidth={2} />
                </a>
            </div>
        );
    }

    return (
        <div
            key={`${contact.id}-${idx}`}
            className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group border border-navy/5 relative"
        >
            {/* Color Accent Line */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1.5" 
                style={{ backgroundColor: style.hex }}
            />

            <div className="p-5 flex flex-col gap-5">
                <div className="flex items-start gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-105 shadow-inner", style.bg, style.text)}>
                        {getIcon(contact.type)}
                    </div>
                    
                    <div className="flex-1 flex flex-col pt-0.5">
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="text-navy font-serif text-lg font-bold leading-snug">
                                {localizedName}
                            </h3>
                            {!(contact.place_id || (contact.address && !['Servicio Nacional', 'Servicio Local', 'En todo el territorio nacional'].includes(contact.address))) && (
                                <a
                                    href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
                                    className="flex items-center gap-2.5 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 shrink-0"
                                >
                                    <Phone className="w-4 h-4" />
                                    <span>{contact.phone}</span>
                                </a>
                            )}
                        </div>

                        {contact.address && (
                            <div className="flex items-start gap-1.5 mt-2 group/addr">
                                <MapPin className="w-3.5 h-3.5 text-slate/30 shrink-0 mt-0.5" />
                                <span className="text-[13px] text-slate/60 leading-relaxed font-medium">
                                    {contact.address}
                                </span>
                            </div>
                        )}
                        
                        {!contact.address && contact.phone && (
                             <span className="text-[13px] text-slate/40 font-medium mt-1">{contact.phone}</span>
                        )}
                    </div>
                </div>

                {/* Optional Actions Footer - Only for REAL locations or if specifically needed */}
                {(contact.place_id || (contact.address && !['Servicio Nacional', 'Servicio Local', 'En todo el territorio nacional'].includes(contact.address))) && (
                    <div className="pt-4 border-t border-navy/5 flex items-center justify-between">
                        <a
                            href={getMapsUrl(contact.name, contact.address, contact.place_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[12px] font-bold text-slate/60 hover:text-navy transition-all group/nav w-fit"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate/5 flex items-center justify-center group-hover/nav:bg-primary/10 group-hover/nav:text-primary transition-colors">
                                <Navigation className="w-3.5 h-3.5" />
                            </div>
                            {labelNavigate}
                            <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover/nav:translate-x-1 transition-transform" />
                        </a>

                        <a
                            href={`tel:${(contact.phone || '').replace(/\s/g, '')}`}
                            className="flex items-center gap-2.5 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                        </a>
                    </div>
                )}
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
    propertyId,
    disabledLanguage = false
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
    const { content: labelAsistencia } = useLocalizedContent('Asistencia', currentLanguage, 'ui_label', accessToken, propertyId);

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
        
        // Universal Google Maps Search URL - Works on all platforms (Mobile App & Desktop)
        let url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        if (placeId) {
            url += `&query_place_id=${placeId}`;
        }
        return url;
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader
                title={labelEmergencyTitle}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                disabledLanguage={disabledLanguage}
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
                                        {contactsData.support_name || labelAsistencia}
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
                            {(contactsData.emergency_contacts || [])
                                .filter(c => c.phone !== '112')
                                .map((contact, idx) => (
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
