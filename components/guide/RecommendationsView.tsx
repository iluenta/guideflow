'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    UtensilsCrossed,
    CalendarDays,
    ShoppingBag,
    MapPin,
    Clock,
    Star,
    Navigation,
    Mountain,
    Trees,
    Landmark,
    Music,
    Wind,
    ArrowRight,
    Camera,
    Bike,
    Waves,
    Coffee,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface Recommendation {
    id: string;
    name: string;
    type: string;
    description?: string;
    distance?: string;
    time?: string;
    price_range?: string;
    personal_note?: string;
    map_url?: string;
    metadata?: {
        time?: string;
        price_range?: string;
        personal_note?: string;
    };
}

interface RecommendationsViewProps {
    onBack: () => void;
    recommendations: Recommendation[];
    group: 'eat' | 'do' | 'shopping';
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    city?: string;
    accessToken?: string;
    propertyId?: string; // FASE 17
}

function RecommendationCard({ 
    rec, 
    isExpanded, 
    toggleExpand, 
    currentLanguage, 
    accessToken, 
    handleOpenMap,
    propertyId // FASE 17
}: { 
    rec: Recommendation, 
    isExpanded: boolean, 
    toggleExpand: (id: string) => void,
    currentLanguage: string, 
    accessToken?: string,
    handleOpenMap: (e: React.MouseEvent, rec: Recommendation) => void,
    propertyId?: string // FASE 17
}) {
    const { content: localizedName } = useLocalizedContent(rec.name, currentLanguage, 'recommendation_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(rec.description || '', currentLanguage, 'recommendation_description', accessToken, propertyId);
    
    // Check for nested metadata or direct props
    const rawPrice = rec.price_range || rec.metadata?.price_range || '';
    const rawTime = rec.time || rec.metadata?.time || '';
    const rawNote = rec.personal_note || rec.metadata?.personal_note || '';

    const { content: localizedPrice } = useLocalizedContent(rawPrice, currentLanguage, 'recommendation_price', accessToken, propertyId);
    const { content: localizedTime } = useLocalizedContent(rawTime, currentLanguage, 'recommendation_time', accessToken, propertyId);
    const { content: localizedNote } = useLocalizedContent(rawNote, currentLanguage, 'recommendation_note', accessToken, propertyId);

    // Static labels
    const { content: labelPrice } = useLocalizedContent('Precio:', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelTime } = useLocalizedContent('Tiempo:', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHostTip } = useLocalizedContent('Consejo del anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);

    const catLabel = (rec.type || 'ocio').toLowerCase();
    const catStyle = categoryConfigs[catLabel] || categoryConfigs.todos;
    const Icon = catStyle.icon;

    return (
        <div
            onClick={() => toggleExpand(rec.id)}
            className={cn(
                "bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer flex flex-col gap-4 overflow-hidden border border-transparent",
                isExpanded && "border-navy/5 ring-1 ring-navy/5 shadow-lg"
            )}
        >
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${catStyle.bgColor} ${catStyle.color}`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={cn(
                            "font-serif text-lg text-navy font-bold leading-tight truncate",
                            !localizedName && "h-6 w-3/4 bg-slate/10 animate-pulse rounded-md"
                        )}>
                            {localizedName}
                        </h3>
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-navy/20 shrink-0" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-navy/20 shrink-0" />
                        )}
                    </div>

                    <div className={cn(
                        "text-[13px] text-slate leading-relaxed transition-all duration-300",
                        !isExpanded && "line-clamp-2",
                        !localizedDescription && "space-y-2"
                    )}>
                        {localizedDescription ? (
                            localizedDescription
                        ) : (
                            <>
                                <div className="h-3 w-full bg-slate/5 animate-pulse rounded-sm" />
                                <div className="h-3 w-5/6 bg-slate/5 animate-pulse rounded-sm" />
                            </>
                        )}
                    </div>

                    {isExpanded && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-navy/5">
                            <div className="flex flex-wrap gap-4">
                                {localizedPrice && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate/80 bg-slate/5 px-2.5 py-1 rounded-lg">
                                        <span className="text-navy/40">{labelPrice}</span>
                                        <span className="text-primary">{localizedPrice}</span>
                                    </div>
                                )}
                                {localizedTime && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate/80 bg-slate/5 px-2.5 py-1 rounded-lg">
                                        <Clock className="w-3.5 h-3.5 text-navy/30" />
                                        <span className="text-navy/40">{labelTime}</span>
                                        <span>{localizedTime}</span>
                                    </div>
                                )}
                            </div>

                            {localizedNote && (
                                <div className="p-4 rounded-xl bg-beige/50 border-l-2 border-primary/20 italic">
                                    <p className="text-[13px] text-navy/70 leading-relaxed">
                                        "{localizedNote}"
                                    </p>
                                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest mt-2 not-italic">
                                        {labelHostTip}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-5 mt-4">
                        {rec.distance && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate/60">
                                <MapPin className="w-3.5 h-3.5 opacity-50" />
                                {rec.distance}
                            </div>
                        )}
                        {localizedTime && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate/60">
                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                {localizedTime}
                            </div>
                        )}
                    </div>
                </div>

                <div className="self-start pt-1">
                    <button
                        onClick={(e) => handleOpenMap(e, rec)}
                        className="w-10 h-10 rounded-full bg-beige hover:bg-primary/10 flex items-center justify-center text-navy transition-all active:scale-90"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

const categoryConfigs: Record<string, { icon: any, color: string, bgColor: string, activeBg: string, hex: string }> = {
    restaurantes: { icon: UtensilsCrossed, color: 'text-orange-600', bgColor: 'bg-orange-50', activeBg: 'bg-orange-600', hex: '#EA580C' },
    naturaleza: { icon: Mountain, color: 'text-emerald-600', bgColor: 'bg-emerald-50', activeBg: 'bg-emerald-600', hex: '#059669' },
    cultura: { icon: Landmark, color: 'text-amber-600', bgColor: 'bg-amber-50', activeBg: 'bg-amber-600', hex: '#D97706' },
    ocio: { icon: Music, color: 'text-pink-600', bgColor: 'bg-pink-50', activeBg: 'bg-pink-600', hex: '#DB2777' },
    relax: { icon: Waves, color: 'text-teal-600', bgColor: 'bg-teal-50', activeBg: 'bg-teal-600', hex: '#0D9488' },
    compras: { icon: ShoppingBag, color: 'text-indigo-600', bgColor: 'bg-indigo-50', activeBg: 'bg-indigo-600', hex: '#4F46E5' },
    desayuno: { icon: Coffee, color: 'text-amber-700', bgColor: 'bg-amber-50', activeBg: 'bg-amber-700', hex: '#B45309' },
    todos: { icon: Star, color: 'text-navy/40', bgColor: 'bg-white', activeBg: 'bg-navy', hex: '#1E3A5F' }
};

const groupConfigs = {
    eat: {
        title: 'Dónde Comer',
        heroTitle: 'Sabores Locales',
        heroDesc: 'Mis recomendaciones personales para disfrutar de la mejor gastronomía de la zona.',
        categories: ['restaurantes', 'desayuno'],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'restaurantes', label: 'Restaurantes', type: 'restaurantes' },
            { id: 'desayuno', label: 'Desayunos', type: 'desayuno' }
        ]
    },
    do: {
        title: 'Qué Hacer',
        heroTitle: 'Descubre el entorno',
        heroDesc: 'Experiencias únicas y rincones especiales seleccionados para ti.',
        categories: ['naturaleza', 'cultura', 'ocio', 'relax'],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'naturaleza', label: 'Naturaleza', type: 'naturaleza' },
            { id: 'cultura', label: 'Cultura', type: 'cultura' },
            { id: 'relax', label: 'Relax', type: 'relax' },
            { id: 'ocio', label: 'Ocio', type: 'ocio' }
        ]
    },
    shopping: {
        title: 'Compras',
        heroTitle: 'De Compras',
        heroDesc: 'Mercados tradicionales, tiendas de artesanía y todo lo necesario para tu estancia.',
        categories: ['compras'],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'compras', label: 'Compras', type: 'compras' }
        ]
    }
};

export function RecommendationsView({ 
    onBack, 
    recommendations, 
    group, 
    currentLanguage = 'es', 
    city,
    accessToken,
    propertyId // FASE 17
}: RecommendationsViewProps) {
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const config = groupConfigs[group];

    // Localize UI Labels
    const { content: localizedGroupTitle } = useLocalizedContent(config.title, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedHeroTitle } = useLocalizedContent(config.heroTitle, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: localizedHeroDesc } = useLocalizedContent(config.heroDesc, currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEmpty } = useLocalizedContent('Sin recomendaciones aún', currentLanguage, 'ui_label', accessToken, propertyId);

    // Pill Labels
    const { content: labelTodo } = useLocalizedContent('Todo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRestaurantes } = useLocalizedContent('Restaurantes', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelDesayunos } = useLocalizedContent('Desayunos', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelNaturaleza } = useLocalizedContent('Naturaleza', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCultura } = useLocalizedContent('Cultura', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelRelax } = useLocalizedContent('Relax', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOcio } = useLocalizedContent('Ocio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelCompras } = useLocalizedContent('Compras', currentLanguage, 'ui_label', accessToken, propertyId);

    const pillLabels: Record<string, string | undefined> = {
        todos: labelTodo,
        restaurantes: labelRestaurantes,
        desayuno: labelDesayunos,
        naturaleza: labelNaturaleza,
        cultura: labelCultura,
        relax: labelRelax,
        ocio: labelOcio,
        compras: labelCompras
    };

    const filteredRecommendations = useMemo(() => {
        let items = recommendations.filter(r => {
            const cat = (r.type || 'ocio').toLowerCase();
            return config.categories.includes(cat);
        });

        if (selectedCategory !== 'todos') {
            items = items.filter(r => (r.type || '').toLowerCase() === selectedCategory);
        }
        return items;
    }, [recommendations, group, selectedCategory]);

    const getMapsUrl = (rec: Recommendation) => {
        if (rec.map_url && rec.map_url.startsWith('http')) return rec.map_url;

        // Smart URL generation based on name, category and city context
        const locationContext = city ? ` ${city}` : '';
        const query = encodeURIComponent(`${rec.name} ${rec.type || ''}${locationContext}`);
        // Universal Google Maps search URL (works on iOS and Android)
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    const getRecommendationDetails = (rec: Recommendation) => {
        return {
            price: rec.price_range || rec.metadata?.price_range,
            time: rec.time || rec.metadata?.time,
            note: rec.personal_note || rec.metadata?.personal_note
        };
    };

    const handleOpenMap = (e: React.MouseEvent, rec: Recommendation) => {
        e.stopPropagation();
        const url = getMapsUrl(rec);
        window.open(url, '_blank');
    };

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="flex flex-col min-h-screen bg-beige pb-8">
            {/* Header (Fase 5 Style) */}
            <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-navy/5 px-4 h-16 flex items-center">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 font-serif text-xl text-navy font-semibold tracking-tight">
                    {localizedGroupTitle}
                </h1>
            </header>

            <div className="flex-1">
                {/* Hero section */}
                <div className="px-6 py-8">
                    <h2 className="font-serif text-3xl text-navy font-bold leading-tight mb-2">
                        {localizedHeroTitle}
                    </h2>
                    <p className="text-sm text-slate leading-relaxed max-w-[90%]">
                        {localizedHeroDesc}
                    </p>
                </div>

                <div className="px-6 mb-8">
                    <div className="flex flex-wrap gap-x-2 gap-y-3">
                        {config.pills.map((pill: { id: string, label: string, type: string }) => {
                            const isActive = selectedCategory === pill.id;
                            const catConfig = categoryConfigs[pill.type] || categoryConfigs.todos;
                            const Icon = catConfig.icon;

                            return (
                                <button
                                    key={pill.id}
                                    onClick={() => setSelectedCategory(pill.id)}
                                    style={isActive ? { backgroundColor: catConfig.hex } : {}}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                                        isActive
                                            ? "text-white shadow-lg scale-105"
                                            : "bg-white text-slate hover:bg-white/80 border border-navy/5"
                                    )}
                                >
                                    {Icon && pill.id !== 'todos' && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
                                    {pillLabels[pill.id] || pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendations List (Fase 5 Style) */}
                <div className="px-6 space-y-4">
                    {filteredRecommendations.length > 0 ? (
                        filteredRecommendations.map((rec) => (
                            <RecommendationCard 
                                key={rec.id}
                                rec={rec}
                                isExpanded={expandedId === rec.id}
                                toggleExpand={toggleExpand}
                                currentLanguage={currentLanguage}
                                accessToken={accessToken}
                                propertyId={propertyId}
                                handleOpenMap={handleOpenMap}
                            />
                        ))
                    ) : (
                        <div className="py-20 text-center bg-white/30 rounded-3xl border border-dashed border-navy/10">
                            <Star className="w-8 h-8 text-navy/10 mx-auto mb-3" />
                            <p className="text-navy/40 text-sm font-bold uppercase tracking-widest">
                                {labelEmpty}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mockup powered text */}
            <div className="px-6 mt-8 mb-4 text-center opacity-20">
                <p className="text-[8px] text-navy uppercase font-black tracking-[0.3em]">
                    Recomendaciones seleccionadas por el anfitrión
                </p>
            </div>
        </div>
    );
}
