'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getTenantId(supabase: any, user: any) {
    // 1. Try metadata first (fastest)
    const metadataId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (metadataId) return metadataId

    // 2. Fallback to profiles table
    const { data, error } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (error || !data) {
        console.error('Error fetching tenant_id from profile:', error)
        return null
    }

    return data.tenant_id
}

export type Property = {
    id: string
    tenant_id: string
    name: string
    location: string
    beds: number
    baths: number
    guests: number
    description: string | null
    main_image_url: string | null
    created_at: string
    updated_at: string
}

export async function getProperties() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error.message)
        return []
    }

    return data as Property[]
}

export async function getProperty(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching property:', error.message)
        return null
    }

    return data as Property
}

export async function createProperty(formData: Partial<Property>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Get tenant_id with robust fallback
    const tenant_id = await getTenantId(supabase, user)

    if (!tenant_id) {
        throw new Error('Usuario sin tenant asignado')
    }

    const { data, error } = await supabase
        .from('properties')
        .insert({
            ...formData,
            tenant_id: tenant_id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating property:', error.message)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/properties')
    return data as Property
}

export async function updateProperty(id: string, formData: Partial<Property>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data, error } = await supabase
        .from('properties')
        .update(formData)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating property:', error.message)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/properties')
    revalidatePath(`/dashboard/properties/${id}`)
    return data as Property
}

export async function deleteProperty(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting property:', error.message)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/properties')
}

// Storage helpers
export async function getUploadUrl(fileName: string, contentType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('Usuario sin tenant asignado')

    const path = `${tenant_id}/${Date.now()}_${fileName}`

    const { data, error } = await supabase.storage
        .from('property-images')
        .createSignedUploadUrl(path)

    if (error) throw error

    return {
        uploadUrl: data.signedUrl,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${path}`,
        path: path
    }
}
