'use client';

import { ArrowLeft, MapPin, Copy, Phone, ExternalLink, Key, Lock, DoorOpen, Info, Wifi, Check, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from './PageHeader';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface CheckinStep {
    title: string;
    description: string;
    icon: string;
    image_url?: string;
}

interface CheckInViewProps {
    onBack: () => void;
    checkinData: {
        checkin_time?: string;
        emergency_phone?: string;
        steps?: CheckinStep[];
    };
    address: string;
    hostName: string;
    currentLanguage: string;
    preferredContactName?: string;
    preferredContactPhone?: string;
    onLanguageChange?: (lang: string) => void;
    accessToken?: string;
    propertyId?: string; // FASE 17
}

function StepItem({ 
    step, 
    idx, 
    currentLanguage, 
    accessToken, 
    propertyId, // FASE 17
    getIcon, 
    isCode, 
    handleCopy 
}: { 
    step: CheckinStep, 
    idx: number, 
    currentLanguage: string, 
    accessToken?: string,
    propertyId?: string, // FASE 17
    getIcon: (iconName: string) => any,
    isCode: (text: string) => boolean,
    handleCopy: (text: string) => void
}) {
    const { content: localizedTitle } = useLocalizedContent(step.title, currentLanguage, 'checkin_step_title', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(step.description, currentLanguage, 'checkin_step_description', accessToken, propertyId);
    const { content: copyCodeLabel } = useLocalizedContent('Copiar código', currentLanguage, 'ui_label', accessToken, propertyId);
    
    const StepIcon = getIcon(step.icon);

    return (
        <motion.div variants={itemVars} className="bg-surface rounded-3xl p-6 shadow-card border border-primary/[0.03] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110" />

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-surface border border-primary/10 text-primary flex items-center justify-center font-serif text-base font-bold shrink-0 shadow-sm transition-colors group-hover:border-primary/20">
                    {idx + 2}
                </div>
                <div className="flex-1 pt-0.5">
                    <div className="flex items-center gap-2 mb-2">
                        <StepIcon className="w-3.5 h-3.5 text-primary/40" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/60">
                            {localizedTitle}
                        </h3>
                    </div>
                    <p className="font-serif text-base text-slate-800 font-bold leading-snug mb-4">
                        {localizedDescription}
                    </p>

                    {step.image_url && (
                        <div className="mb-4 rounded-2xl overflow-hidden border border-primary/5 shadow-inner bg-primary/[0.02]">
                            <img
                                src={step.image_url}
                                alt={step.title}
                                className="w-full h-auto object-cover max-h-[300px] transition-transform duration-700 hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {isCode(step.description) && (
                        <button
                            className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/[0.06] px-4 py-2 rounded-xl transition-all hover:bg-primary/[0.1] active:scale-95 shadow-sm"
                            onClick={() => handleCopy(step.description)}
                        >
                            <Copy className="w-3 h-3" />
                            {copyCodeLabel}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "circOut" } }
};

export function CheckInView({
    onBack,
    checkinData,
    address,
    hostName,
    currentLanguage,
    preferredContactName,
    preferredContactPhone,
    onLanguageChange,
    accessToken,
    propertyId // FASE 17
}: CheckInViewProps) {
    const { toast } = useToast();
    const steps = checkinData.steps || [];
 
    // Localized strings
    const { content: pageTitle } = useLocalizedContent('Llegada', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: checkinAvailableLabel } = useLocalizedContent('Check-in disponible', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: addressLabel } = useLocalizedContent('Dirección', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: showOnMapLabel } = useLocalizedContent('Ver en mapa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: problemsLabel } = useLocalizedContent('¿Problemas para entrar? Contacta con', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: callLabel } = useLocalizedContent('Llamar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: copiedLabel } = useLocalizedContent('Copiado', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: codeCopiedLabel } = useLocalizedContent('Código copiado al portapapeles', currentLanguage, 'ui_label', accessToken, propertyId);

    // Use preferred contact if available, fallback to hostName/emergency_phone
    const displayContactName = preferredContactName || hostName;
    const displayContactPhone = preferredContactPhone || checkinData.emergency_phone;

    const handleWhatsApp = () => {
        if (!displayContactPhone) return;
        const cleanPhone = displayContactPhone.replace(/\s+/g, '').replace('+', '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleCall = () => {
        if (!displayContactPhone) return;
        window.location.href = `tel:${displayContactPhone}`;
    };

    const getIcon = (iconName: string) => {
        switch (iconName?.toLowerCase()) {
            case 'key': return Key;
            case 'lock': return Lock;
            case 'door': return DoorOpen;
            case 'phone': return Phone;
            case 'info': return Info;
            case 'wifi': return Wifi;
            default: return MapPin;
        }
    };

    const isCode = (text: string) => {
        const trimmed = text.trim();
        return /^[0-9A-Z]{3,8}$/.test(trimmed) || trimmed.includes('Código:');
    };

    const handleCopy = (text: string) => {
        const codeMatch = text.match(/Código:\s*([^\s.]+)/) || [null, text];
        const toCopy = codeMatch[1];
        if (toCopy) {
            navigator.clipboard.writeText(toCopy);
            toast({
                title: copiedLabel,
                description: codeCopiedLabel,
            });
        }
    };

    const openMaps = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const url = isIOS
            ? `http://maps.apple.com/?q=${encodeURIComponent(address)}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            <PageHeader
                title={pageTitle}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <motion.div
                className="p-5 max-w-md mx-auto pb-32 space-y-6"
                variants={containerVars}
                initial="hidden"
                animate="show"
            >
                {/* Time info card */}
                <motion.div variants={itemVars} className="bg-surface rounded-3xl p-6 shadow-card border border-primary/[0.03] text-center">
                    <p className="text-text-secondary/60 text-[10px] uppercase tracking-[0.2em] mb-3 font-bold">
                        {checkinAvailableLabel}
                    </p>
                    <p className="font-serif text-3xl text-slate-800 font-bold">
                        {checkinData.checkin_time || '15:00 - 22:00'}
                    </p>
                </motion.div>

                {/* Steps List */}
                <div className="space-y-4">
                    {/* Step 1: Address (Fixed) */}
                    <motion.div variants={itemVars} className="bg-surface rounded-3xl p-6 shadow-card border border-primary/[0.03] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.02] rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110" />

                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-serif text-base font-bold shrink-0 shadow-lg shadow-primary/20">
                                1
                            </div>
                            <div className="flex-1 pt-0.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary/40" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/60">
                                        {addressLabel}
                                    </h3>
                                </div>
                                <p className="font-serif text-lg text-slate-800 font-bold leading-snug mb-4">
                                    {address}
                                </p>
                                <button
                                    className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/[0.06] px-4 py-2 rounded-xl transition-all hover:bg-primary/[0.1] active:scale-95 shadow-sm"
                                    onClick={openMaps}
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    {showOnMapLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Dynamic Steps */}
                    {steps.map((step, idx) => (
                        <StepItem 
                            key={idx} 
                            step={step} 
                            idx={idx} 
                            currentLanguage={currentLanguage} 
                            accessToken={accessToken} 
                            propertyId={propertyId} 
                            getIcon={getIcon}
                            isCode={isCode}
                            handleCopy={handleCopy}
                        />
                    ))}
                </div>

                {/* Help note */}
                {displayContactPhone && (
                    <motion.div variants={itemVars} className="p-5 bg-primary/[0.03] rounded-3xl border border-primary/[0.06] text-center">
                        <p className="text-primary/60 text-[11px] font-black uppercase tracking-widest mb-4">
                            {problemsLabel} {displayContactName}
                        </p>
                        <div className="grid grid-cols-2 gap-3 max-w-[260px] mx-auto">
                            <button
                                onClick={handleWhatsApp}
                                className="flex items-center justify-center gap-2 bg-white border border-primary/10 text-primary h-11 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all"
                            >
                                <MessageSquare className="w-4 h-4" />
                                WhatsApp
                            </button>
                            <button
                                onClick={handleCall}
                                className="flex items-center justify-center gap-2 bg-primary text-white h-11 rounded-2xl font-bold text-xs shadow-md shadow-primary/10 active:scale-95 transition-all"
                            >
                                <Phone className="w-4 h-4" />
                                {callLabel}
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
