import React from 'react';
import { BookOpen } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { ManualsList } from './ManualsList';
import { HowToAccordion } from './HowToAccordion';

interface Manual {
    id: string;
    appliance_name: string;
    brand: string;
    model: string;
    manual_content: string;
}

interface Faq {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

interface ManualsViewProps {
    onBack: () => void;
    manuals: Manual[];
    faqs?: Faq[];
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function ManualsView({
    onBack,
    manuals,
    faqs = [],
    currentLanguage = 'es',
    onLanguageChange
}: ManualsViewProps) {
    const hasFaqs = faqs.length > 0;
    const hasManuals = manuals.length > 0;

    return (
        <div className="min-h-screen bg-beige font-sans pb-12">
            <PageHeader
                title={currentLanguage === 'es' ? "Guía de Uso" : "How-To Guide"}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-6 space-y-10">
                {/* How-To Guides Section (Phase 5 Image 2/3) */}
                {hasFaqs && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate/40">
                                {currentLanguage === 'es' ? "GUÍAS DE USO" : "HOW-TO GUIDES"}
                            </h2>
                            <div className="h-[1px] flex-1 bg-navy/5" />
                        </div>
                        <HowToAccordion items={faqs} />
                    </div>
                )}

                {/* Appliance Manuals Section REMOVED - Host only */}

                {!hasFaqs && !hasManuals && (
                    <div className="flex flex-col items-center justify-center pt-20 text-center px-8">
                        <div className="w-20 h-20 rounded-full bg-white shadow-card flex items-center justify-center mb-6 border border-navy/5">
                            <BookOpen className="w-10 h-10 text-navy/20" strokeWidth={1} />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-navy mb-2">
                            {currentLanguage === 'es' ? "Sin guías disponibles" : "No guides available"}
                        </h3>
                        <p className="text-slate text-sm font-medium leading-relaxed">
                            {currentLanguage === 'es'
                                ? "El anfitrión aún no ha añadido guías o manuales para esta propiedad."
                                : "The host hasn't added any guides or manuals for this property yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
