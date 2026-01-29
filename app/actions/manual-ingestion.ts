'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { revalidatePath } from 'next/cache'
import { generateContentWithClaude } from '@/lib/ai/claude'

/**
 * Ingests a new manual, chunks it, and generates embeddings for RAG using REST API
 */
export async function ingestManual(propertyId: string, fileUrl: string, name: string, brand?: string, model?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    // 1. Create the manual record
    const { data: manual, error: manualError } = await supabase
        .from('appliance_manuals')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            name,
            brand,
            model,
            file_path: fileUrl
        })
        .select()
        .single()

    if (manualError) throw new Error(manualError.message)

    // 2. Process PDF with direct REST call
    const resp = await fetch(fileUrl)
    const buffer = await resp.arrayBuffer()
    const base64Data = Buffer.from(buffer).toString('base64')

    const prompt = `
    Analiza este manual técnico y divídelo en secciones lógicas basadas en los encabezados del documento.

    REGLAS DE CHUNKING:
    1. No dividas por número de palabras, sino por funciones.
    2. Identifica secciones como: 'Instrucciones de Seguridad', 'Programas de Lavado', 'Mantenimiento', 'Troubleshooting', 'Desbloqueo de Mandos'.
    3. Para cada sección, extrae el texto completo y coherente.

    FORMATO DE SALIDA (JSON):
    {
      "sections": [
        {
          "topic": "Nombre de la sección",
          "content": "Texto completo de la sección en Markdown",
          "page_number": 1
        }
      ],
      "structured_info": {
        "quick_start": "Pasos para encender en < 10 segundos",
        "knob_type": "escamoteable / fijo / táctil",
        "safety_unlock": "Cómo quitar el bloqueo de niños",
        "warning": "Aviso crítico de este modelo específico"
      }
    }
    `

    const resultText = await generateContentWithClaude(`AQUÍ TIENES EL CONTENIDO DEL MANUAL:\n${base64Data}\n\n${prompt}`)

    const jsonMatch = resultText?.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!result) throw new Error('No se pudo procesar el PDF con la IA.')

    const { sections, structured_info } = result

    // 3. Update manual with structured info and generate top-level embedding
    const manualSummary = `${brand || ''} ${model || ''} ${name}\n${structured_info.quick_start}\n${structured_info.warning}`
    const topLevelEmbedding = await generateEmbedding(manualSummary)

    await supabase
        .from('appliance_manuals')
        .update({
            content: structured_info,
            embedding: topLevelEmbedding.length > 0 ? topLevelEmbedding : null,
            appliance_name: `${brand || ''} ${model || ''}`.trim() || name
        })
        .eq('id', manual.id)

    // 4. Generate embeddings and store sections
    const sectionsToInsert = await Promise.all(
        sections.map(async (section: any) => {
            const embedding = await generateEmbedding(`${section.topic}\n${section.content}`)
            return {
                manual_id: manual.id,
                property_id: propertyId,
                tenant_id: tenant_id,
                topic: section.topic,
                content: section.content,
                page_number: section.page_number,
                embedding: embedding.length > 0 ? embedding : null
            }
        })
    )

    const { error: sectionsError } = await supabase
        .from('manual_sections')
        .insert(sectionsToInsert)

    if (sectionsError) throw new Error(sectionsError.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return manual
}
