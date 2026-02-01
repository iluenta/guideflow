'use client';

import { ScrollText, Info } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface RulesViewProps {
    onBack: () => void;
    rules?: string;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function RulesView({
    onBack,
    rules = "No se han definido normas específicas para este alojamiento.",
    currentLanguage = 'es',
    onLanguageChange
}: RulesViewProps) {
    const { content: localizedRules, isTranslating: rulesLoading } = useLocalizedContent(rules, currentLanguage || 'es', 'house_rules');
    const { content: localizedCaution } = useLocalizedContent("El incumplimiento de estas normas podría conllevar la pérdida de la fianza o la cancelación de la estancia.", currentLanguage || 'es', 'legal_disclaimer');
    const { content: localizedTitle } = useLocalizedContent("REGLAS IMPORTANTES", currentLanguage || 'es', 'ui_label');

    return (
        <div className="min-h-screen bg-beige font-sans">
            <PageHeader
                title={currentLanguage === 'es' ? 'Normas de la casa' : 'House Rules'}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-6 space-y-8">
                {/* Rules Icon */}
                <div className="flex justify-center py-4">
                    <div className="w-24 h-24 rounded-full bg-cream shadow-card flex items-center justify-center border border-navy/5">
                        <ScrollText className="w-12 h-12 text-navy" strokeWidth={1.2} />
                    </div>
                </div>

                {/* Rules Content */}
                <div className="bg-cream rounded-[2rem] p-8 shadow-card border border-navy/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ScrollText className="w-32 h-32" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-8 bg-navy rounded-full" />
                            <h3 className="font-serif text-xl font-bold text-navy">{localizedTitle}</h3>
                        </div>

                        <div className={`prose prose-slate prose-sm max-w-none text-navy/80 leading-relaxed font-medium ${rulesLoading ? 'animate-pulse opacity-50' : ''}`}>
                            <p className="whitespace-pre-wrap">{localizedRules}</p>
                        </div>

                        <div className="pt-6 border-t border-navy/5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                                <Info className="w-5 h-5 text-navy" />
                            </div>
                            <p className="text-xs text-slate font-medium italic">
                                {localizedCaution}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
