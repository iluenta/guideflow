'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GuideSection } from './properties'
import axios from 'axios'
import { analyzeImageWithClaude, generateContentWithClaude } from '@/lib/ai/claude'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/openai'
import { searchBrave, formatBraveResults } from '@/lib/ai/brave'

/**
 * Robustly fetches content from a URL using a reader service (like Jina Reader)
 */
async function fetchListingContent(url: string, retryCount = 0): Promise<string> {
    const MAX_RETRIES = 1
    try {
        console.log(`Scraping attempt ${retryCount + 1} for: ${url}`)
        const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(url.trim())}`, {
            timeout: 45000,
            headers: {
                'X-Return-Format': 'markdown'
            }
        })
        return response.data
    } catch (error: any) {
        if (retryCount < MAX_RETRIES) {
            console.warn(`Scraping timeout or error, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            return fetchListingContent(url, retryCount + 1)
        }
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout')
        if (isTimeout) {
            throw new Error('El servidor de extracción tardó demasiado en responder (Timeout).')
        }
        throw new Error('No se pudo acceder a la URL.')
    }
}

/**
 * Extracts structured guide data from raw text using Claude
 */
export async function extractListingData(content: string) {
    console.log('Extracting listing data with Claude...')

    const prompt = `
    Analiza la información de este anuncio para crear una guía digital.
    
    FORMATO DE SALIDA (JSON ESTRICTO):
    {
      "host_name": "Nombre completo de la persona",
      "welcome_message": "Mensaje completo y literal del anfitrión",
      "description": "Resumen corto de la propiedad (máx 200 caracteres)",
      "sections": [
        {
          "title": "WiFi",
          "data": { "text": "Red y contraseña..." }
        }
      ]
    }

    CONTENIDO DEL ANUNCIO:
    ${content.substring(0, 40000)}
    `

    try {
        const resultText = await generateContentWithClaude(prompt)
        const jsonMatch = resultText?.match(/\{[\s\S]*\}/)
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch (error: any) {
        console.error('Claude Extraction Error:', error.message)
        throw new Error(`Error en el procesamiento de IA: ${error.message}`)
    }
}

/**
 * Analyzes an image (appliance, etc.) and generates a technical manual using Claude
 */
export async function generateManualFromImage(propertyId: string, imageUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    const prompt = "Analiza esta imagen de un electrodoméstico y genera un manual de uso simplificado en español. Devuelve SOLO el texto del manual en Markdown."

    const manualText = await analyzeImageWithClaude(imageUrl, prompt)

    const { data, error } = await supabase
        .from('property_manuals')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            appliance_name: 'Electrodoméstico',
            manual_content: manualText,
            metadata: { source: 'single_image_legacy' }
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return data
}

/**
 * Processes a batch of images to identify appliances and generate manuals/notes using Claude and Brave
 */
export async function processBatchScans(propertyId: string, imageUrls: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    try {
        const perImageResults = await Promise.all(
            imageUrls.map(async (url, index) => {
                try {
                    // PASO 1: Análisis Visual con Claude 3.5 Sonnet
                    const analysisPrompt = `Eres un experto en identificación de electrodomésticos y aparatos domésticos.

TAREA: Analiza la imagen y extrae información técnica. La imagen puede estar rotada (vertical/horizontal/invertida), asegúrate de leer el texto en todas las orientaciones posibles.

FORMATO DE SALIDA (JSON estricto):
{
  "appliance_type": "categoría (horno, lavadora, caldera, termo, lavavajillas, microondas, etc)",
  "brand": "marca visible o null",
  "model": "modelo exacto o null",
  "has_technical_label": boolean,
  "visible_controls": ["descripción control 1", "descripción control 2"],
  "visual_condition": "nuevo/usado/antiguo",
  "confidence": 0.0-1.0,
  "needs_web_search": boolean,
  "search_keywords": "palabras clave para búsqueda web si needs_web_search=true"
}

REGLAS DE ORO:
1. **ORIENTACIÓN**: Muchas etiquetas técnicas vienen pegadas de lado. Lee el texto verticalmente si es necesario.
2. **EXTRACCIÓN**: Copia el código "E-Nr" o "Model" CARÁCTER POR CARÁCTER. No lo resumas ni lo inventes.
3. **CONTEXTO VISUAL**: 
   - Si ves rejillas, bandejas o cristales oscuros -> Es un HORNO.
   - Si ves tubos de agua, válvulas o manómetros -> Es un TERMO/CALDERA.
   - No confundas etiquetas de BSH (Bosch/Siemens/Balay) - pueden ser de cualquier aparato. Mira el entorno.
4. **CONFIANZA**:
   - Etiqueta técnica legible: > 0.9
   - Solo frontal/entorno: < 0.6
   - Si dudas del tipo de aparato: < 0.4
5. **SEARCH KEYWORDS**: Si hay modelo, incluye marca + modelo + tipo en las keywords.

RESPONDE SOLO CON EL JSON.`

                    const analysisText = await analyzeImageWithClaude(url, analysisPrompt)
                    if (!analysisText) return { success: false, error: 'AI Error' }

                    // Limpieza y parseo de JSON del análisis
                    let analysis: any
                    try {
                        const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
                        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
                    } catch (e) {
                        console.error('[PROCESS] Failed to parse Claude analysis JSON:', analysisText)
                        return { success: false, error: 'JSON Parse Error' }
                    }
                    if (!analysis || analysis.confidence < 0.3) {
                        console.warn(`[PROCESS] Low confidence analysis for ${url}:`, analysis)
                        return { success: false, error: 'Low confidence' }
                    }
                    console.log(`[PROCESS] Identification successful: ${analysis.brand} ${analysis.model} (${analysis.appliance_type})`)

                    // Guardar registro de imagen
                    const { data: imgRecord } = await supabase
                        .from('appliance_images')
                        .insert({
                            property_id: propertyId,
                            image_url: url,
                            analysis_result: analysis
                        })
                        .select()
                        .single()

                    // PASO 2: Búsqueda Web (Brave) - ESCALONADA para evitar Rate Limits
                    let webContext = ''
                    if (analysis.needs_web_search && (analysis.brand || analysis.model || analysis.search_keywords)) {
                        // Esperar un desfase basado en el índice para no lanzar todas las búsquedas al mismo milisegundo
                        const staggerDelay = index * 2500
                        if (staggerDelay > 0) {
                            console.log(`[PROCESS] Staggering web search for ${analysis.brand} (${staggerDelay}ms delay)...`)
                            await new Promise(res => setTimeout(res, staggerDelay))
                        }

                        const query = analysis.search_keywords || `${analysis.brand} ${analysis.model} ${analysis.appliance_type} manual español`
                        console.log(`[PROCESS] Searching web for: ${query}`)
                        const searchResults = await searchBrave(query)
                        webContext = formatBraveResults(searchResults)
                        console.log(`[PROCESS] Web context acquired (${webContext.length} chars)`)
                    }

                    // PASO 3: Generación del Manual con Claude 3.5 Sonnet
                    const generationPrompt = `Eres un experto técnico redactando manuales de usuario simplificados para huéspedes.

APARATO:
${JSON.stringify(analysis, null, 2)}

INFORMACIÓN WEB ENCONTRADA:
${webContext || 'No hay información web, genera basándote en la visión y conocimiento general.'}

GENERA un manual en ESPAÑOL siguiendo esta estructura EXACTA:

# ${analysis.appliance_type} - ${analysis.brand} ${analysis.model || ''}

## 1. Descripción General
- Tipo de aparato y características principales
- Capacidad/potencia si se conoce

## 2. Panel de Control y Elementos
- Descripción detallada de cada botón/perilla/indicador
- Qué significa cada símbolo o luz

## 3. Instrucciones de Uso Paso a Paso
### Uso Básico Diario
1. [Paso 1]
2. [Paso 2]
...

### Funciones Avanzadas (si aplica)
- [Función especial 1]
- [Función especial 2]

## 4. Programas/Modos Disponibles
| Programa | Descripción | Cuándo usarlo |
|----------|-------------|---------------|
| ... | ... | ... |

## 5. Solución de Problemas Comunes
**🔴 El aparato no enciende**
- Verifica que esté enchufado
- Comprueba el interruptor general
- Revisa el fusible/diferencial

**🔴 Luz roja parpadeando**
- [Causa probable]
- [Solución paso a paso]

**🔴 Hace ruido extraño**
...

[INCLUIR MÍNIMO 10 PROBLEMAS FRECUENTES]

## 6. Mantenimiento Regular
- Limpieza: [frecuencia y método]
- Filtros: [cuándo cambiar/limpiar]
- Descalcificación: [si aplica]

## 7. ⚠️ Advertencias de Seguridad
- [Punto crítico 1]
- [Punto crítico 2]

---

REGLAS DE REDACCIÓN:
- Lenguaje claro para personas no técnicas
- Pasos numerados y concisos
- Incluir soluciones antes de "llamar al anfitrión"
- Si falta información técnica, usa conocimiento general del tipo de aparato
- NO inventes modelos o especificaciones técnicas precisas si no las tienes`

                    const manualContent = await generateContentWithClaude(generationPrompt)
                    if (!manualContent) {
                        console.error('[PROCESS] Claude failed to generate manual content')
                        return { success: false, error: 'Generation Error' }
                    }
                    console.log(`[PROCESS] Manual generated (${manualContent.length} chars)`)

                    // PASO 4: Guardar Manual y Vectorizar
                    const { data: manual, error: manError } = await supabase
                        .from('property_manuals')
                        .insert({
                            property_id: propertyId,
                            tenant_id: tenant_id,
                            appliance_name: analysis.appliance_type,
                            brand: analysis.brand,
                            model: analysis.model,
                            manual_content: manualContent,
                            metadata: {
                                source: webContext ? 'web_enhanced' : 'vision_only',
                                confidence: analysis.confidence,
                                visual_condition: analysis.visual_condition
                            }
                        })
                        .select()
                        .single()

                    if (manError) throw manError

                    // Actualizar record de imagen con manual_id
                    await supabase.from('appliance_images').update({ manual_id: manual.id }).eq('id', imgRecord.id)

                    // Vectorización (OpenAI)
                    const chunks = splitIntoChunks(manualContent, 800)
                    const embeddingPromises = chunks.map(async (chunk) => {
                        const vec = await generateOpenAIEmbedding(chunk)
                        return {
                            manual_id: manual.id,
                            content: chunk,
                            embedding: vec
                        }
                    })
                    const embeddings = await Promise.all(embeddingPromises)
                    await supabase.from('manual_embeddings').insert(embeddings)

                    return { success: true, appliance: analysis.appliance_type }

                } catch (err) {
                    console.error(`[PROCESS] Failed image ${url}:`, err)
                    return { success: false, error: 'Internal Error' }
                }
            })
        )

        const validResultsCount = perImageResults.filter(r => r && r.success).length
        revalidatePath(`/dashboard/properties/${propertyId}`)
        return { success: true, count: validResultsCount }

    } catch (error: any) {
        console.error('Batch Scan Error:', error.message)
        throw new Error(`Error: ${error.message}`)
    }
}

/**
 * Main Auto-Build action
 */
export async function ingestPropertyData(propertyId: string, url: string, options: { overwrite: boolean }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    if (!options.overwrite) {
        const { count } = await supabase
            .from('guide_sections')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', propertyId)

        if (count && count > 0) {
            return { requiresConfirmation: true, sectionCount: count }
        }
    }

    if (options.overwrite) {
        await supabase
            .from('guide_sections')
            .delete()
            .eq('property_id', propertyId)
    }

    const rawContent = await fetchListingContent(url)
    const structuredData = await extractListingData(rawContent)

    const propertyUpdate: any = { description: structuredData.description }

    const { data: property } = await supabase
        .from('properties')
        .select('name, theme_config')
        .eq('id', propertyId)
        .single()

    if (property) {
        propertyUpdate.theme_config = {
            ...(property.theme_config || {}),
            host_name: structuredData.host_name || property.theme_config?.host_name,
            welcome_message: structuredData.welcome_message || property.theme_config?.welcome_message,
            welcome_title: `Bienvenidos a ${property.name}`
        }
    }

    await supabase
        .from('properties')
        .update(propertyUpdate)
        .eq('id', propertyId)

    const sectionsToInsert = structuredData.sections.map((s: any, index: number) => ({
        ...s,
        property_id: propertyId,
        tenant_id: tenant_id,
        order_index: index
    }))

    const { error } = await supabase
        .from('guide_sections')
        .insert(sectionsToInsert)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    revalidatePath('/dashboard/properties')

    return { success: true }
}
