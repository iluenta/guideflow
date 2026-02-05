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

    // 1. Check Authentication (Host check)
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Security validation (Backup for middleware)
    if (!user) {
        if (!token) {
            redirect('/access-denied?reason=token_required')
        }

        const validation = await validateAccessToken(supabase, token)
        if (!validation.valid) {
            redirect(`/access-denied?reason=${validation.reason}`)
        }
    }

    const property = await getPropertyBySlug(slug)

    if (!property) {
        notFound()
    }

    const sections = await getGuideSections(property.id)
    const manuals = await getPropertyManuals(property.id)
    const recommendations = await getPropertyRecommendations(property.id)
    const faqs = await getPropertyFaqs(property.id)

    const { data: context } = await supabase
        .from('property_context')
        .select('*')
        .eq('property_id', property.id)

    const { data: branding } = await supabase
        .from('property_branding')
        .select('*')
        .eq('property_id', property.id)
        .single()

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
