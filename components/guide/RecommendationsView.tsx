'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
    ChevronUp,
    Pizza,
    Fish,
    Beef,
    Globe,
    Utensils,
    Store,
    Sunrise,
    Sunset,
    Telescope,
    Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface Recommendation {
    id: string;
    name: string;
    type: string;
    category?: string;
    description?: string;
    distance?: string;
    time?: string;
    price_range?: string;
    personal_note?: string;
    map_url?: string;
    google_place_id?: string;
    rating?: number | null;
    tags?: string[];
    opening_hours?: {
        open: string | null;
        close: string | null;
        always_open?: boolean;
        open_now?: boolean;
        weekday_text?: string[];
    };
    metadata?: {
        photo_url?: string | null;
        rating_count?: number | null;
        editorial_summary?: string | null;
        time?: string;
        price_level?: number;
        price_range?: string;
        personal_note?: string;
        google_place_id?: string;
        tags?: string[];
        best_time_slots?: string[];
        availability?: {
            days: string[];
            notes?: string;
        };
        opening_hours?: {
            open: string | null;
            close: string | null;
            always_open?: boolean;
            open_now?: boolean;
            weekday_text?: string[];
        };
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
    propertyId?: string;
    disabledLanguage?: boolean;
    handleNavigate?: (path: string) => void;
    initialRecId?: string;
}

function RecommendationCard({
    rec,
    isExpanded,
    toggleExpand,
    currentLanguage,
    accessToken,
    getMapsUrl,
    propertyId
}: {
    rec: Recommendation,
    isExpanded: boolean,
    toggleExpand: (id: string) => void,
    currentLanguage: string,
    accessToken?: string,
    getMapsUrl: (rec: Recommendation) => string,
    propertyId?: string
}) {
    const { content: localizedName } = useLocalizedContent(rec.name, currentLanguage, 'recommendation_name', accessToken, propertyId);
    const { content: localizedDescription } = useLocalizedContent(rec.description || '', currentLanguage, 'recommendation_description', accessToken, propertyId);

    const metadata = rec.metadata || {};
    const photoUrl = metadata.photo_url || null;
    const rating = rec.rating || null;
    const editorialSummary = metadata.editorial_summary || null;
    const openNow = metadata.opening_hours?.open_now;

    const rawNote = rec.personal_note || metadata.personal_note || '';
    const openingHours = metadata.opening_hours || rec.opening_hours;

    const { content: localizedNote } = useLocalizedContent(rawNote, currentLanguage, 'recommendation_note', accessToken, propertyId);
    const { content: labelHostTip } = useLocalizedContent('Consejo del anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelOpen } = useLocalizedContent('Abierto', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelClosed } = useLocalizedContent('Cerrado', currentLanguage, 'ui_label', accessToken, propertyId);

    const tags = metadata.tags || rec.tags || [];
    const distanceText = rec.distance && !rec.distance.toLowerCase().includes('distance') ? rec.distance : null;

    const catLabel = (rec.type || 'ocio').toLowerCase();
    const catStyle = categoryConfigs[catLabel] || categoryConfigs.todos;
    const Icon = catStyle.icon;

    return (
        <div
            onClick={() => toggleExpand(rec.id)}
            className={cn(
                "bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-navy/5",
                isExpanded && "ring-1 ring-navy/10 shadow-lg"
            )}
        >
            <div className="flex relative items-start p-3 sm:p-4 gap-3">
                {/* Accent Border (Colored) - Thin Line on the left */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-1" 
                    style={{ backgroundColor: catStyle.hex }}
                />

                {/* Left: Small Square Image / Icon Fallback */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden shadow-inner border border-navy/5 bg-slate/5">
                    {photoUrl ? (
                        <img 
                            src={photoUrl} 
                            alt={rec.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div 
                            className="w-full h-full flex items-center justify-center relative overflow-hidden"
                            style={{ 
                                background: `linear-gradient(135deg, ${catStyle.hex}15 0%, ${catStyle.hex}30 100%)` 
                            }}
                        >
                            {/* Decorative background icon */}
                            <Icon 
                                className="absolute -right-2 -bottom-2 w-16 h-16 opacity-5 rotate-12" 
                                strokeWidth={1} 
                            />
                            {/* Main centered icon */}
                            <div 
                                className="relative z-10 p-4 rounded-full bg-white/40 backdrop-blur-sm shadow-sm"
                                style={{ color: catStyle.hex }}
                            >
                                <Icon className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Content Area (Tighter) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                    {/* Title + Rating Line */}
                    <div className="flex justify-between items-start gap-2 mb-0.5">
                        <h3 className={cn(
                            "text-[15px] sm:text-base font-bold text-navy leading-tight min-h-[1.2em]",
                            !isExpanded && "line-clamp-2",
                            !localizedName && "h-5 w-3/4 bg-slate/10 animate-pulse rounded-md"
                        )}>
                            {localizedName}
                        </h3>
                        {rating && (
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                <Star className="w-3 h-3 text-orange-400 fill-current" />
                                <span className="text-[13px] font-bold text-navy/80">{rating}</span>
                            </div>
                        )}
                    </div>

                    {/* Subtitle / Description */}
                    <p className={cn(
                        "text-[12px] sm:text-[13px] text-slate/70 leading-snug mb-2 italic",
                        !isExpanded && "line-clamp-2"
                    )}>
                        {editorialSummary || localizedDescription}
                    </p>

                    {/* Meta Info: Distance + Status */}
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate/50 mb-2">
                        {distanceText && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 opacity-40" />
                                {distanceText}
                            </div>
                        )}
                        {openNow !== undefined && (
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", openNow ? "bg-emerald-500" : "bg-rose-500")} />
                                <span className={cn(openNow ? "text-emerald-600" : "text-rose-600")}>
                                    {openNow ? (labelOpen || 'Abierto') : (labelClosed || 'Cerrado')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tags + Maps Link Footer */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                            {tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] font-bold text-slate/30 lowercase italic">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        
                        <a
                            href={getMapsUrl(rec)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (getMapsUrl(rec).startsWith('http')) {
                                    window.open(getMapsUrl(rec), '_blank', 'noopener,noreferrer');
                                    e.preventDefault();
                                }
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-slate/40 hover:text-navy transition-colors shrink-0"
                        >
                            Maps
                            <Navigation className="w-3 h-3" />
                        </a>
                    </div>

                    {/* Expanded Detail Overlay */}
                    {isExpanded && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-navy/5 animate-in fade-in slide-in-from-top-1">
                            {localizedNote && (
                                <div 
                                    className="p-3 rounded-2xl text-[12px] relative overflow-hidden group/note border border-navy/5 shadow-sm"
                                    style={{ 
                                        background: `linear-gradient(to right, ${catStyle.hex}10, transparent)` 
                                    }}
                                >
                                    {/* Decorative subtle left line */}
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 w-1 opacity-20"
                                        style={{ backgroundColor: catStyle.hex }}
                                    />
                                    
                                    <p className="font-serif italic text-navy/70 relative z-10 leading-relaxed pr-8">
                                        "{localizedNote}"
                                    </p>
                                    
                                    <div className="flex items-center gap-2 mt-2 opacity-60">
                                        <div 
                                            className="h-[1px] flex-1"
                                            style={{ backgroundColor: `${catStyle.hex}20` }}
                                        />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-navy/40">
                                            {labelHostTip}
                                        </span>
                                    </div>

                                    {/* Small floating icon in background */}
                                    <Icon 
                                        className="absolute -right-2 -bottom-2 w-10 h-10 opacity-5 rotate-12" 
                                        style={{ color: catStyle.hex }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const categoryConfigs: Record<string, { icon: any, color: string, bgColor: string, activeBg: string, hex: string }> = {
    restaurantes: { icon: UtensilsCrossed, color: 'text-orange-600', bgColor: 'bg-orange-50', activeBg: 'bg-orange-600', hex: '#EA580C' },
    italiano: { icon: Pizza, color: 'text-red-600', bgColor: 'bg-red-50', activeBg: 'bg-red-600', hex: '#DC2626' },
    mediterraneo: { icon: Fish, color: 'text-sky-600', bgColor: 'bg-sky-50', activeBg: 'bg-sky-600', hex: '#0284C7' },
    hamburguesas: { icon: Beef, color: 'text-amber-700', bgColor: 'bg-amber-50', activeBg: 'bg-amber-700', hex: '#B45309' },
    asiatico: { icon: UtensilsCrossed, color: 'text-rose-600', bgColor: 'bg-rose-50', activeBg: 'bg-rose-600', hex: '#E11D48' },
    alta_cocina: { icon: Star, color: 'text-violet-600', bgColor: 'bg-violet-50', activeBg: 'bg-violet-600', hex: '#7C3AED' },
    internacional: { icon: Globe, color: 'text-cyan-600', bgColor: 'bg-cyan-50', activeBg: 'bg-cyan-600', hex: '#0891B2' },
    naturaleza: { icon: Mountain, color: 'text-emerald-600', bgColor: 'bg-emerald-50', activeBg: 'bg-emerald-600', hex: '#059669' },
    cultura: { icon: Landmark, color: 'text-amber-600', bgColor: 'bg-amber-50', activeBg: 'bg-amber-600', hex: '#D97706' },
    ocio: { icon: Music, color: 'text-pink-600', bgColor: 'bg-pink-50', activeBg: 'bg-pink-600', hex: '#DB2777' },
    relax: { icon: Waves, color: 'text-teal-600', bgColor: 'bg-teal-50', activeBg: 'bg-teal-600', hex: '#0D9488' },
    compras: { icon: ShoppingBag, color: 'text-indigo-600', bgColor: 'bg-indigo-50', activeBg: 'bg-indigo-600', hex: '#4F46E5' },
    supermercados: { icon: Store, color: 'text-blue-600', bgColor: 'bg-blue-50', activeBg: 'bg-blue-600', hex: '#2563EB' },
    desayuno: { icon: Coffee, color: 'text-amber-700', bgColor: 'bg-amber-50', activeBg: 'bg-amber-700', hex: '#B45309' },
    todos: { icon: Star, color: 'text-navy/40', bgColor: 'bg-white', activeBg: 'bg-navy', hex: '#1E3A5F' }
};

const groupConfigs = {
    eat: {
        title: 'Dónde Comer',
        heroTitle: 'Sabores Locales',
        heroDesc: 'Mis recomendaciones personales para disfrutar de la mejor gastronomía de la zona.',
        categories: [
            'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico',
            'alta_cocina', 'internacional', 'desayuno', 'restaurante', 'cafe',
            'food', 'comida', 'gastronomia', 'gastronomía', 'tapas', 'taberna', 'tapas_bar', 'bar_restaurante'
        ],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'restaurantes', label: 'Restaurantes', type: 'restaurantes' },
            { id: 'italiano', label: 'Italiano', type: 'italiano' },
            { id: 'mediterraneo', label: 'Mediterráneo', type: 'mediterraneo' },
            { id: 'hamburguesas', label: 'Hamburguesas', type: 'hamburguesas' },
            { id: 'asiatico', label: 'Asiático', type: 'asiatico' },
            { id: 'alta_cocina', label: 'Alta Cocina', type: 'alta_cocina' },
            { id: 'internacional', label: 'Internacional', type: 'internacional' },
            { id: 'desayuno', label: 'Cafés', type: 'desayuno' },
        ]
    },
    do: {
        title: 'Qué Hacer',
        heroTitle: 'Descubre el entorno',
        heroDesc: 'Experiencias únicas y rincones especiales seleccionados para ti.',
        categories: [
            'naturaleza', 'cultura', 'ocio', 'relax', 'activity', 'actividad',
            'actividades', 'park', 'parque', 'museum', 'museo', 'landmark',
            'experiencias', 'experience', 'spa', 'ocio_nocturno', 'nightclub',
            'night_club', 'bar_copas', 'discoteca', 'pub',
            'ruta', 'trail'
        ],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'naturaleza', label: 'Naturaleza', type: 'naturaleza' },
            { id: 'cultura', label: 'Cultura', type: 'cultura' },
            { id: 'relax', label: 'Relax', type: 'relax' },
            { id: 'ocio', label: 'Ocio', type: 'ocio' },
        ]
    },
    shopping: {
        title: 'Compras',
        heroTitle: 'De Compras',
        heroDesc: 'Mercados tradicionales, tiendas de artesanía y todo lo necesario para tu estancia.',
        categories: ['compras', 'supermercados', 'shopping', 'market', 'mercado', 'tiendas', 'tienda', 'supermarket'],
        pills: [
            { id: 'todos', label: 'Todo', type: 'todos' },
            { id: 'compras', label: 'Tiendas', type: 'compras' },
            { id: 'supermercados', label: 'Supermercados', type: 'supermercados' }
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
    propertyId,
    disabledLanguage = false,
    handleNavigate, // FASE 17
    initialRecId // FASE 17
}: RecommendationsViewProps) {
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [expandedId, setExpandedId] = useState<string | null>(initialRecId || null);
    const config = groupConfigs[group];
    const recommendationRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    const { content: labelCompras } = useLocalizedContent('Tiendas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelSuper } = useLocalizedContent('Súper / Mercados', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelItaliano } = useLocalizedContent('Italiano', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelMediterraneo } = useLocalizedContent('Mediterráneo', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelHamburguesas } = useLocalizedContent('Hamburguesas', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAsiatico } = useLocalizedContent('Asiático', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAltaCocina } = useLocalizedContent('Alta Cocina', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInternacional } = useLocalizedContent('Internacional', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAmanecer } = useLocalizedContent('Amanecer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelAtardecer } = useLocalizedContent('Atardecer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelFooter } = useLocalizedContent('Recomendaciones seleccionadas por el anfitrión', currentLanguage, 'ui_label', accessToken, propertyId);

    const pillLabels: Record<string, string | undefined> = {
        todos: labelTodo,
        restaurantes: labelRestaurantes,
        desayuno: labelDesayunos,
        naturaleza: labelNaturaleza,
        cultura: labelCultura,
        relax: labelRelax,
        ocio: labelOcio,
        compras: labelCompras,
        supermercados: labelSuper,
        italiano: labelItaliano,
        mediterraneo: labelMediterraneo,
        hamburguesas: labelHamburguesas,
        asiatico: labelAsiatico,
        alta_cocina: labelAltaCocina,
        internacional: labelInternacional,
        amanecer: labelAmanecer,
        atardecer: labelAtardecer
    };

    const filteredRecommendations = useMemo(() => {
        let items = recommendations.filter(r => {
            const cat = (r.type || r.category || 'ocio').toLowerCase();
            return config.categories.includes(cat);
        });

        if (selectedCategory && selectedCategory !== 'todos') {
            items = items.filter(r => {
                const type = (r.type || r.category || '').toLowerCase();
                if (type === selectedCategory) return true;

                // Tapas/Taberna mapping for Restaurantes filter
                const RESTAURANTE_SUBTYPES = ['tapas', 'taberna', 'tapas_bar', 'bar_restaurante', 'restaurante', 'food', 'comida'];
                if (selectedCategory === 'restaurantes' && RESTAURANTE_SUBTYPES.includes(type)) return true;

                // Nightlife mapping for Ocio filter
                const OCIO_SUBTYPES = ['ocio_nocturno', 'nightclub', 'night_club', 'bar_copas', 'discoteca', 'pub'];
                if (selectedCategory === 'ocio' && OCIO_SUBTYPES.includes(type)) return true;

                return false;
            });
        }
        return items;
    }, [recommendations, group, selectedCategory]);

    const getMapsUrl = (rec: Recommendation) => {
        // If there's a specific map_url, use it.
        if (rec.map_url && rec.map_url.startsWith('http')) return rec.map_url;

        const locationContext = city ? ` ${city}` : '';
        const query = encodeURIComponent(`${rec.name}${locationContext}`);
        const placeId = rec.google_place_id || rec.metadata?.google_place_id;

        // Universal Google Maps Search URL - Works on all platforms (Mobile App & Desktop)
        let url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        if (placeId) {
            url += `&query_place_id=${placeId}`;
        }
        return url;
    };

    useEffect(() => {
        if (initialRecId) {
            const targetRec = recommendations.find(r => r.id === initialRecId);
            if (targetRec) {
                const cat = (targetRec.type || targetRec.category || '').toLowerCase();
                let pillToSelect = 'todos';

                const exactPill = config.pills.find(p => p.id === cat);
                if (exactPill) {
                    pillToSelect = cat;
                } else {
                    const OCIO_SUBTYPES = ['ocio_nocturno', 'nightclub', 'night_club', 'bar_copas', 'discoteca', 'pub'];
                    if (group === 'do' && (cat === 'ocio' || OCIO_SUBTYPES.includes(cat))) {
                        pillToSelect = 'ocio';
                    }
                }

                setSelectedCategory(pillToSelect);
                setExpandedId(initialRecId);

                // 3. Scroll to it with a slight delay for hydration/rendering
                const scrollTimer = setTimeout(() => {
                    const element = recommendationRefs.current[initialRecId];
                    if (element) {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                        });
                    }
                }, 600); // Increased delay for stability

                return () => clearTimeout(scrollTimer);
            }
        }
    }, [initialRecId, recommendations, config.pills, group]);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => {
            const newExpandedId = prev === id ? null : id;
            if (newExpandedId) {
                // Scroll to the expanded card
                setTimeout(() => {
                    recommendationRefs.current[newExpandedId]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }, 100); // Small delay to allow expansion animation
            }
            return newExpandedId;
        });
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
                            <div key={rec.id} ref={el => { recommendationRefs.current[rec.id] = el; }}>
                                <RecommendationCard
                                    rec={rec}
                                    isExpanded={expandedId === rec.id}
                                    toggleExpand={toggleExpand}
                                    currentLanguage={currentLanguage}
                                    accessToken={accessToken}
                                    propertyId={propertyId}
                                    getMapsUrl={getMapsUrl}
                                />
                            </div>
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
                    {labelFooter}
                </p>
            </div>
        </div>
    );
}
