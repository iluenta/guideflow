import { PropertySetupWizard } from '@/components/dashboard/PropertySetupWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function NewPropertyPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

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
