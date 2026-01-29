'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding } from '@/lib/ai/openai'
import { generateContentWithClaude } from '@/lib/ai/claude'

/**
 * RAG-enabled chat for guests using Claude 3 Haiku and OpenAI Embeddings
 */
export async function chatWithHostBot(propertyId: string, message: string) {
    const supabase = await createClient()

    // 1. Generate embedding for the query (OpenAI 1536)
    const queryEmbedding = await generateOpenAIEmbedding(message)

    // 2. Search for relevant manual chunks (matching the new property_manuals schema)
    const { data: matches, error: matchError } = await supabase.rpc('match_property_manuals', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5,
        p_property_id: propertyId
    })

    if (matchError) {
        console.error('[CHAT] RAG Match Error:', matchError)
    }

    const context = (matches || [])
        .map((m: any) => `[MANUAL: ${m.appliance_name} (${m.brand} ${m.model})]\n${m.content}`)
        .join('\n\n---\n\n')

    const systemInstruction = `Eres HostBot, el asistente experto del alojamiento. 
    Tu objetivo es resolver dudas del huésped basándote en los manuales oficiales suministrados.
    
    REGLAS DE RESPUESTA:
    1. Si encuentras información en el contexto, empieza con: 'Según el manual oficial...'
    2. Si la información NO está en el manual pero es de sentido común, responde amablemente.
    3. Si la confianza es baja u observas frustración, ofrece contactar al anfitrión vía WhatsApp.
    4. Sé conciso y directo.`

    const fullPrompt = context
        ? `${systemInstruction}\n\nCONTEXTO TÉCNICO:\n${context}\n\nPREGUNTA DEL HUÉSPED: ${message}`
        : `${systemInstruction}\n\nPREGUNTA DEL HUÉSPED: ${message}`

    const responseText = await generateContentWithClaude(fullPrompt, 'claude-haiku-4-5')

    return {
        answer: responseText || "Lo siento, estoy teniendo problemas para responder en este momento. Por favor, intenta de nuevo o contacta al anfitrión.",
        sourceMatched: matches && matches.length > 0
    }
}
