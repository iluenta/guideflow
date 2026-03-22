import { motion } from 'framer-motion';
import { Clock, Key, LogOut, Cigarette, PartyPopper, PawPrint, Volume2, Home, Key as KeyIcon, BedDouble, Recycle, Car, Smile, Leaf, Sparkles, UtensilsCrossed, Baby, Moon, Handshake } from 'lucide-react';
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
    propertyId?: string;
    disabledLanguage?: boolean;
}

// ─── Icon system — mismo mapa que StepRules ───────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    cigarette: Cigarette,
    party: PartyPopper,
    paw: PawPrint,
    volume: Volume2,
    home: Home,
    key: KeyIcon,
    bed: BedDouble,
    recycle: Recycle,
    car: Car,
    smile: Smile,
    leaf: Leaf,
    sparkles: Sparkles,
    utensils: UtensilsCrossed,
    baby: Baby,
    moon: Moon,
    handshake: Handshake,
}

function RuleIcon({ iconId }: { iconId: string }) {
    const Icon = ICON_MAP[iconId] ?? Home
    return (
        <div className="w-10 h-10 rounded-full bg-primary/[0.04] border border-primary/[0.06] flex items-center justify-center shrink-0 text-primary/50 mt-0.5">
            <Icon size={18} strokeWidth={1.5} />
        </div>
    )
}

// ─── RuleItem — nuevo sistema (iconId) con fallback al viejo (type+text) ──────
function RuleItem({ rule, currentLanguage, accessToken, propertyId }: {
    rule: any
    currentLanguage: string
    accessToken?: string
    propertyId?: string
}) {
    // Compatibilidad: si tiene iconId usa el nuevo sistema, si no usa el viejo
    const isNewSystem = Boolean(rule.iconId)

    // Localización del texto — usa title (nuevo) o text (viejo)
    const textToLocalize = rule.title || rule.text || ''
    const { content: localizedTitle } = useLocalizedContent(
        textToLocalize, currentLanguage, 'house_rule', accessToken, propertyId
    )
    const { content: localizedDescription } = useLocalizedContent(
        rule.description || '', currentLanguage, 'house_rule', accessToken, propertyId
    )

    if (isNewSystem) {
        // ── Nuevo sistema: icono + título + descripción ──
        return (
            <motion.div
                variants={item}
                className="flex items-start gap-4 p-5 rounded-3xl bg-surface border border-primary/[0.03] shadow-sm"
            >
                <RuleIcon iconId={rule.iconId} />
                <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-slate-800 font-bold leading-snug">
                        {localizedTitle}
                    </p>
                    {rule.description && (
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed mt-1">
                            {localizedDescription}
                        </p>
                    )}
                </div>
            </motion.div>
        )
    }

    // ── Sistema viejo: check/x + texto plano ──────────────────────────────────
    return (
        <motion.div
            variants={item}
            className="flex items-start gap-4 p-5 rounded-3xl bg-surface border border-primary/[0.03] shadow-sm"
        >
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                rule.type === 'allowed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            )}>
                {rule.type === 'allowed'
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                }
            </div>
            <p className="text-[14px] text-slate-800 font-medium leading-relaxed">
                {localizedTitle}
            </p>
        </motion.div>
    )
}

// ─── Animations ───────────────────────────────────────────────────────────────
const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RulesView({
    onBack,
    rulesData,
    checkinData,
    oldRules,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false
}: RulesViewProps) {
    const rules = rulesData?.rules_items || []

    const { content: localizedCaution } = useLocalizedContent(
        "Gracias por respetar estas normas 🙏",
        currentLanguage || 'es',
        'house_rules_footer',
        accessToken,
        propertyId
    )
    const { content: labelRulesTitle } = useLocalizedContent('Normas de la Casa', currentLanguage, 'ui_label', accessToken, propertyId)
    const { content: labelQuietHours } = useLocalizedContent('Silencio', currentLanguage, 'ui_label', accessToken, propertyId)
    const { content: labelCheckin } = useLocalizedContent('Check-in', currentLanguage, 'ui_label', accessToken, propertyId)
    const { content: labelCheckout } = useLocalizedContent('Check-out', currentLanguage, 'ui_label', accessToken, propertyId)
    const { content: labelSchedules } = useLocalizedContent('Horarios', currentLanguage, 'ui_label', accessToken, propertyId)

    const schedules = [
        { label: labelQuietHours, icon: Clock, time: rulesData?.quiet_hours || '23:00 - 08:00' },
        { label: labelCheckin, icon: Key, time: checkinData?.checkin_time || '15:00 - 20:00' },
        { label: labelCheckout, icon: LogOut, time: rulesData?.checkout_time || '11:00' },
    ]

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
                disabledLanguage={disabledLanguage}
            />

            <div className="px-6 pb-24 max-w-md mx-auto w-full">

                {/* Normas */}
                <div className="mt-6 space-y-3">
                    {rules.map((rule: any, i: number) => (
                        <RuleItem
                            key={rule.id || i}
                            rule={rule}
                            currentLanguage={currentLanguage}
                            accessToken={accessToken}
                            propertyId={propertyId}
                        />
                    ))}
                </div>

                {/* Horarios */}
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

                {/* Footer */}
                <motion.div variants={item} className="text-center px-4">
                    <p className="font-serif text-slate-800/60 text-base italic leading-relaxed">
                        {localizedCaution}
                    </p>
                </motion.div>

            </div>
        </motion.div>
    )
}