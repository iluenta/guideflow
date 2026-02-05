'use client';

import { Check, X, Clock, Info, ShieldAlert, Key } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface RulesViewProps {
    onBack: () => void;
    rulesData?: any;
    checkinData?: any;
    oldRules?: string;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

export function RulesView({
    onBack,
    rulesData,
    checkinData,
    oldRules,
    currentLanguage = 'es',
    onLanguageChange
}: RulesViewProps) {
    const rules = rulesData?.rules_items || [];
    const { content: localizedCaution } = useLocalizedContent(
        "Gracias por respetar estas normas 🙏",
        currentLanguage || 'es',
        'house_rules_footer'
    );
    const { content: localizedOldRules } = useLocalizedContent(
        oldRules || "",
        currentLanguage || 'es',
        'house_rules_legacy'
    );

    const schedules = [
        {
            label: currentLanguage === 'es' ? 'Silencio' : 'Quiet Hours',
            icon: ShieldAlert,
            value: rulesData?.quiet_hours || '22:00 - 8:00'
        },
        {
            label: currentLanguage === 'es' ? 'Check-in' : 'Check-in',
            icon: Key,
            value: checkinData?.checkin_time || '15:00 - 22:00'
        },
        {
            label: currentLanguage === 'es' ? 'Check-out' : 'Check-out',
            icon: Clock,
            value: rulesData?.checkout_time || 'Antes de las 11:00'
        },
    ];

    return (
        <div className="min-h-screen bg-background font-sans pb-24">
            <PageHeader
                title={currentLanguage === 'es' ? 'Normas de la casa' : 'House Rules'}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="p-4 space-y-6">
                {/* Rules List */}
                <div className="space-y-3">
                    {rules.length > 0 ? (
                        rules.map((rule: any, idx: number) => (
                            <div
                                key={idx}
                                className="bg-surface rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    rule.type === 'allowed' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                )}>
                                    {rule.type === 'allowed' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                </div>
                                <span className="text-text-primary/80 font-semibold text-sm leading-tight">
                                    {rule.text}
                                </span>
                            </div>
                        ))
                    ) : (
                        !oldRules && (
                            <div className="bg-surface rounded-2xl p-8 text-center shadow-sm border border-primary/5">
                                <p className="text-text-muted text-sm italic">No hay normas específicas definidas.</p>
                            </div>
                        )
                    )}

                    {oldRules && (
                        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-1.5 w-6 bg-primary/20 rounded-full" />
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest">Información Adicional</h4>
                            </div>
                            <div className="prose prose-slate prose-sm max-w-none text-text-secondary leading-relaxed font-medium">
                                <p className="whitespace-pre-wrap">{localizedOldRules}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Schedules Section */}
                <div className="space-y-4 pt-4">
                    <h3 className="font-serif text-xl font-bold text-primary px-1">
                        {currentLanguage === 'es' ? 'Horarios' : 'Schedules'}
                    </h3>

                    <div className="bg-surface rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
                        {schedules.map((item, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex items-center justify-between p-5",
                                    idx !== schedules.length - 1 && "border-b border-primary/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-4 h-4 text-text-muted" />
                                    <span className="text-text-secondary font-medium text-sm">{item.label}</span>
                                </div>
                                <span className="text-text-primary font-bold text-sm">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-8 text-center">
                    <p className="text-text-muted font-medium italic text-sm">
                        {localizedCaution}
                    </p>
                </div>
            </div>
        </div>
    );
}
