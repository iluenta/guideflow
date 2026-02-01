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
    Coffee
} from 'lucide-react';

interface MenuGridProps {
    onNavigate: (pageId: string) => void;
}

export function MenuGrid({ onNavigate }: MenuGridProps) {
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon');
    const [currentTime, setCurrentTime] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

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
                    bgGradient: 'from-amber-50 to-orange-50',
                    accentColor: 'text-amber-600',
                    items: [
                        { emoji: '🥐', label: 'Desayunos cerca', count: '3 opciones', id: 'eat' },
                        { emoji: '🥾', label: 'Rutas de senderismo', count: '5 rutas', id: 'do' }
                    ]
                };
            case 'afternoon':
                return {
                    icon: Sun,
                    emoji: '☀️',
                    title: 'BUENAS TARDES',
                    subtitle: 'Perfecto para esta tarde:',
                    bgGradient: 'from-sky-50 to-blue-50',
                    accentColor: 'text-sky-600',
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
                    bgGradient: 'from-orange-50 to-rose-50',
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
                    bgGradient: 'from-indigo-50 to-purple-50',
                    accentColor: 'text-indigo-600',
                    items: [
                        { emoji: '🍷', label: 'Cena romántica', count: '3 restaurantes', id: 'eat' },
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

    const handleNavigate = (pageId: string) => {
        triggerHaptic();
        onNavigate(pageId);
    };

    return (
        <div className={`px-4 pt-6 pb-24 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* Welcome Title */}
            <div className="text-center mb-8">
                <h2 className="font-serif text-3xl text-navy font-medium tracking-wide mb-2 uppercase">Welcome</h2>
                <p className="text-xs tracking-[0.2em] text-slate uppercase font-medium">Please enjoy your stay</p>
            </div>

            {/* Dynamic Right Now Section */}
            <div className={`relative rounded-2xl p-5 shadow-card mb-8 overflow-hidden bg-gradient-to-br ${rightNow.bgGradient}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{rightNow.emoji}</span>
                        <div className="flex items-center gap-2">
                            <h3 className="font-serif text-lg text-navy font-semibold">{rightNow.title}</h3>
                            <span className="text-xs text-slate/70 font-medium bg-white/60 px-2 py-0.5 rounded-full">
                                {currentTime}
                            </span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-navy px-2 py-1 rounded-full flex items-center gap-1">
                        <Sunset className="w-3 h-3" /> NUEVO
                    </span>
                </div>

                <p className="text-sm text-slate/80 font-medium mb-3">{rightNow.subtitle}</p>

                <div className="space-y-2 mb-4">
                    {rightNow.items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleNavigate(item.id)}
                            className="flex items-center justify-between w-full bg-white/70 hover:bg-white p-3 rounded-xl transition-all active:scale-[0.98] group shadow-sm border border-navy/5"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{item.emoji}</span>
                                <span className="text-sm text-navy font-medium">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate/60 font-medium">{item.count}</span>
                                <ChevronRight className="w-4 h-4 text-slate/40 group-hover:text-navy transition-all" />
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => handleNavigate('do')}
                    className={`w-full text-center text-sm font-semibold ${rightNow.accentColor} hover:underline flex items-center justify-center gap-1`}
                >
                    Ver todas las sugerencias
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Essentials Section */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate/80 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                    <span className="text-orange-500">⚡</span> LO ESENCIAL
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleNavigate('check-in')} className="bg-navy text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg shadow-navy/20 active:scale-95 transition-all aspect-square">
                        <Key className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-tighter">Check In</span>
                    </button>
                    <button onClick={() => handleNavigate('wifi')} className="bg-white text-navy rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-card active:scale-95 transition-all aspect-square border border-navy/5">
                        <Wifi className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-tighter">WiFi</span>
                    </button>
                    <button onClick={() => handleNavigate('emergency')} className="bg-rose-50 text-rose-600 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all aspect-square border border-rose-100">
                        <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[11px] font-bold uppercase tracking-tighter">SOS</span>
                    </button>
                </div>
            </div>

            {/* Explore Section */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate/80 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                    <span className="text-pink-500">📍</span> EXPLORA
                </h3>
                <div className="space-y-3">
                    {[
                        { id: 'eat', label: 'Dónde Comer', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600' },
                        { id: 'do', label: 'Qué Hacer', icon: CalendarDays, color: 'bg-blue-50 text-blue-600' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className="w-full bg-white p-4 rounded-2xl shadow-card flex items-center justify-between group active:scale-[0.99] transition-all border border-navy/5"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-navy font-bold">{item.label}</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate/30 group-hover:text-navy transition-all" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Apartment Section */}
            <div className="mb-10">
                <h3 className="text-[10px] font-black text-slate/80 uppercase tracking-[0.2em] mb-4 px-1 flex items-center gap-2">
                    <span className="text-blue-500">🏠</span> TU ALOJAMIENTO
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleNavigate('house-info')} className="bg-white p-4 rounded-2xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all text-navy border border-navy/5">
                        <Info className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Servicios</span>
                    </button>
                    <button onClick={() => handleNavigate('rules')} className="bg-white p-4 rounded-2xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all text-navy border border-navy/5">
                        <ScrollText className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Normas</span>
                    </button>
                    <button onClick={() => handleNavigate('manuals')} className="bg-white p-4 rounded-2xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all text-navy border border-navy/5">
                        <BookOpen className="w-6 h-6" strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Manuales</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
