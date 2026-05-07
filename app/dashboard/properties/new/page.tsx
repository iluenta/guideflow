import { PropertySetupWizard } from '@/components/dashboard/PropertySetupWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'

export default async function NewPropertyPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const profile = await requireProfile(supabase).catch(() => null)
    if (!profile || !can(profile.tenant_role as TenantRole, 'properties', 'create')) {
        redirect('/dashboard/properties')
    }

    return (
        <div className="min-h-screen bg-beige">
            <div className="container py-3">
                <Suspense fallback={<div className="w-full h-96 bg-slate-50 animate-pulse rounded-3xl" />}>
                    <PropertySetupWizard tenantId={profile?.tenant_id} />
                </Suspense>
            </div>
        </div>
    )
}
