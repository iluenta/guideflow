'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGuideTheme } from '@/lib/guide-theme';
import { cn } from '@/lib/utils';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: string;
    themeId?: string;
}

const CONTENT = {
    es: {
        title: "PRIVACIDAD DE TU GUÍA",
        intro: "Hospyia Labs S.L. gestiona esta guía digital en nombre del anfitrión de tu alojamiento.",
        sections: [
            {
                title: "QUÉ REGISTRAMOS",
                items: [
                    "Cuándo abres la guía (fecha y hora)",
                    "Qué secciones consultas",
                    "Cuánto tiempo pasas en cada sección",
                    "Tu navegador y sistema operativo"
                ]
            },
            {
                title: "QUÉ NO REGISTRAMOS",
                items: [
                    "Tu nombre, email, teléfono u otros datos personales identificables",
                    "Tu ubicación física exacta",
                    "Las conversaciones con el asistente IA en formato vinculable a ti"
                ]
            },
            {
                title: "PARA QUÉ LO USAMOS",
                body: "Únicamente para mejorar la guía y el servicio que tu anfitrión te ofrece. No compartimos estos datos con terceros con fines comerciales ni publicitarios."
            },
            {
                title: "BASE LEGAL",
                body: "Interés legítimo del responsable (artículo 6.1.f del RGPD) para la mejora continua del servicio que estás utilizando."
            },
            {
                title: "CUÁNTO TIEMPO LO GUARDAMOS",
                body: "Los datos de uso se conservan durante 12 meses desde el final de tu estancia y posteriormente se eliminan o anonimizan."
            },
            {
                title: "TUS DERECHOS",
                body: "Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación y oposición escribiendo a privacidad@hospyia.com. También puedes presentar reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si consideras que tus derechos no han sido respetados."
            },
            {
                title: "RESPONSABLE DEL TRATAMIENTO",
                body: "Hospyia Labs S.L.\n[Dirección]\nNIF: [NIF]\nEmail: privacidad@hospyia.com"
            }
        ]
    },
    en: {
        title: "GUIDE PRIVACY",
        intro: "Hospyia Labs S.L. manages this digital guide on behalf of your accommodation host.",
        sections: [
            {
                title: "WHAT WE RECORD",
                items: [
                    "When you open the guide (date and time)",
                    "Which sections you consult",
                    "How much time you spend in each section",
                    "Your browser and operating system"
                ]
            },
            {
                title: "WHAT WE DON'T RECORD",
                items: [
                    "Your name, email, phone number, or other personally identifiable data",
                    "Your exact physical location",
                    "AI assistant conversations in a format linkable to you"
                ]
            },
            {
                title: "WHAT WE USE IT FOR",
                body: "Only to improve the guide and the service your host offers you. We do not share this data with third parties for commercial or advertising purposes."
            },
            {
                title: "LEGAL BASIS",
                body: "Legitimate interest of the controller (Article 6.1.f of the GDPR) for the continuous improvement of the service you are using."
            },
            {
                title: "HOW LONG WE KEEP IT",
                body: "Usage data is kept for 12 months from the end of your stay and is subsequently deleted or anonymized."
            },
            {
                title: "YOUR RIGHTS",
                body: "You can exercise your rights of access, rectification, deletion, limitation, and opposition by writing to privacidad@hospyia.com. You can also file a complaint with the Spanish Data Protection Agency (www.aepd.es) if you believe your rights have not been respected."
            },
            {
                title: "DATA CONTROLLER",
                body: "Hospyia Labs S.L.\n[Address]\nNIF: [NIF]\nEmail: privacidad@hospyia.com"
            }
        ]
    }
};

export function PrivacyModal({ isOpen, onClose, language, themeId }: PrivacyModalProps) {
    const t = getGuideTheme(themeId);
    const lang = (language === 'es' || language === 'en') ? language : 'es';
    const content = CONTENT[lang as keyof typeof CONTENT];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl rounded-[28px]",
                            t.cardBg
                        )}
                    >
                        {/* Header */}
                        <div className={cn("flex items-center justify-between px-6 py-5 border-b", t.searchBorder)}>
                            <h2 className={cn("text-[14px] font-bold tracking-[0.15em] uppercase", t.sectionLabel)}>
                                {content.title}
                            </h2>
                            <button
                                onClick={onClose}
                                className={cn("p-2 rounded-full transition-colors", t.iconBtnBg, t.iconBtnColor)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide">
                            <p className={cn("text-[15px] leading-relaxed", t.guideCardSubtitle)}>
                                {content.intro}
                            </p>

                            {content.sections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className={cn("text-[11px] font-bold tracking-[0.1em] uppercase", t.sectionLabel)}>
                                        {section.title}
                                    </h3>
                                    {section.items ? (
                                        <ul className="space-y-2">
                                            {section.items.map((item, i) => (
                                                <li key={i} className={cn("text-[14px] flex items-start gap-3", t.guideCardSubtitle)}>
                                                    <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 opacity-40", t.accentText.replace('text-', 'bg-'))} />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={cn("text-[14px] leading-relaxed whitespace-pre-wrap", t.guideCardSubtitle)}>
                                            {section.body}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer spacing */}
                        <div className="h-6" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
