import React from 'react';
import { BookOpen } from 'lucide-react';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { PageHeader } from './PageHeader';
import { ManualsList } from './ManualsList';
import { HowToAccordion } from './HowToAccordion';
import { cn } from '@/lib/utils';

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
    propertyId?: string;
    disabledLanguage?: boolean;
    themeId?: string;
}

function getSectionLabelColor(themeId: string): string {
    switch (themeId) {
        case 'urban':   return 'text-[#555]';
        case 'coastal': return 'text-[#94A3B8]';
        case 'warm':    return 'text-[#8C6B5D]';
        case 'luxury':  return 'text-[#8A8070]';
        default:        return 'text-[#A1A1AA]';
    }
}

export function ManualsView({
    onBack,
    manuals,
    faqs = [],
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false,
    themeId = 'modern',
}: ManualsViewProps) {
    const hasFaqs = faqs.length > 0;
    const hasManuals = manuals.length > 0;
    const sectionLabelColor = getSectionLabelColor(themeId);

    const { content: labelGuiaUso } = useLocalizedContent('Guía de Uso', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuiasUsoCaps } = useLocalizedContent('GUÍAS DE USO', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSinGuias } = useLocalizedContent('Sin guías disponibles', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNoGuiasDesc } = useLocalizedContent('El anfitrión aún no ha añadido guías o manuales para esta propiedad.', currentLanguage, 'ui_label', accessToken, propertyId);

    return (
        <div className="min-h-screen bg-background pb-12 font-sans">
            <PageHeader
                title={labelGuiaUso}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                disabledLanguage={disabledLanguage}
            />

            <div className="px-5 pb-10">
                {hasFaqs && (
                    <div className="mt-6 mb-6">
                        <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4', sectionLabelColor)}>
                            {labelGuiasUsoCaps}
                        </p>
                        <HowToAccordion
                            items={faqs}
                            currentLanguage={currentLanguage}
                            accessToken={accessToken}
                            propertyId={propertyId}
                            themeId={themeId}
                        />
                    </div>
                )}

                {!hasFaqs && !hasManuals && (
                    <div className="flex flex-col items-center justify-center pt-20 text-center px-8">
                        <div className="w-20 h-20 rounded-full bg-surface shadow-card flex items-center justify-center mb-6 border border-primary/[0.05]">
                            <BookOpen className="w-10 h-10 text-primary/20" strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                            {labelSinGuias}
                        </h3>
                        <p className="text-[var(--color-text-secondary)] text-sm font-medium leading-relaxed">
                            {labelNoGuiasDesc}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
