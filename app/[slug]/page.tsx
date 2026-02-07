import { getPropertyBySlug, getGuideSections, getPropertyManuals, getPropertyRecommendations, getPropertyFaqs } from '@/app/actions/properties'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateAccessToken } from '@/lib/security'
import { redirect } from 'next/navigation'
import { GuideViewContainer } from '@/components/guide/GuideViewContainer'

interface GuidePageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ token?: string }>
}

export default async function GuidePage({ params, searchParams }: GuidePageProps) {
    const { slug } = await params
    const { token } = await searchParams
    const supabase = await createClient()

    // Auth & Security are handled by middleware. Only proceed if you need the user object for host-specific UI.
    const { data: { user } } = await supabase.auth.getUser()

    const property = await getPropertyBySlug(slug)
    if (!property) notFound()

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

    const theme = branding?.computed_theme || {
        colors: {
            primary: property.theme_config?.primary_color || '#316263',
            secondary: '#7c9a92',
            accent: '#f59e0b',
            background: '#F0EEE9',
            surface: '#ffffff',
            text: { primary: '#1a1a1a', secondary: '#4a4a4a', muted: '#8a8a8a' }
        }
    }

    return (
        <div
            className="min-h-screen selection:bg-teal/10"
            style={{
                '--color-primary': theme.colors.primary,
                '--color-primary-foreground': theme.colors.surface,
                '--color-secondary': theme.colors.secondary,
                '--color-accent': theme.colors.accent,
                '--color-background': theme.colors.background,
                '--color-surface': theme.colors.surface,
                '--color-text-primary': theme.colors.text.primary,
                '--color-text-secondary': theme.colors.text.secondary,
                '--color-muted-foreground': theme.colors.text.muted,
                '--color-teal': theme.colors.primary, // Legacy compatibility
                '--color-ink': theme.colors.text.primary,
                '--color-cloud': theme.colors.background,
                '--color-beige': theme.colors.background,
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                fontFamily: theme.fonts?.body || 'system-ui, sans-serif'
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
            />
        </div>
    )
}
