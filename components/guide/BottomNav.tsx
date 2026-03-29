'use client';

import React from 'react';
import { Home, UtensilsCrossed, Theater, Info, MessageSquare } from 'lucide-react';
import { useLocalizedContent } from '@/hooks/useLocalizedContent';
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

    const hasManuals = manuals.length > 0;
    const rulesContext = context?.find(c => c.category === 'rules')?.content;
    const hasRules = !!(rulesContext?.rules_items?.length > 0 || rulesContext?.quiet_hours || rulesContext?.checkout_time) ||
        !!sections?.find(s => s.type === 'rules' || s.title?.toLowerCase().includes('normas'));
    const hasInfo = hasManuals || hasRules;
    const hasEat = recommendations.filter(r => r.type === 'restaurant' || r.type === 'cafe' || r.type === 'bar').length > 0;
    const hasLeisure = recommendations.filter(r => r.type === 'activity' || r.type === 'park' || r.type === 'museum' || r.type === 'landmark').length > 0;

    const tabs = [
        { id: 'hub', icon: Home, label: labelHome || 'Inicio', show: true },
        { id: 'eat', icon: UtensilsCrossed, label: labelEat || 'Comer', show: hasEat },
        { id: 'leisure', icon: Theater, label: labelLeisure || 'Ocio', show: hasLeisure },
        { id: 'info', icon: Info, label: labelInfo || 'Info', show: hasInfo },
        { id: 'chat', icon: MessageSquare, label: labelChat || 'Chat', show: true }
    ].filter(tab => tab.show);

    const handleTabClick = (tabId: string) => {
        if (onTabChange) onTabChange(tabId);
    };

    // Resolve accent color from theme for active tab
    const accentColor = t?.accentText?.match(/text-\[([^\]]+)\]/)?.[1] || '#0EA5E9';

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '64px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e7eb',
            boxShadow: '0 -4px 20px -4px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '448px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                height: '100%',
                padding: '0 4px',
            }}>
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                flex: 1,
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: isActive ? accentColor : '#6b7280',
                                fontWeight: isActive ? 700 : 400,
                                transition: 'color 0.2s',
                                position: 'relative',
                            }}
                        >
                            {isActive && (
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '20%',
                                    right: '20%',
                                    height: '3px',
                                    borderRadius: '0 0 3px 3px',
                                    backgroundColor: accentColor,
                                }} />
                            )}
                            <Icon
                                style={{ width: 24, height: 24, strokeWidth: isActive ? 2.5 : 2 }}
                            />
                            <span style={{
                                fontSize: '10px',
                                fontWeight: isActive ? 700 : 500,
                                letterSpacing: '-0.02em',
                            }}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
