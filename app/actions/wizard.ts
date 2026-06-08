'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { syncWizardDataToRAG } from './rag-sync'
import { sanitizeUUID } from '@/lib/utils'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'

export async function saveWizardStep(
    category: string,
    stepData: any,
    propertyId?: string,
    _tenantId?: string // Deprecated, using profile tenant_id
) {
    const supabase = await createClient()
    const { tenant_id, tenant_role } = await requireProfile(supabase)

    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para esta acción')
    }

    // Sanitizar IDs
    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = tenant_id

    if (category === 'property') {
        const propValues = {
            name: stepData.name,
            slug: stepData.slug,
            guests: stepData.guests,
            beds: stepData.beds,
            baths: stepData.baths,
            floor: stepData.floor || null,
            has_parking: stepData.has_parking,
            parking_number: stepData.parking_number,
            has_access_code: stepData.has_access_code,
            access_code: stepData.access_code,
            main_image_url: stepData.main_image_url,
            theme_config: { primary_color: stepData.primary_color },
            latitude: stepData.latitude,
            longitude: stepData.longitude,
            city: stepData.city,
            country: stepData.country,
            postal_code: stepData.postal_code
        }

        if (currentPropId) {
            const { data, error } = await supabase
                .from('properties')
                .update(propValues)
                .eq('id', currentPropId)
                .eq('tenant_id', currentTenantId)
                .select()
                .single()
            if (error) throw error
            // Sincronizar RAG
            await syncWizardDataToRAG(currentPropId, currentTenantId, 'property', stepData)
            return { success: true, property: data }
        } else {
            const { data, error } = await supabase
                .from('properties')
                .insert({ ...propValues, tenant_id: currentTenantId })
                .select()
                .single()
            if (error) throw error
            // Sincronizar RAG
            await syncWizardDataToRAG(data.id, currentTenantId, 'property', stepData)

            // Insertar branding por defecto
            await supabase.from('property_branding').insert({
                property_id: data.id,
                tenant_id: currentTenantId,
                theme_id: 'modern',
                layout_theme_id: 'modern',
                computed_theme: { _layout_theme_id: 'modern' },
                updated_at: new Date().toISOString()
            })

            revalidatePath('/dashboard/properties')
            return { success: true, property: data, isNew: true }
        }
    } else if (category === 'faqs') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para FAQs')

        // 1. Limpiar registros anteriores
        await supabase.from('property_faqs')
            .delete()
            .eq('property_id', currentPropId)
            .eq('tenant_id', currentTenantId)

        // 2. Insertar los nuevos
        if (stepData && stepData.length > 0) {
            const { error } = await supabase.from('property_faqs').insert(
                stepData.map((faq: any) => ({
                    property_id: currentPropId,
                    tenant_id: currentTenantId,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    priority: faq.priority || 0
                }))
            )
            if (error) throw error
        }

        // 3. Sincronizar RAG
        await syncWizardDataToRAG(currentPropId, currentTenantId, 'faqs', stepData)
        return { success: true }

    } else if (category === 'dining') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para Recomendaciones')

        // 1. Limpiar anteriores
        await supabase.from('property_recommendations')
            .delete()
            .eq('property_id', currentPropId)
            .eq('tenant_id', currentTenantId)

        // 2. Insertar nuevos (deduplicados por google_place_id → name)
        const seenKeys = new Set<string>();
        const uniqueRecs = (stepData || []).filter((rec: any) => {
            const key = (rec.google_place_id as string | undefined)?.trim()
                     || (rec.name as string | undefined)?.toLowerCase().trim()
                     || null;
            if (!key || seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });

        if (uniqueRecs.length > 0) {
            const { error } = await supabase.from('property_recommendations').insert(
                uniqueRecs.map((rec: any) => {
                    const metadata = rec.metadata || {};
                    return {
                        property_id: currentPropId,
                        tenant_id: currentTenantId,
                        type: rec.category || rec.type || 'restaurant',
                        name: rec.name,
                        description: rec.description || rec.specialty || '',
                        distance: rec.distance || '',
                        time: rec.time || '',
                        price_range: rec.price_range || '',
                        personal_note: rec.personal_note || '',
                        address: rec.address || '',
                        google_place_id: rec.google_place_id || null,
                        map_url: rec.map_url || null,
                        rating: rec.rating || null,
                        metadata: {
                            ...metadata,
                            time: rec.time || metadata.time,
                            price_level: rec.price_level || metadata.price_level,
                            price_range: rec.price_range || metadata.price_range,
                            personal_note: rec.personal_note || metadata.personal_note,
                            address: rec.address || metadata.address || '',
                            photo_url: metadata.photo_url || rec.photo_url || null,
                            rating_count: metadata.rating_count || rec.rating_count || null,
                            editorial_summary: metadata.editorial_summary || rec.editorial_summary || null,
                            best_time_slots: metadata.best_time_slots || rec.best_time_slots || [],
                            atmosphere: rec.atmosphere || metadata.atmosphere,
                            tags: rec.tags || metadata.tags || [],
                            availability: rec.availability || metadata.availability || { days: ["todos"], notes: "" },
                            opening_hours: metadata.opening_hours || rec.opening_hours || null,
                            google_place_id: rec.google_place_id || null
                        }
                    };
                })
            )
            if (error) throw error
        }

        // 3. Sincronizar RAG
        await syncWizardDataToRAG(currentPropId, currentTenantId, 'dining', stepData)
        return { success: true }

    } else if (category === 'branding' || category === 'appearance') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para Branding')

        const brandingData = stepData || {}
        const sanitizedThemeId = brandingData.theme_id && brandingData.theme_id.trim() !== '' ? brandingData.theme_id : null
        const sanitizedLayoutThemeId = brandingData.layout_theme_id && brandingData.layout_theme_id.trim() !== '' ? brandingData.layout_theme_id : 'modern'

        const computedThemeWithId = brandingData.computed_theme
            ? { ...brandingData.computed_theme, _layout_theme_id: sanitizedLayoutThemeId }
            : { _layout_theme_id: sanitizedLayoutThemeId }

        const { error } = await supabase
            .from('property_branding')
            .upsert({
                property_id: currentPropId,
                tenant_id: currentTenantId,
                theme_id: sanitizedThemeId,
                layout_theme_id: sanitizedLayoutThemeId,
                custom_primary_color: brandingData.custom_primary_color || null,
                custom_logo_url: brandingData.custom_logo_url || null,
                computed_theme: computedThemeWithId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'property_id' })

        if (error) throw error

        const { data: prop } = await supabase
            .from('properties')
            .select('slug')
            .eq('id', currentPropId)
            .eq('tenant_id', currentTenantId)
            .maybeSingle()
        if (prop?.slug) {
            revalidatePath(`/${prop.slug}`)
        }

        return { success: true }

    } else {
        if (!currentPropId) throw new Error(`ID de propiedad requerido para ${category}`)

        if (stepData === null || stepData === undefined) {
            console.warn(`[WIZARD-SAVE] Skipping save for category ${category}: No data provided.`);
            return { success: true };
        }

        const { error } = await supabase
            .from('property_context')
            .upsert({
                property_id: currentPropId,
                tenant_id: currentTenantId,
                category: category,
                content: stepData
            }, { onConflict: 'property_id,category' })

        if (error) throw error

        await syncWizardDataToRAG(currentPropId, currentTenantId, category, stepData)

        if (category === 'access') {
            const { data: updatedProp, error: propError } = await supabase.from('properties').update({
                full_address: stepData.full_address,
                latitude: stepData.latitude,
                longitude: stepData.longitude,
                city: stepData.city,
                country: stepData.country,
                country_code: stepData.country_code,
                postal_code: stepData.postal_code,
                neighborhood: stepData.neighborhood,
                timezone: stepData.timezone,
                geocoding_confidence: stepData.geocoding_confidence,
                geocoding_source: stepData.geocoding_source,
                geocoding_accuracy: stepData.geocoding_accuracy,
                geocoding_validated_at: new Date().toISOString()
            }).eq('id', currentPropId)
                .eq('tenant_id', currentTenantId)
                .select()
                .single()

            if (propError) throw propError

            revalidatePath('/', 'layout')
            return { success: true, property: updatedProp }
        }

        revalidatePath('/', 'layout')
        return { success: true }
    }
}
