'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { geminiREST } from '@/lib/ai/clients/gemini-rest'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/clients/openai'
import { syncManualToRAG } from './rag-sync'
import { revalidatePath } from 'next/cache'

/**
 * Fuses user-provided notes into an existing AI-generated manual.
 * Rewrites the manual to integrate the notes naturally and updates RAG embeddings.
 */
export async function enrichManualWithHostNotes(manualId: string, hostNotes: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // 1. Obtener el manual actual
    const { data: manual, error: fetchErr } = await supabase
        .from('property_manuals')
        .select('*')
        .eq('id', manualId)
        .single()

    if (fetchErr || !manual) throw new Error('Manual no encontrado')

    logger.debug(`[ENRICH] Enriqueciendo manual ${manual.appliance_name} (${manual.brand})...`)

    // 2. Prompt de fusión para Gemini
    const fusionPrompt = `Eres un redactor técnico experto. Tu tarea es integrar las "Notas del Anfitrión" en un "Manual Técnico" existente de forma natural y profesional.

MANUAL ACTUAL:
${manual.manual_content}

NOTAS DEL ANFITRIÓN (A INTEGRAR):
${hostNotes}

REGLAS DE ORO:
1. **INTEGRACIÓN NATURAL**: No solo añadas las notas al final. Si una nota habla de la temperatura, ponla en la sección de "Ajustes". Si habla de seguridad, ponla en "Seguridad".
2. **PRIORIDAD DEL ANFITRIÓN**: Si una nota del anfitrión contradice o matiza el manual genérico, la nota del anfitrión es la verdad absoluta.
3. **MANTENER FORMATO**: Mantén la estructura de Markdown, los encabezados y la claridad.
4. **DICCIONARIO DE SÍMBOLOS**: Si las notas describen un icono nuevo, añádelo a la sección "DICCIONARIO DE SÍMBOLOS VISUALES".
5. **TONO**: Profesional, útil y directo.

RESPONDE SOLO CON EL NUEVO CONTENIDO DEL MANUAL EN MARKDOWN.`

    const genResponse = await geminiREST('gemini-2.5-flash', fusionPrompt, {
        responseMimeType: 'text/plain',
        temperature: 0.3
    })

    const enrichedContent = genResponse?.data
    if (!enrichedContent) throw new Error('Error al generar el manual enriquecido')

    // 3. Actualizar el registro del manual
    const { error: updateErr } = await supabase
        .from('property_manuals')
        .update({
            manual_content: enrichedContent,
            updated_at: new Date().toISOString()
        })
        .eq('id', manualId)

    if (updateErr) {
        console.error('[ENRICHMENT] Error updating manual:', updateErr.message)
        throw new Error('Error al actualizar el manual enriquecido')
    }

    // 4. Actualizar embeddings (Chat RAG)
    await syncManualToRAG(
        manual.property_id,
        manual.tenant_id,
        manualId,
        enrichedContent,
        manual.appliance_name,
        manual.brand,
        manual.model
    )

    revalidatePath(`/dashboard/properties/${manual.property_id}/setup`)

    return { success: true }
}
