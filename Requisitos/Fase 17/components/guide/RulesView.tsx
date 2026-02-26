import { motion } from 'framer-motion';
import { Check, X, Clock, Key, LogOut } from 'lucide-react';
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
    accessToken?: string;
    propertyId?: string; // FASE 17
}

function RuleItem({ rule, currentLanguage, accessToken, propertyId }: { rule: any, currentLanguage: string, accessToken?: string, propertyId?: string }) {
    const { content: localizedText } = useLocalizedContent(rule.text, currentLanguage, 'house_rule', accessToken, propertyId);
    
    return (
        <motion.div
            variants={item}
            className="flex items-start gap-4 p-5 rounded-3xl bg-surface border border-primary/[0.03] shadow-sm"
        >
            <div
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    rule.type === 'allowed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                )}
            >
                {rule.type === 'allowed' ? (
                    <Check size={16} strokeWidth={3} />
                ) : (
                    <X size={16} strokeWidth={3} />
                )}
            </div>
            <p className="text-[14px] text-slate-800 font-medium leading-relaxed">
                {localizedText}
            </p>
        </motion.div>
    );
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export function RulesView({
    onBack,
    rulesData,
    checkinData,
    oldRules,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId // FASE 17
}: RulesViewProps) {
    const rules = rulesData?.rules_items || [];
    const { content: localizedCaution } = useLocalizedContent(
        "Gracias por respetar estas normas 🙏",
        currentLanguage || 'es',
        'house_rules_footer',
        accessToken,
        propertyId
    );

    const { content: labelRulesTitle } = useLocalizedContent('Normas de la Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelQuietHours } = useLocalizedContent('Silencio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCheckin } = useLocalizedContent('Check-in', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCheckout } = useLocalizedContent('Check-out', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSchedules } = useLocalizedContent('Horarios', currentLanguage, 'ui_label', accessToken, propertyId);

    const schedules = [
        {
            label: labelQuietHours,
            icon: Clock,
            time: rulesData?.quiet_hours || '23:00 - 08:00'
        },
        {
            label: labelCheckin,
            icon: Key,
            time: checkinData?.checkin_time || '15:00 - 20:00'
        },
        {
            label: labelCheckout,
            icon: LogOut,
            time: rulesData?.checkout_time || '11:00'
        },
    ];

    return (
        <motion.div
            className="flex flex-col min-h-screen bg-background"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <PageHeader
                title={labelRulesTitle}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
            />

            <div className="px-6 pb-24 max-w-md mx-auto w-full">
                {/* Rules List */}
                <div className="mt-6 space-y-3">
                    {rules.map((rule: any, i: number) => (
                        <RuleItem 
                            key={i} 
                            rule={rule} 
                            currentLanguage={currentLanguage} 
                            accessToken={accessToken} 
                            propertyId={propertyId} 
                        />
                    ))}
                </div>

                {/* Schedules Section */}
                <motion.div variants={item} className="mt-10 mb-10">
                    <h3 className="text-lg font-serif font-bold mb-5 text-slate-800 text-left px-2">
                        {labelSchedules}
                    </h3>
                    <div className="bg-surface rounded-3xl border border-primary/[0.03] shadow-card overflow-hidden">
                        {schedules.map((schedule, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex items-center justify-between px-6 py-5",
                                    i < schedules.length - 1 ? 'border-b border-primary/[0.03]' : ''
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/[0.04] rounded-2xl flex items-center justify-center text-primary shrink-0">
                                        <schedule.icon size={18} strokeWidth={2} />
                                    </div>
                                    <span className="text-sm font-bold text-primary/60 uppercase tracking-widest text-[11px]">
                                        {schedule.label}
                                    </span>
                                </div>
                                <span className="text-base font-serif font-bold text-slate-800">
                                    {schedule.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Thank You Section */}
                <motion.div variants={item} className="text-center px-4">
                    <p className="font-serif text-slate-800/60 text-base italic leading-relaxed">
                        {localizedCaution}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
