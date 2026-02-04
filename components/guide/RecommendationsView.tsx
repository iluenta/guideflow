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
    Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface RecommendationsViewProps {
    onBack: () => void;
    recommendations: Recommendation[];
    group: 'eat' | 'do' | 'shopping';
    currentLanguage?: string;
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

export function RecommendationsView({ onBack, recommendations, group, currentLanguage = 'es' }: RecommendationsViewProps) {
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const config = groupConfigs[group];

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

    const handleOpenMap = (url?: string) => {
        if (url) {
            window.open(url, '_blank');
        }
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
                    {config.title}
                </h1>
            </header>

            <div className="flex-1">
                {/* Hero section */}
                <div className="px-6 py-8">
                    <h2 className="font-serif text-3xl text-navy font-bold leading-tight mb-2">
                        {config.heroTitle}
                    </h2>
                    <p className="text-sm text-slate leading-relaxed max-w-[90%]">
                        {config.heroDesc}
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
                                    {pill.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recommendations List (Fase 5 Style) */}
                <div className="px-6 space-y-4">
                    {filteredRecommendations.length > 0 ? (
                        filteredRecommendations.map((rec) => {
                            const catLabel = (rec.type || 'ocio').toLowerCase();
                            const catStyle = categoryConfigs[catLabel] || categoryConfigs.todos;
                            const Icon = catStyle.icon;

                            return (
                                <div
                                    key={rec.id}
                                    onClick={() => handleOpenMap(rec.map_url)}
                                    className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group cursor-pointer flex items-start gap-4"
                                >
                                    {/* Icon Box */}
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${catStyle.bgColor} ${catStyle.color}`}>
                                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h3 className="font-serif text-lg text-navy font-bold leading-tight mb-1.5">
                                            {rec.name}
                                        </h3>
                                        {rec.description && (
                                            <p className="text-[13px] text-slate leading-relaxed mb-4 line-clamp-2">
                                                {rec.description}
                                            </p>
                                        )}

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-5">
                                            {rec.distance && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate/60">
                                                    <MapPin className="w-3.5 h-3.5 opacity-50" />
                                                    {rec.distance}
                                                </div>
                                            )}
                                            {rec.time && (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate/60">
                                                    <Clock className="w-3.5 h-3.5 opacity-50" />
                                                    {rec.time}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Arrow (Mockup Style) */}
                                    <div className="self-center">
                                        <div className="w-8 h-8 rounded-full bg-beige flex items-center justify-center text-navy opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 duration-300">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center bg-white/30 rounded-3xl border border-dashed border-navy/10">
                            <Star className="w-8 h-8 text-navy/10 mx-auto mb-3" />
                            <p className="text-navy/40 text-sm font-bold uppercase tracking-widest">
                                Sin recomendaciones aún
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
