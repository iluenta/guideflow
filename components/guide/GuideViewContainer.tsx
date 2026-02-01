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

interface GuideViewContainerProps {
    property: any;
    sections: any[];
    manuals: any[];
}

export function GuideViewContainer({ property, sections, manuals }: GuideViewContainerProps) {
    const [currentPage, setCurrentPage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [language, setLanguage] = useState<string>('es');

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
        else if (pageId === 'manuals' || pageId === 'info') setActiveTab('info');
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
        else if (tabId === 'info') setCurrentPage('manuals');
        window.scrollTo(0, 0);
    };

    const handleChatOpen = () => {
        // Dispatch custom event to open chat (matches original behavior)
        window.dispatchEvent(new CustomEvent('open-guest-chat'));
    };

    const renderCurrentView = () => {
        switch (currentPage) {
            case 'wifi':
                const wifiSection = sections.find(s => s.title.toLowerCase().includes('wifi') || s.content_type === 'text' && s.title.toLowerCase().includes('internet'));
                return (
                    <WifiView
                        onBack={handleBack}
                        networkName={property.metadata?.wifi_name}
                        password={property.metadata?.wifi_password}
                        notes={wifiSection?.data?.text}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'rules':
                const rulesSection = sections.find(s => s.title.toLowerCase().includes('normas') || s.title.toLowerCase().includes('reglas'));
                return (
                    <RulesView
                        onBack={handleBack}
                        rules={rulesSection?.data?.text}
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
            default:
                return (
                    <div className="min-h-screen bg-beige">
                        {/* Target Header Design (Image 1) */}
                        <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-navy/5 px-4 h-16 flex items-center justify-between shadow-sm">
                            <button className="p-2 -ml-2 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90">
                                <Menu className="w-6 h-6" />
                            </button>

                            <h1 className="absolute left-1/2 -translate-x-1/2 font-serif text-lg font-bold text-navy tracking-tight max-w-[50%] truncate">
                                {property.name}
                            </h1>

                            <div className="flex items-center">
                                <LanguageSelector
                                    currentLanguage={language}
                                    onLanguageChange={setLanguage}
                                />
                            </div>
                        </header>

                        {/* Hero Section (Cleaned up) */}
                        <div className="relative h-[45vh] w-full overflow-hidden">
                            {property.main_image_url ? (
                                <Image
                                    src={property.main_image_url}
                                    alt={property.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="h-full w-full bg-navy/10" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-beige/90 via-transparent to-transparent" />

                            {/* Hero Info Overlay */}
                            <div className="absolute bottom-10 left-6 right-6">
                                <Badge className="mb-3 uppercase py-1 px-3 tracking-[0.2em] bg-white text-navy border-none shadow-lg text-[9px] font-black">
                                    GUEST EXPERIENCE
                                </Badge>
                                <div className="text-4xl font-serif font-black text-white drop-shadow-2xl tracking-tight leading-[1.1]">
                                    {property.name}
                                </div>
                                <div className="flex items-center gap-2 mt-3 text-white/95 font-bold drop-shadow-xl uppercase tracking-widest text-[10px]">
                                    <MapPin className="h-3 w-3" />
                                    <span>{property.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Menu Grid Content */}
                        <div className="-mt-8 relative z-10 bg-beige rounded-t-[2.5rem] pt-8 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                            <MenuGrid onNavigate={handleNavigate} />
                        </div>

                        {/* Footer Text */}
                        <div className="px-6 pb-24 text-center">
                            <p className="text-[10px] text-slate/40 uppercase font-black tracking-[0.5em]">
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
                onChatOpen={handleChatOpen}
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
