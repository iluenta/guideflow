'use client';

import React, { useState, useEffect } from 'react';
import { MenuGrid } from './MenuGrid';
import { WifiView } from './WifiView';
import { RulesView } from './RulesView';
import { ManualsView } from './ManualsView';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Menu } from 'lucide-react';
import { GuestChat } from './GuestChat';
import { LanguageSelector } from './LanguageSelector';
import { ChatOnboarding } from './ChatOnboarding';

import { BottomNav } from './BottomNav';
import { CheckInView } from './CheckInView';

interface GuideViewContainerProps {
    property: any;
    sections: any[];
    manuals: any[];
    context?: any[];
}

export function GuideViewContainer({ property, sections, manuals, context }: GuideViewContainerProps) {
    const [currentPage, setCurrentPage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [language, setLanguage] = useState<string>('es');

    const welcomeData = context?.find(c => c.category === 'welcome')?.content;

    // Auto-detect browser language
    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        const supported = ['es', 'en', 'fr', 'de', 'it', 'pt'];
        if (supported.includes(browserLang)) {
            setLanguage(browserLang);
        } else {
            setLanguage('en'); // Default to English if not supported
        }
    }, []);

    const handleNavigate = (pageId: string) => {
        setCurrentPage(pageId);
        // Map pageIds to tabs if possible
        if (pageId === 'eat' || pageId === 'food') setActiveTab('eat');
        else if (pageId === 'do' || pageId === 'things-do') setActiveTab('leisure');
        else if (pageId === 'manuals' || pageId === 'info' || pageId === 'house-info') setActiveTab('info');
        else setActiveTab('home');

        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setCurrentPage(null);
        setActiveTab('home');
    };

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId === 'home') setCurrentPage(null);
        else if (tabId === 'eat') setCurrentPage('eat');
        else if (tabId === 'leisure') setCurrentPage('do');
        else if (tabId === 'info') setCurrentPage('manuals');
        else if (tabId === 'profile') setCurrentPage('profile');
        window.scrollTo(0, 0);
    };

    const handleChatOpen = () => {
        // Dispatch custom event to open chat (matches original behavior)
        window.dispatchEvent(new CustomEvent('open-guest-chat'));
    };

    const renderCurrentView = () => {
        switch (currentPage) {
            case 'wifi':
                const techData = context?.find(c => c.category === 'tech')?.content || {};
                return (
                    <WifiView
                        onBack={handleBack}
                        networkName={techData.wifi_ssid}
                        password={techData.wifi_password}
                        notes={techData.router_notes}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'rules':
                const rulesData = context?.find(c => c.category === 'rules')?.content || {};
                const rulesCheckinData = context?.find(c => c.category === 'checkin')?.content || {};
                const rulesSection = sections.find(s => s.title.toLowerCase().includes('normas') || s.title.toLowerCase().includes('reglas'));
                return (
                    <RulesView
                        onBack={handleBack}
                        rulesData={rulesData}
                        checkinData={rulesCheckinData}
                        oldRules={rulesSection?.data?.text}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'manuals':
                return (
                    <ManualsView
                        onBack={handleBack}
                        manuals={manuals}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'check-in':
            case 'checkin':
                const checkinData = context?.find(c => c.category === 'checkin')?.content || {};
                const accessData = context?.find(c => c.category === 'access')?.content;
                return (
                    <CheckInView
                        onBack={handleBack}
                        checkinData={checkinData}
                        address={accessData?.full_address || property.full_address || ''}
                        hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')}
                        currentLanguage={language}
                    />
                );
            default:
                return (
                    <div className="min-h-screen bg-beige">
                        {/* Prototype Header Design (Screenshot 2) */}
                        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/10 px-4 h-16 flex items-center justify-between">
                            <button className="p-2 -ml-2 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90">
                                <Menu className="w-6 h-6" />
                            </button>

                            <h1 className="absolute left-1/2 -translate-x-1/2 font-sans text-base font-bold text-navy tracking-tight max-w-[60%] truncate uppercase">
                                {property.name}
                            </h1>

                            <div className="flex items-center">
                                <LanguageSelector
                                    currentLanguage={language}
                                    onLanguageChange={setLanguage}
                                />
                            </div>
                        </header>

                        {/* Main Content Area */}
                        <div className="relative z-10 bg-beige">
                            <MenuGrid onNavigate={handleNavigate} welcomeData={welcomeData} imageUrl={property.main_image_url} />
                        </div>

                        {/* Footer Text */}
                        <div className="px-6 pb-24 text-center opacity-30">
                            <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">
                                Powered by GuideFlow Premium
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <main className="w-full max-w-md mx-auto min-h-screen bg-beige shadow-2xl relative overflow-x-hidden">
            <div>
                {renderCurrentView()}
            </div>

            <BottomNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                currentLanguage={language}
            />

            <GuestChat
                propertyId={property.id}
                propertyName={property.name}
            />

            <ChatOnboarding onOpenChat={handleChatOpen} />
        </main>
    );
}
