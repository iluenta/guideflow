'use client';

import React, { useState, useEffect } from 'react';
import { MenuGrid } from '@/components/guide/MenuGrid';
import { WifiView } from '@/components/guide/WifiView';
import { RulesView } from '@/components/guide/RulesView';
import { ManualsView } from '@/components/guide/ManualsView';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Menu } from 'lucide-react';
import { GuestChat } from '@/components/guide/GuestChat';
import { LanguageSelector } from '@/components/guide/LanguageSelector';
import { ChatOnboarding } from '@/components/guide/ChatOnboarding';

import { BottomNav } from '@/components/guide/BottomNav';
import { CheckInView } from '@/components/guide/CheckInView';
import { EmergencyView } from '@/components/guide/EmergencyView';
import { RecommendationsView } from '@/components/guide/RecommendationsView';
import { HouseInfoView } from '@/components/guide/HouseInfoView';
import { HamburgerMenu } from '@/components/guide/HamburgerMenu';
import { AssistantHome } from '@/components/guide/AssistantHome';

interface GuideViewContainerProps {
    property: any;
    branding?: any;
    sections: any[];
    manuals: any[];
    recommendations: any[];
    faqs?: any[];
    context?: any[];
}

export function GuideViewContainer({ property, branding, sections, manuals, recommendations, faqs = [], context }: GuideViewContainerProps) {
    const [currentPage, setCurrentPage] = useState<string | null>('assistant');
    const [activeTab, setActiveTab] = useState('home');
    const [language, setLanguage] = useState<string>('es');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // DEBUG: Log state changes
    useEffect(() => {
        console.log('GuideView: currentPage changed to:', currentPage);
    }, [currentPage]);

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
        console.log('GuideView: Navigating to:', pageId);
        setCurrentPage(pageId);
        // Map pageIds to tabs if possible
        if (pageId === 'eat' || pageId === 'food') setActiveTab('eat');
        else if (pageId === 'do' || pageId === 'things-do' || pageId === 'leisure') setActiveTab('leisure');
        else if (pageId === 'shopping' || pageId === 'compras') setActiveTab('leisure');
        else if (pageId === 'manuals' || pageId === 'info' || pageId === 'house-info') setActiveTab('info');
        else if (pageId === 'profile') setActiveTab('profile');
        else if (pageId === 'assistant' || pageId === null) setActiveTab('home');
        else setActiveTab('home');

        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setCurrentPage('assistant');
        setActiveTab('home');
    };

    const handleTabChange = (tabId: string) => {
        console.log('GuideView: Tab changed to:', tabId);
        setActiveTab(tabId);
        if (tabId === 'home') setCurrentPage('assistant');
        else if (tabId === 'eat') setCurrentPage('eat');
        else if (tabId === 'leisure') setCurrentPage('do');
        else if (tabId === 'info') setCurrentPage('manuals');
        else if (tabId === 'profile') setCurrentPage('profile');
        window.scrollTo(0, 0);
    };

    const handleChatOpen = () => {
        window.dispatchEvent(new CustomEvent('open-guest-chat'));
    };

    const handleChatWithQuery = (query: string) => {
        if (!query) {
            window.dispatchEvent(new CustomEvent('open-guest-chat'));
        } else {
            window.dispatchEvent(new CustomEvent('open-guest-chat-with-query', { detail: { query } }));
        }
    };

    const renderCurrentView = () => {
        // Explicitly handle assistant home state
        if (currentPage === 'assistant' || currentPage === null || currentPage === '') {
            return (
                <AssistantHome
                    propertyName={property.name}
                    onExplore={() => {
                        console.log('GuideView: AssistantHome -> onExplore called');
                        setCurrentPage('explore');
                    }}
                    onChatQuery={handleChatWithQuery}
                    currentLanguage={language}
                />
            );
        }

        switch (currentPage) {
            case 'wifi':
                const techData = context?.find((c: any) => c.category === 'tech')?.content || {};
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
                const rulesData = context?.find((c: any) => c.category === 'rules')?.content || {};
                const rulesCheckinData = context?.find((c: any) => c.category === 'checkin')?.content || {};
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
                        faqs={faqs}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'check-in':
            case 'checkin':
                const checkinData = context?.find((c: any) => c.category === 'checkin')?.content || {};
                const accessData = context?.find((c: any) => c.category === 'access')?.content;
                return (
                    <CheckInView
                        onBack={handleBack}
                        checkinData={checkinData}
                        address={accessData?.full_address || property.full_address || ''}
                        hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')}
                        currentLanguage={language}
                    />
                );
            case 'emergency':
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                return (
                    <EmergencyView
                        onBack={handleBack}
                        contactsData={contactsData}
                        hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')}
                        currentLanguage={language}
                    />
                );
            case 'house-info':
                return (
                    <HouseInfoView
                        onBack={handleBack}
                        property={property}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                    />
                );
            case 'eat':
                return (
                    <RecommendationsView
                        onBack={handleBack}
                        recommendations={recommendations}
                        group="eat"
                        currentLanguage={language}
                    />
                );
            case 'do':
            case 'leisure':
                return (
                    <RecommendationsView
                        onBack={handleBack}
                        recommendations={recommendations}
                        group="do"
                        currentLanguage={language}
                    />
                );
            case 'shopping':
            case 'compras':
                return (
                    <RecommendationsView
                        onBack={handleBack}
                        recommendations={recommendations}
                        group="shopping"
                        currentLanguage={language}
                    />
                );
            case 'explore':
                return (
                    <div className="min-h-screen">
                        <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-border/10 px-4 h-16 flex items-center justify-between">
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="p-2 -ml-2 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[60%]">
                                {branding?.custom_logo_url ? (
                                    <div className="h-10 flex items-center">
                                        <img
                                            src={branding.custom_logo_url}
                                            alt={property.name}
                                            className="h-full w-auto max-w-[120px] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <h1 className="font-sans text-base font-bold text-navy tracking-tight truncate uppercase">
                                        {property.name}
                                    </h1>
                                )}
                            </div>

                            <div className="flex items-center">
                                <LanguageSelector
                                    currentLanguage={language}
                                    onLanguageChange={setLanguage}
                                />
                            </div>
                        </header>

                        <div className="relative z-10 bg-beige">
                            <MenuGrid onNavigate={handleNavigate} welcomeData={welcomeData} imageUrl={property.main_image_url} currentLanguage={language} />
                        </div>

                        <div className="px-6 pb-24 text-center opacity-30">
                            <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">
                                Powered by GuideFlow Premium
                            </p>
                        </div>
                    </div>
                );
            default:
                // Fallback for any other state
                return (
                    <AssistantHome
                        propertyName={property.name}
                        onExplore={() => setCurrentPage('explore')}
                        onChatQuery={handleChatWithQuery}
                        currentLanguage={language}
                    />
                );
        }
    };

    return (
        <div className="w-full max-w-md mx-auto min-h-screen bg-background shadow-2xl relative">
            <HamburgerMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                currentLanguage={language}
                propertyName={property.name}
                propertyId={property.id}
            />

            <main className="overflow-x-hidden pb-24">
                {renderCurrentView()}
            </main>

            <BottomNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                currentLanguage={language}
            />

            <GuestChat
                propertyId={property.id}
                propertyName={property.name}
                currentLanguage={language}
            />

            {/* Onboarding removed for Fase 10 flow to reduce friction */}
            {/* <ChatOnboarding onOpenChat={handleChatOpen} /> */}
        </div>
    );
}
