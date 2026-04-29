'use client';

import { useLocalizedContent, seedTranslationCache, seedTranslationCacheQuiet } from '@/hooks/useLocalizedContent';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Menu, Bot, MessageSquare } from 'lucide-react';
import supabaseLoader from '@/lib/image-loader';
import { getLayoutTheme } from '@/lib/themes';

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
    checkinDate?: string;
    checkoutDate?: string;
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
    checkinDate,
    checkoutDate,
}: GuideViewContainerProps) {
    const themeId: string =
        branding?.layout_theme_id ||
        (branding?.computed_theme as any)?._layout_theme_id ||
        'modern';

    const layoutTheme = getLayoutTheme(themeId);
    const palette = layoutTheme.colors;
    const portalThemeStyle: React.CSSProperties = {
        '--color-primary':        palette.primary,
        '--color-secondary':      palette.secondary,
        '--color-accent':         palette.accent,
        '--color-background':     palette.background,
        '--color-surface':        palette.surface,
        '--color-text-primary':   palette.text.primary,
        '--color-text-secondary': palette.text.secondary,
        '--color-muted-foreground': palette.text.muted,
        '--color-teal':           palette.primary,
        '--color-ink':            palette.text.primary,
        '--font-heading':         layoutTheme.fonts.heading,
        '--font-body':            layoutTheme.fonts.body,
    } as React.CSSProperties;

    useMemo(() => {
        if (Object.keys(initialTranslations).length > 0) {
            const propertyId = property.id;
            const formatted: Record<string, string> = {};
            Object.entries(initialTranslations).forEach(([original, translated]) => {
                formatted[`${initialLanguage}:${original}:${propertyId}`] = translated;
                formatted[`${initialLanguage}:${original}:global`] = translated;
            });
            // Quiet: called during render, must not notify listeners (would setState in render)
            seedTranslationCacheQuiet(formatted);
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
        let sid = localStorage.getItem('hospyia_guest_session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            localStorage.setItem('hospyia_guest_session_id', sid);
        }
        setGuestSessionId(sid);
    }, []);

    // Track page views
    useEffect(() => {
        if (currentPage && property?.id && guestSessionId && accessToken) {
            const trackView = async () => {
                try {
                    await fetch('/api/tracking', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            propertyId: property.id,
                            guestSessionId,
                            section: currentPage,
                            accessToken
                        })
                    });
                } catch (err) {
                    console.error('[TRACKING] Failed:', err);
                }
            };
            trackView();
        }
    }, [currentPage, property?.id, guestSessionId, accessToken]);

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

    // Eager prefetch: batch-translate all guide content on mount so individual views
    // find cache hits instead of triggering separate on-demand translation requests.
    useEffect(() => {
        if (language === 'es' || !accessToken) return;

        const texts: string[] = [];

        // Custom guide sections (SectionRenderer)
        sections?.forEach(s => {
            if (s.title) texts.push(s.title);
            const d = s.data;
            if (!d) return;
            if (typeof d.content === 'string' && d.content.trim()) texts.push(d.content);
            if (typeof d.text === 'string' && d.text.trim()) texts.push(d.text);
            if (typeof d.address === 'string' && d.address.trim()) texts.push(d.address);
            if (Array.isArray(d.items)) d.items.forEach((item: any) => {
                if (typeof item === 'string') texts.push(item);
                if (typeof item?.text === 'string') texts.push(item.text);
                if (typeof item?.label === 'string') texts.push(item.label);
            });
        });

        // FAQs (ManualsView → HowToAccordion)
        faqs?.forEach(f => {
            if (f.question) texts.push(f.question);
            if (f.answer) texts.push(f.answer);
        });

        // Recommendations (RecommendationsView)
        recommendations?.forEach(r => {
            if (r.name) texts.push(r.name);
            if (r.description) texts.push(r.description);
            if (r.category) texts.push(r.category);
            if (r.personal_note) texts.push(r.personal_note);
            if (r.metadata?.personal_note) texts.push(r.metadata.personal_note);
            if (r.metadata?.editorial_summary) texts.push(r.metadata.editorial_summary);
        });

        // Manuals — names only; manual_content is long-form markdown translated on-demand
        manuals?.forEach(m => {
            if (m.name) texts.push(m.name);
            if (m.appliance_name) texts.push(m.appliance_name);
        });

        // Property context (all views that read from displayContext)
        const ctx = context || [];
        ctx.forEach((entry: any) => {
            const c = entry?.content;
            if (!c) return;
            switch (entry.category) {
                case 'welcome':
                    // HouseInfoView, MenuGrid
                    if (c.message) texts.push(c.message);
                    if (c.title) texts.push(c.title);
                    break;
                case 'rules':
                    // RulesView
                    if (Array.isArray(c.rules_items)) {
                        c.rules_items.forEach((item: any) => {
                            if (item.title) texts.push(item.title);
                            if (item.text) texts.push(item.text);
                            if (item.description) texts.push(item.description);
                        });
                    }
                    break;
                case 'checkin':
                    // CheckInView, RulesView
                    if (Array.isArray(c.steps)) {
                        c.steps.forEach((step: any) => {
                            if (step.title) texts.push(step.title);
                            if (step.description) texts.push(step.description);
                        });
                    }
                    break;
                case 'tech':
                    // WifiView — notes field is user text; ssid/password are not translated
                    if (c.router_notes) texts.push(c.router_notes);
                    break;
                case 'contacts':
                    // EmergencyView, CheckInView
                    if (c.support_name) texts.push(c.support_name);
                    if (Array.isArray(c.emergency_contacts)) {
                        c.emergency_contacts.forEach((ec: any) => {
                            if (ec.name) texts.push(ec.name);
                            if (ec.distance) texts.push(ec.distance);
                        });
                    }
                    if (Array.isArray(c.custom_contacts)) {
                        c.custom_contacts.forEach((cc: any) => {
                            if (cc.name) texts.push(cc.name);
                        });
                    }
                    break;
                case 'access':
                    // CheckInView, GuideWelcome — parking text fields are user-written
                    if (c.parking_info) texts.push(c.parking_info);
                    if (c.parking_instructions) texts.push(c.parking_instructions);
                    break;
            }
        });

        const unique = [...new Set(texts.filter(t => t && t.trim().length > 2))];
        if (!unique.length) return;

        // Smaller batches sent in parallel: each request is lighter and all fire simultaneously.
        // Total time = slowest chunk, not sum of all chunks.
        const BATCH_SIZE = 50;
        const chunks: string[][] = [];
        for (let i = 0; i < unique.length; i += BATCH_SIZE) chunks.push(unique.slice(i, i + BATCH_SIZE));

        const translateChunk = async (chunk: string[]) => {
            try {
                const res = await fetch('/api/translate-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        batch: chunk,
                        targetLanguage: language,
                        sourceLanguage: 'es',
                        accessToken,
                        propertyId: property.id,
                    }),
                });
                if (!res.ok) return;
                const { translations } = await res.json();
                if (Array.isArray(translations)) {
                    const toSeed: Record<string, string> = {};
                    chunk.forEach((original, idx) => {
                        if (translations[idx]) {
                            toSeed[`${language}:${original}:${property.id}`] = translations[idx];
                            toSeed[`${language}:${original}:global`] = translations[idx];
                        }
                    });
                    // Seed as each chunk completes so components update progressively
                    seedTranslationCache(toSeed);
                }
            } catch { /* silent — on-demand system is the fallback */ }
        };

        // Fire all chunks in parallel
        Promise.all(chunks.map(translateChunk));
    // sections/faqs/recommendations/manuals are stable SSR props — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, property.id, accessToken]);

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
        else if (tabId === 'house-info') setCurrentPage('house-info');
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
                    property={property}
                    checkinDate={checkinDate}
                    checkoutDate={checkoutDate}
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
                    property={property}
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
                return <ManualsView onBack={handleBack} manuals={manuals} faqs={faqs} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} themeId={themeId} />;
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
                const hasAccessCodeEnabled = property?.has_access_code === true;
                const accessCodeProp = hasAccessCodeEnabled ? (property.access_code || accessData?.access_code || '') : '';
                return <CheckInView onBack={handleBack} propertyName={property.name} accessCodeProp={accessCodeProp} hasAccessCodeEnabled={hasAccessCodeEnabled} checkinData={checkinData} address={accessData?.full_address || property.full_address || ''} hostName={welcomeData?.host_name || labelHostNameFallback} currentLanguage={language} preferredContactName={prefName} preferredContactPhone={prefPhone} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} />;
            }
            case 'emergency': {
                const contactsData = context?.find((c: any) => c.category === 'contacts')?.content || {};
                return <EmergencyView onBack={handleBack} contactsData={contactsData} hostName={welcomeData?.host_name || labelHostNameFallback} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} themeId={themeId} />;
            }
            case 'house-info':
                return <HouseInfoView onBack={handleBack} property={property} welcomeData={welcomeData} contactsData={contactsData} currentLanguage={language} onLanguageChange={setLanguage} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} themeId={themeId} />;
            case 'eat':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="eat" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} themeId={themeId} />;
            case 'do':
            case 'leisure':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="do" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} themeId={themeId} />;
            case 'shopping':
            case 'shop':
            case 'compras':
                return <RecommendationsView onBack={handleBack} recommendations={recommendations} group="shopping" currentLanguage={language} onLanguageChange={setLanguage} city={property.city} accessToken={accessToken} propertyId={property.id} disabledLanguage={!!tokenLanguage} initialRecId={navigationPayload?.recId} themeId={themeId} />;
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
                            <p className="text-[9px] text-navy uppercase font-black tracking-[0.4em]">{poweredByLabel} Hospyia</p>
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
                <div data-theme={themeId} style={portalThemeStyle}>
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
                        hostName={welcomeData?.host_name || property.host_name}
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
                            themeId={themeId}
                        />
                    ) : (
                        <button
                            onClick={handleChatOpen}
                            style={{ position: 'fixed', bottom: '88px', right: '20px', width: '56px', height: '56px', zIndex: 10000 }}
                            className="bg-gradient-to-tr from-primary to-primary/90 text-white rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)] ring-4 ring-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Abrir asistente de ayuda"
                        >
                            <div className="relative">
                                <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
                            </div>
                        </button>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}