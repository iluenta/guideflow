'use client';

import { useLocalizedContent, seedTranslationCache } from '@/hooks/useLocalizedContent';
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import supabaseLoader from '@/lib/image-loader';

// ─── Carga estática: SOLO lo visible en el primer render ──────────────────────
// Welcome y Home son las pantallas iniciales — no pueden ser lazy.
import { Fase11Welcome } from '@/components/guide/Fase11Welcome';
import { Fase11Home } from '@/components/guide/Fase11Home';
import { BottomNav } from '@/components/guide/BottomNav';
import { HamburgerMenu } from '@/components/guide/HamburgerMenu';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Carga lazy: un chunk por vista, se descarga solo al navegar ──────────────
// Resultado esperado: page.js baja de ~1.9 MB a < 500 KB.

const WifiView = dynamic(
    () => import('@/components/guide/WifiView').then(m => ({ default: m.WifiView })),
    { loading: () => <ViewSkeleton /> }
);
const RulesView = dynamic(
    () => import('@/components/guide/RulesView').then(m => ({ default: m.RulesView })),
    { loading: () => <ViewSkeleton /> }
);
const ManualsView = dynamic(
    () => import('@/components/guide/ManualsView').then(m => ({ default: m.ManualsView })),
    { loading: () => <ViewSkeleton /> }
);
const CheckInView = dynamic(
    () => import('@/components/guide/CheckInView').then(m => ({ default: m.CheckInView })),
    { loading: () => <ViewSkeleton /> }
);
const EmergencyView = dynamic(
    () => import('@/components/guide/EmergencyView').then(m => ({ default: m.EmergencyView })),
    { loading: () => <ViewSkeleton /> }
);
const RecommendationsView = dynamic(
    () => import('@/components/guide/RecommendationsView').then(m => ({ default: m.RecommendationsView })),
    { loading: () => <ViewSkeleton /> }
);
const HouseInfoView = dynamic(
    () => import('@/components/guide/HouseInfoView').then(m => ({ default: m.HouseInfoView })),
    { loading: () => <ViewSkeleton /> }
);
const MenuGrid = dynamic(
    () => import('@/components/guide/MenuGrid').then(m => ({ default: m.MenuGrid })),
    { loading: () => <ViewSkeleton /> }
);

// GuestChat: lazy + ssr:false. react-markdown + remark-gfm (~180 KB) no se
// descargan hasta que el usuario pulsa el botón del chat por primera vez.
const GuestChat = dynamic(
    () => import('@/components/guide/GuestChat').then(m => ({ default: m.GuestChat })),
    { ssr: false }
);

// ─── Skeleton compartido para estados de carga ────────────────────────────────
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

// ─── Props ────────────────────────────────────────────────────────────────────
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
    const [activeTab, setActiveTab] = useState('hub');
    const [language, setLanguage] = useState<string>(initialLanguage);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navigationPayload, setNavigationPayload] = useState<any>(null);

    // GuestChat se monta solo cuando el usuario lo abre por primera vez.
    // El botón flotante se renderiza aquí de forma ultra-ligera hasta ese momento.
    const [chatMounted, setChatMounted] = useState(false);

    // ── Cache offline ─────────────────────────────────────────────────────────
    const cacheKey = `guide_data_${property.id}`;
    const [localData, setLocalData] = useState<any>(null);

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
    const displayFaqs = faqs || localData?.faqs || [];

    const welcomeData = displayContext?.find((c: any) => c.category === 'welcome')?.content;
    const { content: poweredByLabel } = useLocalizedContent('Desarrollado por', language, 'ui_label', accessToken, property.id);

    useEffect(() => {
        if (!tokenLanguage && language) {
            document.cookie = `preferred_lang=${language};path=/;max-age=31536000;SameSite=Lax`;
        }
    }, [language, tokenLanguage]);

    // ── Navegación ────────────────────────────────────────────────────────────
    const handleNavigate = (pageId: string, payload?: any) => {
        setCurrentPage(pageId);
        setNavigationPayload(payload || null);
        if (pageId === 'welcome') setActiveTab('hub');
        else if (pageId === 'home' || pageId === 'assistant') setActiveTab('hub');
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
        setActiveTab(tabId);
        if (tabId === 'hub') setCurrentPage('home');
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
        setChatMounted(true);
        window.dispatchEvent(new CustomEvent(
            query ? 'open-guest-chat-with-query' : 'open-guest-chat',
            query ? { detail: { query } } : undefined
        ));
    };

    // ── Render de vistas ──────────────────────────────────────────────────────
    const renderCurrentView = () => {
        if (currentPage === 'welcome') {
            return (
                <Fase11Welcome
                    propertyName={property.name}
                    heroImage={property.main_image_url || branding?.hero_image_url || ''}
                    location={property.city || ''}
                    onOpenGuide={() => { setCurrentPage('home'); setActiveTab('guide'); }}
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

        if (!currentPage || currentPage === 'home' || currentPage === 'assistant') {
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
                    prefName = contactsData.support_name || 'Asistencia';
                    prefPhone = contactsData.support_phone || contactsData.support_mobile || '';
                } else if (contactsData.custom_contacts) {
                    const cc = contactsData.custom_contacts.find((c: any) => c.id === contactsData.preferred_contact_id);
                    if (cc) { prefName = cc.name; prefPhone = cc.phone; }
                }
                return <CheckInView onBack={handleBack} checkinData={checkinData} address={accessData?.full_address || property.full_address || ''} hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')} currentLanguage={language} preferredContactName={prefName} preferredContactPhone={prefPhone} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'emergency': {
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                return <EmergencyView onBack={handleBack} contactsData={contactsData} hostName={welcomeData?.host_name || (language === 'es' ? 'tu anfitrión' : 'your host')} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
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
                            <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-navy/70 hover:bg-navy/5 rounded-full transition-colors active:scale-90">
                                <Menu className="w-6 h-6" />
                            </button>
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

            {/*
             * ACCIÓN 3 — Chat diferido:
             * Si el usuario no ha abierto el chat todavía, se muestra un botón
             * flotante mínimo (<1 KB). Al pulsarlo, se monta GuestChat (lazy),
             * que es cuando se descarga react-markdown + remark-gfm (~180 KB).
             */}
            {chatMounted ? (
                <GuestChat
                    propertyId={property.id}
                    propertyName={property.name}
                    currentLanguage={language}
                    accessToken={accessToken}
                />
            ) : (
                <button
                    onClick={handleChatOpen}
                    className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50"
                    aria-label="Abrir asistente de ayuda"
                >
                    <div className="relative">
                        {/* Icono de bot inline — no importa lucide hasta que se monte el chat */}
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                    </div>
                </button>
            )}
        </div>
    );
}