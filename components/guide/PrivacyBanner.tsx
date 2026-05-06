'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGuideTheme } from '@/lib/guide-theme';
import { cn } from '@/lib/utils';

interface PrivacyBannerProps {
    isVisible: boolean;
    onAccept: () => void;
    onClose: () => void;
    onMoreInfo: () => void;
    language: string;
    themeId?: string;
}

const CONTENT = {
    es: {
        text: "Para mejorar tu experiencia, registramos qué secciones consultas. No guardamos datos personales identificables.",
        moreInfo: "Más info",
        accept: "Entendido"
    },
    en: {
        text: "To improve your experience, we record which sections you visit. We do not store personally identifiable data.",
        moreInfo: "More info",
        accept: "Got it"
    }
};

export function PrivacyBanner({ isVisible, onAccept, onClose, onMoreInfo, language, themeId }: PrivacyBannerProps) {
    const t = getGuideTheme(themeId);
    const lang = (language === 'es' || language === 'en') ? language : 'es';
    const content = CONTENT[lang as keyof typeof CONTENT];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-4 md:max-w-sm"
                >
                    <div className={cn(
                        "relative p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                        t.chipBg
                    )}>
                        {/* Close button X */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-1 opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>

                        <div className="space-y-4 pr-6">
                            <p className={cn("text-[13px] leading-relaxed", t.guideCardSubtitle)}>
                                {content.text}{' '}
                                <button
                                    onClick={onMoreInfo}
                                    className={cn("font-bold underline decoration-current/30", t.accentText)}
                                >
                                    {content.moreInfo}
                                </button>
                            </p>

                            <button
                                onClick={onAccept}
                                className={cn(
                                    "px-6 py-2.5 text-[12px] font-bold uppercase tracking-widest transition-all active:scale-95",
                                    t.iconBtnBg,
                                    t.iconBtnColor,
                                    "rounded-full"
                                )}
                            >
                                {content.accept}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
