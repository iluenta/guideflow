'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Bot, MessageSquare, BookOpen, ChevronRight, Wifi, Key, Utensils, MapPin, Info, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';

interface AssistantHomeProps {
    propertyName: string;
    onExplore: () => void;
    onChatQuery: (query: string) => void;
    currentLanguage?: string;
    manuals?: any[];
    recommendations?: any[];
    context?: any[];
    guestName?: string;
    accessToken?: string;
    propertyId?: string; // FASE 17
}

export function AssistantHome({
    propertyName,
    onExplore,
    onChatQuery,
    currentLanguage = 'es',
    manuals = [],
    recommendations = [],
    context = [],
    guestName,
    accessToken,
    propertyId // FASE 17
}: AssistantHomeProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Extract relevant data for filtering
    const techData = context?.find(c => c.category === 'tech')?.content || {};
    const accessData = context?.find(c => c.category === 'access')?.content || {};
    const checkinData = context?.find(c => c.category === 'checkin')?.content || {};

    const { content: localizedPropertyName } = useLocalizedContent(propertyName, currentLanguage, 'general', accessToken, propertyId);
    const { content: greetingLabel } = useLocalizedContent('Hola', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: subtitleLabel } = useLocalizedContent('Estás en el alojamiento', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: pitchLabel } = useLocalizedContent('Estoy aquí para que tu estancia sea perfecta y no tengas que buscar ni llamar a nadie.', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: searchPlaceholder } = useLocalizedContent('¿Qué necesitas ahora?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: sectionTitle } = useLocalizedContent('PUEDES PREGUNTARME:', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: valueTitle } = useLocalizedContent('Resuelvo tus dudas al instante sin que tengas que llamar al propietario.', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: valueSubtitle } = useLocalizedContent('Ya conozco este apartamento por dentro y por fuera.', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: browseLabel } = useLocalizedContent('¿Prefieres navegar por la guía?', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: exploreFullLabel } = useLocalizedContent('Explorar guía completa', currentLanguage, 'ui_label', accessToken, propertyId);

    const allChips = [
        {
            id: 'wifi',
            query: currentLanguage === 'es' ? '¿Cuál es la clave del WiFi?' : 'What is the WiFi password?',
            label: currentLanguage === 'es' ? 'Conexión WiFi' : 'WiFi Connection',
            icon: Wifi,
            color: 'bg-blue-50 text-blue-600 border-blue-100',
            show: !!(techData.wifi_password || techData.wifi_ssid || techData.router_notes)
        },
        {
            id: 'vitro',
            query: currentLanguage === 'es' ? '¿Cómo funciona la vitrocerámica o los fuegos?' : 'How does the stove or cooktop work?',
            label: currentLanguage === 'es' ? 'Cocina / Vitro' : 'Stove / Cooktop',
            icon: Settings,
            color: 'bg-orange-50 text-orange-600 border-orange-100',
            show: manuals.some(m => {
                const name = (m.appliance_name || '').toLowerCase();
                return name.includes('vitro') || name.includes('cocina') || name.includes('horno') ||
                    name.includes('stove') || name.includes('induction') || name.includes('placa') ||
                    name.includes('fuego') || name.includes('encimera');
            })
        },
        {
            id: 'access',
            query: currentLanguage === 'es' ? '¿Cómo entro al apartamento?' : 'How do I enter the apartment?',
            label: currentLanguage === 'es' ? 'Cómo entrar' : 'How to enter',
            icon: Key,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            show: !!(checkinData.instructions || accessData.instructions || accessData.entry_code || accessData.checkin_instructions || (checkinData.steps && checkinData.steps.length > 0))
        },
        {
            id: 'parking',
            query: currentLanguage === 'es' ? '¿Dónde está mi plaza de garaje?' : 'Where is my parking spot?',
            label: currentLanguage === 'es' ? 'Aparcar / Garaje' : 'Parking',
            icon: MapPin,
            color: 'bg-purple-50 text-purple-600 border-purple-100',
            show: !!(accessData.parking_info || accessData.garage_spot || accessData.parking_instructions || accessData.parking)
        },
        {
            id: 'eat',
            query: currentLanguage === 'es' ? '¿Dónde puedo comer cerca?' : 'Where can I eat nearby?',
            label: currentLanguage === 'es' ? 'Comer cerca' : 'Eat nearby',
            icon: Utensils,
            color: 'bg-rose-50 text-rose-600 border-rose-100',
            show: recommendations.some(r => r.group === 'eat')
        },
        {
            id: 'visit',
            query: currentLanguage === 'es' ? '¿Qué puedo visitar?' : 'What can I visit?',
            label: currentLanguage === 'es' ? 'Qué visitar' : 'Sightseeing',
            icon: Info,
            color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            show: recommendations.some(r => r.group === 'do' || r.group === 'visit')
        }
    ];

    const chips = allChips.filter(c => c.show);

    return (
        <div className={`min-h-screen flex flex-col px-6 py-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

            {/* Header: Welcome & Branding hint */}
            <div className="mb-12 text-center">
                <h1 className="font-serif text-[42px] leading-tight font-bold text-primary mb-2">
                    {guestName ? `${greetingLabel} ${guestName} 👋` : `${greetingLabel} 👋`}
                </h1>
                <p className="text-[15px] text-text-secondary opacity-80 font-medium leading-relaxed max-w-[280px] mx-auto">
                    {subtitleLabel} {localizedPropertyName}.
                </p>
            </div>

            {/* Assistant Pitch */}
            <div className="mb-10 bg-surface/40 backdrop-blur-sm rounded-[32px] p-6 border border-primary/5 shadow-sm text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-6 h-6 text-primary" />
                </div>
                <p className="text-[14px] text-primary/80 font-semibold leading-snug">
                    {pitchLabel}
                </p>
            </div>

            {/* Main Search Action */}
            <div className="mb-12 relative group" onClick={() => onChatQuery('')}>
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="relative bg-surface rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-primary/10 p-4 h-16 flex items-center gap-4 transition-transform active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[16px] text-text-secondary/50 font-medium flex-1">
                        {searchPlaceholder}
                    </span>
                    <Search className="w-5 h-5 text-primary/30 mr-2" />
                </div>
            </div>

            {/* Suggestion Chips */}
            {chips.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-[10px] font-black text-navy/30 uppercase tracking-[0.3em] mb-4 text-center">
                        {sectionTitle}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {chips.map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => onChatQuery(chip.query)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.96] hover:bg-white shadow-sm hover:shadow-md ${chip.color}`}
                            >
                                <div className="shrink-0">
                                    <chip.icon className="w-4 h-4" />
                                </div>
                                <span className="text-[12px] font-bold leading-tight">{chip.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Confirmation (For Host Value) */}
            <div className="mb-16 flex items-start gap-4 p-5 bg-navy/5 rounded-3xl border border-navy/5">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] text-navy/40 font-bold leading-relaxed italic uppercase tracking-wider">
                        {valueTitle}
                    </p>
                    <p className="text-[10px] text-navy/30 font-medium leading-relaxed uppercase tracking-widest">
                        {valueSubtitle}
                    </p>
                </div>
            </div>

            {/* Alternate Navigation */}
            <div className="text-center">
                <p className="text-[13px] text-navy/40 font-medium mb-4">
                    {browseLabel}
                </p>
                <Button
                    variant="outline"
                    onClick={onExplore}
                    className="h-14 px-8 rounded-2xl border-primary/20 text-primary font-bold shadow-sm hover:bg-primary/5 hover:text-primary transition-all w-full flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 opacity-60" />
                        <span>{exploreFullLabel}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-30 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>

            {/* Brand Footer */}
            <div className="mt-auto pt-12 text-center pb-8 opacity-20">
                <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">
                    Powered by GuideFlow
                </p>
            </div>

        </div>
    );
}
