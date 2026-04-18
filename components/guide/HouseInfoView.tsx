import { motion } from 'framer-motion';
import { Bed, Bath, Users, Info, MapPin, Phone, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';

interface HouseInfoViewProps {
    onBack: () => void;
    property: any;
    welcomeData?: any;
    contactsData?: any;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    accessToken?: string;
    propertyId?: string;
    disabledLanguage?: boolean;
    themeId?: string;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function getThemeTokens(themeId: string) {
    switch (themeId) {
        case 'urban':
            return {
                titleColor: 'text-white',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'uppercase tracking-widest',
                addressColor: 'text-[#888]',
                addressIcon: 'text-[#555]',
                featureCard: 'bg-[#1C1C1C] border border-[#333] rounded-xl',
                featureIconBg: 'bg-[#0F0F0F] border border-[#333]',
                featureIconColor: 'text-[#00E5FF]',
                featureLabel: 'text-white',
                featureSub: 'text-[#555]',
                aboutBg: 'bg-[#0F0F0F] border border-[#333] rounded-xl',
                aboutIconBg: 'bg-[#1C1C1C] border border-[#333]',
                aboutIconColor: 'text-[#00E5FF]',
                aboutHeadingColor: 'text-[#00E5FF]',
                aboutHeadingFont: { fontFamily: 'var(--font-heading)' },
                aboutText: 'text-[#A1A1AA]',
                divider: 'border-[#333]',
                warmlyColor: 'text-[#555]',
                hostNameColor: 'text-[#00E5FF]',
                hostNameFont: { fontFamily: 'var(--font-heading)' },
                hostNameExtra: 'uppercase tracking-widest text-xl',
                phoneBtnBg: 'bg-[#00E5FF]',
                phoneBtnText: 'text-black',
                footerColor: 'text-[#555]',
            };
        case 'coastal':
            return {
                titleColor: 'text-[#0C4A6E]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-extrabold',
                addressColor: 'text-[#64748B]',
                addressIcon: 'text-[#BAE6FD]',
                featureCard: 'bg-white border border-[#E0F2FE] rounded-2xl shadow-sm',
                featureIconBg: 'bg-[#E0F2FE]',
                featureIconColor: 'text-[#0EA5E9]',
                featureLabel: 'text-[#0C4A6E]',
                featureSub: 'text-[#0369A1]',
                aboutBg: 'bg-[#F0F9FF] border border-[#E0F2FE] rounded-2xl',
                aboutIconBg: 'bg-[#E0F2FE]',
                aboutIconColor: 'text-[#0EA5E9]',
                aboutHeadingColor: 'text-[#0C4A6E]',
                aboutHeadingFont: { fontFamily: 'var(--font-heading)' },
                aboutText: 'text-[#0C4A6E]/80',
                divider: 'border-[#E0F2FE]',
                warmlyColor: 'text-[#0369A1]',
                hostNameColor: 'text-[#0C4A6E]',
                hostNameFont: { fontFamily: 'var(--font-heading)' },
                hostNameExtra: 'font-extrabold text-2xl',
                phoneBtnBg: 'bg-[#0EA5E9]',
                phoneBtnText: 'text-white',
                footerColor: 'text-[#0369A1]',
            };
        case 'warm':
            return {
                titleColor: 'text-[#431407]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-bold italic',
                addressColor: 'text-[#8C6B5D]',
                addressIcon: 'text-[#D4A054]/50',
                featureCard: 'bg-white border border-[#D4A054]/10 rounded-xl shadow-sm',
                featureIconBg: 'bg-[#FFF8F0]',
                featureIconColor: 'text-[#D4A054]',
                featureLabel: 'text-[#431407]',
                featureSub: 'text-[#8C6B5D]',
                aboutBg: 'bg-[#FFF8F0] border border-[#D4A054]/10 rounded-xl',
                aboutIconBg: 'bg-white border border-[#D4A054]/20',
                aboutIconColor: 'text-[#D4A054]',
                aboutHeadingColor: 'text-[#431407]',
                aboutHeadingFont: { fontFamily: 'var(--font-heading)' },
                aboutText: 'text-[#431407]/80',
                divider: 'border-[#D4A054]/10',
                warmlyColor: 'text-[#8C6B5D]',
                hostNameColor: 'text-[#431407]',
                hostNameFont: { fontFamily: 'var(--font-heading)' },
                hostNameExtra: 'italic font-bold text-2xl',
                phoneBtnBg: 'bg-[#D4A054]',
                phoneBtnText: 'text-white',
                footerColor: 'text-[#8C6B5D]',
            };
        case 'luxury':
            return {
                titleColor: 'text-[#1B2A4A]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-medium tracking-widest uppercase',
                addressColor: 'text-[#8A8070]',
                addressIcon: 'text-[#D4C5A9]',
                featureCard: 'bg-white border border-[#D4C5A9] rounded-xl shadow-sm',
                featureIconBg: 'bg-[#F9F7F4] border border-[#D4C5A9]',
                featureIconColor: 'text-[#C9A84C]',
                featureLabel: 'text-[#1B2A4A]',
                featureSub: 'text-[#8A8070]',
                aboutBg: 'bg-[#F9F7F4] border border-[#D4C5A9] rounded-xl',
                aboutIconBg: 'bg-white border border-[#D4C5A9]',
                aboutIconColor: 'text-[#C9A84C]',
                aboutHeadingColor: 'text-[#1B2A4A]',
                aboutHeadingFont: { fontFamily: 'var(--font-heading)' },
                aboutText: 'text-[#1B2A4A]/70',
                divider: 'border-[#D4C5A9]',
                warmlyColor: 'text-[#8A8070]',
                hostNameColor: 'text-[#1B2A4A]',
                hostNameFont: { fontFamily: 'var(--font-heading)' },
                hostNameExtra: 'font-medium tracking-widest uppercase text-xl',
                phoneBtnBg: 'bg-[#1B2A4A]',
                phoneBtnText: 'text-[#C9A84C]',
                footerColor: 'text-[#8A8070]',
            };
        default: // modern
            return {
                titleColor: 'text-[#09090B]',
                titleFont: undefined,
                titleExtra: 'font-bold',
                addressColor: 'text-[#52525B]',
                addressIcon: 'text-[#A1A1AA]',
                featureCard: 'bg-white border border-[#E4E4E7] rounded-2xl shadow-sm',
                featureIconBg: 'bg-[#F4F4F5]',
                featureIconColor: 'text-[#52525B]',
                featureLabel: 'text-[#09090B]',
                featureSub: 'text-[#52525B]',
                aboutBg: 'bg-[#F4F4F5] border border-[#E4E4E7] rounded-2xl',
                aboutIconBg: 'bg-[#E4E4E7]',
                aboutIconColor: 'text-[#52525B]',
                aboutHeadingColor: 'text-[#09090B]',
                aboutHeadingFont: undefined,
                aboutText: 'text-[#09090B]/80',
                divider: 'border-[#E4E4E7]',
                warmlyColor: 'text-[#52525B]',
                hostNameColor: 'text-[#09090B]',
                hostNameFont: undefined,
                hostNameExtra: 'font-bold text-2xl',
                phoneBtnBg: 'bg-[#18181B]',
                phoneBtnText: 'text-white',
                footerColor: 'text-[#52525B]',
            };
    }
}

export function HouseInfoView({
    onBack,
    property,
    welcomeData,
    contactsData,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false,
    themeId = 'modern',
}: HouseInfoViewProps) {
    const t = getThemeTokens(themeId);

    const { content: labelHouseInfoTitle } = useLocalizedContent('Info Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAboutProperty } = useLocalizedContent('Sobre la propiedad', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerifiedDetails } = useLocalizedContent('Detalles verificados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWarmly } = useLocalizedContent('Con cariño,', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelContactHost } = useLocalizedContent('Contactar', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: labelDormitorios } = useLocalizedContent(`${property.beds || 0} Dormitorio${(property.beds || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subCamas } = useLocalizedContent('Camas preparadas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBanos } = useLocalizedContent(`${property.baths || 0} Baño${(property.baths || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subEquipados } = useLocalizedContent('Equipados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuests } = useLocalizedContent(`Hasta ${property.guests || 0} huéspedes`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subIdeal } = useLocalizedContent('Ideal para su estancia', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: localizedName } = useLocalizedContent(property.name, currentLanguage, 'property_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(welcomeData?.message || '', currentLanguage, 'welcome_message', accessToken, propertyId);

    const features = [
        { icon: Bed, label: labelDormitorios, sub: subCamas, show: !!property.beds },
        { icon: Bath, label: labelBanos, sub: subEquipados, show: !!property.baths },
        { icon: Users, label: labelGuests, sub: subIdeal, show: !!property.guests }
    ].filter(f => f.show);

    const hostName = welcomeData?.host_name || property.host_name || 'Anfitrión';
    const hostPhone = contactsData?.support_phone || contactsData?.support_mobile || property.host_phone || '';

    return (
        <motion.div className="flex flex-col min-h-full bg-background" variants={container} initial="hidden" animate="show">
            <PageHeader
                title={labelHouseInfoTitle}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                disabledLanguage={disabledLanguage}
            />

            <div className="px-6 pb-24 max-w-md mx-auto w-full">
                {/* Property Image */}
                {property.main_image_url && (
                    <motion.div variants={item} className="mt-6 mb-6">
                        <div className="rounded-3xl overflow-hidden shadow-card h-44 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Image
                                src={property.main_image_url}
                                alt={property.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Property Name & Address */}
                <motion.div variants={item} className="mb-8 px-2 text-left">
                    <h1 className={cn(
                        'text-2xl mb-2 leading-tight',
                        t.titleColor, t.titleExtra,
                        !localizedName && 'h-8 w-56 bg-current/10 animate-pulse rounded-lg'
                    )} style={t.titleFont}>
                        {localizedName}
                    </h1>
                    <p className={cn('text-[12px] font-medium uppercase tracking-wider flex items-center gap-1.5', t.addressColor)}>
                        <MapPin size={12} className={cn('shrink-0', t.addressIcon)} />
                        {property.full_address}
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div variants={item} className="space-y-3 mb-10">
                    {features.map((feature, i) => (
                        <div key={i} className={cn('flex items-center gap-5 p-4', t.featureCard)}>
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', t.featureIconBg, t.featureIconColor)}>
                                <feature.icon size={20} strokeWidth={2} />
                            </div>
                            <div className="text-left">
                                <p className={cn('font-bold text-[15px] leading-tight', t.featureLabel)}>{feature.label}</p>
                                <p className={cn('text-[11px] font-black uppercase tracking-widest mt-1', t.featureSub)}>{feature.sub}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* About Section */}
                {(welcomeData?.message || hostName) && (
                    <motion.div variants={item} className="mb-10">
                        <div className={cn('p-6', t.aboutBg)}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className={cn('p-1.5 rounded-lg', t.aboutIconBg, t.aboutIconColor)}>
                                    <Info size={14} strokeWidth={3} />
                                </div>
                                <h3 className={cn('font-bold', t.aboutHeadingColor)} style={t.aboutHeadingFont}>
                                    {labelAboutProperty}
                                </h3>
                            </div>

                            <div className={cn('text-[14px] leading-relaxed font-medium text-left whitespace-pre-line', t.aboutText, !localizedDescription && 'space-y-2')}>
                                {localizedDescription ? (
                                    localizedDescription
                                ) : (
                                    <>
                                        <div className="h-4 w-full bg-current/5 animate-pulse rounded-md" />
                                        <div className="h-4 w-11/12 bg-current/5 animate-pulse rounded-md" />
                                        <div className="h-4 w-4/5 bg-current/5 animate-pulse rounded-md" />
                                    </>
                                )}
                            </div>

                            {/* Signature */}
                            <div className={cn('mt-8 pt-8 border-t flex flex-col items-start text-left', t.divider)}>
                                <span className={cn('text-[11px] font-bold uppercase tracking-widest mb-2', t.warmlyColor)}>
                                    {labelWarmly}
                                </span>
                                <div className="flex flex-col items-center w-full gap-5 text-center mt-2">
                                    <div className="flex flex-col items-center">
                                        <span className={cn('leading-tight px-4', t.hostNameColor, t.hostNameExtra)} style={t.hostNameFont}>
                                            {hostName}
                                        </span>
                                    </div>
                                    {hostPhone && (
                                        <div className="flex items-center justify-center gap-3">
                                            <a
                                                href={`https://wa.me/${hostPhone.replace(/\s+/g, '').replace('+', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                                            >
                                                <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                                            </a>
                                            <a
                                                href={`tel:${hostPhone.replace(/\s/g, '')}`}
                                                className={cn('flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[13px] font-bold shadow-lg transition-all active:scale-95 hover:opacity-90', t.phoneBtnBg, t.phoneBtnText)}
                                            >
                                                <Phone className="w-4 h-4" />
                                                <span>{labelContactHost}</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div variants={item} className="text-center opacity-30">
                    <p className={cn('text-[10px] font-black tracking-[0.2em] uppercase', t.footerColor)}>
                        {labelVerifiedDetails}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
