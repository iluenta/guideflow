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
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
};

export function HouseInfoView({
    onBack,
    property,
    welcomeData,
    contactsData,
    currentLanguage = 'es',
    onLanguageChange,
    accessToken,
    propertyId,
    disabledLanguage = false
}: HouseInfoViewProps) {
    const { content: labelHouseInfoTitle } = useLocalizedContent('Info Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAboutProperty } = useLocalizedContent('Sobre la propiedad', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerifiedDetails } = useLocalizedContent('Detalles verificados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelWarmly } = useLocalizedContent('Con cariño,', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelYourHost } = useLocalizedContent('Tu anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelContactHost } = useLocalizedContent('Contactar', currentLanguage, 'ui_label', accessToken, propertyId);

    // Feature Labels (Dynamic)
    const { content: labelDormitorios } = useLocalizedContent(`${property.beds || 0} Dormitorio${(property.beds || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subCamas } = useLocalizedContent('Camas preparadas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBanos } = useLocalizedContent(`${property.baths || 0} Baño${(property.baths || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subEquipados } = useLocalizedContent('Equipados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuests } = useLocalizedContent(`Hasta ${property.guests || 0} huéspedes`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subIdeal } = useLocalizedContent('Ideal para su estancia', currentLanguage, 'ui_label', accessToken, propertyId);

    const { content: localizedName } = useLocalizedContent(property.name, currentLanguage, 'property_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(welcomeData?.message || '', currentLanguage, 'welcome_message', accessToken, propertyId);

    const features = [
        {
            icon: Bed,
            label: labelDormitorios,
            sub: subCamas,
            show: !!property.beds
        },
        {
            icon: Bath,
            label: labelBanos,
            sub: subEquipados,
            show: !!property.baths
        },
        {
            icon: Users,
            label: labelGuests,
            sub: subIdeal,
            show: !!property.guests
        }
    ].filter(f => f.show);

    const hostName = welcomeData?.host_name || property.host_name || 'Anfitrión';
    const hostPhone = contactsData?.support_phone || contactsData?.support_mobile || property.host_phone || '';

    return (
        <motion.div
            className="flex flex-col min-h-full bg-background"
            variants={container}
            initial="hidden"
            animate="show"
        >
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
                        "text-2xl font-serif font-bold text-slate-800 mb-2 leading-tight",
                        !localizedName && "h-8 w-56 bg-slate-100 animate-pulse rounded-lg"
                    )}>
                        {localizedName}
                    </h1>
                    <p className="text-[12px] text-primary/50 font-medium uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary/30 shrink-0" />
                        {property.full_address}
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div variants={item} className="space-y-3 mb-10">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-5 p-4 rounded-3xl border border-primary/[0.03] bg-surface shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/[0.04] text-primary shrink-0">
                                <feature.icon size={20} strokeWidth={2} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 text-[15px] leading-tight">{feature.label}</p>
                                <p className="text-[11px] text-primary/40 font-black uppercase tracking-widest mt-1">{feature.sub}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* About Section */}
                {(welcomeData?.message || hostName) && (
                    <motion.div variants={item} className="mb-10">
                        <div className="bg-primary/[0.02] rounded-3xl p-6 border border-primary/[0.05]">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                    <Info size={14} strokeWidth={3} />
                                </div>
                                <h3 className="font-serif font-bold text-slate-800">
                                    {labelAboutProperty}
                                </h3>
                            </div>
                            
                            <div className={cn(
                                "text-[14px] text-slate-800/80 leading-relaxed font-medium text-left whitespace-pre-line",
                                !localizedDescription && "space-y-2"
                            )}>
                                {localizedDescription ? (
                                    localizedDescription
                                ) : (
                                    <>
                                        <div className="h-4 w-full bg-primary/5 animate-pulse rounded-md" />
                                        <div className="h-4 w-11/12 bg-primary/5 animate-pulse rounded-md" />
                                        <div className="h-4 w-4/5 bg-primary/5 animate-pulse rounded-md" />
                                    </>
                                )}
                            </div>

                            {/* Signature Section */}
                            <div className="mt-8 pt-8 border-t border-primary/5 flex flex-col items-start text-left">
                                <span className="text-[11px] text-primary/40 font-bold uppercase tracking-widest mb-2">
                                    {labelWarmly}
                                </span>
                                <div className="flex flex-col items-center w-full gap-5 text-center mt-2">
                                    <div className="flex flex-col items-center">
                                        <span className="text-navy font-serif italic text-2xl font-bold leading-tight px-4">
                                            {hostName}
                                        </span>
                                    </div>

                                    {hostPhone && (
                                        <div className="flex items-center justify-center gap-3">
                                            <a
                                                href={`https://wa.me/${hostPhone.replace(/\s+/g, '').replace('+', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-[#25D366]/90 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                                            >
                                                <MessageSquare className="w-5 h-5" strokeWidth={2.5} />
                                            </a>
                                            <a
                                                href={`tel:${hostPhone.replace(/\s/g, '')}`}
                                                className="flex items-center gap-2.5 bg-primary text-white px-6 py-2.5 rounded-full text-[13px] font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
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
                    <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
                        {labelVerifiedDetails}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
