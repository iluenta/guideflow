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
    slug: string | null
    location: string
    beds: number
    baths: number
    guests: number
    description: string | null
    main_image_url: string | null
    theme_config: any
    created_at: string
    updated_at: string
}

export type GuideSection = {
    id: string
    property_id: string
    tenant_id: string
    order_index: number
    title: string
    content_type: 'text' | 'image' | 'video' | 'map' | 'ai_chat' | 'recommendation'
    data: any
    created_at: string
    updated_at: string
}

export async function getProperties() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Even if we have a public SELECT policy, we explicitly filter by tenant
    // in the dashboard to avoid showing everyone's properties.
    const tenant_id = await getTenantId(supabase, user)

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error.message)
        return []
    }

    return data as Property[]
}

export async function getProperty(id: string) {
    const supabase = await createClient()

    // We allow public read for guides if viewing by ID or slug, 
    // but the management actions still check for user.
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

export async function getPropertyBySlug(slug: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    if (error) {
        console.error('Error fetching property by slug:', error.message)
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

    // In Next.js Server Actions, even with RLS, we should be explicit
    const { data, error } = await supabase
        .from('properties')
        .update(formData)
        .eq('id', id)
        .select()
        .maybeSingle()

    if (error) {
        console.error('Error updating property:', error.message)
        throw new Error(error.message)
    }

    if (!data) {
        console.error('Update failed: No row matched or RLS blocked it.', { id })
        throw new Error('No se pudo actualizar la propiedad. Verifica tus permisos.')
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

export async function getScanUploadUrl(propertyId: string, fileName: string, contentType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Use a shared timestamp for a batch upload if possible, or just individual
    const timestamp = Date.now()
    const path = `${propertyId}/${timestamp}/${fileName}`

    const { data, error } = await supabase.storage
        .from('property_scans')
        .createSignedUploadUrl(path)

    if (error) throw error

    return {
        uploadUrl: data.signedUrl,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property_scans/${path}`,
        path: path
    }
}

// Guide Sections Actions
export async function getGuideSections(propertyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('property_id', propertyId)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error fetching sections:', error.message)
        return []
    }

    return data as GuideSection[]
}

export async function saveGuideSection(propertyId: string, section: Partial<GuideSection>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('Usuario sin tenant')

    const { data, error } = await supabase
        .from('guide_sections')
        .upsert({
            ...section,
            property_id: propertyId,
            tenant_id: tenant_id
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return data as GuideSection
}

export async function deleteGuideSection(sectionId: string, propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { error } = await supabase
        .from('guide_sections')
        .delete()
        .eq('id', sectionId)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
}

export async function updateSectionsOrder(propertyId: string, sectionIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('Usuario sin tenant')

    const updates = sectionIds.map((id, index) => ({
        id,
        order_index: index,
        tenant_id: tenant_id
    }))

    const { error } = await supabase
        .from('guide_sections')
        .upsert(updates)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
}

export async function getPropertyManuals(propertyId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('property_manuals')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching manuals:', error.message)
        return []
    }

    return data
}
