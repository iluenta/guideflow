import { getPropertyBySlug, getGuideSections, getPropertyManuals, getPropertyRecommendations, getPropertyFaqs } from '@/app/actions/properties'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateAccessToken } from '@/lib/security'
import { redirect } from 'next/navigation'
import { GuideViewContainer } from '@/components/guide/GuideViewContainer'
import { getLayoutTheme } from '@/lib/themes'
import { headers, cookies } from 'next/headers'
import { Translator } from '@/lib/gemini-i18n'

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
    'Tu concierge digital en',
    '¿En qué puedo ayudarte hoy?',
    'Desarrollado por',

    // Pantalla Home — etiquetas comunes a todos los temas
    'Lo Indispensable',
    'LO INDISPENSABLE',
    'Conoce tu refugio',
    'Tu Estancia',
    'Guía de la Casa',
    'THE ESSENTIAL INTEL',
    'HOUSE RULES',

    // Etiquetas tema Urban
    'URBAN GUIDE',
    'EXPLORA',
    'DISCOVER THE BEAT',
    'ACCESO',
    'INTERNET',
    'EMERGENCIA (SOS)',
    'VIBE',
    'GASTRONOMÍA',
    'QUÉ HACER',
    'COMPRAS',
    'TU CONCIERGE DIGITAL EN',

    // BottomNav (siempre visible)
    'Inicio',
    'Comer',
    'Ocio',
    'Info',
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
    searchParams: Promise<{ token?: string }>
}

export default async function GuidePage({ params, searchParams }: GuidePageProps) {
    const { slug } = await params
    const { token } = await searchParams
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

    if (!activeToken) {
        activeToken = (await cookies()).get(`gf_token_${slug}`)?.value
    }

    const { data: { user: authUser } } = await supabase.auth.getUser()
    let isOwner = false
    if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authUser.id).single()
        if (profile?.tenant_id === property.tenant_id) isOwner = true
    }

    if (!isOwner) {
        if (!activeToken) redirect('/access-denied?reason=token_required')

        const tokenPattern = /^[a-z0-9]{10,48}$/i
        if (!tokenPattern.test(activeToken)) {
            (await cookies()).delete(`gf_token_${slug}`)
            redirect('/access-denied?reason=invalid')
        }

        const { valid, access, reason, availableFrom } = await validateAccessToken(supabase, activeToken, property.id)
        if (!valid) {
            (await cookies()).delete(`gf_token_${slug}`)
            if (reason === 'too_early') redirect(`/access-denied?reason=too_early&date=${availableFrom?.toISOString()}`)
            redirect(`/access-denied?reason=${reason || 'invalid'}`)
        }

        if (access) {
            guestName = access.guest_name
            tokenLanguage = access.language
            const { data: existingSession } = await supabase.from('guest_sessions').select('id').eq('token_id', access.id).maybeSingle()
            if (!existingSession) {
                await supabase.from('guest_sessions').insert({ token_id: access.id, expires_at: access.valid_until })
            }
        }
    }

    const headersList = await headers()
    const cookiesList = await cookies()
    const acceptLanguage = headersList.get('accept-language') || ''
    const cookieLang = cookiesList.get('preferred_lang')?.value
    const serverDetectedLanguage = detectLanguageFromHeader(acceptLanguage)
    const initialLanguage: string = tokenLanguage || (activeToken ? (cookieLang || serverDetectedLanguage) : (serverDetectedLanguage || cookieLang)) || 'es'

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
            className="min-h-screen selection:bg-teal/10"
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
                context={context || []}
                guestName={guestName}
                accessToken={activeToken}
                tokenLanguage={tokenLanguage}
                initialLanguage={initialLanguage}
                initialTranslations={initialTranslations}
            />
        </div>
    )
}