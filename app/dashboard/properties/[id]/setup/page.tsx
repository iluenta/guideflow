import { PropertySetupWizard } from '@/components/dashboard/PropertySetupWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'

export default async function PropertySetupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const profile = await requireProfile(supabase).catch(() => null)
    if (!profile || !can(profile.tenant_role as TenantRole, 'properties', 'view')) {
        redirect('/dashboard/properties')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('name, tenant_id')
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!property) redirect('/dashboard/properties')

    return (
        <div className="min-h-screen bg-slate-50/50">
            <div className="container max-w-7xl py-4">
                <Suspense fallback={<div className="w-full h-96 bg-white animate-pulse rounded-3xl shadow-sm" />}>
                    <PropertySetupWizard propertyId={id} tenantId={property?.tenant_id} />
                </Suspense>
            </div>
        </div>
    )
}
