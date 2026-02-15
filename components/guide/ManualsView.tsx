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
    accessToken?: string;
    propertyId?: string; // FASE 17
}

export function ManualsView({
    onBack,
    manuals,
    faqs = [],
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId // FASE 17
}: ManualsViewProps) {
    const hasFaqs = faqs.length > 0;
    const hasManuals = manuals.length > 0;

    const { content: labelGuiaUso } = useLocalizedContent('Guía de Uso', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuiasUsoCaps } = useLocalizedContent('GUÍAS DE USO', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSinGuias } = useLocalizedContent('Sin guías disponibles', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNoGuiasDesc } = useLocalizedContent('El anfitrión aún no ha añadido guías o manuales para esta propiedad.', currentLanguage, 'ui_label', accessToken, propertyId);

    return (
        <div className="min-h-screen bg-stone-50/50 pb-12 font-sans">
            <PageHeader
                title={labelGuiaUso}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="px-5 pb-10">
                {/* How-To Guides Section */}
                {hasFaqs && (
                    <div className="mt-6 mb-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                            {labelGuiasUsoCaps}
                        </p>
                        <HowToAccordion 
                            items={faqs} 
                            currentLanguage={currentLanguage}
                            accessToken={accessToken}
                            propertyId={propertyId}
                        />
                    </div>
                )}

                {/* Appliance Manuals Section REMOVED - Host only */}

                {!hasFaqs && !hasManuals && (
                    <div className="flex flex-col items-center justify-center pt-20 text-center px-8">
                        <div className="w-20 h-20 rounded-full bg-white shadow-card flex items-center justify-center mb-6 border border-navy/5">
                            <BookOpen className="w-10 h-10 text-navy/20" strokeWidth={1} />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-navy mb-2">
                            {labelSinGuias}
                        </h3>
                        <p className="text-slate text-sm font-medium leading-relaxed">
                            {labelNoGuiasDesc}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
