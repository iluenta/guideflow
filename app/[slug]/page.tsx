import { getPropertyBySlug, getGuideSections, getPropertyManuals, getPropertyRecommendations, getPropertyFaqs } from '@/app/actions/properties'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateAccessToken } from '@/lib/security'
import { redirect } from 'next/navigation'
import { GuideViewContainer } from '@/components/guide/GuideViewContainer'
import { getLayoutTheme } from '@/lib/themes'
import { headers, cookies } from 'next/headers'
import { Translator } from '@/lib/ai/services/gemini-i18n'
import { TranslationService } from '@/lib/ai/services/translation-service'
import { playfair, oswald, nunito, cormorant, jost } from '@/lib/fonts-themes'

function detectLanguageFromHeader(acceptLanguage: string): string {
    const SUPPORTED = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ca', 'gl', 'eu']
    const langs = acceptLanguage
        .split(',')
        .map(l => l.split(';')[0].trim().toLowerCase().slice(0, 2))
    return langs.find(l => SUPPORTED.includes(l)) || 'es'
}

// ─── ACCIÓN 2: Lista reducida de strings críticos ─────────────────────────────
// Solo lo visible en el primer render (Welcome + Home + BottomNav).
// Antes: 159 strings, 2 batches, ~2.8s TTFB
// Después: ~50 strings, 1 batch, <1.2s TTFB esperado
// El resto se traduce progresivamente en el cliente via useLocalizedContent.
const CRITICAL_UI_STRINGS = [
    // Pantalla Welcome (Fase11Welcome)
    'Tu Guía',
    'Hola',
    'Bienvenido a',
    'Bienvenido a casa',
    'Tu asistente digital en',
    '¿En qué puedo ayudarte hoy?',
    'Desarrollado por',

    // Pantalla Home — etiquetas comunes a todos los temas
    'Lo Indispensable',
    'Conoce tu refugio',
    'Tu Estancia',
    'Guía de la Casa',
    'The essential intel',
    'House rules',

    // Etiquetas tema Urban
    'Urban Guide',
    'Explora',
    'Discover the beat',
    'Acceso',
    'Internet',
    'Emergencia (SOS)',
    'Vibe',
    'Gastronomía',
    'Qué hacer',
    'Compras',
    'Tu asistente digital en',

    // BottomNav (siempre visible)
    'Inicio',
    'Comer',
    'Ocio',
    'Info',

    // ModernHome extra
    'Parking',
    'Check-out',
    'Cómo llegar',
    '¿Dónde puedo aparcar?',
    'Chat',

    // Widget de recomendación destacada (Home)
    'RECOMENDACIÓN',
    'Explora la zona',
    'Ver recomendaciones',
    'Descubre los mejores rincones cerca de ti.',

    // Saludos por hora
    'BUENOS DÍAS',
    'BUENAS TARDES',
    'BUENAS NOCHES',

    // FAQs rápidas del Home
    'Preguntas Frecuentes',
    'Acceso',
    'Parking',
    '¿Dónde puedo aparcar?',
    '¿Dónde puedo comer cerca?',
];

/** Extracts all user-visible translatable strings from guide data (mirrors GuideViewContainer eager prefetch). */
function extractGuideTexts(
    sections: any[],
    faqs: any[],
    recommendations: any[],
    manuals: any[],
    context: any[]
): string[] {
    const texts: string[] = [];

    sections?.forEach((s: any) => {
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

    faqs?.forEach((f: any) => {
        if (f.question) texts.push(f.question);
        if (f.answer) texts.push(f.answer);
    });

    recommendations?.forEach((r: any) => {
        if (r.name) texts.push(r.name);
        if (r.description) texts.push(r.description);
        if (r.category) texts.push(r.category);
        if (r.personal_note) texts.push(r.personal_note);
        if (r.metadata?.personal_note) texts.push(r.metadata.personal_note);
        if (r.metadata?.editorial_summary) texts.push(r.metadata.editorial_summary);
    });

    manuals?.forEach((m: any) => {
        if (m.name) texts.push(m.name);
        if (m.appliance_name) texts.push(m.appliance_name);
    });

    context?.forEach((entry: any) => {
        const c = entry?.content;
        if (!c) return;
        switch (entry.category) {
            case 'welcome':
                if (c.message) texts.push(c.message);
                if (c.title) texts.push(c.title);
                break;
            case 'rules':
                if (Array.isArray(c.rules_items)) c.rules_items.forEach((item: any) => {
                    if (item.title) texts.push(item.title);
                    if (item.text) texts.push(item.text);
                    if (item.description) texts.push(item.description);
                });
                break;
            case 'checkin':
                if (Array.isArray(c.steps)) c.steps.forEach((step: any) => {
                    if (step.title) texts.push(step.title);
                    if (step.description) texts.push(step.description);
                });
                break;
            case 'tech':
                if (c.router_notes) texts.push(c.router_notes);
                break;
            case 'contacts':
                if (c.support_name) texts.push(c.support_name);
                if (Array.isArray(c.emergency_contacts)) c.emergency_contacts.forEach((ec: any) => {
                    if (ec.name) texts.push(ec.name);
                    if (ec.distance) texts.push(ec.distance);
                });
                if (Array.isArray(c.custom_contacts)) c.custom_contacts.forEach((cc: any) => {
                    if (cc.name) texts.push(cc.name);
                });
                break;
            case 'access':
                if (c.parking_info) texts.push(c.parking_info);
                if (c.parking_instructions) texts.push(c.parking_instructions);
                break;
        }
    });

    return [...new Set(texts.filter(t => t && t.trim().length > 2))];
}

async function prefetchTranslations(
    strings: string[],
    language: string,
    propertyId: string
): Promise<Record<string, string>> {
    if (language === 'es' || !strings.length) return {};

    const uniqueStrings = [...new Set(strings.filter(s => s && s.trim().length > 2))];
    if (uniqueStrings.length === 0) return {};

    // Con ~50 strings siempre cabe en 1 batch
    const BATCH_SIZE = 80;
    const batches: string[][] = [];
    for (let i = 0; i < uniqueStrings.length; i += BATCH_SIZE) {
        batches.push(uniqueStrings.slice(i, i + BATCH_SIZE));
    }

    try {
        console.log(`[PREFETCH] 🌐 ${uniqueStrings.length} strings, ${batches.length} batch(es) → ${language}`);

        const results = await Promise.all(
            batches.map(batch => Translator.translateBatch(batch, language, 'es', 'ui', propertyId))
        );

        const mapped: Record<string, string> = {};
        batches.forEach((batch, bIdx) => {
            batch.forEach((s, i) => {
                if (results[bIdx].translations?.[i]) mapped[s] = results[bIdx].translations[i];
            });
        });

        console.log(`[PREFETCH] ✅ ${Object.keys(mapped).length} translations ready`);
        return mapped;
    } catch (err) {
        console.error('[PREFETCH] Failed:', err);
        return {};
    }
}

interface GuidePageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ token?: string, lang?: string }>
}

export default async function GuidePage({ params, searchParams }: GuidePageProps) {
    const { slug } = await params
    const { token, lang } = await searchParams
    const supabase = await createClient()

    const property = await getPropertyBySlug(slug)
    if (!property) notFound()

    if (property.status !== 'active') {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        let isOwner = false
        if (authUser) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authUser.id).single()
            if (profile?.tenant_id === property.tenant_id) isOwner = true
        }
        if (!isOwner) notFound()
    }

    let guestName = ''
    let tokenLanguage = ''
    let activeToken = token

    // Backward compatibility: If token is in URL, store it in cookie and REDIRECT to hide it
    if (token) {
        // Use the dedicated route handler to set the cookie securely and redirect back
        // This solves "Cookies can only be modified in a Server Action or Route Handler"
        const nextUrl = lang ? `/g/${token}?lang=${lang}` : `/g/${token}`
        return redirect(nextUrl)
    }

    if (!activeToken) {
        activeToken = (await cookies()).get(`gf_token_${slug}`)?.value
    }

    const { data: { user: authUser } } = await supabase.auth.getUser()
    let isOwner = false
    if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authUser.id).single()
        if (profile?.tenant_id === property.tenant_id) isOwner = true
    }

    if (activeToken) {
        const tokenPattern = /^[a-z0-9]{10,48}$/i
        if (tokenPattern.test(activeToken)) {
            const { valid, access } = await validateAccessToken(supabase, activeToken, property.id)
            if (valid && access) {
                guestName = access.guest_name
                tokenLanguage = access.language
            } else if (!isOwner) {
                // Si no es el dueño y el token no es válido, fuera
                (await cookies()).delete(`gf_token_${slug}`)
                redirect('/access-denied?reason=invalid')
            }
        }
    }

    if (!isOwner && !guestName) {
        // Doble check: si no es dueño y no hemos conseguido un acceso válido
        redirect('/access-denied?reason=token_required')
    }

    const headersList = await headers()
    const cookiesList = await cookies()
    const acceptLanguage = headersList.get('accept-language') || ''
    const cookieLang = cookiesList.get('preferred_lang')?.value
    const serverDetectedLanguage = detectLanguageFromHeader(acceptLanguage)
    const initialLanguage: string = tokenLanguage || lang || (activeToken ? (cookieLang || serverDetectedLanguage) : (serverDetectedLanguage || cookieLang)) || 'es'

    console.log(`[PAGE] 🌐 Language: ${initialLanguage} (token:${tokenLanguage || '-'} cookie:${cookieLang || '-'} header:${serverDetectedLanguage})`);

    // Preparar batch de traducciones con strings extra de la propiedad
    const batchToTranslate = [...CRITICAL_UI_STRINGS];
    if (property.name) batchToTranslate.push(property.name);
    if (property.city) {
        batchToTranslate.push(`DESCUBRE ${property.city.toUpperCase()}`);
        batchToTranslate.push(`Descubre ${property.city}`);
    }

    // ── ACCIÓN 2 (mejora clave): traducciones en paralelo con los datos ────────
    // Antes: datos → traducciones (secuencial)
    // Ahora: datos + traducciones al mismo tiempo
    const [
        sections,
        manuals,
        recommendations,
        faqs,
        { data: context },
        { data: branding },
        initialTranslations
    ] = await Promise.all([
        getGuideSections(property.id),
        getPropertyManuals(property.id),
        getPropertyRecommendations(property.id),
        getPropertyFaqs(property.id),
        supabase.from('property_context').select('*').eq('property_id', property.id),
        supabase.from('property_branding').select('*').eq('property_id', property.id).single(),
        initialLanguage !== 'es'
            ? prefetchTranslations(batchToTranslate, initialLanguage, property.id)
            : Promise.resolve({} as Record<string, string>)
    ]);

    // ── SSR content cache lookup ──────────────────────────────────────────────
    // Query DB cache for all guide content texts (no Gemini — zero penalty if cold).
    // On warm cache (second visit): everything arrives translated in the HTML,
    // client-side eager prefetch finds all hits → zero translate-guide requests.
    // On cold cache: returns {} instantly, client handles it as before.
    let allTranslations = initialTranslations;
    if (initialLanguage !== 'es') {
        const contentTexts = extractGuideTexts(
            sections, faqs ?? [], recommendations ?? [], manuals ?? [], context ?? []
        );
        if (contentTexts.length > 0) {
            const contentTranslations = await TranslationService.fetchCachedBatch(
                contentTexts, 'es', initialLanguage, property.id
            );
            if (Object.keys(contentTranslations).length > 0) {
                allTranslations = { ...initialTranslations, ...contentTranslations };
                console.log(`[PREFETCH] 📦 +${Object.keys(contentTranslations).length} content strings from DB cache`);
            }
        }
    }

    // ── ACCIÓN 3: Key alignment ───────────────────────────────────────────────
    // El hook useLocalizedContent genera keys con este formato:
    //   `${language}:${text}:${propertyId}`
    //
    // GuideViewContainer.seedTranslationCache() ya transforma initialTranslations
    // (que vienen como { originalText: translatedText }) al formato correcto:
    //   `${initialLanguage}:${original}:${propertyId}` = translated
    //   `${initialLanguage}:${original}:global`        = translated
    //
    // Esto garantiza que el primer render use la caché sin ningún fetch de cliente.
    // No se necesita ninguna transformación adicional aquí.

    const layoutThemeId: string =
        (branding as any)?.layout_theme_id ||
        (branding?.computed_theme as any)?._layout_theme_id ||
        'modern'
    const layoutTheme = getLayoutTheme(layoutThemeId)
    const palette = layoutTheme.colors

    return (
        <div
            data-theme={layoutThemeId}
            className={`min-h-screen selection:bg-teal/10 ${playfair.variable} ${oswald.variable} ${nunito.variable} ${cormorant.variable} ${jost.variable}`}
            style={{
                '--color-primary': palette.primary,
                '--color-primary-foreground': palette.surface,
                '--color-secondary': palette.secondary,
                '--color-accent': palette.accent,
                '--color-background': palette.background,
                '--color-surface': palette.surface,
                '--color-text-primary': palette.text.primary,
                '--color-text-secondary': palette.text.secondary,
                '--color-muted-foreground': palette.text.muted,
                '--color-teal': palette.primary,
                '--color-ink': palette.text.primary,
                '--color-cloud': palette.background,
                '--color-beige': palette.background,
                '--font-heading': layoutTheme.fonts.heading,
                '--font-body': layoutTheme.fonts.body,
                backgroundColor: palette.background,
                color: palette.text.primary,
                fontFamily: layoutTheme.fonts.body,
            } as React.CSSProperties}
        >
            <GuideViewContainer
                property={property}
                branding={branding}
                sections={sections}
                manuals={manuals}
                recommendations={recommendations}
                faqs={faqs}
                context={context || []}/*  */
                guestName={guestName}
                accessToken={activeToken}
                tokenLanguage={tokenLanguage}
                initialLanguage={initialLanguage}
                initialTranslations={allTranslations}
            />
        </div>
    )
}