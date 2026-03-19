'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncWizardDataToRAG, syncManualToRAG } from './rag-sync'
import { sanitizeUUID } from '@/lib/utils'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

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
    full_address: string | null
    beds: number
    baths: number
    guests: number
    status: 'draft' | 'active' | 'archived'
    description?: string | null  // eliminado en migration 033; opcional para compatibilidad
    main_image_url: string | null
    theme_config: any
    latitude: number | null
    longitude: number | null
    city: string | null
    country: string | null
    country_code: string | null
    postal_code: string | null
    neighborhood: string | null
    timezone: string | null
    has_parking: boolean
    parking_number: string
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

    const tenant_id = await getTenantId(supabase, user)

    // 1. Propiedades base
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error.message)
        return []
    }

    const properties = data as Property[]
    if (properties.length === 0) return []

    const propertyIds = properties.map(p => p.id)

    // 2. Queries paralelas para calcular completedSteps por propiedad
    const [
        { data: contextRows },
        { data: faqRows },
        { data: recRows },
        { data: brandingRows },
    ] = await Promise.all([
        // Categorías del wizard guardadas en property_context
        supabase
            .from('property_context')
            .select('property_id, category')
            .in('property_id', propertyIds),

        // FAQs
        supabase
            .from('property_faqs')
            .select('property_id')
            .in('property_id', propertyIds),

        // Recomendaciones locales
        supabase
            .from('property_recommendations')
            .select('property_id')
            .in('property_id', propertyIds),

        // Branding / apariencia
        supabase
            .from('property_branding')
            .select('property_id')
            .in('property_id', propertyIds),
    ])

    // Steps totales del wizard (los mismos que filteredSteps en WizardContext)
    const TOTAL_STEPS = [
        'property', 'appearance', 'access', 'welcome', 'contacts',
        'checkin', 'rules', 'tech', 'visual-scanner', 'appliance-manuals',
        'inventory', 'dining', 'faqs'
    ]

    // 3. Calcular guide_completion por propiedad
    return properties.map(property => {
        const completed = new Set<string>()

        // 'property' — siempre completado si la propiedad existe
        completed.add('property')

        // inventory / visual-scanner
        if (
            (property as any).inventory_status === 'completed' ||
            (property as any).inventory_status === 'generating'
        ) {
            completed.add('inventory')
            completed.add('visual-scanner')
        }

        // Categorías de property_context
        contextRows
            ?.filter(r => r.property_id === property.id)
            .forEach(r => completed.add(r.category))

        // faqs
        if (faqRows?.some(r => r.property_id === property.id)) {
            completed.add('faqs')
        }

        // dining / recomendaciones
        if (recRows?.some(r => r.property_id === property.id)) {
            completed.add('dining')
        }

        // appearance / branding
        if (brandingRows?.some(r => r.property_id === property.id)) {
            completed.add('appearance')
        }

        const guide_completion = Math.round(
            (completed.size / TOTAL_STEPS.length) * 100
        )

        return { ...property, guide_completion }
    })
}

export async function getProperty(id: string) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(id)
    if (!currentPropId) return null

    // We allow public read for guides if viewing by ID or slug, 
    // but the management actions still check for user.
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', currentPropId)
        .single()

    if (error) {
        console.error('Error fetching property:', error.message)
        return null
    }

    return data as Property
}

export async function getPropertyBySlug(slug: string) {
    const supabase = await createClient()

    // 1. Try by slug
    const { data: bySlug } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    if (bySlug) return bySlug as Property

    // 2. Fallback to ID (for backwards compatibility or when slug isn't yet set)
    const currentPropId = sanitizeUUID(slug)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentPropId || '');
    if (!currentPropId || !isUUID) return null

    const { data: byId, error: idError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', currentPropId)
        .maybeSingle()

    if (idError) {
        console.error('Error fetching property by id fallback:', idError.message)
        return null
    }

    return byId as Property
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

    // Auto-generate slug if missing
    if (!formData.slug && formData.name) {
        formData.slug = generateSlug(formData.name)
    }

    // Check for slug uniqueness if provided
    if (formData.slug) {
        const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .eq('slug', formData.slug)
            .maybeSingle()

        if (existing) {
            throw new Error('SLUG_ALREADY_EXISTS')
        }
    }

    // description fue eliminado en migration 033; excluir del insert
    const { description: _d, ...payload } = formData as Partial<Property> & { description?: string }
    const { data, error } = await supabase
        .from('properties')
        .insert({
            ...payload,
            tenant_id: tenant_id
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            throw new Error('SLUG_ALREADY_EXISTS')
        }
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

    // Auto-generate slug if it's missing (e.g., manually cleared or first-time sync)
    if (!formData.slug && formData.name) {
        formData.slug = generateSlug(formData.name)
    }

    // Check for slug uniqueness if provided
    if (formData.slug) {
        const { data: existing } = await supabase
            .from('properties')
            .select('id')
            .eq('slug', formData.slug)
            .neq('id', id)
            .maybeSingle()

        if (existing) {
            throw new Error('SLUG_ALREADY_EXISTS')
        }
    }

    const currentPropId = sanitizeUUID(id)
    if (!currentPropId) throw new Error('ID de propiedad inválido')

    // description fue eliminado en migration 033; excluir del update
    const { description: _d, ...payload } = formData as Partial<Property> & { description?: string }

    const { data, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', currentPropId)
        .select()
        .maybeSingle()

    if (error) {
        if (error.code === '23505') {
            throw new Error('SLUG_ALREADY_EXISTS')
        }
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

export async function updatePropertyStatus(id: string, newStatus: 'draft' | 'active' | 'archived') {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const currentPropId = sanitizeUUID(id)
    if (!currentPropId) throw new Error('ID de propiedad inválido')

    const { data, error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', currentPropId)
        .select()
        .single()

    if (error) {
        console.error('Error updating property status:', error.message)
        throw new Error('No se pudo actualizar el estado de la propiedad.')
    }

    revalidatePath('/dashboard/properties')
    revalidatePath(`/dashboard/properties/${currentPropId}`)
    return data as Property
}

export async function deleteProperty(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const currentPropId = sanitizeUUID(id)
    if (!currentPropId) throw new Error('ID de propiedad inválido')

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', currentPropId)

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

export async function getBrandingUploadUrl(fileName: string, contentType: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('Usuario sin tenant asignado')

    const path = `${tenant_id}/${Date.now()}_${fileName}`

    const { data, error } = await supabase.storage
        .from('branding')
        .createSignedUploadUrl(path)

    if (error) throw error

    return {
        uploadUrl: data.signedUrl,
        publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding/${path}`,
        path: path
    }
}


export async function getPropertyManuals(propertyId: string) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return []

    const { data, error } = await supabase
        .from('property_manuals')
        .select('*')
        .eq('property_id', currentPropId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching manuals:', error.message)
        return []
    }

    return data
}

export async function deleteManual(manualId: string, propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('propertyId es requerido')

    // 1. Delete manual
    const { error } = await supabase
        .from('property_manuals')
        .delete()
        .eq('id', manualId)

    if (error) throw new Error(error.message)

    // 2. Delete embeddings from context table
    await supabase.from('context_embeddings').delete().eq('source_id', manualId)

    // 3. Sync appliance list in property_context
    if (tenant_id) {
        await syncPropertyApplianceList(currentPropId, tenant_id)
    }

    revalidatePath(`/dashboard/properties/${currentPropId}`)
}

export async function updateManualContent(manualId: string, propertyId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('propertyId es requerido')

    const { error } = await supabase
        .from('property_manuals')
        .update({ manual_content: content, updated_at: new Date().toISOString() })
        .eq('id', manualId)

    if (error) throw new Error(error.message)

    const tenant_id = await getTenantId(supabase, user)
    if (tenant_id) {
        await syncPropertyApplianceList(currentPropId, tenant_id)
    }

    // Trigger RAG update
    const { data: manual } = await supabase
        .from('property_manuals')
        .select('appliance_name, brand, model')
        .eq('id', manualId)
        .single()

    if (manual) {
        await syncManualToRAG(
            currentPropId,
            tenant_id,
            manualId,
            content,
            manual.appliance_name,
            manual.brand,
            manual.model
        )
    }

    revalidatePath(`/dashboard/properties/${currentPropId}`)
}

export async function saveManual(manualId: string, propertyId: string, updates: { manual_content?: string, notes?: string, is_revised?: boolean }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('propertyId es requerido')

    // Fetch existing details for sync and metadata
    const { data: existing } = await supabase
        .from('property_manuals')
        .select('metadata, appliance_name, brand, model, manual_content')
        .eq('id', manualId)
        .single()

    const newMetadata = {
        ...(existing?.metadata || {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.is_revised !== undefined ? { is_revised: updates.is_revised } : {}),
        status: updates.is_revised ? 'reviewed' : (updates.manual_content ? 'edited' : (existing?.metadata?.status || 'pending'))
    }

    const updateFields: any = {
        metadata: newMetadata,
        updated_at: new Date().toISOString()
    }

    if (updates.manual_content !== undefined) {
        updateFields.manual_content = updates.manual_content
    }
    const { error } = await supabase
        .from('property_manuals')
        .update(updateFields)
        .eq('id', manualId)

    if (error) throw new Error(error.message)

    const tenant_id = await getTenantId(supabase, user)

    // Re-index for RAG if content changed, if notes changed, or if it's the first time approval
    if (updates.manual_content !== undefined || updates.notes !== undefined || updates.is_revised) {
        const contentToSync = updates.manual_content ?? existing?.manual_content ?? ''
        if (contentToSync) {
            await syncManualToRAG(
                currentPropId,
                tenant_id,
                manualId,
                contentToSync,
                existing?.appliance_name || 'Aparato',
                existing?.brand || 'Genérico',
                existing?.model
            )
        }
    }

    if (tenant_id) {
        await syncPropertyApplianceList(currentPropId, tenant_id)
    }

    revalidatePath(`/dashboard/properties/${currentPropId}`)
}

// Guide Sections Actions
export async function getGuideSections(propertyId: string) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return []

    const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .eq('property_id', currentPropId)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error fetching sections:', error.message)
        return []
    }

    return data as GuideSection[]
}

export async function getPropertyRecommendations(propertyId: string) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return []

    const { data, error } = await supabase
        .from('property_recommendations')
        .select('*')
        .eq('property_id', currentPropId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching recommendations:', error.message)
        return []
    }

    return data
}

export async function getPropertyFaqs(propertyId: string) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return []

    const { data, error } = await supabase
        .from('property_faqs')
        .select('*')
        .eq('property_id', currentPropId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching FAQs:', error.message)
        return []
    }

    return data
}

export async function saveGuideSection(propertyId: string, section: Partial<GuideSection>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = await getTenantId(supabase, user)
    if (!tenant_id) throw new Error('Usuario sin tenant')

    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenant_id)
    if (!currentPropId || !currentTenantId) throw new Error('IDs requeridos')

    const { data, error } = await supabase
        .from('guide_sections')
        .upsert({
            ...section,
            property_id: currentPropId,
            tenant_id: currentTenantId
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

    const currentSectionId = sanitizeUUID(sectionId)
    const currentPropId = sanitizeUUID(propertyId)
    if (!currentSectionId || !currentPropId) throw new Error('IDs requeridos')

    const { error } = await supabase
        .from('guide_sections')
        .delete()
        .eq('id', currentSectionId)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
}

export async function updateSectionsOrder(propertyId: string, sectionIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')
    const tenant_id = await getTenantId(supabase, user)
    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenant_id)
    if (!currentPropId || !currentTenantId) throw new Error('IDs requeridos')

    const updates = sectionIds.map((id, index) => ({
        id: sanitizeUUID(id) || id, // Fallback safe
        order_index: index,
        tenant_id: currentTenantId
    }))

    const { error } = await supabase
        .from('guide_sections')
        .upsert(updates)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${currentPropId}`)
}


/**
 * Regenera el índice de aparatos en property_context (appliance_list)
 */
export async function syncPropertyApplianceList(propertyId: string, tenantId: string, customClient?: any, skipRevalidate: boolean = false) {
    const supabase = customClient || await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenantId)

    if (!currentPropId || !currentTenantId) {
        console.error('[SYNC-LIST] ID inválido:', { propertyId, tenantId })
        return
    }

    const { data: allManuals } = await supabase
        .from('property_manuals')
        .select('appliance_name, brand, model')
        .eq('property_id', currentPropId)

    if (!allManuals) return

    const applianceIndex = allManuals.map((m: { appliance_name: string; brand: string; model?: string }) => `- ${m.appliance_name.toUpperCase()}: ${m.brand} ${m.model || ''}`).join('\n')

    const { error } = await supabase.from('property_context').upsert({
        property_id: currentPropId,
        tenant_id: currentTenantId,
        category: 'inventory_manuals', // FIX: no sobreescribir selección del wizard
        content: {
            text: `Lista de aparatos con manual disponible:\n${applianceIndex}`,
            items: allManuals
        }
    }, { onConflict: 'property_id,category' })

    if (error) throw new Error(error.message)

    // Sincronizar RAG
    await syncWizardDataToRAG(currentPropId, currentTenantId, 'inventory', { text: applianceIndex }, supabase)

    if (!skipRevalidate) {
        revalidatePath(`/dashboard/properties/${propertyId}`)
    }
}

/**
 * Actualiza el estado del inventario para feedback visual
 */
export async function updateInventoryStatus(propertyId: string, status: 'idle' | 'generating' | 'completed' | 'failed') {
    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return { success: false, error: 'ID inválido' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('properties')
        .update({ inventory_status: status })
        .eq('id', currentPropId)

    if (error) console.error('[STATUS] Error updating inventory status:', error.message)
    revalidatePath(`/dashboard/properties/${propertyId}`)
    return { success: !error }
}
