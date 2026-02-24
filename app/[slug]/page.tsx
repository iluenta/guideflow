import { getPropertyBySlug, getGuideSections, getPropertyManuals, getPropertyRecommendations, getPropertyFaqs } from '@/app/actions/properties'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateAccessToken } from '@/lib/security'
import { redirect } from 'next/navigation'
import { GuideViewContainer } from '@/components/guide/GuideViewContainer'
import { getLayoutTheme } from '@/lib/themes'

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

    // 2. Validate token and get guest info if available
    let guestName = ''
    if (token) {
        const { valid, access } = await validateAccessToken(supabase, token, property.id)
        if (valid && access) {
            guestName = access.guest_name
        }
    }

    // Parallelize all data fetching
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

    // ── Resolve the visual theme ──────────────────────────────────────────────
    // Preferred: branding.layout_theme_id column (after migration 031 is applied)
    // Fallback:  computed_theme._layout_theme_id stored in JSONB (before migration)
    // Final:     default to 'modern'
    const layoutThemeId: string =
        (branding as any)?.layout_theme_id ||
        (branding?.computed_theme as any)?._layout_theme_id ||
        'modern'
    const layoutTheme = getLayoutTheme(layoutThemeId)

    // The computed_theme in DB may be stale/legacy.
    // Always use the forced palette from the LayoutTheme definition.
    const palette = layoutTheme.colors

    return (
        <div
            data-theme={layoutThemeId}
            className="min-h-screen selection:bg-teal/10"
            style={{
                // Forwarded CSS custom properties — consumed by all guide components
                '--color-primary': palette.primary,
                '--color-primary-foreground': palette.surface,
                '--color-secondary': palette.secondary,
                '--color-accent': palette.accent,
                '--color-background': palette.background,
                '--color-surface': palette.surface,
                '--color-text-primary': palette.text.primary,
                '--color-text-secondary': palette.text.secondary,
                '--color-muted-foreground': palette.text.muted,
                // Legacy aliases used by older guide components
                '--color-teal': palette.primary,
                '--color-ink': palette.text.primary,
                '--color-cloud': palette.background,
                '--color-beige': palette.background,
                // Typography
                '--font-heading': layoutTheme.fonts.heading,
                '--font-body': layoutTheme.fonts.body,
                // Theme background applied directly so no flash
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
                accessToken={token}
            />
        </div>
    )
}
