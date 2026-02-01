'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
            location: stepData.location,
            guests: stepData.guests,
            beds: stepData.beds,
            baths: stepData.baths,
            description: stepData.description,
            theme_config: { primary_color: stepData.primary_color }
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
        return { success: true }
    }
}
