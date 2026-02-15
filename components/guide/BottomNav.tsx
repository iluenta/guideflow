'use client';

import React from 'react';
import { Home, UtensilsCrossed, Theater, Info, MessageSquare } from 'lucide-react';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';

interface BottomNavProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    currentLanguage?: string;
    accessToken?: string;
}

export function BottomNav({
    activeTab = 'home',
    onTabChange,
    currentLanguage = 'es',
    accessToken,
    propertyId
}: BottomNavProps & { propertyId?: string }) {

    const { content: labelHome } = useLocalizedContent('Inicio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEat } = useLocalizedContent('Comer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelLeisure } = useLocalizedContent('Ocio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInfo } = useLocalizedContent('Info', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelChat } = useLocalizedContent('Chat', currentLanguage, 'ui_label', accessToken, propertyId);

    const tabs = [
        { id: 'hub', icon: Home, label: labelHome },
        { id: 'eat', icon: UtensilsCrossed, label: labelEat },
        { id: 'leisure', icon: Theater, label: labelLeisure },
        { id: 'info', icon: Info, label: labelInfo },
        { id: 'chat', icon: MessageSquare, label: labelChat }
    ];

    const handleTabClick = (tabId: string) => {
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    const triggerHaptic = (pattern: number | number[] = 10) => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] pb-safe z-40">
            <div className="max-w-md mx-auto flex items-center justify-around px-1 h-16">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                handleTabClick(tab.id);
                                triggerHaptic([50, 30, 50]);
                            }}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-200",
                                isActive ? "text-navy" : "text-stone-400"
                            )}
                        >
                            {/* Active Tab Top Bar */}
                            {isActive && (
                                <span className="absolute top-0 left-[20%] right-[20%] h-[3px] bg-navy rounded-b-[3px] animate-in fade-in slide-in-from-top-1 duration-300" />
                            )}

                            <div className="relative flex items-center justify-center h-6 w-6">
                                <Icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-300",
                                        isActive ? "fill-navy" : ""
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>

                            <span
                                className={cn(
                                    "text-[10px] font-bold tracking-tight transition-all duration-200",
                                    isActive ? "opacity-100" : "opacity-80"
                                )}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
