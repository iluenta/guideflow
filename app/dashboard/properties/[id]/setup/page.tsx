import { PropertySetupWizard } from '@/components/dashboard/PropertySetupWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PropertySetupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', id)
        .single()

    if (!property) redirect('/dashboard/properties')

    return (
        <div className="container py-10">
            <PropertySetupWizard propertyId={id} />
        </div>
    )
}
