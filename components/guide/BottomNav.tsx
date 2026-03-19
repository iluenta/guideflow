'use client';

import React from 'react';
import { Home, UtensilsCrossed, Theater, Info, MessageSquare } from 'lucide-react';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
import { cn } from '@/lib/utils';
import { getGuideTheme } from '@/lib/guide-theme';

interface BottomNavProps {
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    currentLanguage?: string;
    accessToken?: string;
    themeId?: string;
}

export function BottomNav({
    activeTab = 'home',
    onTabChange,
    currentLanguage = 'es',
    accessToken,
    propertyId,
    manuals = [],
    recommendations = [],
    context = [],
    sections = [],
    themeId = 'modern_v2'
}: BottomNavProps & { propertyId?: string, manuals?: any[], recommendations?: any[], context?: any[], sections?: any[] }) {

    const t = getGuideTheme(themeId);

    const { content: labelHome } = useLocalizedContent('Inicio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelEat } = useLocalizedContent('Comer', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelLeisure } = useLocalizedContent('Ocio', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelInfo } = useLocalizedContent('Info', currentLanguage, 'ui_label', accessToken, propertyId);
    const { content: labelChat } = useLocalizedContent('Chat', currentLanguage, 'ui_label', accessToken, propertyId);

    // Visibility Logic
    const hasManuals = manuals.length > 0;
    const hasEat = recommendations.filter(r => r.type === 'restaurant' || r.type === 'cafe' || r.type === 'bar').length > 0;
    const hasLeisure = recommendations.filter(r => r.type === 'activity' || r.type === 'park' || r.type === 'museum' || r.type === 'landmark').length > 0;

    const tabs = [
        { id: 'hub', icon: Home, label: labelHome, show: true },
        { id: 'eat', icon: UtensilsCrossed, label: labelEat, show: hasEat },
        { id: 'leisure', icon: Theater, label: labelLeisure, show: hasLeisure },
        { id: 'info', icon: Info, label: labelInfo, show: hasManuals },
        { id: 'chat', icon: MessageSquare, label: labelChat, show: true }
    ].filter(tab => tab.show);

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
        <nav className={cn("fixed bottom-0 left-0 right-0 backdrop-blur-md border-t shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] pb-safe z-40 transition-colors bg-opacity-95", t.pageBg, t.searchBorder)}>
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
                                isActive ? t.chipIconColor : t.sectionLabel
                            )}
                        >
                            {/* Active Tab Top Bar */}
                            {isActive && (
                                <span 
                                    className="absolute top-0 left-[20%] right-[20%] h-[3px] rounded-b-[3px] animate-in fade-in slide-in-from-top-1 duration-300" 
                                    style={{ backgroundColor: 'currentColor' }}
                                />
                            )}

                            <div className="relative flex items-center justify-center h-6 w-6">
                                <Icon
                                    className="w-6 h-6 transition-all duration-300"
                                    style={{ color: 'currentColor' }}
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
