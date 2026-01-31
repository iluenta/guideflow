'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import axios from 'axios'
import { geminiREST, analyzeImageWithGemini } from '@/lib/ai/gemini-rest'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/openai'
import { syncPropertyApplianceList } from './properties'
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
 * Extracts structured guide data from raw text using Gemini
 */
export async function extractListingData(content: string) {
    console.log('Extracting listing data with Gemini...')

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
        const response = await geminiREST('gemini-3-flash-preview', prompt, {
            temperature: 0.1,
            responseMimeType: 'application/json'
        });
        return response?.data;
    } catch (error: any) {
        console.error('Gemini Extraction Error:', error.message)
        throw new Error(`Error en el procesamiento de IA: ${error.message}`)
    }
}

/**
 * Analyzes an image (appliance, etc.) and generates a technical manual using Gemini
 */
export async function generateManualFromImage(propertyId: string, imageUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    const prompt = "Analiza esta imagen de un electrodoméstico y genera un manual de uso simplificado en español. Devuelve SOLO el texto del manual en Markdown."

    const response = await analyzeImageWithGemini(imageUrl, prompt)
    const manualText = response?.data

    const { data, error } = await supabase
        .from('property_manuals')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            appliance_name: 'Electrodoméstico',
            manual_content: manualText,
            metadata: { source: 'single_image_legacy', usage: response?.usage }
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return data
}

/**
 * Processes a batch of images to identify appliances and generate manuals/notes using Gemini and Brave
 */
export async function processBatchScans(propertyId: string, imageUrls: string[], replaceExisting: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    try {
        console.log(`[BATCH] Starting analysis for ${imageUrls.length} images (Replace: ${replaceExisting})...`)
        const perImageResults = await Promise.all(
            imageUrls.map(async (url, index) => {
                const startTime = new Date().toISOString();
                console.log(`[PROCESS] [${index + 1}/${imageUrls.length}] Starting: ${url}`)
                try {
                    // PASO 1: Análisis Visual con Gemini 3 Flash
                    console.log(`[PROCESS] [${index + 1}] Step 1: Vision identification...`)
                    const analysisPrompt = `Eres un experto mundial en identificación técnica de electrodomésticos y equipamiento de hogar.
Identifica el aparato o elemento de la propiedad.

FORMATO DE SALIDA (JSON estricto):
{
  "appliance_type": "categoría (CAFETERA, HERVIDOR, HORNO, LAVADORA, LAVAVAJILLAS, TERMO, AIRE ACONDICIONADO, VITROCERAMICA, MICROONDAS, NEVERA, SECADORA, PISCINA, CHIMENEA, BARBACOA, CALDERA, ACCESO, OTRO_TECNICO, NO_UTIL)",
  "is_scannable": boolean (true si es un aparato o elemento con instrucciones claras, false si es decoración, paisajes o zonas comunes generales),
  "item_category": "TECHNICAL_APPLIANCE" | "PROPERTY_AMENITY" | "NON_TECHNICAL",
  "brand": "marca visible",
  "model": "modelo exacto o serie",
  "confidence": 0.0-1.0,
  "needs_web_search": boolean,
  "search_keywords": "palabras clave para google",
  "visual_condition": "nuevo|usado|deteriorado"
}

REGLAS CRÍTICAS:
1. **OBJETO ÚNICO**: Devuelve ÚNICAMENTE UN OBJETO JSON. Si hay varios aparatos, selecciona el más prominente o central de la imagen.
2. **FILTRO DE IDONEIDAD**: Si la imagen no es un aparato técnico o un amenity recoñocible (ej: es una cama, un cuadro, o un paisaje genérico), pon "is_scannable": false.
3. **AMENITIES**: Una piscina privada, una chimenea o una barbacoa son "PROPERTY_AMENITY". Un electrodoméstico es "TECHNICAL_APPLIANCE".
4. **CONFIANZA**: Solo procede con confianza > 0.4.

RESPONDE SOLO CON EL JSON.`

                    const geminiResponse = await analyzeImageWithGemini(url, analysisPrompt);
                    const analysisText = geminiResponse?.data;
                    const usage = geminiResponse?.usage;
                    const endTime = new Date().toISOString();

                    if (!analysisText) {
                        console.error(`[PROCESS] [${index + 1}] Vision analysis returned no text. Error:`, geminiResponse?.error)
                        await supabase.from('appliance_images').insert({
                            property_id: propertyId,
                            image_url: url,
                            status: 'failed',
                            error_log: `AI Vision Error: ${geminiResponse?.error || 'Empty response'}`,
                            analysis_started_at: startTime,
                            analysis_finished_at: endTime,
                            ai_model: 'gemini-3-flash-preview'
                        })
                        return { success: false, error: 'AI Vision Error' }
                    }
                    console.log(`[PROCESS] [${index + 1}] Vision analysis received. Content length: ${typeof analysisText === 'string' ? analysisText.length : 'object'}`)

                    // Parseo del JSON
                    let analysis: any;
                    try {
                        if (typeof analysisText === 'object' && analysisText !== null) {
                            analysis = analysisText;
                        } else if (typeof analysisText === 'string') {
                            const jsonMatch = analysisText.match(/\[?\{[\s\S]*\}?\]/);
                            const rawJson = jsonMatch ? jsonMatch[0] : '{}';
                            analysis = JSON.parse(rawJson);
                        } else {
                            analysis = {};
                        }

                        // Si la IA devolvió un array (muy común en fotos con varios elementos), cogemos el primero
                        analysis = Array.isArray(analysis) ? analysis[0] : analysis;
                    } catch (e) {
                        console.error('[PROCESS] JSON Parse failed for:', analysisText);
                        await supabase.from('appliance_images').insert({
                            property_id: propertyId,
                            image_url: url,
                            status: 'failed',
                            error_log: 'JSON Parse Error',
                            analysis_started_at: startTime,
                            analysis_finished_at: endTime,
                            ai_model: 'gemini-3-flash-preview'
                        })
                        return { success: false, error: 'Parse Error' }
                    }

                    if (!analysis || !analysis.is_scannable || (analysis.confidence || 0) < 0.4) {
                        const reason = !analysis ? 'No analysis' : !analysis.is_scannable ? 'Item not scannable' : 'Low confidence';
                        console.log(`[PROCESS] [${index + 1}] Skipping: ${reason}`)
                        await supabase.from('appliance_images').insert({
                            property_id: propertyId,
                            image_url: url,
                            status: 'failed',
                            error_log: reason,
                            analysis_started_at: startTime,
                            analysis_finished_at: endTime,
                            ai_model: 'gemini-3-flash-preview',
                            analysis_result: analysis
                        })
                        return { success: false, error: reason }
                    }

                    // Guardar Log Exitoso
                    console.log(`[PROCESS] [${index + 1}] Saving image log to database...`)
                    const { data: imgRecord, error: logError } = await supabase.from('appliance_images').insert({
                        property_id: propertyId,
                        image_url: url,
                        analysis_result: analysis,
                        status: 'completed',
                        analysis_started_at: startTime,
                        analysis_finished_at: endTime,
                        ai_model: 'gemini-3-flash-preview',
                        tokens_prompt: usage?.prompt_tokens,
                        tokens_completion: usage?.candidates_tokens
                    }).select().single();

                    if (logError) {
                        console.error(`[PROCESS] [${index + 1}] DB Log Error (Migration missing?):`, logError.message)
                    }

                    // PASO 2: Búsqueda Web
                    let webContext = ''
                    if (analysis.needs_web_search && (analysis.brand || analysis.model)) {
                        console.log(`[PROCESS] [${index + 1}] Step 2: Web searching for ${analysis.brand}...`)
                        const staggerDelay = index * 3000
                        await new Promise(res => setTimeout(res, staggerDelay))
                        const query = analysis.search_keywords || `${analysis.brand} ${analysis.model} manual español`
                        const searchResults = await searchBrave(query)
                        webContext = formatBraveResults(searchResults)
                    }

                    // PASO 3: Generación del Manual
                    console.log(`[PROCESS] [${index + 1}] Step 3: Manual generation (${analysis.item_category})...`)
                    const isGeneric = !analysis.model || analysis.model === 'desconocido' || analysis.model === 'N/A';

                    let generationPrompt = ""

                    if (analysis.item_category === 'PROPERTY_AMENITY') {
                        generationPrompt = `Genera una guía de uso para este AMENITY (Comodidad/Instalación): ${analysis.brand || ''} ${analysis.appliance_type}.
                        
                        REGLAS PARA AMENITIES:
                        1. **TONO**: Amable, directo y práctico para un huésped.
                        2. **CONTENIDO**: Describe qué es, para qué sirve y normas básicas de uso.
                        3. **SÍMBOLOS**: Si identificas mandos o botones (ej. en una barbacoa o panel de piscina), descríbelos visualmente.
                        4. **HALLUCINACIÓN**: NUNCA inventes especificaciones técnicas profundas (cilindradas, voltajes, mecánicas complejas) si no son evidentes. Sé descriptivo del uso, no de la ingeniería.
                        5. **FALLOS**: Incluye solo 3-4 consejos prácticos de problemas comunes (ej. "si no sale agua, verifica la llave de paso").`
                    } else {
                        generationPrompt = `Genera un manual técnico exhaustivo para un ${analysis.brand} ${analysis.model || '(Modelo genérico)'}.
                        ${isGeneric ? 'NOTA: No se ha identificado el modelo exacto. Genera un "MANUAL UNIVERSAL" basado en las mejores prácticas de este tipo de aparato, con instrucciones seguras y estándar.' : ''}
                        Contexto web: ${webContext}
                        
                        REGLAS CRÍTICAS PARA LA IA:
                        1. **DICCIONARIO DE SÍMBOLOS**: Describe físicamente los iconos y su función.
                        2. **PROHIBICIÓN DE EMOJIS**: No uses emojis.
                        3. **ESPECIFICACIONES**: Incluye mapa de mandos, mantenimiento y guía de fallos (+15 problemas).
                        4. **HALLUCINACIÓN**: Si no conoces el modelo, NO inventes una marca o especificaciones técnicas arbitrarias. Sé genérico pero preciso en el uso.`
                    }

                    const genResponse = await geminiREST('gemini-3-flash-preview', generationPrompt, {
                        responseMimeType: 'text/plain',
                        temperature: 0.5
                    })

                    const manualContent = genResponse?.data
                    if (!manualContent) {
                        console.error(`[PROCESS] [${index + 1}] Manual generation failed. Error:`, genResponse?.error)
                        return { success: false, error: 'Gen Error' }
                    }
                    // PASO 4: Guardar y Vectorizar
                    console.log(`[PROCESS] [${index + 1}] Step 4: Saving manual to database...`)

                    // LÓGICA DE SUSTITUCIÓN: Si replaceExisting es true, buscamos si ya hay un manual para este aparato
                    if (replaceExisting) {
                        // Buscamos coincidencia exacta o coincidencia de palabra clave (ej. 'HERVIDOR' coincide con 'HERVIDOR ELÉCTRICO')
                        const { data: existingManuals } = await supabase
                            .from('property_manuals')
                            .select('id, appliance_name')
                            .eq('property_id', propertyId)

                        const normalizedTarget = analysis.appliance_type.toUpperCase()
                        const duplicate = existingManuals?.find(m => {
                            const extName = m.appliance_name.toUpperCase()
                            return extName.includes(normalizedTarget) || normalizedTarget.includes(extName)
                        })

                        if (duplicate) {
                            console.log(`[PROCESS] [${index + 1}] Replacing existing manual: ${duplicate.id} (${duplicate.appliance_name})`)
                            await supabase.from('property_manuals').delete().eq('id', duplicate.id)
                            await supabase.from('context_embeddings').delete().eq('source_id', duplicate.id)
                        }
                    }

                    const { data: manual, error: manError } = await supabase.from('property_manuals').insert({
                        property_id: propertyId,
                        tenant_id: tenant_id,
                        appliance_name: analysis.appliance_type,
                        brand: analysis.brand,
                        model: analysis.model,
                        manual_content: manualContent,
                        metadata: {
                            usage: genResponse?.usage,
                            item_category: analysis.item_category,
                            is_scannable: analysis.is_scannable,
                            appliance_type: analysis.appliance_type
                        }
                    }).select().single();

                    if (manError) throw manError
                    if (imgRecord) await supabase.from('appliance_images').update({ manual_id: manual.id }).eq('id', imgRecord.id);

                    // Vectorización Dual: Legacy (por compatibilidad) y Unificado (para Chat)
                    const chunks = splitIntoChunks(manualContent, 800)
                    const embeddingDataList = await Promise.all(chunks.map(async chunk => {
                        const vec = await generateOpenAIEmbedding(chunk)
                        return {
                            manual_id: manual.id,
                            content: chunk,
                            embedding: vec
                        }
                    }))

                    // 4.1. Legacy table
                    await supabase.from('manual_embeddings').insert(embeddingDataList)

                    // 4.2. Unified context table (Chat RAG) - Prependemos info del aparato para mejor matching vectorial
                    const contextEmbeddings = await Promise.all(chunks.map(async chunk => {
                        const enrichedContent = `[APARATO: ${analysis.brand} ${analysis.model} ${analysis.appliance_type}]\n${chunk}`;
                        const enrichedEmbedding = await generateOpenAIEmbedding(enrichedContent);
                        return {
                            property_id: propertyId,
                            tenant_id: tenant_id,
                            source_type: 'manual',
                            source_id: manual.id,
                            content: enrichedContent,
                            embedding: enrichedEmbedding,
                            metadata: {
                                appliance: analysis.appliance_type,
                                brand: analysis.brand,
                                item_category: analysis.item_category
                            }
                        };
                    }));

                    const { error: ctxErr } = await supabase
                        .from('context_embeddings')
                        .upsert(contextEmbeddings, { onConflict: 'source_id,content' })

                    if (ctxErr) console.error('[BATCH] context_embeddings upsert error:', ctxErr.message)

                    // 4.3. Actualizar índice de aparatos en property_context
                    await syncPropertyApplianceList(propertyId, tenant_id)

                    console.log(`[PROCESS] [${index + 1}] SUCCESS: Manual generated and synced to RAG.`)
                    return { success: true }

                } catch (err: any) {
                    console.error(`[PROCESS] [${index + 1}] CRITICAL EXCEPTION during image processing:`, err)
                    return { success: false, error: err.message }
                } finally {
                    try {
                        const urlMatch = url.match(/property_scans\/(.+)$/)
                        if (urlMatch) {
                            console.log(`[PROCESS] [${index + 1}] Post-cleanup: Deleting from storage: ${urlMatch[1]}`)
                            await supabase.storage.from('property_scans').remove([urlMatch[1]])
                        }
                    } catch (cleanupErr) {
                        console.error(`[PROCESS] [${index + 1}] Cleanup error:`, cleanupErr)
                    }
                }
            })
        )
        const successCount = perImageResults.filter(r => r.success).length
        console.log(`[BATCH] Finished. Success: ${successCount}/${imageUrls.length}`)
        revalidatePath(`/dashboard/properties/${propertyId}`)
        return { success: true, count: successCount }
    } catch (error: any) {
        console.error('[BATCH] Fatal batch error:', error.message)
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
        const { count } = await supabase.from('guide_sections').select('*', { count: 'exact', head: true }).eq('property_id', propertyId)
        if (count && count > 0) return { requiresConfirmation: true, sectionCount: count }
    }

    if (options.overwrite) {
        await supabase.from('guide_sections').delete().eq('property_id', propertyId)
    }

    const rawContent = await fetchListingContent(url)
    const structuredData = await extractListingData(rawContent)
    if (!structuredData) throw new Error('No data')

    const propertyUpdate: any = {
        description: structuredData.description,
        theme_config: {
            host_name: structuredData.host_name,
            welcome_message: structuredData.welcome_message,
            welcome_title: `Bienvenidos`
        }
    }

    await supabase.from('properties').update(propertyUpdate).eq('id', propertyId)

    const sectionsToInsert = structuredData.sections.map((s: any, index: number) => ({
        ...s,
        property_id: propertyId,
        tenant_id: tenant_id,
        order_index: index
    }))

    await supabase.from('guide_sections').insert(sectionsToInsert)
    revalidatePath(`/dashboard/properties/${propertyId}`)
    return { success: true }
}
