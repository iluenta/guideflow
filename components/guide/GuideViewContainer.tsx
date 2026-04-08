'use client';

import { useLocalizedContent, seedTranslationCache } from '@/hooks/useLocalizedContent';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Menu, Bot, MessageSquare } from 'lucide-react';
import supabaseLoader from '@/lib/image-loader';

// ─── Carga estática: SOLO lo visible en el primer render ──────────────────────
import { GuideHome } from '@/components/guide/GuideHome';
import { GuideWelcome } from '@/components/guide/GuideWelcome';
import { BottomNav } from '@/components/guide/BottomNav';
import { ContactModal } from '@/components/guide/ContactModal';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Carga lazy: ssr:false evita que Next incluya estos chunks en el bundle SSR
// Sin ssr:false los módulos se analizan en el servidor aunque no se rendericen,
// lo que los mantiene en el bundle principal. Con ssr:false se separan en chunks
// independientes que solo se descargan al navegar a esa vista.

const WifiView = dynamic(
    () => import('@/components/guide/WifiView').then(m => ({ default: m.WifiView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const RulesView = dynamic(
    () => import('@/components/guide/RulesView').then(m => ({ default: m.RulesView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const ManualsView = dynamic(
    () => import('@/components/guide/ManualsView').then(m => ({ default: m.ManualsView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const CheckInView = dynamic(
    () => import('@/components/guide/CheckInView').then(m => ({ default: m.CheckInView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const EmergencyView = dynamic(
    () => import('@/components/guide/EmergencyView').then(m => ({ default: m.EmergencyView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const RecommendationsView = dynamic(
    () => import('@/components/guide/RecommendationsView').then(m => ({ default: m.RecommendationsView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const HouseInfoView = dynamic(
    () => import('@/components/guide/HouseInfoView').then(m => ({ default: m.HouseInfoView })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const MenuGrid = dynamic(
    () => import('@/components/guide/MenuGrid').then(m => ({ default: m.MenuGrid })),
    { loading: () => <ViewSkeleton />, ssr: false }
);
const GuestChat = dynamic(
    () => import('@/components/guide/GuestChat').then(m => ({ default: m.GuestChat })),
    { loading: () => <div className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-tr from-primary/50 to-primary/20 rounded-full animate-pulse shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-4 ring-primary/10 z-50 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-primary/40" /></div>, ssr: false }
);

function ViewSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="h-16 bg-muted/30" />
            <div className="p-6 space-y-4">
                <div className="h-48 bg-muted/20 rounded-2xl" />
                <div className="h-6 bg-muted/20 rounded w-2/3" />
                <div className="h-4 bg-muted/20 rounded w-1/2" />
                <div className="h-4 bg-muted/20 rounded w-3/4" />
            </div>
        </div>
    );
}

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
    initialTranslations = {},
}: GuideViewContainerProps) {
    const themeId: string =
        branding?.layout_theme_id ||
        (branding?.computed_theme as any)?._layout_theme_id ||
        'modern';

    useMemo(() => {
        if (Object.keys(initialTranslations).length > 0) {
            const propertyId = property.id;
            const formatted: Record<string, string> = {};
            Object.entries(initialTranslations).forEach(([original, translated]) => {
                formatted[`${initialLanguage}:${original}:${propertyId}`] = translated;
                formatted[`${initialLanguage}:${original}:global`] = translated;
            });
            seedTranslationCache(formatted);
        }
    }, [initialTranslations, initialLanguage, property.id]);

    const [currentPage, setCurrentPage] = useState<string | null>('welcome');
    const [activeTab, setActiveTab] = useState('welcome');
    const [language, setLanguage] = useState<string>(initialLanguage);
    const [navigationPayload, setNavigationPayload] = useState<any>(null);
    const [chatMounted, setChatMounted] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [pendingChatQuery, setPendingChatQuery] = useState<string | undefined>(undefined);

    const cacheKey = `guide_data_${property.id}`;
    const [localData, setLocalData] = useState<any>(null);
    const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

    // Initialize guest session
    useEffect(() => {
        let sid = localStorage.getItem('guideflow_guest_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            localStorage.setItem('guideflow_guest_session_id', sid);
        }
        setGuestSessionId(sid);
    }, []);

    // Track page views
    useEffect(() => {
        if (currentPage && property?.id && guestSessionId) {
            const trackView = async () => {
                try {
                    await fetch('/api/tracking', {
                        method: 'POST',
                        body: JSON.stringify({
                            propertyId: property.id,
                            guestSessionId,
                            section: currentPage
                        })
                    });
                } catch (err) {
                    console.error('[TRACKING] Failed:', err);
                }
            };
            trackView();
        }
    }, [currentPage, property?.id, guestSessionId]);

    useEffect(() => {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { setLocalData(JSON.parse(cached)); } catch { }
        }
    }, [cacheKey]);

    useEffect(() => {
        if (property && sections && manuals) {
            const dataToCache = { property, branding, sections, manuals, recommendations, faqs, context, timestamp: Date.now() };
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        }
    }, [property, branding, sections, manuals, recommendations, faqs, context, cacheKey]);

    const displayContext = context || localData?.context || [];
    const displayManuals = manuals || localData?.manuals || [];
    const displayRecommendations = recommendations || localData?.recommendations || [];
    
    const contactsData = displayContext?.find((c: any) => c.category === 'contacts')?.content || {};

    const welcomeData = displayContext?.find((c: any) => c.category === 'welcome')?.content;
    const { content: poweredByLabel } = useLocalizedContent('Desarrollado por', language, 'ui_label', accessToken, property.id);
    const { content: labelAsistencia } = useLocalizedContent('Asistencia', language, 'ui_label', accessToken, property.id);
    const { content: labelHostNameFallback } = useLocalizedContent('tu anfitrión', language, 'ui_label', accessToken, property.id);

    useEffect(() => {
        if (!tokenLanguage && language) {
            document.cookie = `preferred_lang=${language};path=/;max-age=31536000;SameSite=Lax`;
        }
    }, [language, tokenLanguage]);

    const handleNavigate = (pageId: string, payload?: any) => {
        setCurrentPage(pageId);
        setNavigationPayload(payload || null);
        if (pageId === 'welcome') setActiveTab('welcome');
        else if (pageId === 'home' || pageId === 'assistant') setActiveTab('hub');
        else if (pageId === 'emergency') setActiveTab('emergency');
        else if (pageId === 'eat' || pageId === 'food') setActiveTab('eat');
        else if (['do', 'things-do', 'leisure'].includes(pageId)) setActiveTab('leisure');
        else if (['shop', 'shopping', 'compras'].includes(pageId)) setActiveTab('leisure');
        else if (['manuals', 'info', 'house-info', 'wifi', 'rules'].includes(pageId)) setActiveTab('info');
        else setActiveTab('guide');
        window.scrollTo(0, 0);
    };

    const handleBack = () => { setCurrentPage('home'); setActiveTab('hub'); setNavigationPayload(null); };

    const handleTabChange = (tabId: string) => {
        if (tabId === 'chat') { handleChatOpen(); return; }
        if (tabId === 'contact') { setIsContactModalOpen(true); return; }
        setActiveTab(tabId);
        if (tabId === 'welcome') setCurrentPage('welcome');
        else if (tabId === 'hub') setCurrentPage('home');
        else if (tabId === 'emergency') setCurrentPage('emergency');
        else if (tabId === 'eat') setCurrentPage('eat');
        else if (tabId === 'leisure') setCurrentPage('do');
        else if (tabId === 'info') setCurrentPage('manuals');
        window.scrollTo(0, 0);
    };

    const handleChatOpen = () => {
        setChatMounted(true);
        window.dispatchEvent(new CustomEvent('open-guest-chat'));
    };

    const handleChatWithQuery = (query: string) => {
        if (!chatMounted) {
            setPendingChatQuery(query);
            setChatMounted(true);
        } else {
            window.dispatchEvent(new CustomEvent(
                query ? 'open-guest-chat-with-query' : 'open-guest-chat',
                query ? { detail: { query } } : undefined
            ));
        }
    };

    const renderCurrentView = () => {
        if (currentPage === 'welcome') {
            return (
                <GuideWelcome
                    propertyName={property.name}
                    heroImage={property.main_image_url || branding?.hero_image_url || ''}
                    location={property.city || ''}
                    onBack={() => {}} // No back from welcome
                    onOpenGuide={() => { setCurrentPage('home'); setActiveTab('guide'); }}
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
                    latitude={property.latitude}
                    longitude={property.longitude}
                    showBack={false}
                    hasParking={property.has_parking}
                    parkingNumber={property.parking_number}
                />
            );
        }

        if (!currentPage || currentPage === 'home' || currentPage === 'assistant') {
            return (
                <GuideHome
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
            case 'wifi': {
                const techData = context?.find((c: any) => c.category === 'tech')?.content || {};
                return <WifiView onBack={handleBack} networkName={techData.wifi_ssid} password={techData.wifi_password} notes={techData.router_notes} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'rules': {
                const rulesData = context?.find((c: any) => c.category === 'rules')?.content || {};
                const rulesCheckinData = context?.find((c: any) => c.category === 'checkin')?.content || {};
                const rulesSection = sections.find(s => s.title.toLowerCase().includes('normas') || s.title.toLowerCase().includes('reglas'));
                return <RulesView onBack={handleBack} rulesData={rulesData} checkinData={rulesCheckinData} oldRules={rulesSection?.data?.text} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'manuals':
                return <ManualsView onBack={handleBack} manuals={manuals} faqs={faqs} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            case 'check-in':
            case 'checkin': {
                const checkinData = context?.find((c: any) => c.category === 'checkin')?.content || {};
                const accessData = context?.find((c: any) => c.category === 'access')?.content;
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                let prefName = '', prefPhone = '';
                if (contactsData.preferred_contact_id === 'support') {
                    prefName = contactsData.support_name || labelAsistencia;
                    prefPhone = contactsData.support_phone || contactsData.support_mobile || '';
                } else if (contactsData.custom_contacts) {
                    const cc = contactsData.custom_contacts.find((c: any) => c.id === contactsData.preferred_contact_id);
                    if (cc) { prefName = cc.name; prefPhone = cc.phone; }
                }
                return <CheckInView onBack={handleBack} checkinData={checkinData} address={accessData?.full_address || property.full_address || ''} hostName={welcomeData?.host_name || labelHostNameFallback} currentLanguage={language} preferredContactName={prefName} preferredContactPhone={prefPhone} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'emergency': {
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                return <EmergencyView onBack={handleBack} contactsData={contactsData} hostName={welcomeData?.host_name || labelHostNameFallback} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'house-info':
                return <HouseInfoView onBack={handleBack} property={property} welcomeData={welcomeData} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            case 'eat':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="eat" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} />;
            case 'do':
            case 'leisure':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="do" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} />;
            case 'shopping':
            case 'shop':
            case 'compras':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="shopping" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} />;
            case 'explore':
                return (
                    <div className="min-h-screen">
                        <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-border/10 px-4 h-16 flex items-center justify-between">
                            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[60%]">
                                {branding?.custom_logo_url?.trim() ? (
                                    <div className="h-10 relative w-[120px]">
                                        <Image loader={supabaseLoader} src={branding.custom_logo_url} alt={property.name} fill sizes="120px" className="object-contain object-left" />
                                    </div>
                                ) : (
                                    <h1 className="font-sans text-base font-bold text-navy tracking-tight truncate uppercase">{property.name}</h1>
                                )}
                            </div>
                        </header>
                        <div className="relative z-10 bg-beige">
                            <MenuGrid onNavigate={handleNavigate} welcomeData={welcomeData} imageUrl={property.main_image_url} currentLanguage={language} accessToken={accessToken} propertyId={property.id} manuals={displayManuals} recommendations={displayRecommendations} context={displayContext} sections={sections} />
                        </div>
                        <div className="px-6 pb-24 text-center opacity-30">
                            <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">{poweredByLabel} GuideFlow Premium</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <GuideHome
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

    const [mounted, setMounted] = React.useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <>
            <div className="w-full max-w-md mx-auto min-h-screen bg-background shadow-2xl relative">
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
            </div>
            {mounted && createPortal(
                <>
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
                        themeId={themeId}
                    />
                    <ContactModal
                        isOpen={isContactModalOpen}
                        onClose={() => setIsContactModalOpen(false)}
                        contactsData={contactsData}
                        currentLanguage={language}
                        accessToken={accessToken}
                        propertyId={property.id}
                        themeId={themeId}
                    />
                    {chatMounted ? (
                        <GuestChat
                            propertyId={property.id}
                            propertyName={property.name}
                            currentLanguage={language}
                            accessToken={accessToken}
                            initialOpen={true}
                            initialQuery={pendingChatQuery}
                            guestSessionId={guestSessionId || undefined}
                        />
                    ) : (
                        <button
                            onClick={handleChatOpen}
                            style={{ position: 'fixed', bottom: '88px', right: '20px', width: '56px', height: '56px', zIndex: 10000 }}
                            className="bg-gradient-to-tr from-primary to-primary/80 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-4 ring-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Abrir asistente de ayuda"
                        >
                            <div className="relative">
                                <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                            </div>
                        </button>
                    )}
                </>,
                document.body
            )}
        </>
    );
}