import { motion } from 'framer-motion';
import { Bed, Bath, Users, Info, MapPin } from 'lucide-react';
import { PageHeader } from './PageHeader';

interface HouseInfoViewProps {
    onBack: () => void;
    property: any;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
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

export function HouseInfoView({ onBack, property, currentLanguage = 'es', onLanguageChange }: HouseInfoViewProps) {
    const features = [
        {
            icon: Bed,
            label: currentLanguage === 'es' ? `${property.beds || 0} Dormitorio${(property.beds || 0) > 1 ? 's' : ''}` : `${property.beds || 0} Bedroom${(property.beds || 0) > 1 ? 's' : ''}`,
            sub: currentLanguage === 'es' ? 'Camas preparadas' : 'Beds prepared',
            show: !!property.beds
        },
        {
            icon: Bath,
            label: currentLanguage === 'es' ? `${property.baths || 0} Baño${(property.baths || 0) > 1 ? 's' : ''}` : `${property.baths || 0} Bathroom${(property.baths || 0) > 1 ? 's' : ''}`,
            sub: currentLanguage === 'es' ? 'Equipados' : 'Equipped',
            show: !!property.baths
        },
        {
            icon: Users,
            label: currentLanguage === 'es' ? `Hasta ${property.guests || 0} huéspedes` : `Up to ${property.guests || 0} guests`,
            sub: currentLanguage === 'es' ? 'Ideal para su estancia' : 'Ideal for your stay',
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
                title={currentLanguage === 'es' ? "Info Casa" : "House Info"}
                onBack={onBack}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
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
                    <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2 leading-tight">
                        {property.name}
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
                                    {currentLanguage === 'es' ? 'Sobre la propiedad' : 'About the property'}
                                </h3>
                            </div>
                            <p className="text-[14px] text-slate-800/80 leading-relaxed font-medium text-left">
                                {property.description}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Footer */}
                <motion.div variants={item} className="text-center opacity-30">
                    <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">
                        {currentLanguage === 'es' ? 'Detalles verificados' : 'Verified Details'}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
