'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/geocoding'
import { syncWizardDataToRAG } from './rag-sync'

export async function saveWizardStep(
    category: string,
    stepData: any,
    propertyId?: string,
    tenantId?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    let currentPropId = propertyId

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
            await syncWizardDataToRAG(currentPropId, tenantId || '', 'property', stepData)
            return { success: true, property: data }
        } else {
            if (!tenantId) throw new Error('tenant_id es requerido para crear una propiedad')
            const { data, error } = await supabase
                .from('properties')
                .insert({ ...propValues, tenant_id: tenantId })
                .select()
                .single()
            if (error) throw error
            // Sincronizar RAG
            await syncWizardDataToRAG(data.id, tenantId, 'property', stepData)
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
                    tenant_id: tenantId,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    priority: faq.priority || 0
                }))
            )
            if (error) throw error
        }

        // 3. Sincronizar RAG
        await syncWizardDataToRAG(currentPropId, tenantId || '', 'faqs', stepData)
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
                    tenant_id: tenantId,
                    type: rec.category || rec.type || 'restaurant',
                    name: rec.name,
                    description: rec.description || rec.specialty || '',
                    distance: rec.distance || '',
                    metadata: {
                        time: rec.time,
                        price_range: rec.price_range,
                        personal_note: rec.personal_note
                    }
                }))
            )
            if (error) throw error
        }

        // 3. Sincronizar RAG
        await syncWizardDataToRAG(currentPropId, tenantId || '', 'dining', stepData)
        return { success: true }

    } else if (category === 'branding') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para Branding')

        const { error } = await supabase
            .from('property_branding')
            .upsert({
                property_id: currentPropId,
                tenant_id: tenantId,
                theme_id: stepData.theme_id,
                custom_primary_color: stepData.custom_primary_color,
                custom_logo_url: stepData.custom_logo_url,
                computed_theme: stepData.computed_theme,
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
                category: category,
                content: stepData
            }, { onConflict: 'property_id,category' })

        if (error) throw error

        // Sincronizar RAG para contexto
        await syncWizardDataToRAG(currentPropId, tenantId || '', category, stepData)

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
            return { success: true, property: updatedProp }
        }

        return { success: true }
    }
}
