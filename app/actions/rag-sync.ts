'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding } from '@/lib/ai/openai'

/**
 * Synchronizes wizard data (FAQs and Context) to the unified context_embeddings table for RAG.
 */
export async function syncWizardDataToRAG(propertyId: string, tenantId: string, category: string, data: any) {
    const supabase = await createClient()

    console.log(`[RAG-SYNC] Syncing ${category} for property ${propertyId}...`)

    // 1. Limpiar fragmentos antiguos de esta fuente y categoría para evitar duplicados en el RAG
    // Usamos el source_id como el ID de la propiedad + categoría para FAQs/Contexto
    const sourceId = `${propertyId}_${category}`
    await supabase.from('context_embeddings').delete().eq('source_id', sourceId)

    let contentToEmbed = ''
    let metadata = {}

    if (category === 'faqs') {
        const faqs = data as any[]
        if (!faqs || faqs.length === 0) return

        // Agrupamos FAQs por categorías para un mejor contexto
        contentToEmbed = faqs.map(f => `[PREGUNTA]: ${f.question}\n[RESPUESTA]: ${f.answer}`).join('\n\n')
        metadata = { category: 'guía_uso', type: 'faqs' }
    } else {
        // Para categorías de contexto (tech, access, etc.)
        contentToEmbed = `[INFORMAClÓN DE ${category.toUpperCase()}]:\n${JSON.stringify(data)}`
        metadata = { category: category, type: 'context' }
    }

    // 2. Generar embedding (OpenAI 1536)
    // Para simplificar FAQs las metemos en un solo bloque si no son demasiadas, 
    // o podríamos dividirlas si superan cierto límite.
    try {
        const embedding = await generateOpenAIEmbedding(contentToEmbed)

        // 3. Insertar en la tabla unificada
        const { error } = await supabase.from('context_embeddings').insert({
            property_id: propertyId,
            tenant_id: tenantId,
            source_type: 'context',
            source_id: sourceId,
            content: contentToEmbed,
            embedding: embedding,
            metadata: metadata
        })

        if (error) console.error(`[RAG-SYNC] Error inserting ${category}:`, error.message)
        else console.log(`[RAG-SYNC] SUCCESS: ${category} indexed.`)

    } catch (err: any) {
        console.error(`[RAG-SYNC] Embedding generation failed for ${category}:`, err.message)
    }
}
