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

export async function getTenantId(supabase: any, user: any) {
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

/**
 * SANITIZATION HELPERS: Prevent internal data exposure (tenant_id, etc) to public guests.
 */
function sanitizeProperty(property: any): Partial<Property> {
    if (!property) return property;
    const { tenant_id: _t, created_at: _c, updated_at: _u, ...safe } = property;
    return safe;
}

function sanitizeGuideSection(section: any): Partial<GuideSection> {
    if (!section) return section;
    const { tenant_id: _t, ...safe } = section;
    return safe;
}

function sanitizeRecommendation(rec: any) {
    if (!rec) return rec;
    const { tenant_id: _t, ...safe } = rec;
    return safe;
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
    floor: string | null
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
    has_access_code: boolean
    access_code: string
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

    // ✅ Una sola query — el cálculo ocurre en Postgres, no en JS
    const { data, error } = await supabase
        .from('properties_with_completion')
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

    // AUTO-RECOVERY: If stuck in generating/identifying for > 2 mins, reset to completed
    if (data.inventory_status === 'generating' || data.inventory_status === 'identifying') {
        const lastUpdate = new Date(data.updated_at).getTime()
        const now = Date.now()
        const threshold = 2 * 60 * 1000 // 2 minutes

        if (now - lastUpdate > threshold) {
            console.warn(`[AUTO-RECOVERY] Property ${currentPropId} stuck in ${data.inventory_status}. Resetting.`)
            await supabase.from('properties').update({ inventory_status: 'completed' }).eq('id', currentPropId)
            data.inventory_status = 'completed'
        }
    }

    // SANITIZATION: Check if request is authenticated as host
    const { data: { user } } = await supabase.auth.getUser()
    const isHost = !!user && (user.app_metadata?.tenant_id === data.tenant_id || user.user_metadata?.tenant_id === data.tenant_id)

    return isHost ? data : sanitizeProperty(data)
}

export async function getPropertyBySlug(slug: string) {
    const supabase = await createClient()

    let property = null;

    // 1. Try by slug
    const { data: bySlug } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    property = bySlug;

    // 2. Fallback to ID
    if (!property) {
        const currentPropId = sanitizeUUID(slug)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentPropId || '');
        if (currentPropId && isUUID) {
            const { data: byId } = await supabase
                .from('properties')
                .select('*')
                .eq('id', currentPropId)
                .maybeSingle()
            property = byId;
        }
    }

    if (!property) return null;

    // SANITIZATION: Check if request is authenticated as host
    const { data: { user } } = await supabase.auth.getUser()
    let isHost = false;
    if (user) {
        const tenant_id = await getTenantId(supabase, user);
        if (tenant_id === property.tenant_id) {
            isHost = true;
        }
    }

    return isHost ? property : sanitizeProperty(property);
}

export async function createProperty(formData: Partial<Property>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Get tenant_id with robust fallback
    const tenant_id = await getTenantId(supabase, user)

    // Validate required fields
    if (!formData.name?.trim()) {
        throw new Error('El nombre del alojamiento es obligatorio')
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
        throw new Error('Error al crear la propiedad')
    }

    revalidatePath('/dashboard/properties')
    return data as Property
}

export async function updateProperty(id: string, formData: Partial<Property>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Validate required fields
    if (!formData.name?.trim()) {
        throw new Error('El nombre del alojamiento es obligatorio')
    }

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
        throw new Error('Error al actualizar la propiedad')
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
        throw new Error('Error al eliminar la propiedad')
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

    if (error) {
        console.error('[MANUAL] Error deleting:', error.message)
        throw new Error('Error al eliminar el manual')
    }

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

    if (error) {
        console.error('[MANUAL] Error updating content:', error.message)
        throw new Error('Error al actualizar el manual')
    }

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

    if (error) {
        console.error('[MANUAL] Error saving:', error.message)
        throw new Error('Error al guardar el manual')
    }

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

    return (data || []).map(sanitizeGuideSection)
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

    return (data || []).map(sanitizeRecommendation)
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

    return (data || []).map(rec => {
        const { tenant_id: _t, ...safe } = rec;
        return safe;
    })
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

    if (error) {
        console.error('[SECTION] Error saving:', error.message)
        throw new Error('Error al guardar la sección')
    }

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

    if (error) {
        console.error('[SECTION] Error deleting:', error.message)
        throw new Error('Error al eliminar la sección')
    }

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

    if (error) {
        console.error('[SECTION] Error updating order:', error.message)
        throw new Error('Error al actualizar el orden de secciones')
    }

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

    if (error) {
        console.error('[SYNC-LIST] Error upserting context:', error.message)
        throw new Error('Error al sincronizar lista de aparatos')
    }

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

/**
 * Silently verifies if the generation process is stuck and fixes it if so.
 * Used by WizardContext polling for transparent state recovery.
 */
export async function verifyAndFixInventoryStatus(propertyId: string) {
    const supabase = await createClient()
    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) return { success: false }

    const { data: prop, error } = await supabase
        .from('properties')
        .select('inventory_status, updated_at')
        .eq('id', currentPropId)
        .single()

    if (error || !prop) return { success: false }

    if (prop.inventory_status === 'generating' || prop.inventory_status === 'identifying') {
        const lastUpdate = new Date(prop.updated_at).getTime()
        const now = Date.now()
        const silenceSecs = (now - lastUpdate) / 1000

        // Check if there are already manuals in DB
        const { count: manualCount } = await supabase
            .from('property_manuals')
            .select('id', { count: 'exact', head: true })
            .eq('property_id', currentPropId)

        const hasManuals = (manualCount ?? 0) > 0

        // If there are manuals and no DB activity for 5+ min → Phase 2 finished (or failed silently)
        // If no manuals yet, wait up to 15 min before giving up
        const threshold = hasManuals ? 5 * 60 * 1000 : 15 * 60 * 1000

        if (now - lastUpdate > threshold) {
            console.warn(`[SILENT-RECOVERY] Property ${currentPropId} seems stuck (${Math.round(silenceSecs)}s silence, ${manualCount} manuals). Fixing.`)
            await supabase.from('properties').update({ inventory_status: 'completed' }).eq('id', currentPropId)
            revalidatePath(`/dashboard/properties/${propertyId}`)
            return { success: true, fixed: true, status: 'completed' }
        }
    }

    return { success: true, fixed: false, status: prop.inventory_status }
}
