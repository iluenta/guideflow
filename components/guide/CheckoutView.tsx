'use client';

import { Clock, LogOut, MessageSquare, Phone, Trash2, Key, Package, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from './PageHeader';
import { telHref, whatsappHref } from '@/lib/phone';
import { StepItem } from './CheckInView';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { motion, Variants } from 'framer-motion';

interface CheckoutStep {
    title: string;
    description: string;
    icon: string;
    image_url?: string;
}

interface CheckoutViewProps {
    onBack: () => void;
    checkoutData: { steps?: CheckoutStep[] };
    checkoutTime?: string;
    currentLanguage: string;
    preferredContactName?: string;
    preferredContactPhone?: string;
    onLanguageChange?: (lang: string) => void;
    accessToken?: string;
    propertyId?: string;
    disabledLanguage?: boolean;
}

const ICONS: Record<string, any> = { LogOut, Trash2, Key, Package, Sparkles, Clock };

const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export function CheckoutView({
    onBack,
    checkoutData,
    checkoutTime,
    currentLanguage,
    preferredContactName,
    preferredContactPhone,
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage,
}: CheckoutViewProps) {
    const { toast } = useToast();
    const steps = checkoutData?.steps ?? [];

    const { content: title } = useLocalizedContent('Salida', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: checkoutLabel } = useLocalizedContent('Hora de salida', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: stepsLabel } = useLocalizedContent('Antes de irte', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: helpLabel } = useLocalizedContent('¿Alguna duda antes de salir?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: callLabel } = useLocalizedContent('Llamar', currentLanguage, 'ui_label', accessToken, propertyId);

    const getIcon = (name: string) => ICONS[name] ?? LogOut;

    // Los pasos de salida no llevan códigos, pero StepItem los pide: se pasa un
    // detector que nunca acierta para que no aparezca el botón de copiar.
    const isCode = () => false;
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado' });
    };

    const contactTel = telHref(preferredContactPhone);
    const contactWhatsapp = whatsappHref(preferredContactPhone);

    return (
        <div className="min-h-screen bg-background pb-24">
            <PageHeader
                title={title}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                disabledLanguage={disabledLanguage}
            />

            <div className="px-4 pt-5 space-y-5">
                {checkoutTime && (
                    <div className="rounded-3xl p-5 bg-primary text-[var(--color-primary-foreground)] shadow-sm">
                        <div className="flex items-center gap-2 opacity-80 mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{checkoutLabel}</span>
                        </div>
                        <p className="text-3xl font-black tracking-tight">{checkoutTime}</p>
                    </div>
                )}

                {steps.length > 0 && (
                    <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">
                            {stepsLabel}
                        </p>
                        <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-4">
                            {steps.map((step, idx) => (
                                <StepItem
                                    key={idx}
                                    step={step}
                                    // StepItem numera con idx+2 porque en la llegada el paso 1 es la
                                    // dirección; aquí no la hay, así que se compensa con -1.
                                    idx={idx - 1}
                                    currentLanguage={currentLanguage}
                                    accessToken={accessToken}
                                    propertyId={propertyId}
                                    getIcon={getIcon}
                                    isCode={isCode}
                                    handleCopy={handleCopy}
                                />
                            ))}
                        </motion.div>
                    </>
                )}

                {preferredContactPhone && (
                    <div className="rounded-3xl p-5 bg-surface border border-primary/5 shadow-sm text-center space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">{helpLabel}</p>
                        {preferredContactName && (
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">{preferredContactName}</p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href={contactWhatsapp ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-11 flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-primary/[0.06] text-primary border border-primary/10"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                WhatsApp
                            </a>
                            <a
                                href={contactTel ?? undefined}
                                className="h-11 flex items-center justify-center gap-2 text-xs font-bold rounded-xl bg-primary text-[var(--color-primary-foreground)]"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                {callLabel}
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
