import { getPropertyBySlug, getGuideSections, getPropertyManuals } from '@/app/actions/properties'
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
    const primaryColor = property.theme_config?.primary_color || '#1E3A5F'

    return (
        <div
            className="min-h-screen bg-beige font-sans selection:bg-navy/10"
            style={{ '--primary': primaryColor, '--primary-foreground': '#F5F0E8' } as React.CSSProperties}
        >
            <GuideViewContainer
                property={property}
                sections={sections}
                manuals={manuals}
            />
        </div>
    )
}
