import { motion } from 'framer-motion';
import { Bed, Bath, Users, Info, MapPin } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';

interface HouseInfoViewProps {
    onBack: () => void;
    property: any;
    currentLanguage?: string;
    accessToken?: string;
    propertyId?: string; // FASE 17
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
    currentLanguage = 'es', 
    accessToken,
    propertyId // FASE 17
}: HouseInfoViewProps) {
    const { content: labelHouseInfoTitle } = useLocalizedContent('Info Casa', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAboutProperty } = useLocalizedContent('Sobre la propiedad', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelVerifiedDetails } = useLocalizedContent('Detalles verificados', currentLanguage, 'ui_label', accessToken, propertyId);

    // Feature Labels (Dynamic)
    const { content: labelDormitorios } = useLocalizedContent(`${property.beds || 0} Dormitorio${(property.beds || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subCamas } = useLocalizedContent('Camas preparadas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelBanos } = useLocalizedContent(`${property.baths || 0} Baño${(property.baths || 0) > 1 ? 's' : ''}`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subEquipados } = useLocalizedContent('Equipados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelGuests } = useLocalizedContent(`Hasta ${property.guests || 0} huéspedes`, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subIdeal } = useLocalizedContent('Ideal para su estancia', currentLanguage, 'ui_label', accessToken, propertyId);

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
            />

            <div className="px-6 pb-24 max-w-md mx-auto w-full">
                {/* Property Image */}
                {property.main_image_url && (
                    <motion.div variants={item} className="mt-6 mb-6">
                        <div className="rounded-3xl overflow-hidden shadow-card h-44 relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img
                                src={property.main_image_url}
                                alt={property.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Property Name & Address */}
                <motion.div variants={item} className="mb-8 px-2">
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
                {property.description && (
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
                                "text-[14px] text-slate-800/80 leading-relaxed font-medium text-left",
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
