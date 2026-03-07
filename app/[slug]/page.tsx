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

    // 1. Deduplicate and filter (following user rule: length > 2)
    const uniqueStrings = [...new Set(strings.filter(s => s && s.trim().length > 2))];
    if (uniqueStrings.length === 0) return {};

    // 2. Batching (following user rule: BATCH_SIZE = 80)
    const BATCH_SIZE = 80;
    const batches: string[][] = [];
    for (let i = 0; i < uniqueStrings.length; i += BATCH_SIZE) {
        batches.push(uniqueStrings.slice(i, i + BATCH_SIZE));
    }

    try {
        console.log(`[PREFETCH] 🌐 Starting translation of ${uniqueStrings.length} strings in ${batches.length} batches to ${language}`);

        const results = await Promise.all(batches.map(batch =>
            Translator.translateBatch(
                batch,
                language,
                'es',
                'ui',
                propertyId
            )
        ));

        // 3. Merge all results back
        const mapped: Record<string, string> = {};
        batches.forEach((batch, batchIdx) => {
            const batchResults = results[batchIdx].translations;
            batch.forEach((s, i) => {
                if (batchResults && batchResults[i]) {
                    mapped[s] = batchResults[i];
                }
            });
        });

        console.log(`[PREFETCH] ✅ Successfully prefetched ${Object.keys(mapped).length} translations`);
        return mapped;
    } catch (err) {
        console.error('[PREFETCH] Multi-batch Translation failed:', err);
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

    // 3. Parallelize all data fetching
    const [
        sections,
        manuals,
        recommendations,
        faqs,
        { data: context },
        { data: branding }
    ] = await Promise.all([
        getGuideSections(property.id),
        getPropertyManuals(property.id),
        getPropertyRecommendations(property.id),
        getPropertyFaqs(property.id),
        supabase.from('property_context').select('*').eq('property_id', property.id),
        supabase.from('property_branding').select('*').eq('property_id', property.id).single()
    ])

    // 4. Prepare translations (Priority-based)
    let initialTranslations: Record<string, string> = {};
    if (initialLanguage !== 'es') {
        const batchToTranslate = [...CRITICAL_UI_STRINGS];

        // Priority 1: UI + Property Info
        if (property.name) batchToTranslate.push(property.name);
        if (property.city) batchToTranslate.push(`Descubre ${property.city}`);

        // Navigation labels
        batchToTranslate.push(
            'Check-in disponible', 'Dirección', 'Ver en mapa', '¿Problemas para entrar? Contacta con', 'Llamar',
            'BIENVENIDO', 'TU ANFITRIÓN', 'Disfruta de tu estancia en nuestra casa', 'Please enjoy your stay',
            'BUENOS DÍAS', 'BUENAS TARDES', 'BUENAS NOCHES', 'ATARDECER', 'Hola',
            'RECOMENDACIÓN', 'Explora la zona', 'Descubre los mejores rincones cerca de ti.', 'Ver recomendaciones',
            'LO ESENCIAL', 'EXPLORA', 'TU ALOJAMIENTO', 'Lo Indispensable', 'Sobre la Casa',
            'Gastronomía', 'Restaurantes locales', 'Dónde Comer', 'Restaurantes y cafeterías locales',
            'Qué Hacer', 'Actividades', 'Actividades y lugares de interés',
            'Compras', 'Tiendas y mercados', 'Tiendas, mercados y más',
            'Info', 'Info Casa', 'Normas', 'Manual', 'Guía de USO',
            'Ver todas las sugerencias', 'Desarrollado por', 'NUEVO'
        );

        // Priority 1: Context (Welcome/Checkin), FAQs, Wifi & SOS
        const welcomeData = context?.find((c: any) => c.category === 'welcome')?.content;
        const checkinData = context?.find((c: any) => c.category === 'checkin')?.content;
        const techData = context?.find((c: any) => c.category === 'tech')?.content;
        const contactsData = context?.find((c: any) => c.category === 'contacts')?.content;
        const accessData = context?.find((c: any) => c.category === 'access')?.content;

        if (welcomeData?.text) batchToTranslate.push(welcomeData.text);
        if (welcomeData?.message) batchToTranslate.push(welcomeData.message);
        if (checkinData?.text) batchToTranslate.push(checkinData.text);
        if (techData?.router_notes) batchToTranslate.push(techData.router_notes);
        if (accessData?.full_address) batchToTranslate.push(accessData.full_address);

        // SOS / Contacts
        if (contactsData) {
            if (contactsData.support_name) batchToTranslate.push(contactsData.support_name);
            if (contactsData.custom_contacts) {
                contactsData.custom_contacts.forEach((cc: any) => {
                    if (cc.name) batchToTranslate.push(cc.name);
                });
            }
            if (contactsData.emergency_contacts) {
                contactsData.emergency_contacts.forEach((ec: any) => {
                    if (ec.name) batchToTranslate.push(ec.name);
                    if (ec.distance) batchToTranslate.push(ec.distance);
                });
            }
        }

        if (faqs && faqs.length > 0) {
            faqs.forEach((f: any) => {
                if (f.question) batchToTranslate.push(f.question);
                if (f.answer) batchToTranslate.push(f.answer);
            });
        }

        // Priority 2: Recommendations (Names & Descriptions)
        if (activeToken && recommendations && recommendations.length > 0) {
            recommendations.forEach((r: any) => {
                if (r.name) batchToTranslate.push(r.name);
                if (r.description) batchToTranslate.push(r.description);
                // Also common sub-fields if they exist
                if (r.personal_note) batchToTranslate.push(r.personal_note);
            });
        }

        initialTranslations = await prefetchTranslations(batchToTranslate, initialLanguage, property.id);
    }

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
