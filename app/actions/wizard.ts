'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/geocoding'

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
            // Add initial geolocation if available
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
            return { success: true, property: data }
        } else {
            if (!tenantId) throw new Error('tenant_id es requerido para crear una propiedad')
            const { data, error } = await supabase
                .from('properties')
                .insert({ ...propValues, tenant_id: tenantId })
                .select()
                .single()
            if (error) throw error
            revalidatePath('/dashboard/properties')
            return { success: true, property: data, isNew: true }
        }
    } else if (category === 'faqs') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para FAQs')
        // En Server Actions podemos hacer múltiples operaciones de forma segura
        for (const faq of stepData) {
            const { error } = await supabase.from('property_faqs').upsert({
                property_id: currentPropId,
                question: faq.question,
                answer: faq.answer,
                category: faq.category
            })
            if (error) throw error
        }
        return { success: true }
    } else if (category === 'dining') {
        if (!currentPropId) throw new Error('ID de propiedad requerido para Recomendaciones')
        for (const rec of stepData) {
            const { error } = await supabase.from('property_recommendations').upsert({
                property_id: currentPropId,
                type: rec.type || 'restaurant',
                name: rec.name,
                description: rec.description || rec.specialty,
                distance: rec.distance,
                price_range: rec.price_range,
                personal_note: rec.personal_note
            })
            if (error) throw error
        }
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

        // IF it's the 'access' category, we also update the main property table with precise location info
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
