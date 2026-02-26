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
  Coffee } from
'lucide-react';
import { Header } from './Header';
interface MenuGridProps {
  onNavigate: (pageId: string) => void;
}
export function MenuGrid({ onNavigate }: MenuGridProps) {
  const [timeOfDay, setTimeOfDay] = useState<
    'morning' | 'afternoon' | 'evening' | 'night'>(
    'afternoon');
  const [currentTime, setCurrentTime] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      setCurrentTime(`${hour}:${minutes.toString().padStart(2, '0')}`);
      if (hour >= 6 && hour < 12) setTimeOfDay('morning');else
      if (hour >= 12 && hour < 18) setTimeOfDay('afternoon');else
      if (hour >= 18 && hour < 22) setTimeOfDay('evening');else
      setTimeOfDay('night');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    // Trigger animations after mount
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
          {
            emoji: '🥐',
            label: 'Desayunos cerca',
            count: '3 opciones',
            action: () => onNavigate('places-eat')
          },
          {
            emoji: '🥾',
            label: 'Rutas de senderismo',
            count: '5 rutas',
            action: () => onNavigate('things-do')
          }]

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
          {
            emoji: '🏞️',
            label: 'Visitar el lago',
            count: '15 min',
            action: () => onNavigate('places-see')
          },
          {
            emoji: '🍰',
            label: 'Merienda local',
            count: '4 sitios',
            action: () => onNavigate('places-eat')
          }]

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
          {
            emoji: '🌄',
            label: 'Ver atardecer',
            count: 'Mirador',
            action: () => onNavigate('places-see')
          },
          {
            emoji: '🍻',
            label: 'Tapear',
            count: '6 bares',
            action: () => onNavigate('places-eat')
          }]

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
          {
            emoji: '🍷',
            label: 'Cena romántica',
            count: '3 restaurantes',
            action: () => onNavigate('places-eat')
          },
          {
            emoji: '🌟',
            label: 'Ver estrellas',
            count: 'Terraza',
            action: () => onNavigate('places-see')
          }]

        };
    }
  };
  const rightNow = getRightNowContent();
  // Haptic feedback helper
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  const handleNavigate = (pageId: string) => {
    triggerHaptic();
    onNavigate(pageId);
  };
  return (
    <div className="min-h-screen bg-beige pb-24">
      <Header />

      <div className="px-4 pt-6 pb-4">
        {/* Welcome Section */}
        <div
          className={`text-center mb-8 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          <h2 className="font-serif text-3xl text-navy font-medium tracking-wide mb-2">
            WELCOME
          </h2>
          <p className="text-xs tracking-[0.2em] text-slate uppercase font-medium">
            Please enjoy your stay
          </p>
        </div>

        {/* Dynamic "Right Now" Section - Improved */}
        <div
          className={`relative rounded-2xl p-5 shadow-card mb-6 overflow-hidden transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} bg-gradient-to-br ${rightNow.bgGradient}`}>

          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{rightNow.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg text-navy font-semibold">
                    {rightNow.title}
                  </h3>
                  <span className="text-xs text-slate/70 font-medium bg-white/60 px-2 py-0.5 rounded-full">
                    {currentTime}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-white bg-navy px-2 py-1 rounded-full">
              ✨ NUEVO
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-slate/80 font-medium mb-3">
            {rightNow.subtitle}
          </p>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {rightNow.items.map((item, idx) =>
            <button
              key={idx}
              onClick={() => {
                triggerHaptic();
                item.action();
              }}
              className="flex items-center justify-between w-full bg-white/70 hover:bg-white p-3 rounded-xl transition-all active:scale-[0.98] group">

                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm text-navy font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate/60 font-medium">
                    {item.count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            )}
          </div>

          {/* View All Button */}
          <button
            onClick={() => handleNavigate('things-do')}
            className={`w-full text-center text-sm font-semibold ${rightNow.accentColor} hover:underline flex items-center justify-center gap-1`}>

            Ver todas las sugerencias
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Essentials Section */}
        <div
          className={`mb-6 transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          <h3 className="text-xs font-bold text-slate/80 uppercase tracking-wider mb-3 px-1">
            ⚡ Lo Esencial
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleNavigate('check-in')}
              className="bg-navy text-white rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-lg shadow-navy/20 active:scale-95 transition-all aspect-square">

              <Key className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[11px] font-medium leading-tight">
                Check In
              </span>
            </button>

            <button
              onClick={() => handleNavigate('wifi')}
              className="bg-white text-navy rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-card hover:shadow-card-hover active:scale-95 transition-all aspect-square">

              <Wifi className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[11px] font-medium leading-tight">
                WiFi
              </span>
            </button>

            <button
              onClick={() => handleNavigate('emergency')}
              className="bg-red-50 text-red-600 rounded-xl p-3 flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 transition-all aspect-square">

              <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[11px] font-medium leading-tight">SOS</span>
            </button>
          </div>
        </div>

        {/* Explore Section */}
        <div
          className={`mb-6 transition-all duration-500 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          <h3 className="text-xs font-bold text-slate/80 uppercase tracking-wider mb-3 px-1">
            📍 Explora
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleNavigate('places-eat')}
              className="w-full bg-white p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.99] transition-all">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="text-navy font-medium">Dónde Comer</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleNavigate('things-do')}
              className="w-full bg-white p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.99] transition-all">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <span className="text-navy font-medium">Qué Hacer</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => handleNavigate('transport')}
              className="w-full bg-white p-4 rounded-xl shadow-card flex items-center justify-between group active:scale-[0.99] transition-all">

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <span className="text-navy font-medium">Cómo Moverse</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Apartment Section */}
        <div
          className={`mb-6 transition-all duration-500 delay-[400ms] ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

          <h3 className="text-xs font-bold text-slate/80 uppercase tracking-wider mb-3 px-1">
            🏠 Tu Apartamento
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleNavigate('house-info')}
              className="bg-white p-3 rounded-xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all">

              <Info className="w-6 h-6 text-navy" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-center text-slate">
                Info Casa
              </span>
            </button>

            <button
              onClick={() => handleNavigate('rules')}
              className="bg-white p-3 rounded-xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all">

              <ScrollText className="w-6 h-6 text-navy" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-center text-slate">
                Normas
              </span>
            </button>

            <button
              onClick={() => handleNavigate('guides')}
              className="bg-white p-3 rounded-xl shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all">

              <BookOpen className="w-6 h-6 text-navy" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-center text-slate">
                Manuales
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>);

}