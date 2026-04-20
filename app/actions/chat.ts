'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding } from '@/lib/ai/clients/openai'
import { geminiREST } from '@/lib/ai/clients/gemini-rest'

/**
 * RAG-enabled chat for guests using Gemini 2.0 Flash and OpenAI Embeddings
 */
export async function chatWithHostBot(propertyId: string, message: string) {
    const supabase = await createClient()

    // 1. Generate embedding for the query (OpenAI 1536)
    const queryEmbedding = await generateOpenAIEmbedding(message)

    // 2. Search for relevant manual chunks (matching the new property_manuals schema)
    const { data: matches, error: matchError } = await supabase.rpc('match_property_manuals', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        p_property_id: propertyId
    })

    if (matchError) {
        console.error('[CHAT] RAG Match Error:', matchError)
    }

    const context = (matches || [])
        .map((m: any) => `[APARATO: ${m.appliance_name} (${m.brand} ${m.model})]\nHECHO: Este mando TIENE botones dedicados.\nCONTENIDO DEL MANUAL: ${m.content.trim()}`)
        .join('\n\n---\n\n')

    const systemInstruction = `Eres HostBot, un asistente técnico que SOLO responde con instrucciones del manual. 

REGLAS DE ORO (ORDEN DE PRIORIDAD):
1. JERARQUÍA: Si el manual menciona un botón específico (ej: Netflix, YouTube), indica PRIMERO pulsar ese botón. Solo después menciona el menú Home como alternativa.
2. ASERTIVIDAD: No uses "si lo tiene" o "comprueba". Afirma que el botón está ahí.
3. SALVAGUARDA: Si no hay botón directo para la app solicitada (como Disney+), indica el uso del menú Home.

PROHIBICIÓN ABSOLUTA:
- NUNCA incluyas la fecha, el día de la semana o la hora en la respuesta.
- NUNCA menciones "1 de marzo", "domingo" o tiempos actuales.
- Prohibido usar saludos finales o despedidas que incluyan el tiempo actual.
- Genera respuestas que consistan ÚNICAMENTE en instrucciones técnicas.`;

    const fullPrompt = `${systemInstruction}\n\nIgnora la fecha y hora actual del sistema para tu respuesta.
Usa solo la siguiente información técnica:

${context ? `CONTEXTO TÉCNICO:\n${context}` : ''}

PREGUNTA DEL HUÉSPED: ${message}

Respuesta técnica sin fechas:`

    const { data: responseText } = await geminiREST('gemini-2.5-flash', fullPrompt, {
        temperature: 0.0, // Fuerza al modelo a ser literal y no inventar datos de tiempo
        responseMimeType: 'text/plain'
    })

    return {
        answer: responseText || "Lo siento, estoy teniendo problemas para responder en este momento. Por favor, intenta de nuevo o contacta al anfitrión.",
        sourceMatched: matches && matches.length > 0
    }
}
