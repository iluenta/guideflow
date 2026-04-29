import { motion } from 'framer-motion';
import { Bed, Bath, Users, Info, MapPin, Phone, MessageSquare, Quote, CheckCircle2, Ruler, Layers, Car } from 'lucide-react';
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
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

function getThemeTokens(themeId: string) {
    switch (themeId) {
        case 'urban':
            return {
                titleColor: 'text-white',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'uppercase tracking-widest',
                addressColor: 'text-[#888]',
                addressIcon: 'text-[#555]',
                featureCard: 'bg-[#1C1C1C] border border-[#333] rounded-2xl',
                featureIconBg: 'bg-[#0F0F0F]',
                featureIconColor: 'text-[#00E5FF]',
                featureLabel: 'text-white',
                featureSub: 'text-[#555]',
                aboutBg: 'bg-[#1C1C1C] border border-[#333] rounded-3xl',
                aboutIconColor: 'text-[#00E5FF]',
                aboutHeadingColor: 'text-[#888] font-black',
                aboutText: 'text-[#A1A1AA]',
                divider: 'border-[#333]',
                warmlyColor: 'text-[#555]',
                hostNameColor: 'text-[#00E5FF]',
                hostNameExtra: 'uppercase tracking-widest text-lg font-bold',
                phoneBtnBg: 'bg-[#00E5FF]',
                phoneBtnText: 'text-black',
                whatsBtnBg: 'bg-[#0F0F0F] border border-[#333]',
                whatsBtnText: 'text-[#00E5FF]',
                footerColor: 'text-[#555]',
                quoteColor: 'text-[#00E5FF]/20',
                detailBg: 'bg-[#0F0F0F] border border-[#333] rounded-full',
                detailIcon: 'text-[#00E5FF]',
                detailText: 'text-[#A1A1AA]',
            };
        case 'coastal':
            return {
                titleColor: 'text-[#0C4A6E]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-extrabold',
                addressColor: 'text-[#64748B]',
                addressIcon: 'text-[#BAE6FD]',
                featureCard: 'bg-white border border-[#E0F2FE] rounded-2xl shadow-sm',
                featureIconBg: 'bg-[#F0F9FF]',
                featureIconColor: 'text-[#0EA5E9]',
                featureLabel: 'text-[#0C4A6E]',
                featureSub: 'text-[#64748B]',
                aboutBg: 'bg-white border border-[#E0F2FE] rounded-3xl shadow-sm',
                aboutIconColor: 'text-[#0EA5E9]',
                aboutHeadingColor: 'text-[#475569] font-black',
                aboutText: 'text-[#1E3A5F]/80',
                divider: 'border-[#E0F2FE]',
                warmlyColor: 'text-[#64748B]',
                hostNameColor: 'text-[#0C4A6E]',
                hostNameExtra: 'font-extrabold text-xl',
                phoneBtnBg: 'bg-[#0EA5E9]',
                phoneBtnText: 'text-white',
                whatsBtnBg: 'bg-[#F0F9FF] border border-[#E0F2FE]',
                whatsBtnText: 'text-[#0EA5E9]',
                footerColor: 'text-[#64748B]',
                quoteColor: 'text-[#0EA5E9]/10',
                detailBg: 'bg-[#F0F9FF] border border-[#E0F2FE] rounded-full',
                detailIcon: 'text-[#0EA5E9]',
                detailText: 'text-[#64748B]',
            };
        case 'warm':
            return {
                titleColor: 'text-[#431407]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-bold italic',
                addressColor: 'text-[#8C6B5D]',
                addressIcon: 'text-[#D4A054]/50',
                featureCard: 'bg-white border border-[#E8D5BE] rounded-2xl shadow-sm',
                featureIconBg: 'bg-[#FFF8F0]',
                featureIconColor: 'text-[#D4A054]',
                featureLabel: 'text-[#431407]',
                featureSub: 'text-[#8C6B5D]',
                aboutBg: 'bg-white border border-[#E8D5BE] rounded-3xl shadow-sm',
                aboutIconColor: 'text-[#D4A054]',
                aboutHeadingColor: 'text-[#8B5E3C] font-black',
                aboutText: 'text-[#431407]/80',
                divider: 'border-[#E8D5BE]',
                warmlyColor: 'text-[#9C7B5E]',
                hostNameColor: 'text-[#431407]',
                hostNameExtra: 'italic font-bold text-xl',
                phoneBtnBg: 'bg-[#D4A054]',
                phoneBtnText: 'text-white',
                whatsBtnBg: 'bg-[#FFF8F0] border border-[#E8D5BE]',
                whatsBtnText: 'text-[#D4A054]',
                footerColor: 'text-[#8C6B5D]',
                quoteColor: 'text-[#D4A054]/15',
                detailBg: 'bg-[#FFF8F0] border border-[#E8D5BE] rounded-full',
                detailIcon: 'text-[#D4A054]',
                detailText: 'text-[#8C6B5D]',
            };
        case 'luxury':
            return {
                titleColor: 'text-[#1B2A4A]',
                titleFont: { fontFamily: 'var(--font-heading)' },
                titleExtra: 'font-medium tracking-widest uppercase',
                addressColor: 'text-[#8A8070]',
                addressIcon: 'text-[#D4C5A9]',
                featureCard: 'bg-white border border-[#D4C5A9] rounded-2xl shadow-sm',
                featureIconBg: 'bg-[#F9F7F4]',
                featureIconColor: 'text-[#C9A84C]',
                featureLabel: 'text-[#1B2A4A]',
                featureSub: 'text-[#8A8070]',
                aboutBg: 'bg-white border border-[#D4C5A9] rounded-3xl shadow-sm',
                aboutIconColor: 'text-[#C9A84C]',
                aboutHeadingColor: 'text-[#8A8070] font-black',
                aboutText: 'text-[#1B2A4A]/70',
                divider: 'border-[#D4C5A9]',
                warmlyColor: 'text-[#8A8070]',
                hostNameColor: 'text-[#1B2A4A]',
                hostNameExtra: 'font-medium tracking-widest uppercase text-lg',
                phoneBtnBg: 'bg-[#1B2A4A]',
                phoneBtnText: 'text-[#C9A84C]',
                whatsBtnBg: 'bg-[#F9F7F4] border border-[#D4C5A9]',
                whatsBtnText: 'text-[#C9A84C]',
                footerColor: 'text-[#8A8070]',
                quoteColor: 'text-[#C9A84C]/15',
                detailBg: 'bg-[#F9F7F4] border border-[#D4C5A9] rounded-full',
                detailIcon: 'text-[#C9A84C]',
                detailText: 'text-[#8A8070]',
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
                featureSub: 'text-[#A1A1AA]',
                aboutBg: 'bg-white border border-[#E4E4E7] rounded-3xl shadow-sm',
                aboutIconColor: 'text-[#52525B]',
                aboutHeadingColor: 'text-[#52525B] font-black',
                aboutText: 'text-[#09090B]/80',
                divider: 'border-[#E4E4E7]',
                warmlyColor: 'text-[#A1A1AA]',
                hostNameColor: 'text-[#09090B]',
                hostNameExtra: 'font-bold text-xl',
                phoneBtnBg: 'bg-[#18181B]',
                phoneBtnText: 'text-white',
                whatsBtnBg: 'bg-[#F4F4F5] border border-[#E4E4E7]',
                whatsBtnText: 'text-[#18181B]',
                footerColor: 'text-[#A1A1AA]',
                quoteColor: 'text-[#E4E4E7]',
                detailBg: 'bg-[#F4F4F5] border border-[#E4E4E7] rounded-full',
                detailIcon: 'text-[#52525B]',
                detailText: 'text-[#52525B]',
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
    const { content: labelMessageHost } = useLocalizedContent('Mensaje de los anfitriones', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelTheProperty } = useLocalizedContent('La propiedad', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerifiedDetails } = useLocalizedContent('Detalles verificados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWarmly } = useLocalizedContent('Con cariño,', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelContactHost } = useLocalizedContent('Llamar', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWhatsApp } = useLocalizedContent('WhatsApp', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: labelDormitorios } = useLocalizedContent('Dormitorios', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBanos } = useLocalizedContent('Baños', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuests } = useLocalizedContent('Huéspedes', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: labelSqM } = useLocalizedContent('superficie', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelFloor } = useLocalizedContent('planta', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelParking } = useLocalizedContent('Parking', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: localizedName } = useLocalizedContent(property.name, currentLanguage, 'property_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(welcomeData?.message || '', currentLanguage, 'welcome_message', accessToken, propertyId);

    const stats = [
        { icon: Bed, value: property.beds || 0, label: labelDormitorios, show: !!property.beds },
        { icon: Bath, value: property.baths || 0, label: labelBanos, show: !!property.baths },
        { icon: Users, value: property.guests || 0, label: labelGuests, show: !!property.guests },
        { icon: Car, value: property.parking_number || 'P', label: labelParking, show: !!property.has_parking }
    ].filter(s => s.show);

    const details = [
        { icon: Ruler, text: `${property.sqm || property.square_meters || 0} m²`, label: labelSqM, show: !!(property.sqm || property.square_meters) },
        { icon: Layers, text: `${property.floor || property.floor_number || 0}ª`, label: labelFloor, show: !!(property.floor || property.floor_number) }
    ].filter(d => d.show);

    const hostName = welcomeData?.host_name || property.host_name || 'Anfitrión';
    const hostPhone = 
        contactsData?.host_mobile || 
        contactsData?.host_phone || 
        property.host_phone || 
        welcomeData?.host_phone || 
        contactsData?.support_mobile || 
        contactsData?.support_phone || 
        '';

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
                {/* Header Card with Overlaid Text */}
                <motion.div variants={item} className="mt-6 mb-10 relative">
                    <div className="rounded-[2.5rem] overflow-hidden shadow-xl h-56 relative bg-gray-200">
                        {property.main_image_url && (
                            <Image
                                src={property.main_image_url}
                                alt={property.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 text-left">
                            <h1 className={cn(
                                'text-2xl font-bold text-white mb-1 leading-tight',
                                !localizedName && 'h-7 w-48 bg-white/20 animate-pulse rounded-md'
                            )}>
                                {localizedName}
                            </h1>
                            <p className="text-white/70 text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={10} className="shrink-0" />
                                {property.full_address}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Host Message Section */}
                {(localizedDescription || hostName) && (
                    <motion.div variants={item} className="mb-10">
                        <div className={cn('p-8 pt-10 relative', t.aboutBg)}>
                            <Quote className={cn('absolute top-4 left-6 w-10 h-10', t.quoteColor)} strokeWidth={1.5} />
                            
                            <div className="text-left relative z-10">
                                <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4', t.aboutHeadingColor)}>
                                    {labelMessageHost}
                                </p>
                                <div className={cn('text-[15px] leading-relaxed font-medium mb-8 text-pretty whitespace-pre-line', t.aboutText)}>
                                    {localizedDescription}
                                </div>

                                <div className="flex items-center gap-4 pt-6 border-t border-dashed" style={{ borderColor: 'inherit' }}>
                                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-500/20">
                                        {hostName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn('text-[11px] font-bold uppercase tracking-widest', t.warmlyColor)}>
                                            {labelWarmly}
                                        </span>
                                        <span className={cn('leading-tight', t.hostNameColor, t.hostNameExtra)}>
                                            {hostName}
                                        </span>
                                    </div>
                                </div>

                                {hostPhone && (
                                    <div className="grid grid-cols-2 gap-3 mt-8">
                                        <a
                                            href={`https://wa.me/${hostPhone.replace(/\s+/g, '').replace('+', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold transition-all active:scale-95 shadow-sm', t.whatsBtnBg, t.whatsBtnText)}
                                        >
                                            <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
                                            <span>{labelWhatsApp}</span>
                                        </a>
                                        <a
                                            href={`tel:${hostPhone.replace(/\s/g, '')}`}
                                            className={cn('flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold shadow-md transition-all active:scale-95', t.phoneBtnBg, t.phoneBtnText)}
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>{labelContactHost}</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Property Stats Section */}
                {stats.length > 0 && (
                    <motion.div variants={item} className="mb-10 text-left">
                        <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-2', t.aboutHeadingColor)}>
                            {labelTheProperty}
                        </p>
                        <div className={cn('grid gap-3 mb-4', stats.length === 4 ? 'grid-cols-2' : 'grid-cols-3')}>
                            {stats.map((stat, i) => (
                                <div key={i} className={cn('flex flex-col items-center text-center p-4', t.featureCard)}>
                                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', t.featureIconBg, t.featureIconColor)}>
                                        <stat.icon size={20} />
                                    </div>
                                    <span className={cn('text-2xl font-black mb-0.5', t.featureLabel)}>{stat.value}</span>
                                    <span className={cn('text-[11px] font-bold leading-tight', t.featureLabel)}>{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {details.length > 0 && (
                            <div className={cn('grid grid-cols-2 gap-3 py-3 px-6', t.detailBg)}>
                                {details.map((detail, i) => (
                                    <div key={i} className={cn('flex items-center gap-2 text-[13px] font-bold', i === 0 ? 'justify-start' : 'justify-center border-l border-current/10')}>
                                        <detail.icon size={14} className={t.detailIcon} />
                                        <span className={t.detailText}>{detail.text}</span>
                                        <span className={cn('text-[10px] font-medium lowercase opacity-60', t.detailText)}>{detail.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Footer Check */}
                <motion.div variants={item} className="flex items-center justify-center gap-2 py-4">
                    <CheckCircle2 size={12} className="text-green-500" />
                    <p className={cn('text-[10px] font-black tracking-[0.15em] uppercase text-green-600')}>
                        {labelVerifiedDetails}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
