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

    // "eu,es-ES;q=0.9,en;q=0.8" -> ['eu', 'es', 'en']
    const langs = acceptLanguage
        .split(',')
        .map(l => l.split(';')[0].trim().toLowerCase().slice(0, 2))

    return langs.find(l => SUPPORTED.includes(l)) || 'en'
}

// FOTC Fix: Critical UI strings to translate on the server
const CRITICAL_UI_STRINGS = [
    // General / Common
    'Info Casa',
    'Sobre la propiedad',
    'Detalles verificados',
    'Camas preparadas',
    'Equipados',
    'Ideal para su estancia',
    'Tu Guía',
    'RECOMENDACIÓN',
    'Explora la zona',
    'Descubre los mejores rincones cerca de ti.',
    'Ver recomendaciones',
    'Lo Indispensable',
    'Sobre la Casa',
    'Gastronomía',
    'Restaurantes locales',
    'Qué Hacer',
    'Actividades',
    'Compras',
    'Tiendas y mercados',
    'Info',
    'Normas',
    'Manual',
    'Desarrollado por',
    'BUENOS DÍAS',
    'BUENAS TARDES',
    'BUENAS NOCHES',
    'Check-in',
    'Check-out',
    'Normas de la Casa',
    'Emergencias',
    'WiFi',
    'NOMBRE DE LA RED',
    'CONTRASEÑA',
    'Inicio',
    'Comer',
    'Ocio',
    'Chat',
    'Llegada',
    'Check-in disponible',
    'Dirección',
    'Ver en mapa',
    '¿Problemas para entrar? Contacta con',
    'Llamar',
    'WhatsApp',
    'Copiar código',
    'Copiado',
    'Código copiado al portapapeles',
    'Servicio Nacional',
    'En caso de emergencia, llama al 112',
    'Soporte Directo',
    'Atención al huésped',
    'Servicios Locales',
    'Otros Contactos',
    'Silencio',
    'Horarios',
    'Gracias por respetar estas normas 🙏',
    'Dónde Comer',
    'Sabores Locales',
    'Mis recomendaciones personales para disfrutar de la mejor gastronomía de la zona.',
    'De Compras',
    'Mercados tradicionales, tiendas de artesanía y todo lo necesario para tu estancia.',
    'Experiencias únicas y rincones especiales seleccionados para ti.',
    'Descubre el entorno',
    'Precio:',
    'Tiempo:',
    'Consejo del anfitrión',
    'Todo',
    'Restaurantes',
    'Italiano',
    'Mediterráneo',
    'Hamburguesas',
    'Asiático',
    'Alta Cocina',
    'Internacional',
    'Cafés',
    'Naturaleza',
    'Cultura',
    'Relax',
    'Tiendas',
    'Supermercados',
    'Súper / Mercados',
    'Recomendaciones seleccionadas por el anfitrión',
    'Cargando...',
    'BOAS TARDES',
    'BOAS NOITES',
    'BOS DÍAS',
    'Hola',

    // Fase 11 Welcome specific
    'Bienvenido a casa',
    '¿En qué puedo ayudarte hoy?',
    'Tu concierge digital en',
    'Preguntas Frecuentes',
    'Tu Estancia',
    'Guía de la Casa',
    'Todo lo que necesitas saber',
    'Acceso',
    'Parking',
    '¿Dónde puedo aparcar?',
    '¿Dónde puedo comer cerca?',

    // Assistant Home specific
    'Estás en el alojamiento',
    'Estoy aquí para que tu estancia sea perfecta y no tengas que buscar ni llamar a nadie.',
    'Resuelvo tus dudas al instante sin que tengas que llamar al propietario.',
    'Ya conozco este apartamento por dentro y por fuera.',
    '¿Qué necesitas ahora?',
    'PUEDES PREGUNTARME:',
    '¿Prefieres navegar por la guía?',
    'Explorar guía completa',
    'Conexión WiFi',
    '¿Cuál es la clave del WiFi?',
    'Cocina / Vitro',
    '¿Cómo funciona la vitrocerámica o los fuegos?',
    'Cómo entrar',
    '¿Cómo entro al apartamento?',
    'Aparcar / Garaje',
    '¿Dónde está mi plaza de garaje?',
    'Comer cerca',
    'Qué visitar',
    '¿Qué puedo visitar?',

    // Manuals specific
    'Guía de Uso',
    'GUÍAS DE USO',
    'Sin guías disponibles',
    'El anfitrión aún no ha añadido guías o manuales para esta propiedad.'
];

async function prefetchTranslations(
    strings: string[],
    language: string,
    propertyId: string
): Promise<Record<string, string>> {
    if (language === 'es' || !strings.length) return {};

    try {
        // CALL SERVICE DIRECTLY - NO HTTP FETCH OVERHEAD
        const { translations: results } = await Translator.translateBatch(
            strings,
            language,
            'es',
            'ui',
            propertyId
        );

        // Convert array back to Record for the prop
        const mapped: Record<string, string> = {};
        strings.forEach((s, i) => {
            if (results && results[i]) mapped[s] = results[i];
        });

        console.log(`[PREFETCH] ✅ Translated ${Object.keys(mapped).length}/${strings.length} strings to ${language}`);
        return mapped;
    } catch (err) {
        console.error('[PREFETCH] Direct Service Call Failed:', err);
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

    // 1.5. Validate property status
    if (property.status !== 'active') {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        let isOwner = false
        if (authUser) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', authUser.id)
                .single()

            if (profile?.tenant_id === property.tenant_id) {
                isOwner = true
            }
        }

        if (!isOwner) {
            notFound()
        }
    }

    // 2. Validate token and get guest info if available
    let guestName = ''
    let tokenLanguage = ''
    let activeToken = token

    // Case A: Token in URL (Middleware might have missed it or we are in a non-standard flow)
    // Case B: Token in Cookie (Preferred session method)
    if (!activeToken) {
        activeToken = (await cookies()).get(`gf_token_${slug}`)?.value
    }

    // Host Bypass Logic
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let isOwner = false
    if (authUser) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', authUser.id)
            .single()

        if (profile?.tenant_id === property.tenant_id) {
            isOwner = true
        }
    }

    if (!isOwner) {
        // Guest Validation
        if (!activeToken) {
            redirect('/access-denied?reason=token_required')
        }

        // Cheap Format Validation
        const tokenPattern = /^[a-z0-9]{10,48}$/i
        if (!tokenPattern.test(activeToken)) {
            (await cookies()).delete(`gf_token_${slug}`)
            redirect('/access-denied?reason=invalid')
        }

        // Hard Database Validation
        const { valid, access, reason, availableFrom } = await validateAccessToken(supabase, activeToken, property.id)

        if (!valid) {
            // Cleanup failed session
            (await cookies()).delete(`gf_token_${slug}`)

            if (reason === 'too_early') {
                redirect(`/access-denied?reason=too_early&date=${availableFrom?.toISOString()}`)
            }
            redirect(`/access-denied?reason=${reason || 'invalid'}`)
        }

        if (access) {
            guestName = access.guest_name
            tokenLanguage = access.language

            // Track session in DB (Optional but good for revocation)
            // We use a simple "last used" update or check entry
            const { data: existingSession } = await supabase
                .from('guest_sessions')
                .select('id')
                .eq('token_id', access.id)
                .maybeSingle()

            if (!existingSession) {
                await supabase.from('guest_sessions').insert({
                    token_id: access.id,
                    expires_at: access.valid_until
                })
            }
        }
    }

    // 2.5 Detection logic (No flash)
    const headersList = await headers()
    const cookiesList = await cookies()

    const acceptLanguage = headersList.get('accept-language') || ''
    const cookieLang = cookiesList.get('preferred_lang')?.value
    const serverDetectedLanguage = detectLanguageFromHeader(acceptLanguage)

    const initialLanguage = tokenLanguage || cookieLang || serverDetectedLanguage

    console.log(`[PAGE] 🌐 Language Detection | Token: ${tokenLanguage || '-'} | Cookie: ${cookieLang || '-'} | Header: ${serverDetectedLanguage} => FINAL: ${initialLanguage}`);

    // Prepare critical translations
    const batchToTranslate = [...CRITICAL_UI_STRINGS];
    if (property.name) batchToTranslate.push(property.name);
    if (property.city) batchToTranslate.push(`Descubre ${property.city}`);

    // Add more common labels to reduce client churn
    batchToTranslate.push('Check-in disponible', 'Dirección', 'Ver en mapa', '¿Problemas para entrar? Contacta con', 'Llamar');

    // Parallelize all data fetching including critical translations
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
        prefetchTranslations(batchToTranslate, initialLanguage, property.id)
    ])

    // ── Resolve the visual theme ──────────────────────────────────────────────
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
