'use client';

import { ArrowLeft, MapPin, Copy, Phone, ExternalLink, Key, Lock, DoorOpen, Info, Wifi, Check, MessageSquare, Clock } from 'lucide-react';
import Image from 'next/image';
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
    propertyName?: string;
    accessCodeProp?: string;
    hasAccessCodeEnabled?: boolean;
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
    propertyId?: string;
    disabledLanguage?: boolean;
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
        <div className="relative flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/20 text-primary flex items-center justify-center font-sans text-xs font-bold shrink-0 z-10 mt-2">
                {idx + 2}
            </div>
            <motion.div variants={itemVars} className="flex-1 bg-surface rounded-2xl p-5 shadow-sm border border-primary/5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 text-primary mb-3">
                    <StepIcon className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{localizedTitle}</span>
                </div>
                <p className="font-sans text-[13px] text-slate-700 leading-relaxed mb-4">
                    {localizedDescription}
                </p>

                {step.image_url && (
                    <div className="rounded-xl overflow-hidden border border-primary/5 shadow-inner bg-primary/[0.02] relative min-h-[160px] mb-4">
                        <Image
                            src={step.image_url}
                            alt={step.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                            loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 pointer-events-none">
                            <p className="text-white text-[10px] font-bold">{localizedTitle}</p>
                        </div>
                    </div>
                )}

                {isCode(step.description) && (
                    <button
                        className="flex items-center justify-center gap-2 w-full text-xs font-bold text-primary bg-primary/[0.04] border border-primary/10 px-4 py-2.5 rounded-xl transition-all hover:bg-primary/[0.08] active:scale-95 shadow-sm"
                        onClick={() => handleCopy(step.description)}
                    >
                        <Copy className="w-3.5 h-3.5" />
                        {copyCodeLabel}
                    </button>
                )}
            </motion.div>
        </div>
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
    propertyName,
    accessCodeProp,
    hasAccessCodeEnabled,
    checkinData,
    address,
    hostName,
    currentLanguage,
    preferredContactName,
    preferredContactPhone,
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false
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
    const { content: copyCodeLabel } = useLocalizedContent('Copiar código', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCopiar } = useLocalizedContent('Copiar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWhatsApp } = useLocalizedContent('WhatsApp', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: digitalKeyLabel } = useLocalizedContent('Tu llave digital', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: welcomeLabel } = useLocalizedContent('Bienvenido a', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: urbCodeLabel } = useLocalizedContent('Código urb.', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: stepsLabel } = useLocalizedContent('Sigue estos pasos al llegar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: nowLabel } = useLocalizedContent('Ahora', currentLanguage, 'ui_label', accessToken, propertyId);
    const isCode = (text: string) => {
        const trimmed = text.trim();
        return /^[0-9A-Z]{3,8}$/.test(trimmed) || trimmed.includes('Código:');
    };

    // Extract access code from steps for the hero block
    const accessCodeStep = steps.find((s: any) => isCode(s.description));
    let accessCode = accessCodeProp || '';
    if (hasAccessCodeEnabled && !accessCode && accessCodeStep) {
        const text = accessCodeStep.description;
        const codeMatch = text.match(/Código:\s*([^\s.]+)/);
        if (codeMatch) {
            accessCode = codeMatch[1];
        } else if (/^[0-9A-Z]{3,8}$/.test(text.trim())) {
            accessCode = text.trim();
        } else {
            accessCode = text.match(/([0-9A-Z]{4,8})/)?.[1] || '';
        }
    }
    // If global toggle is off, force empty code
    if (!hasAccessCodeEnabled) accessCode = '';

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
                disabledLanguage={disabledLanguage}
            />

            <motion.div
                className="p-5 max-w-md mx-auto pb-32"
                variants={containerVars}
                initial="hidden"
                animate="show"
            >
                {/* Hero block */}
                <motion.div variants={itemVars} className="bg-primary text-white rounded-[28px] p-6 shadow-xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <p className="text-white/80 text-[9px] uppercase tracking-[0.15em] font-bold mb-1">
                            {digitalKeyLabel}
                        </p>
                        <h2 className="text-[22px] font-bold font-sans mb-6 leading-tight">
                            {welcomeLabel} {propertyName || hostName}
                        </h2>

                        {accessCode && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 flex items-center justify-between border border-white/10">
                                <div>
                                    <p className="text-white/70 text-[9px] uppercase tracking-[0.15em] font-bold mb-1">
                                        {urbCodeLabel}
                                    </p>
                                    <p className="text-xl font-black tracking-widest">
                                        {accessCode}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCopy(`Código: ${accessCode}`)}
                                    className="flex items-center gap-1.5 bg-white text-primary px-3 py-2 rounded-full text-[10px] font-bold active:scale-95 transition-transform shadow-sm"
                                >
                                    <Copy className="w-3 h-3" />
                                    <span className="hidden sm:inline">{copyCodeLabel}</span>
                                    <span className="sm:hidden">{labelCopiar || 'Copiar'}</span>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full">
                                <Clock className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white/70 text-[9px] uppercase tracking-widest font-bold mb-0.5">
                                    {checkinAvailableLabel}
                                </p>
                                <p className="font-sans text-sm font-bold">
                                    {checkinData.checkin_time || '15:00 - 22:00'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-primary/10 flex-1" />
                    <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest text-center whitespace-nowrap">{stepsLabel}</p>
                    <div className="h-px bg-primary/10 flex-1" />
                </div>

                {/* Steps List */}
                <div className="relative space-y-6 mb-8">
                    {/* Vertical Timeline Line */}
                    <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-primary/10" />

                    {/* Step 1: Address (Fixed) */}
                    <div className="relative flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-background border-2 border-primary/20 text-primary flex items-center justify-center font-sans text-xs font-bold shrink-0 z-10 mt-2">
                            1
                        </div>
                        <motion.div variants={itemVars} className="flex-1 bg-surface rounded-2xl p-5 shadow-sm border border-primary/5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 text-primary mb-3">
                                <MapPin className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-wider">{addressLabel}</span>
                            </div>
                            <p className="font-sans text-[13px] text-slate-700 leading-relaxed mb-4">
                                {address}
                            </p>
                            <button
                                className="flex items-center justify-center gap-2 w-full text-xs font-bold text-primary bg-primary/[0.04] border border-primary/10 px-4 py-2.5 rounded-xl transition-all hover:bg-primary/[0.08] active:scale-95 shadow-sm"
                                onClick={openMaps}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {showOnMapLabel}
                            </button>
                        </motion.div>
                    </div>

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
                                className="flex items-center justify-center gap-2 bg-surface border border-primary/20 text-primary h-11 rounded-2xl font-bold text-xs shadow-sm active:scale-95 transition-all"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {labelWhatsApp || 'WhatsApp'}
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
