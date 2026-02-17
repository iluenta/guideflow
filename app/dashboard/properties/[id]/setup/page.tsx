import { PropertySetupHub } from '@/components/dashboard/PropertySetupHub'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export default async function PropertySetupPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    const { data: property } = await supabase
        .from('properties')
        .select('name, tenant_id')
        .eq('id', id)
        .single()

    if (!property) redirect('/dashboard/properties')

    return (
        <div className="min-h-screen bg-[#FDFCF9]">
            <div className="container max-w-7xl py-8">
                <Suspense fallback={<div className="w-full h-96 bg-white animate-pulse rounded-[32px] shadow-sm" />}>
                    <PropertySetupHub propertyId={id} tenantId={property?.tenant_id} />
                </Suspense>
            </div>
        </div>
    )
}
