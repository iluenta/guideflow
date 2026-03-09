'use client';

import { useLocalizedContent, seedTranslationCache } from '@/hooks/useLocalizedContent';
import React, { useState, useEffect, useMemo } from 'react';
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
import supabaseLoader from '@/lib/image-loader';

import { BottomNav } from '@/components/guide/BottomNav';
import { CheckInView } from '@/components/guide/CheckInView';
import { EmergencyView } from '@/components/guide/EmergencyView';
import { RecommendationsView } from '@/components/guide/RecommendationsView';
import { HouseInfoView } from '@/components/guide/HouseInfoView';
import { HamburgerMenu } from '@/components/guide/HamburgerMenu';
import { Fase11Welcome } from '@/components/guide/Fase11Welcome';
import { Fase11Home } from '@/components/guide/Fase11Home';
import { AnimatePresence, motion } from 'framer-motion';

interface GuideViewContainerProps {
    property: any;
    branding?: any;
    sections: any[];
    manuals: any[];
    recommendations: any[];
    faqs?: any[];
    context?: any[];
    guestName?: string;
    accessToken?: string;
    tokenLanguage?: string;
    initialLanguage?: string;
    initialTranslations?: Record<string, string>;
}

export function GuideViewContainer({
    property,
    branding,
    sections,
    manuals,
    recommendations,
    faqs = [],
    context,
    guestName,
    accessToken,
    tokenLanguage,
    initialLanguage = 'es',
    initialTranslations = {}
}: GuideViewContainerProps) {
    // Resolve themeId: proper column (after migration 031) or JSONB fallback
    const themeId: string =
        branding?.layout_theme_id ||
        (branding?.computed_theme as any)?._layout_theme_id ||
        'modern'

    // Seed the translation cache before the first render
    useMemo(() => {
        if (Object.keys(initialTranslations).length > 0) {
            const propertyId = property.id;
            const formatted: Record<string, string> = {};

            Object.entries(initialTranslations).forEach(([original, translated]) => {
                // Seed both property-specific and global tags to be safe
                formatted[`${initialLanguage}:${original}:${propertyId}`] = translated;
                formatted[`${initialLanguage}:${original}:global`] = translated;
            });

            seedTranslationCache(formatted);
        }
    }, [initialTranslations, initialLanguage, property.id]);

    const [currentPage, setCurrentPage] = useState<string | null>('welcome');
    const [activeTab, setActiveTab] = useState('hub');
    const [language, setLanguage] = useState<string>(initialLanguage);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // --- CACHE & OFFLINE LOGIC ---
    const cacheKey = `guide_data_${property.id}`;
    const [localData, setLocalData] = useState<any>(null);

    // Initial load from cache
    useEffect(() => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                setLocalData(JSON.parse(cached));
            } catch (e) {
                console.error('[OFFLINE] LocalStorage parse error');
            }
        }
    }, [cacheKey]);

    // Save to cache when props arrive
    useEffect(() => {
        if (property && sections && manuals) {
            const dataToCache = { property, branding, sections, manuals, recommendations, faqs, context, timestamp: Date.now() };
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        }
    }, [property, branding, sections, manuals, recommendations, faqs, context, cacheKey]);

    // Fallback UI data
    const displayProperty = property || localData?.property;
    const displayContext = context || localData?.context || [];
    const displayManuals = manuals || localData?.manuals || [];
    const displayRecommendations = recommendations || localData?.recommendations || [];
    const displayFaqs = faqs || localData?.faqs || [];

    const welcomeData = displayContext?.find((c: any) => c.category === 'welcome')?.content;
    const { content: poweredByLabel } = useLocalizedContent('Desarrollado por', language, 'ui_label', accessToken, property.id);

    // Persist manual language choice via cookie
    useEffect(() => {
        if (!tokenLanguage && language) {
            document.cookie = `preferred_lang=${language};path=/;max-age=31536000;SameSite=Lax`;
        }
    }, [language, tokenLanguage]);

    const handleNavigate = (pageId: string) => {
        setCurrentPage(pageId);

        // Map pageIds to tabs
        if (pageId === 'welcome') setActiveTab('hub');
        else if (pageId === 'home' || pageId === 'assistant') setActiveTab('hub');
        else if (pageId === 'eat' || pageId === 'food') setActiveTab('eat');
        else if (pageId === 'do' || pageId === 'things-do' || pageId === 'leisure') setActiveTab('leisure');
        else if (pageId === 'shop' || pageId === 'shopping' || pageId === 'compras') setActiveTab('leisure');
        else if (pageId === 'manuals' || pageId === 'info' || pageId === 'house-info' || pageId === 'wifi' || pageId === 'rules') setActiveTab('info');
        else setActiveTab('guide');

        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setCurrentPage('home');
        setActiveTab('guide');
    };

    const handleTabChange = (tabId: string) => {

        if (tabId === 'chat') {
            handleChatOpen();
            return;
        }

        setActiveTab(tabId);
        if (tabId === 'hub') setCurrentPage('home');
        else if (tabId === 'eat') setCurrentPage('eat');
        else if (tabId === 'leisure') setCurrentPage('do');
        else if (tabId === 'info') setCurrentPage('manuals');
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
        // Explicitly handle welcome and home states
        if (currentPage === 'welcome') {
            return (
                <Fase11Welcome
                    propertyName={property.name}
                    heroImage={property.main_image_url || branding?.hero_image_url || ''}
                    location={property.city || ''}
                    onOpenGuide={() => {
                        setCurrentPage('home');
                        setActiveTab('guide');
                    }}
                    onNavigate={handleNavigate}
                    onChatQuery={handleChatWithQuery}
                    currentLanguage={language}
                    onLanguageChange={setLanguage}
                    guestName={guestName}
                    accessToken={accessToken}
                    propertyId={property.id}
                    themeId={themeId}
                    context={displayContext}
                    recommendations={displayRecommendations}
                    disabledLanguage={!!tokenLanguage}
                />
            );
        }

        if (currentPage === 'home' || currentPage === 'assistant' || currentPage === null || currentPage === '') {
            return (
                <Fase11Home
                    propertyName={property.name}
                    heroImage={property.main_image_url || branding?.hero_image_url || ''}
                    location={property.city || ''}
                    onBack={() => setCurrentPage('welcome')}
                    onNavigate={handleNavigate}
                    onChatQuery={handleChatWithQuery}
                    currentLanguage={language}
                    onLanguageChange={setLanguage}
                    recommendations={recommendations}
                    guestName={guestName}
                    accessToken={accessToken}
                    propertyId={property.id}
                    themeId={themeId}
                    context={displayContext}
                    sections={sections}
                    manuals={displayManuals}
                    disabledLanguage={!!tokenLanguage}
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
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
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
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
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
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
                    />
                );
            case 'check-in':
            case 'checkin': {
                const checkinData = context?.find((c: any) => c.category === 'checkin')?.content || {};
                const accessData = context?.find((c: any) => c.category === 'access')?.content;
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};

                // Find preferred contact info
                let prefName = '';
                let prefPhone = '';

                if (contactsData.preferred_contact_id === 'support') {
                    prefName = contactsData.support_name || 'Asistencia';
                    prefPhone = contactsData.support_phone || contactsData.support_mobile || '';
                } else if (contactsData.custom_contacts) {
                    const custom = contactsData.custom_contacts.find((cc: any) => cc.id === contactsData.preferred_contact_id);
                    if (custom) {
                        prefName = custom.name;
                        prefPhone = custom.phone;
                    }
                }

                return (
                    <CheckInView
                        onBack={handleBack}
                        checkinData={checkinData}
                        address={accessData?.full_address || property.full_address || ''}
                        hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')}
                        currentLanguage={language}
                        preferredContactName={prefName}
                        preferredContactPhone={prefPhone}
                        onLanguageChange={setLanguage}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
                    />
                );
            }
            case 'emergency': {
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                return (
                    <EmergencyView
                        onBack={handleBack}
                        contactsData={contactsData}
                        hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
                    />
                );
            }
            case 'house-info':
                return (
                    <HouseInfoView
                        onBack={handleBack}
                        property={property}
                        welcomeData={welcomeData}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
                    />
                );
            case 'eat':
                return (
                    <RecommendationsView
                        onBack={handleBack}
                        recommendations={recommendations}
                        group="eat"
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        city={property.city}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
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
                        onLanguageChange={setLanguage}
                        city={property.city}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
                    />
                );
            case 'shopping':
            case 'shop':
            case 'compras':
                return (
                    <RecommendationsView
                        onBack={handleBack}
                        recommendations={recommendations}
                        group="shopping"
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        city={property.city}
                        accessToken={accessToken}
                        propertyId={property.id}
                        disabledLanguage={!!tokenLanguage}
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
                                {branding?.custom_logo_url && branding.custom_logo_url.trim() !== '' ? (
                                    <div className="h-10 relative w-[120px]">
                                        <Image
                                            loader={supabaseLoader}
                                            src={branding.custom_logo_url}
                                            alt={property.name}
                                            fill
                                            sizes="120px"
                                            className="object-contain object-left"
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
                                    disabled={!!tokenLanguage}
                                />
                            </div>
                        </header>

                        <div className="relative z-10 bg-beige">
                            <MenuGrid
                                onNavigate={handleNavigate}
                                welcomeData={welcomeData}
                                imageUrl={property.main_image_url}
                                currentLanguage={language}
                                accessToken={accessToken}
                                propertyId={property.id}
                                manuals={displayManuals}
                                recommendations={displayRecommendations}
                                context={displayContext}
                                sections={sections}
                            />
                        </div>

                        <div className="px-6 pb-24 text-center opacity-30">
                            <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">
                                {poweredByLabel} GuideFlow Premium
                            </p>
                        </div>
                    </div>
                );
            default:
                // Fallback for any other state
                return (
                    <Fase11Home
                        propertyName={property.name}
                        heroImage={property.main_image_url || branding?.hero_image_url || ''}
                        location={property.city || ''}
                        onBack={() => setCurrentPage('welcome')}
                        onNavigate={handleNavigate}
                        onChatQuery={handleChatWithQuery}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        recommendations={recommendations}
                        guestName={guestName}
                        accessToken={accessToken}
                        propertyId={property.id}
                        themeId={themeId}
                        context={displayContext}
                        sections={sections}
                        manuals={displayManuals}
                        disabledLanguage={!!tokenLanguage}
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
                accessToken={accessToken}
                manuals={displayManuals}
                recommendations={displayRecommendations}
                context={displayContext}
                sections={sections}
            />

            <main className="overflow-x-hidden pb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage || 'home'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {renderCurrentView()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <BottomNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                currentLanguage={language}
                accessToken={accessToken}
                propertyId={property.id}
                manuals={displayManuals}
                recommendations={displayRecommendations}
                context={displayContext}
                sections={sections}
            />

            <GuestChat
                propertyId={property.id}
                propertyName={property.name}
                currentLanguage={language}
                accessToken={accessToken}
            />

            {/* Onboarding removed for Fase 10 flow to reduce friction */}
            {/* <ChatOnboarding onOpenChat={handleChatOpen} /> */}
        </div>
    );
}
