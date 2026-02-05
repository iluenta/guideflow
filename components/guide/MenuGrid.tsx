'use client';

import React, { useEffect, useState } from 'react';
import {
    Key,
    Wifi,
    AlertTriangle,
    UtensilsCrossed,
    CalendarDays,
    Car,
    Info,
    ScrollText,
    BookOpen,
    ChevronRight,
    Sunset,
    Moon,
    Sun,
    Coffee,
    Sparkles,
    ShoppingBag
} from 'lucide-react';

interface MenuGridProps {
    onNavigate: (pageId: string) => void;
    welcomeData?: {
        title?: string;
        host_name?: string;
        message?: string;
    };
    imageUrl?: string;
    currentLanguage?: string;
}

export function MenuGrid({ onNavigate, welcomeData, imageUrl, currentLanguage = 'es' }: MenuGridProps) {
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon');
    const [currentTime, setCurrentTime] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    // Mocking isNewFeature for the first 3 days of guest access
    const isNewFeature = true;

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hour = now.getHours();
            const minutes = now.getMinutes();
            setCurrentTime(`${hour}:${minutes.toString().padStart(2, '0')}`);

            if (hour >= 6 && hour < 12) setTimeOfDay('morning');
            else if (hour >= 12 && hour < 18) setTimeOfDay('afternoon');
            else if (hour >= 18 && hour < 22) setTimeOfDay('evening');
            else setTimeOfDay('night');
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        setTimeout(() => setIsLoaded(true), 100);
        return () => clearInterval(interval);
    }, []);

    const getRightNowContent = () => {
        switch (timeOfDay) {
            case 'morning':
                return {
                    icon: Coffee,
                    emoji: '☕',
                    title: 'BUENOS DÍAS',
                    subtitle: 'Perfecto para empezar el día:',
                    bgGradient: 'from-orange-50/40 to-stone-50',
                    borderLColor: 'border-orange-200',
                    accentColor: 'text-orange-700/70',
                    items: [
                        { emoji: '🥐', label: 'Desayunos cerca', count: '3 opciones', id: 'eat' },
                        { emoji: '🥾', label: 'Rutas de senderismo', count: 'Clima perfecto', id: 'do' }
                    ]
                };
            case 'afternoon':
                return {
                    icon: Sun,
                    emoji: '☀️',
                    title: 'BUENAS TARDES',
                    subtitle: 'Perfecto para esta tarde:',
                    bgGradient: 'from-stone-50 to-slate-50',
                    borderLColor: 'border-slate-300',
                    accentColor: 'text-slate-600',
                    items: [
                        { emoji: '🏞️', label: 'Visitar el lago', count: '15 min', id: 'do' },
                        { emoji: '🍰', label: 'Merienda local', count: '4 sitios', id: 'eat' }
                    ]
                };
            case 'evening':
                return {
                    icon: Sunset,
                    emoji: '🌅',
                    title: 'ATARDECER',
                    subtitle: 'Perfecto para esta hora:',
                    bgGradient: 'from-orange-50/50 to-stone-50',
                    borderLColor: 'border-orange-300',
                    accentColor: 'text-orange-600',
                    items: [
                        { emoji: '🌄', label: 'Ver atardecer', count: 'Mirador', id: 'do' },
                        { emoji: '🍻', label: 'Tapear', count: '6 bares', id: 'eat' }
                    ]
                };
            case 'night':
                return {
                    icon: Moon,
                    emoji: '🌙',
                    title: 'BUENAS NOCHES',
                    subtitle: 'Perfecto para esta noche:',
                    bgGradient: 'from-stone-100 to-slate-100',
                    borderLColor: 'border-slate-400',
                    accentColor: 'text-slate-700',
                    items: [
                        { emoji: '🍷', label: 'Cena romántica', count: '3 opciones', id: 'eat' },
                        { emoji: '🌟', label: 'Ver estrellas', count: 'Terraza', id: 'do' }
                    ]
                };
        }
    };

    const rightNow = getRightNowContent();

    const triggerHaptic = (pattern: number | number[] = 10) => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    const handleNavigate = (pageId: string, hapticPattern: number | number[] = 10) => {
        triggerHaptic(hapticPattern);
        onNavigate(pageId);
    };

    return (
        <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            <div className="px-4 pt-10 pb-24">

                {/* Welcome Title (Polished Fase 5 Style) */}
                <div className="text-center mb-10 px-4">
                    <h2 className="font-serif text-[40px] text-primary font-bold tracking-tight mb-1 uppercase leading-tight">
                        {welcomeData?.title || (currentLanguage === 'es' ? 'BIENVENIDO' : 'WELCOME')}
                    </h2>
                    <p className="text-[10px] tracking-[0.4em] text-text-secondary font-black mb-4 uppercase opacity-60">
                        {welcomeData?.host_name || (currentLanguage === 'es' ? 'TU ANFITRIÓN' : 'YOUR HOST')}
                    </p>
                    <p className="text-[13px] text-text-secondary opacity-70 font-medium italic max-w-[85%] mx-auto leading-relaxed">
                        {welcomeData?.message || (currentLanguage === 'es' ? 'Disfruta de tu estancia en nuestra casa' : 'Please enjoy your stay')}
                    </p>
                </div>

                {/* Dynamic Contextual Banner (Refined to match Image & Snippet) */}
                <div className={`relative rounded-2xl p-6 shadow-sm mb-8 overflow-hidden bg-gradient-to-br ${rightNow.bgGradient} border-l-4 ${rightNow.borderLColor} contextual-banner-anim`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl drop-shadow-sm">{rightNow.emoji}</span>
                            <div className="flex items-center gap-2">
                                <h3 className="font-sans text-[15px] font-black text-primary tracking-tight">{rightNow.title}</h3>
                                <span className="text-[11px] text-primary/40 font-bold bg-primary/5 px-2 py-0.5 rounded-full">
                                    {currentTime}
                                </span>
                            </div>
                        </div>
                        {isNewFeature && (
                            <span className="bg-navy text-white text-[9px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                <Sparkles className="w-3 h-3 fill-white" /> NUEVO
                            </span>
                        )}
                    </div>

                    <p className="text-[13px] text-navy/60 font-medium mb-4">{rightNow.subtitle}</p>

                    <div className="space-y-3 mb-5">
                        {rightNow.items.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNavigate(item.id, [50, 30, 50])}
                                className="flex items-center justify-between w-full bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:bg-surface/95 p-4 rounded-2xl transition-all active:scale-[0.98] group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-xl">{item.emoji}</span>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[14px] text-primary font-bold leading-none mb-1">{item.label}</span>
                                        <span className="text-[11px] text-text-muted font-medium">{item.count}</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary/50 transition-all" />
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handleNavigate('leisure', [50, 30, 50])}
                        className={`w-full text-center text-[13px] font-bold ${rightNow.accentColor} hover:opacity-70 flex items-center justify-center gap-1.5 transition-opacity`}
                    >
                        Ver todas las sugerencias
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                </div>

                {/* Essentials Section */}
                <div className="mb-10 section-essential-anim">
                    <h3 className="text-[10px] font-black text-slate/30 uppercase tracking-[0.3em] mb-4 px-1 flex items-center gap-2">
                        LO ESENCIAL
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleNavigate('check-in', [50, 30, 50])} className="bg-primary text-primary-foreground rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all aspect-square">
                            <Key className="w-6 h-6" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Check In</span>
                        </button>
                        <button onClick={() => handleNavigate('wifi', [50, 30, 50])} className="bg-surface text-primary rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all aspect-square border border-primary/5">
                            <Wifi className="w-6 h-6" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">WiFi</span>
                        </button>
                        <button onClick={() => handleNavigate('emergency', [100, 50, 100])} className="bg-rose-50 text-rose-600 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all aspect-square border border-rose-100/50">
                            <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center text-rose-600">SOS</span>
                        </button>
                    </div>
                </div>

                {/* Explore Section */}
                <div className="mb-10 section-explore-anim">
                    <h3 className="text-[10px] font-black text-slate/30 uppercase tracking-[0.3em] mb-4 px-1 flex items-center gap-2">
                        EXPLORA
                    </h3>
                    <div className="space-y-3">
                        {[
                            { id: 'eat', label: 'Dónde Comer', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600', desc: 'Restaurantes y cafeterías locales' },
                            { id: 'leisure', label: 'Qué Hacer', icon: CalendarDays, color: 'bg-blue-50 text-blue-600', desc: 'Actividades y lugares de interés' },
                            { id: 'shopping', label: 'Compras', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600', desc: 'Tiendas, mercados y más' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className="w-full bg-surface p-5 rounded-3xl shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all border border-primary/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-inner`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-primary font-black text-[15px]">{item.label}</span>
                                        <span className="text-[11px] text-text-muted font-medium">{item.desc}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <ChevronRight className="w-4 h-4 text-primary/30 group-hover:text-primary/60 transition-all" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Apartment Section */}
                <div className="mb-10 section-apartment-anim">
                    <h3 className="text-[10px] font-black text-slate/30 uppercase tracking-[0.3em] mb-4 px-1 flex items-center gap-2">
                        TU ALOJAMIENTO
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => handleNavigate('house-info')} className="bg-surface p-5 rounded-3xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-primary border border-primary/5">
                            <Info className="w-6 h-6 opacity-60" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-center leading-tight">Info Casa</span>
                        </button>
                        <button onClick={() => handleNavigate('rules')} className="bg-surface p-5 rounded-3xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-primary border border-primary/5">
                            <ScrollText className="w-6 h-6 opacity-60" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-center leading-tight">Normas</span>
                        </button>
                        <button onClick={() => handleNavigate('manuals')} className="bg-surface p-5 rounded-3xl shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all text-primary border border-primary/5">
                            <BookOpen className="w-6 h-6 opacity-60" strokeWidth={1.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 text-center leading-tight">Guía de USO</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
