'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/geocoding'
import { syncWizardDataToRAG } from './rag-sync'
import { sanitizeUUID } from '@/lib/utils'

export async function saveWizardStep(
    category: string,
    stepData: any,
    propertyId?: string,
    tenantId?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Sanitizar IDs para evitar errores 22P02 (UUID inválido por usar string vacía o valor semántico como "new")
    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenantId)

    if (category === 'property') {
        const propValues = {
            name: stepData.name,
            slug: stepData.slug,
            guests: stepData.guests,
            beds: stepData.beds,
            baths: stepData.baths,
            description: stepData.description,
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
                .select()
                .single()
            if (error) throw error
            // Sincronizar RAG
            await syncWizardDataToRAG(currentPropId, currentTenantId, 'property', stepData)
            return { success: true, property: data }
        } else {
            if (!currentTenantId) throw new Error('tenant_id es requerido para crear una propiedad')
            const { data, error } = await supabase
                .from('properties')
                .insert({ ...propValues, tenant_id: currentTenantId })
                .select()
                .single()
            if (error) throw error
            // Sincronizar RAG
            await syncWizardDataToRAG(data.id, currentTenantId, 'property', stepData)

            // Insertar branding por defecto (Modern Minimal)
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
        await supabase.from('property_faqs').delete().eq('property_id', currentPropId)

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
        await supabase.from('property_recommendations').delete().eq('property_id', currentPropId)

        // 2. Insertar nuevos
        if (stepData && stepData.length > 0) {
            const { error } = await supabase.from('property_recommendations').insert(
                stepData.map((rec: any) => ({
                    property_id: currentPropId,
                    tenant_id: currentTenantId,
                    type: rec.category || rec.type || 'restaurant',
                    name: rec.name,
                    description: rec.description || rec.specialty || '',
                    distance: rec.distance || '',
                    time: rec.time || '',
                    price_range: rec.price_range || '',
                    personal_note: rec.personal_note || '',
                    google_place_id: rec.google_place_id || null,
                    map_url: rec.map_url || null,
                    metadata: {
                        time: rec.time,
                        price_range: rec.price_range,
                        personal_note: rec.personal_note,
                        google_place_id: rec.google_place_id || null
                    }
                }))
            )
            if (error) throw error
        }

        // 3. Sincronizar RAG
        await syncWizardDataToRAG(currentPropId, currentTenantId, 'dining', stepData)
        return { success: true }

    } else if (category === 'branding' || category === 'appearance') {
        // FIX: 'appearance' es el nombre del tab en el wizard, 'branding' es el nombre interno.
        // Ambos deben guardar en property_branding, no en property_context.
        if (!currentPropId) throw new Error('ID de propiedad requerido para Branding')

        const sanitizedThemeId = stepData.theme_id && stepData.theme_id.trim() !== '' ? stepData.theme_id : null
        const sanitizedLayoutThemeId = stepData.layout_theme_id && stepData.layout_theme_id.trim() !== '' ? stepData.layout_theme_id : 'modern'

        // NOTE: layout_theme_id is stored inside computed_theme JSONB until
        // migration 031_add_layout_theme_id.sql is applied to the DB.
        // Once the column exists, add layout_theme_id back to the upsert below.
        const computedThemeWithId = stepData.computed_theme
            ? { ...stepData.computed_theme, _layout_theme_id: sanitizedLayoutThemeId }
            : { _layout_theme_id: sanitizedLayoutThemeId }

        const { error } = await supabase
            .from('property_branding')
            .upsert({
                property_id: currentPropId,
                tenant_id: currentTenantId,
                theme_id: sanitizedThemeId,
                layout_theme_id: sanitizedLayoutThemeId, // migration 031 confirmed applied
                custom_primary_color: stepData.custom_primary_color,
                custom_logo_url: stepData.custom_logo_url,
                computed_theme: computedThemeWithId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'property_id' })

        if (error) throw error
        return { success: true }

    } else {
        if (!currentPropId) throw new Error(`ID de propiedad requerido para ${category}`)

        const { error } = await supabase
            .from('property_context')
            .upsert({
                property_id: currentPropId,
                tenant_id: currentTenantId,
                category: category,
                content: stepData
            }, { onConflict: 'property_id,category' })

        if (error) throw error

        // Sincronizar RAG para contexto
        await syncWizardDataToRAG(currentPropId, currentTenantId, category, stepData)

        // IF it's the 'access' category, update main property table
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
