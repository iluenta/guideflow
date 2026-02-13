'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import axios from 'axios'
import { geminiREST, analyzeImageWithGemini, geminiVision } from '@/lib/ai/gemini-rest'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/openai'
import { syncPropertyApplianceList } from './properties'
import { syncWizardDataToRAG } from './rag-sync'
import { searchBrave, formatBraveResults } from '@/lib/ai/brave'

/**
 * Utility for timestamps in logs [HH:MM:SS]
 */
function logT(msg: string) {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    console.log(`[${time}] ${msg}`);
}

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
            throw new Error('El servidor de extracciÃ³n tardÃ³ demasiado en responder (Timeout).')
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
    Analiza la informaciÃ³n de este anuncio para crear una guÃ­a digital.
    
    FORMATO DE SALIDA (JSON ESTRICTO):
    {
      "host_name": "Nombre completo de la persona",
      "welcome_message": "Mensaje completo y literal del anfitriÃ³n",
      "description": "Resumen corto de la propiedad (mÃ¡x 200 caracteres)",
      "sections": [
        {
          "title": "WiFi",
          "data": { "text": "Red y contraseÃ±a..." }
        }
      ]
    }

    CONTENIDO DEL ANUNCIO:
    ${content.substring(0, 40000)}
    `

    try {
        const response = await geminiREST('gemini-2.0-flash', prompt, {
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

    const prompt = "Analiza esta imagen de un electrodomÃ©stico y genera un manual de uso simplificado en espaÃ±ol. Devuelve SOLO el texto del manual en Markdown."

    const response = await analyzeImageWithGemini(imageUrl, prompt, { responseMimeType: 'text/plain' })
    const manualText = response?.data

    const { data, error } = await supabase
        .from('property_manuals')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            appliance_name: 'ElectrodomÃ©stico',
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
        logT(`[BATCH] Starting TWO-PHASE analysis for ${imageUrls.length} images (Replace: ${replaceExisting})...`)

        // ═══════════════════════════════════════════════════════════
        // PHASE 1: FAST IDENTIFICATION (~15s for 15 images)
        // Only identify what each appliance is — no manual generation
        // ═══════════════════════════════════════════════════════════
        await supabase
            .from('properties')
            .update({
                inventory_status: 'identifying',
                inventory_last_scan_at: new Date().toISOString()
            })
            .eq('id', propertyId)

        const CONCURRENCY_LIMIT = 5; // Higher concurrency for fast identification

        interface IdentificationResult {
            url: string
            analysis: any
            imgRecordId?: string
            success: boolean
            error?: string
        }

        async function identifyOneImage(url: string, index: number): Promise<IdentificationResult> {
            const startTime = new Date().toISOString()
            try {
                logT(`[PHASE1] [${index + 1}/${imageUrls.length}] Identifying: ${url.split('/').pop()?.substring(0, 40)}...`)

                const analysisPrompt = `Actúa como un experto en electrodomésticos y equipamiento de hogar con gran agudeza visual.
Analiza la imagen e identifica el objeto más prominente (lavadora, cafetera, tv, etc.).

REGLA DE ORO #1: Es ESCANEABLE cualquier electrodoméstico, aparato electrónico o su mando a distancia. 
REGLA DE ORO #2: Si hay varios aparatos, identifícalo el MÁS PROMINENTE o CENTRAL.
REGLA DE ORO #3: NO omitas elementos como Cafeteras, Hervidores, Tostadoras o Microondas solo porque no veas una etiqueta técnica. Su presencia física es suficiente.
REGLA DE ORO #4: El idioma del "appliance_type" debe ser OBLIGATORIAMENTE ESPAÑOL y en MAYÚSCULAS.

FORMATO DE SALIDA (JSON ESTRICTO):
{
  "appliance_type": "CAFETERA | HERVIDOR | TV | HORNO | LAVADORA | CAMPANA | AIRE ACONDICIONADO | etc.",
  "is_scannable": true,
  "brand": "Marca detectada",
  "model": "Modelo exacto si se ve código, o nombre de la línea (ej: Barista) o descripción física",
  "is_remote_control": true | false,
  "confidence": 0.0-1.0,
  "reasoning_spanish": "Por qué has decidido que es este aparato"
}`
                const geminiResponse = await analyzeImageWithGemini(url, analysisPrompt)
                const analysisText = geminiResponse?.data

                let analysis: any;
                if (typeof analysisText === 'object' && analysisText !== null) {
                    analysis = analysisText;
                } else if (typeof analysisText === 'string') {
                    const jsonMatch = analysisText.match(/\[?\{[\s\S]*\}?\]/);
                    const rawJson = jsonMatch ? jsonMatch[0] : '{}';
                    analysis = JSON.parse(rawJson);
                }
                analysis = Array.isArray(analysis) ? analysis[0] : analysis;

                if (!analysis || !analysis.is_scannable || (analysis.confidence || 0) < 0.3) {
                    logT(`[PHASE1] [${index + 1}] Skipping: Not scannable.`)
                    return { url, analysis: null, success: true }
                }

                // Save identification record
                const { data: imgRecord } = await supabase.from('appliance_images').insert({
                    property_id: propertyId,
                    image_url: url,
                    analysis_result: analysis,
                    status: 'identified',
                    analysis_started_at: startTime,
                    analysis_finished_at: new Date().toISOString(),
                    ai_model: 'gemini-2.0-flash',
                    tokens_prompt: geminiResponse?.usage?.prompt_tokens,
                    tokens_completion: geminiResponse?.usage?.candidates_tokens
                }).select().single()

                logT(`[PHASE1] [${index + 1}] ✅ Identified: ${analysis.appliance_type} (${analysis.brand || '?'})`)
                return { url, analysis, imgRecordId: imgRecord?.id, success: true }
            } catch (err: any) {
                logT(`[PHASE1] [${index + 1}] ERROR: ${err.message}`)
                return { url, analysis: null, success: false, error: err.message }
            }
        }

        // Run ALL identifications in parallel (fast!)
        logT(`[PHASE1] Running ${imageUrls.length} identifications in parallel (concurrency: ${CONCURRENCY_LIMIT})...`)
        const identifications: IdentificationResult[] = []

        for (let i = 0; i < imageUrls.length; i += CONCURRENCY_LIMIT) {
            const batch = imageUrls.slice(i, i + CONCURRENCY_LIMIT)
            const batchResults = await Promise.allSettled(
                batch.map((url, batchIdx) => identifyOneImage(url, i + batchIdx))
            )
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    identifications.push(result.value)
                } else {
                    identifications.push({ url: 'unknown', analysis: null, success: false, error: result.reason?.message })
                }
            }
        }

        const identifiedAppliances = identifications.filter(r => r.success && r.analysis)
        logT(`[PHASE1] ✅ Identification complete: ${identifiedAppliances.length} appliances found out of ${imageUrls.length} images`)

        // Update status → identified (inventory can be populated now!)
        await supabase
            .from('properties')
            .update({ inventory_status: 'generating' })
            .eq('id', propertyId)

        // Sync inventory list so InventorySelector can show detected items
        await syncPropertyApplianceList(propertyId, tenant_id)
        revalidatePath(`/dashboard/properties/${propertyId}`)

        // ═══════════════════════════════════════════════════════════
        // PHASE 2: BACKGROUND MANUAL GENERATION (fire-and-forget)
        // Generates full manuals — runs while user continues wizard
        // ═══════════════════════════════════════════════════════════
        const generateManualsInBackground = async () => {
            try {
                logT(`[PHASE2] Starting background manual generation for ${identifiedAppliances.length} appliances...`)
                const MANUAL_CONCURRENCY = 3;

                async function generateOneManual(item: IdentificationResult, index: number): Promise<{ success: boolean; error?: string }> {
                    try {
                        const { url, analysis, imgRecordId } = item
                        logT(`[PHASE2] [${index + 1}/${identifiedAppliances.length}] Generating manual: ${analysis.appliance_type} (${analysis.brand || '?'})`)

                        // Fetch grounding data + error codes in parallel
                        const [groundingResult, errorCodesResult] = await Promise.allSettled([
                            fetchGroundingData(analysis.brand, analysis.model, analysis.appliance_type),
                            fetchErrorCodes(analysis.brand, analysis.model, analysis.appliance_type)
                        ])
                        const groundingData = groundingResult.status === 'fulfilled' ? groundingResult.value : ''
                        const errorCodesData = errorCodesResult.status === 'fulfilled' ? errorCodesResult.value : ''
                        logT(`[PHASE2] [${index + 1}] Context: ${groundingData?.length || 0} chars technical + ${errorCodesData?.length || 0} chars errors`)

                        // Generate manual (uses EXISTING prompt — untouched)
                        const manualContent = await generateManualSinglePass(url, analysis, groundingData, errorCodesData)

                        if (!manualContent || manualContent.length < 300) {
                            throw new Error('Generated manual too short/empty')
                        }
                        logT(`[PHASE2] [${index + 1}] Manual: ${manualContent.length} chars`)

                        // Handle replace existing
                        if (replaceExisting) {
                            const normalizedTargetType = (analysis.appliance_type || '').toUpperCase().trim()
                            const { data: existingManuals } = await supabase
                                .from('property_manuals')
                                .select('id, appliance_name, brand, model')
                                .eq('property_id', propertyId)

                            const duplicate = existingManuals?.find(m => {
                                const existingType = (m.appliance_name || '').toUpperCase().trim()
                                return existingType === normalizedTargetType
                            })

                            if (duplicate) {
                                logT(`[PHASE2] [${index + 1}] Replacing existing: ${duplicate.id}`)
                                await supabase.from('property_manuals').delete().eq('id', duplicate.id)
                                await supabase.from('context_embeddings').delete().eq('source_id', duplicate.id)
                            }
                        }

                        // Save manual
                        const { data: manual, error: manError } = await supabase.from('property_manuals').insert({
                            property_id: propertyId,
                            tenant_id: tenant_id,
                            appliance_name: analysis.appliance_type || 'Aparato',
                            brand: analysis.brand,
                            model: analysis.model,
                            manual_content: manualContent,
                            metadata: {
                                confidence: 'high',
                                has_pdf: false,
                                has_web: false,
                                visual: analysis
                            }
                        }).select().single()

                        if (manError) throw manError
                        if (imgRecordId) {
                            await supabase.from('appliance_images').update({ manual_id: manual.id, status: 'completed' }).eq('id', imgRecordId)
                        }

                        // RAG vectorization
                        const chunks = splitIntoChunks(manualContent, 800)
                        const contextEmbeddings = await Promise.all(chunks.map(async chunk => {
                            const enrichedContent = `[APARATO: ${analysis.appliance_type || ''}]\n${chunk}`
                            const enrichedEmbedding = await generateOpenAIEmbedding(enrichedContent)
                            return {
                                property_id: propertyId,
                                tenant_id: tenant_id,
                                source_type: 'manual',
                                source_id: manual.id,
                                content: enrichedContent,
                                embedding: enrichedEmbedding,
                                metadata: {
                                    appliance: analysis.appliance_type,
                                    brand: analysis.brand
                                }
                            }
                        }))

                        await supabase.from('context_embeddings').delete().eq('source_id', manual.id)
                        await supabase.from('context_embeddings').insert(contextEmbeddings)

                        logT(`[PHASE2] [${index + 1}] ✅ Manual saved & vectorized`)
                        return { success: true }
                    } catch (err: any) {
                        logT(`[PHASE2] [${index + 1}] ERROR: ${err.message}`)
                        return { success: false, error: err.message }
                    } finally {
                        // Cleanup storage
                        try {
                            const urlMatch = item.url.match(/property_scans\/(.+)$/)
                            if (urlMatch) {
                                await supabase.storage.from('property_scans').remove([urlMatch[1]])
                            }
                        } catch (cleanupErr) {
                            console.error(`[PHASE2] Cleanup error:`, cleanupErr)
                        }
                    }
                }

                // Process manuals in parallel batches
                const manualResults: { success: boolean; error?: string }[] = []
                for (let i = 0; i < identifiedAppliances.length; i += MANUAL_CONCURRENCY) {
                    const batch = identifiedAppliances.slice(i, i + MANUAL_CONCURRENCY)
                    logT(`[PHASE2] Processing manual batch ${Math.floor(i / MANUAL_CONCURRENCY) + 1}: ${batch.length} manuals`)
                    const batchResults = await Promise.allSettled(
                        batch.map((item, batchIdx) => generateOneManual(item, i + batchIdx))
                    )
                    for (const result of batchResults) {
                        manualResults.push(result.status === 'fulfilled' ? result.value : { success: false, error: result.reason?.message })
                    }
                }

                // Also cleanup images that weren't scannable
                for (const item of identifications.filter(r => !r.analysis)) {
                    try {
                        const urlMatch = item.url.match(/property_scans\/(.+)$/)
                        if (urlMatch) {
                            await supabase.storage.from('property_scans').remove([urlMatch[1]])
                        }
                    } catch { }
                }

                const succeeded = manualResults.filter(r => r.success).length
                const failed = manualResults.filter(r => !r.success).length
                logT(`[PHASE2] ✅ All manuals generated. Success: ${succeeded}, Failed: ${failed}`)

                // Finalize
                await syncPropertyApplianceList(propertyId, tenant_id, supabase, true)
                await supabase
                    .from('properties')
                    .update({ inventory_status: 'completed' })
                    .eq('id', propertyId)

                logT(`[BATCH] Completed full pipeline for property ${propertyId}`)
            } catch (error: any) {
                console.error('[PHASE2] Fatal error:', error.message)
                await supabase
                    .from('properties')
                    .update({ inventory_status: 'failed' })
                    .eq('id', propertyId)
            }
        }

        // 🔥 Fire-and-forget: Phase 2 runs in background
        generateManualsInBackground()

        logT(`[BATCH] Phase 1 complete. Returning to user. Phase 2 running in background.`)
        return { success: true, identifiedCount: identifiedAppliances.length }

    } catch (error: any) {
        console.error('[BATCH] Fatal error in Phase 1:', error.message)
        await supabase
            .from('properties')
            .update({ inventory_status: 'failed' })
            .eq('id', propertyId)
        throw error
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

    // Sincronizar RAG con los datos ingeridos
    await syncWizardDataToRAG(propertyId, tenant_id, 'property', propertyUpdate)
    await syncWizardDataToRAG(propertyId, tenant_id, 'welcome', propertyUpdate.theme_config)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return { success: true }
}

/**
 * Processes a list of inventory items to generate manuals for those without one. 
 * Respects existing manuals from scanner and incorporates host context.
 */
export async function processInventoryManuals(propertyId: string, items: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    try {
        console.log(`[INVENTORY] Starting background processing for ${items.length} items...`)

        // 1. Obtener manuales existentes para no duplicar
        const { data: existingManuals } = await supabase
            .from('property_manuals')
            .select('appliance_name, brand, model')
            .eq('property_id', propertyId)

        const itemsToProcess = items.filter(item => {
            if (!item.isPresent) return false

            // Si ya existe un manual con un nombre similar, saltamos (prioridad scanner)
            const exists = existingManuals?.some(m =>
                m.appliance_name.toLowerCase().includes(item.id.toLowerCase()) ||
                item.name.toLowerCase().includes(m.appliance_name.toLowerCase())
            )
            return !exists
        })

        if (itemsToProcess.length === 0) {
            console.log('[INVENTORY] No new items to process.')
            return { success: true, processed: 0 }
        }

        console.log(`[INVENTORY] Generating ${itemsToProcess.length} new manuals...`)

        // Procesar secuencialmente para evitar rate limits de la IA si son muchos
        for (const item of itemsToProcess) {
            try {
                console.log(`[INVENTORY] Generating manual for: ${item.name}...`)

                const prompt = `Genera una guía de uso rápida y amable para un huésped sobre el siguiente elemento: ${item.name}.
                ${item.customContext ? `Información específica del anfitrión: ${item.customContext}` : ''}
                
                REGLAS CRÍTICAS:
                1. FORMATO: Markdown estructurado.
                2. TONO: Útil y directo.
                3. CONTENIDO: Indica para qué sirve y consejos básicos.
                4. NO INVENTES: No describas detalles físicos específicos (colores, materiales, tipos exactos, cantidades) que no se hayan proporcionado. Tampoco inventes marcas o modelos técnicos.
                5. Si no sabes dónde está, usa frases genéricas como "Suele encontrarse en..." o "Pregunta al anfitrión si no lo localizas".

                RESPONDE SOLO CON EL TEXTO DEL MANUAL.`

                const genResponse = await geminiREST('gemini-2.0-flash', prompt, {
                    responseMimeType: 'text/plain',
                    temperature: 0.7
                })

                const manualContent = genResponse?.data
                if (!manualContent) continue

                // Guardar Manual
                const { data: manual, error: manError } = await supabase.from('property_manuals').insert({
                    property_id: propertyId,
                    tenant_id: tenant_id,
                    appliance_name: item.name,
                    manual_content: manualContent,
                    metadata: {
                        source: 'inventory_selector',
                        item_id: item.id,
                        host_context: item.customContext
                    }
                }).select().single()

                if (manError) throw manError

                // VectorizaciÃ³n (RAG)
                const chunks = splitIntoChunks(manualContent, 800)
                const contextEmbeddings = await Promise.all(chunks.map(async chunk => {
                    const enrichedContent = `[ELEMENTO: ${item.name}]\n${item.customContext ? `Nota del anfitriÃ³n: ${item.customContext}\n` : ''}${chunk}`
                    const enrichedEmbedding = await generateOpenAIEmbedding(enrichedContent)
                    return {
                        property_id: propertyId,
                        tenant_id: tenant_id,
                        source_type: 'manual',
                        source_id: manual.id,
                        content: enrichedContent,
                        embedding: enrichedEmbedding,
                        metadata: {
                            appliance: item.name,
                            item_category: item.category
                        }
                    }
                }))

                await supabase.from('context_embeddings').delete().eq('source_id', manual.id);
                await supabase.from('context_embeddings').insert(contextEmbeddings);

            } catch (itemErr: any) {
                console.error(`[INVENTORY] Error processing ${item.name}:`, itemErr.message)
            }
        }

        // Actualizar el listado en property_context
        await syncPropertyApplianceList(propertyId, tenant_id)

        console.log(`[INVENTORY] Finished. Processed ${itemsToProcess.length} items.`)
        return { success: true, processed: itemsToProcess.length }

    } catch (error: any) {
        console.error('[INVENTORY] Fatal processing error:', error.message)
        return { success: false, error: error.message }
    }
}

/**
 * PHASE 12: Robust Manual Generation System
 */

/**
 * Helper: Extract text from PDF using Jina
 */
async function extractPDFManual(pdfUrl: string): Promise<string> {
    try {
        console.log(`[PDF EXTRACT] Fetching: ${pdfUrl}`)
        const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(pdfUrl)}`, {
            timeout: 30000,
            headers: { 'X-Return-Format': 'markdown' }
        })
        return response.data
    } catch (error) {
        console.error(`[PDF EXTRACT] Failed for ${pdfUrl}:`, error)
        return ""
    }
}

/**
 * Strategy 1: Smart Search for Official PDF or Web Documentation
 */
async function findOfficialManual(brand: string, model: string, appliance_type: string): Promise<{
    pdfUrl?: string,
    webDocs: string[],
    confidence: 'high' | 'medium' | 'low'
}> {
    const strategies = [
        `"${brand}" "${model}" manual instrucciones filetype:pdf`,
        `"${model}" "E-Nr" manual usuario filetype:pdf`,
        `site:${getOfficialDomain(brand)} "${model}" manual`,
        `"${normalizeModel(model)}" manual pdf`,
        `"${brand}" ${appliance_type} manual instrucciones pdf`,
        `site:manualslib.com OR site:manualscat.com "${brand}" "${model}"`
    ]

    let pdfUrl: string | undefined
    let webDocs: string[] = []
    let bestConfidence: 'high' | 'medium' | 'low' = 'low'

    for (const [index, query] of strategies.entries()) {
        console.log(`[MANUAL SEARCH] Strategy ${index + 1}: ${query}`)
        try {
            const results = await searchBrave(query)
            if (!results.web?.results) continue

            const pdfs = results.web.results
                .filter((r: any) => r.url.toLowerCase().endsWith('.pdf'))
                .map((r: any) => r.url)

            if (pdfs.length > 0) {
                pdfUrl = pdfs[0]
                bestConfidence = index < 2 ? 'high' : 'medium'
                console.log(`[MANUAL SEARCH] âœ… Found PDF: ${pdfUrl}`)
                break
            }

            const relevantDocs = results.web.results
                .filter((r: any) =>
                    r.url.includes(brand.toLowerCase()) ||
                    r.url.includes('manual') ||
                    (r.description && r.description.toLowerCase().includes(model.toLowerCase()))
                )
                .slice(0, 3)
                .map((r: any) => r.url)

            webDocs.push(...relevantDocs)
        } catch (error) {
            console.error(`[MANUAL SEARCH] Strategy ${index + 1} failed:`, error)
        }
        await new Promise(res => setTimeout(res, 1000))
    }

    return {
        pdfUrl,
        webDocs: [...new Set(webDocs)],
        confidence: pdfUrl ? bestConfidence : 'low'
    }
}

function getOfficialDomain(brand: string): string {
    const domains: Record<string, string> = {
        'balay': 'balay.es',
        'bosch': 'bosch-home.es',
        'siemens': 'siemens-home.bsh-group.com',
        'teka': 'teka.com',
        'whirlpool': 'whirlpool.es',
        'lg': 'lg.com',
        'samsung': 'samsung.com'
    }
    return domains[brand.toLowerCase()] || `${brand.toLowerCase()}.com`
}

function normalizeModel(model: string): string {
    return model.replace(/[\/\-\s]/g, '').toUpperCase()
}

/**
 * Strategy 2: Scraping Fragmented Documentation
 */
async function scrapeManualContent(urls: string[]): Promise<string> {
    let aggregatedContent = ''
    for (const url of urls.slice(0, 3)) {
        try {
            console.log(`[WEB SCRAPE] Fetching: ${url}`)
            const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(url)}`, {
                timeout: 20000,
                headers: { 'X-Return-Format': 'markdown' }
            })
            const content = response.data
            const relevantSections = extractRelevantSections(content)
            aggregatedContent += `\n\n## Fuente: ${url}\n${relevantSections}`
        } catch (error) {
            console.error(`[WEB SCRAPE] Failed for ${url}:`, error)
        }
    }
    return aggregatedContent
}

function extractRelevantSections(markdown: string): string {
    const keywords = [
        'funciÃ³n', 'sÃ­mbolo', 'programa', 'temperatura',
        'mando', 'panel', 'control', 'uso', 'instrucciÃ³n',
        'modo', 'cocciÃ³n', 'nivel', 'accesorio'
    ]
    const lines = markdown.split('\n')
    let relevantContent = ''
    let buffer: string[] = []
    let isRelevant = false

    for (const line of lines) {
        const lowerLine = line.toLowerCase()
        if (keywords.some(kw => lowerLine.includes(kw))) {
            isRelevant = true
        }
        if (isRelevant && (line.trim() === '' || line.startsWith('#'))) {
            if (buffer.length > 0) {
                relevantContent += buffer.join('\n') + '\n\n'
                buffer = []
            }
            isRelevant = line.startsWith('#') && keywords.some(kw => lowerLine.includes(kw))
        }
        if (isRelevant) {
            buffer.push(line)
        }
    }
    return relevantContent + buffer.join('\n')
}

/**
 * AnÃ¡lisis visual en 2 fases MEJORADO - con validaciÃ³n de respuesta
 */
async function analyzeControlPanelVisually(imageUrl: string): Promise<{
    brand?: string,
    estimatedModel?: string,
    controls: any,
    layout: any
}> {

    // FASE 1: IdentificaciÃ³n BÃ¡sica
    const identificationPrompt = `Analiza detenidamente esta imagen de un panel de control de electrodomÃ©stico.

ðŸŽ¯ TAREAS OBLIGATORIAS:

1. **Identificar la marca:**
   - Busca logos, texto, tipografÃ­a
   - Si ves "Balay", "Bosch", etc., indÃ­calo
   - Si no hay marca visible, pon "desconocida"

2. **Tipo de aparato:**
   - Â¿Horno? Â¿Microondas? Â¿Placa? Â¿Lavavajillas?
   - Razona por los sÃ­mbolos que ves

3. **CaracterÃ­sticas del panel:**
   - Â¿Hay pantalla digital? Â¿QuÃ© nÃºmeros/texto muestra?
   - Â¿CuÃ¡ntos mandos hay?
   - Â¿QuÃ© rango de temperatura se ve en el mando derecho?

RESPONDE SOLO CON ESTE JSON (SIN MARKDOWN, SIN EXPLICACIONES):
{
  "brand": "marca vista o desconocida",
  "confidence_brand": 0.8,
  "appliance_type": "HORNO",
  "panel_type": "digital_mixto",
  "has_retractable_knobs": false,
  "temperature_range": "50-250",
  "display_shows": "11:49",
  "reasoning": "Se ve logo Balay, display digital con reloj, mandos giratorios"
}`

    let phase1Response
    try {
        phase1Response = await analyzeImageWithGemini(imageUrl, identificationPrompt, {
            responseMimeType: 'application/json' as any,
            temperature: 0.2
        } as any)
    } catch (err: any) {
        console.error('[VISUAL ANALYSIS] Phase 1 failed:', err.message)
        return {
            brand: 'desconocida',
            controls: {},
            layout: { appliance_type: 'HORNO', confidence_brand: 0 }
        }
    }

    const phase1 = phase1Response?.data || {}
    console.log('[VISUAL ANALYSIS] Phase 1 result:', JSON.stringify(phase1, null, 2))

    // FASE 2: Mapeo DETALLADO de Controles
    const controlMappingPrompt = `Ahora ENUMERA CADA SÃMBOLO/CONTROL visible en la imagen.

ðŸ” MANDO IZQUIERDO (selector de funciones):
Recorre el mando en sentido horario desde las 12 y lista TODOS los sÃ­mbolos/iconos que veas.

Ejemplo de formato esperado:
- PosiciÃ³n 12h: "sÃ­mbolo de bombilla" (iluminaciÃ³n)
- PosiciÃ³n 1h: "ventilador con cÃ­rculo" (aire caliente)
- PosiciÃ³n 3h: "dos lÃ­neas horizontales" (calor superior/inferior)
... (continÃºa hasta completar el cÃ­rculo)

ðŸ” MANDO DERECHO (temperatura):
- Â¿QuÃ© nÃºmeros ves? (ej: 50, 100, 150, 200, 250)
- Â¿Hay marcas intermedias?

ðŸ” PANTALLA DIGITAL:
- Â¿QuÃ© muestra actualmente? (ej: "11:49")
- Â¿QuÃ© botones/iconos hay a su alrededor? (campana, +, -, reloj, etc.)

RESPONDE SOLO CON ESTE JSON (COMPLETA TODOS LOS CAMPOS):
{
  "left_knob": {
    "type": "selector_funciones",
    "symbols": [
      {
        "position": "12h",
        "description": "bombilla o luz",
        "likely_meaning": "IluminaciÃ³n interior"
      },
      {
        "position": "1h",
        "description": "describe lo que VES",
        "likely_meaning": "interpreta segÃºn sÃ­mbolo estÃ¡ndar"
      }
    ]
  },
  "right_knob": {
    "type": "temperatura",
    "visible_numbers": ["50", "100", "150", "200", "250"],
    "min_value": "50",
    "max_value": "250",
    "has_intermediate_marks": true
  },
  "digital_display": {
    "current_display": "11:49",
    "has_display": true,
    "adjacent_buttons": [
      {
        "icon": "campana",
        "position": "izquierda del display",
        "likely_function": "temporizador/alarma"
      },
      {
        "icon": "-",
        "position": "centro-izquierda",
        "likely_function": "decrementar tiempo"
      }
    ]
  }
}`

    let phase2Response
    try {
        phase2Response = await analyzeImageWithGemini(imageUrl, controlMappingPrompt, {
            responseMimeType: 'application/json' as any,
            temperature: 0.15
        } as any)
    } catch (err: any) {
        console.error('[VISUAL ANALYSIS] Phase 2 failed:', err.message)
        return {
            brand: phase1.brand,
            controls: {},
            layout: phase1
        }
    }

    const phase2 = phase2Response?.data || {}
    console.log('[VISUAL ANALYSIS] Phase 2 result:', JSON.stringify(phase2, null, 2))

    // ValidaciÃ³n: si no detectÃ³ sÃ­mbolos, reintentar con prompt simplificado
    if (!phase2.left_knob?.symbols || phase2.left_knob.symbols.length < 3) {
        console.warn('[VISUAL ANALYSIS] Phase 2 detected too few symbols, retrying...')

        const retryPrompt = `Mira detenidamente el MANDO IZQUIERDO de este horno.

Â¿CUÃNTOS sÃ­mbolos/iconos diferentes ves alrededor del mando?
Para CADA UNO, describe brevemente quÃ© figura ves (ventilador, lÃ­neas, grill, etc.)

IMPORTANTE: Debe haber al menos 6-8 sÃ­mbolos. Si solo ves 1-2, estÃ¡s mirando mal.

FORMATO JSON:
{
  "symbol_count": 8,
  "symbols": [
    {"desc": "bombilla", "meaning": "luz"},
    {"desc": "ventilador en cÃ­rculo", "meaning": "aire caliente"}
  ]
}`

        const retryResponse = await analyzeImageWithGemini(imageUrl, retryPrompt, {
            responseMimeType: 'application/json' as any,
            temperature: 0.3
        } as any)

        if (retryResponse?.data?.symbols?.length > (phase2.left_knob?.symbols?.length || 0)) {
            console.log('[VISUAL ANALYSIS] Retry found more symbols, using retry data')
            phase2.left_knob = {
                type: 'selector_funciones',
                symbols: retryResponse.data.symbols.map((s: any, i: number) => ({
                    position: `${i + 1}h`,
                    description: s.desc,
                    likely_meaning: s.meaning
                }))
            }
        }
    }

    return {
        brand: phase1.brand || 'desconocida',
        estimatedModel: phase1.confidence_brand > 0.7 ? 'modelo_visual' : undefined,
        controls: phase2,
        layout: phase1
    }
}

/**
 * PHASE 12 (Modular): Multi-Phase Manual Generation
 * This prevents the model from entering infinite loops by breaking the manual into smaller, focused parts.
 */

async function generateSymbolsFromPDF(
    imageUrl: string,
    pdfContent: string,
    visualAnalysis: any
): Promise<string> {
    const prompt = `EstÃ¡s creando la secciÃ³n de SÃMBOLOS Y CONTROLES de una guÃ­a de uso.

ðŸ“„ MANUAL OFICIAL DISPONIBLE:
${pdfContent.substring(0, 20000)}

ðŸ‘ï¸ PANEL VISIBLE EN LA IMAGEN:
- Mando izquierdo: selector de funciones
- Mando derecho: temperatura (${visualAnalysis.controls?.right_knob?.min_value || '50'} - ${visualAnalysis.controls?.right_knob?.max_value || '250'}Â°C)
- Display digital: muestra ${visualAnalysis.controls?.digital_display?.current_display || 'tiempo/temperatura'}

ðŸŽ¯ TAREA: Crear una tabla markdown con MÃXIMO 15 FILAS listando los modos de cocciÃ³n del mando izquierdo.

**FORMATO ESTRICTO:**

## 1. Panel de Control

### Mando de Funciones (Izquierda)
Este mando selecciona el modo de cocciÃ³n. Los principales modos son:

| SÃ­mbolo | Nombre del Modo | Para quÃ© sirve | Temp. Recomendada |
|---------|----------------|----------------|-------------------|
| â˜€ï¸ | Calor Superior/Inferior | Horneado tradicional de pasteles y asados | 180-200Â°C |
| ðŸŒ€ | Aire Caliente 3D | Hornear en varios niveles simultÃ¡neamente | 160-180Â°C |
| ... | ... | ... | ... |

### Mando de Temperatura (Derecha)
- **Rango:** ${visualAnalysis.controls?.right_knob?.min_value || '50'}-${visualAnalysis.controls?.right_knob?.max_value || '250'}Â°C
- **Uso:** Gira el mando hasta la temperatura deseada. El horno comenzarÃ¡ a calentar.

### Pantalla Digital
${visualAnalysis.controls?.digital_display ?
            `Muestra el tiempo de cocciÃ³n programado y otras funciones.
- **Botones:** ${visualAnalysis.controls.digital_display.adjacent_buttons?.map((b: any) => b.icon).join(', ') || 'Temporizador, ajustes'}` :
            'Este modelo tiene pantalla digital para programar tiempos.'}

ðŸš« IMPORTANTE:
- NO repitas el header de la tabla
- NO generes mÃ¡s de 15 filas
- USA sÃ­mbolos emoji cuando no puedas ver el icono exacto
- Si el manual menciona un modo que no ves en la imagen, inclÃºyelo (estÃ¡ en otra posiciÃ³n del mando)

RESPONDE SOLO CON EL CONTENIDO DE LA SECCIÃ“N EN MARKDOWN (sin tÃ­tulo h1).`

    const response = await analyzeImageWithGemini(imageUrl, prompt, {
        responseMimeType: 'text/plain',
        temperature: 0.15,
        maxOutputTokens: 2000,
        stopSequences: ['##', '# ', '\n\n\n']
    } as any)

    return response?.data || '## 1. Panel de Control\n\n(No se pudo generar esta secciÃ³n)'
}

/**
 * Helper to fetch and convert image to base64 for multimodal prompts
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string, mimeType: string } | null> {
    try {
        const response = await fetch(imageUrl)
        if (!response.ok) return null
        const buffer = await response.arrayBuffer()
        return {
            data: Buffer.from(buffer).toString('base64'),
            mimeType: response.headers.get('content-type') || 'image/jpeg'
        }
    } catch (e) {
        console.error('[BASE64] Error fetching image:', e)
        return null
    }
}

async function generateSymbolsFromVisual(
    imageUrl: string,
    visualAnalysis: any
): Promise<string> {

    // Extraer datos del anÃ¡lisis
    const symbolsDetected = visualAnalysis.controls?.left_knob?.symbols || []
    const displayData = visualAnalysis.controls?.digital_display || {}
    const tempData = visualAnalysis.controls?.right_knob || {}

    console.log(`[SYMBOLS] Technical multimodal mapping for ${visualAnalysis.brand}`)

    const imageData = await fetchImageAsBase64(imageUrl)

    const prompt = `Eres un Ingeniero TÃ©cnico experto en electrodomÃ©sticos. Tu tarea es mirar la foto del panel de control adjunta y generar una tabla tÃ©cnica de sÃ­mbolos.

DATOS PREVIAMENTE DETECTADOS (Ãšsalos como guÃ­a):
${JSON.stringify({ brand: visualAnalysis.brand, symbolsDetected, displayData, tempData }, null, 2)}

ðŸŽ¯ TAREA:
1. Mira la imagen y confirma los sÃ­mbolos del mando izquierdo.
2. Genera una TABLA MARKDOWN con cada sÃ­mbolo. 
3. Usa nombres tÃ©cnicos precisos (ej. "Aire Caliente 3D", "Llama progresiva", "AquÃ¡lisis").
4. Si es Balay/Bosch/Siemens, aplica la terminologÃ­a oficial.
5. NO digas "no te preocupes por esto". Identifica cada icono con su funciÃ³n.

<thinking>
[Analiza visualmente la imagen. Identifica el modelo (ej: Balay Serie 3). Mapea los iconos del selector a funciones reales de ese modelo especÃ­fico]
</thinking>

## 1. Panel de Control y Funciones

### Selector de Funciones (Izquierda)
Gira este mando para elegir el modo de cocciÃ³n. Basado en el panel de este modelo:

| SÃ­mbolo | FunciÃ³n TÃ©cnica | AplicaciÃ³n PrÃ¡ctica |
|:-------:|:----------------|:--------------------|
${symbolsDetected.map((s: any) =>
        `| ${s.description} | **${s.likely_meaning}** | [Explica el beneficio para el usuario] |`
    ).join('\n')}

### Selector de Temperatura (Derecha)
Control de temperatura analÃ³gico (${tempData.min_value || '50'}-${tempData.max_value || '275'}Â°C).
- **Luz de control:** Se apaga cuando el horno alcanza la temperatura seleccionada.

### Pantalla y Botones
${displayData.has_display ?
            `Muestra "${displayData.current_display}". Botones:
${displayData.adjacent_buttons?.map((b: any) => `- **${b.icon}:** ${b.likely_function}`).join('\n')}

âš ï¸ **CRÃTICO:** Si el reloj parpadea, el horno NO calentarÃ¡. Ajusta la hora con +/- para activar el aparato.` :
            'Modelo analÃ³gico sin requisitos de ajuste de hora para calentar.'}

ðŸš« LÃMITES:
- Usa un lenguaje tÃ©cnico profesional.
- No inventes sÃ­mbolos que no veas en la foto.
- MÃ¡ximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.0-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.1,
        maxOutputTokens: 2000
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''

    return cleanContent || '## 1. Panel de Control\n\n(Error en mapeo visual)'
}

/**
 * Fallback: genera tabla mirando directamente la imagen
 */
async function generateSymbolsTableFallback(imageUrl: string, visualAnalysis: any): Promise<string> {
    const prompt = `Mira esta imagen del panel de control.

EN EL MANDO IZQUIERDO: Describe visualmente TODOS los sÃ­mbolos que veas (debe haber entre 6-10).
EN EL MANDO DERECHO: Â¿QuÃ© nÃºmeros de temperatura estÃ¡n marcados?
EN LA PANTALLA: Â¿Hay display digital? Â¿QuÃ© botones tiene alrededor?

Genera una tabla markdown con esta estructura:

## 1. Panel de Control

### Mando de Funciones (Izquierda)
| SÃ­mbolo Visible | FunciÃ³n Estimada | Uso TÃ­pico |
|----------------|-----------------|-----------|
| [describe sÃ­mbolo 1] | [funciÃ³n] | [cuÃ¡ndo usarlo] |
| [describe sÃ­mbolo 2] | [funciÃ³n] | [cuÃ¡ndo usarlo] |
... (continÃºa para TODOS los sÃ­mbolos)

### Mando de Temperatura (Derecha)
[Describe el rango y nÃºmeros visibles]

### Pantalla
[Describe quÃ© ves]

IMPORTANTE: Lista TODOS los sÃ­mbolos visibles, no solo 1-2.
RESPONDE SOLO CON MARKDOWN.`

    const response = await analyzeImageWithGemini(imageUrl, prompt, {
        responseMimeType: 'text/plain' as any,
        temperature: 0.25,
        maxOutputTokens: 1500
    } as any)

    return response?.data || '## 1. Panel de Control\n\n(Error al generar tabla)'
}

async function generateSymbolsTable(
    imageUrl: string,
    pdfContent: string | undefined,
    visualAnalysis: any
): Promise<string> {
    if (pdfContent && pdfContent.length > 5000) {
        return await generateSymbolsFromPDF(imageUrl, pdfContent, visualAnalysis)
    } else {
        return await generateSymbolsFromVisual(imageUrl, visualAnalysis)
    }
}

async function generateInstructions(
    pdfContent: string | undefined,
    webContent: string | undefined,
    visualAnalysis: any,
    imageUrl?: string
): Promise<string> {

    const hasReliableSource = (pdfContent && pdfContent.length > 5000) ||
        (webContent && webContent.length > 3000)

    const baseContext = pdfContent || webContent || ''
    const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null

    const prompt = `Escribe la secciÃ³n de INSTRUCCIONES DE USO basada en la foto y documentaciÃ³n adjunta.

${hasReliableSource ?
            `ðŸ“„ DOCUMENTACIÃ“N TÃ‰CNICA:
${baseContext.substring(0, 10000)}` :
            `âš ï¸ Contexto: Horno ${visualAnalysis.brand || 'genÃ©rico'} similar a Balay Serie 3.`}

ðŸŽ¯ TAREA:
Genera una guÃ­a paso a paso directa y tÃ©cnica sobre cÃ³mo cocinar con este aparato especÃ­fico. SIN SALUDOS.

<thinking>
[Revisa la imagen. Â¿Tiene mandos ocultos? Â¿CÃ³mo se pone en hora el reloj de este modelo? Explica el flujo de precalentamiento]
</thinking>

## 2. Instrucciones de Uso

### Puesta en Marcha
1. **Ajuste del Reloj:** Si el display parpadea, ajusta la hora de inmediato. El aparato bloquea el calor por seguridad hasta que tiene hora fija.
2. **Mandos:** ${visualAnalysis.layout?.has_retractable_knobs ? 'Presiona los mandos para que salgan.' : 'Los mandos son fijos.'}

### CÃ³mo Cocinar paso a paso
1. **SelecciÃ³n:** Gira el mando izquierdo a la funciÃ³n elegida.
2. **Temperatura:** Selecciona los grados en el mando derecho.
3. **Precalentamiento:** Deja que el horno alcance la temperatura antes de introducir los alimentos.
4. **FinalizaciÃ³n:** Gira ambos selectores a la posiciÃ³n '0'.

ðŸš« LÃMITES:
- Estilo directo y profesional.
- Sin introducciones amables.
- MÃ¡ximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.0-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.15,
        maxOutputTokens: 1500 as any,
        stopSequences: ['##', '# '] as any
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''

    return cleanContent || '## 2. Instrucciones de Uso\n\n(No disponible)'
}

async function generateTipsAndMaintenance(
    pdfContent: string | undefined,
    visualAnalysis: any,
    imageUrl?: string
): Promise<string> {
    const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null

    const prompt = `Genera la secciÃ³n de LIMPIEZA Y SOLUCIÃ“N DE PROBLEMAS basada en la imagen. SIN SALUDOS.

<thinking>
[Identifica si es Balay/Bosch/Siemens. Inyecta detalles de AQUÃLISIS especÃ­ficos (400ml, 80Â°C, 4min). Crea tabla de PROBLEMAS | CAUSAS | SOLUCIONES]
</thinking>

## 3. Limpieza y SoluciÃ³n de Problemas

### Mantenimiento y AquÃ¡lisis
Si tu modelo incluye AquÃ¡lisis (identificable por el icono de una gota de agua):
1. Con el horno frÃ­o, vierte **400 ml de agua** con una gota de jabÃ³n en la base.
2. Activa la funciÃ³n **AquÃ¡lisis** o calor inferior a **80Â°C**.
3. Deja funcionar **4 minutos** y apaga.
4. Tras enfriar, retira la suciedad con una bayeta.

### Tabla de ResoluciÃ³n de Errores
| Problema Detectado | Causa Frecuente | AcciÃ³n del Usuario |
|:-------------------|:----------------|:-------------------|
| No calienta (display parpadea) | Reloj desajustado | Configura la hora con +/- |
| Icono de Llave encendido | Bloqueo activo | Pulsa botÃ³n llave durante 4 seg |
| Ruido tras apagarlo | Enfriamiento electrÃ³nico | Normal, pararÃ¡ solo en unos minutos |
| CondensaciÃ³n excesiva | Vapor de alimentos | Seca el interior tras usarlo |

ðŸš« LÃMITES:
- Solo informaciÃ³n Ãºtil y tÃ©cnica.
- MÃ¡ximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.0-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.1,
        maxOutputTokens: 1500
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''

    return cleanContent || '## 3. Consejos\n\n- Usa con precauciÃ³n\n- Limpia despuÃ©s de usar'
}

/**
 * Step 1.5: Fetch Technical Data via Text-only Grounding (FAST)
 */
async function fetchGroundingData(brand: string, model: string, type: string): Promise<string> {
    const query = `Busca informaciÃ³n tÃ©cnica detallada, ficha de producto y SOLUCIÃ“N DE PROBLEMAS (tabla de errores) para el siguiente aparato: ${brand} ${type} ${model}.
    Necesito saber:
    1. Capacidad real y potencia.
    2. Significado de botones o luces.
    3. Tiempos de funcionamiento/espera estÃ¡ndar.
    4. Tabla de errores frecuentes y cÃ³mo resetearlo.
    
    TODO DEBE ESTAR EN ESPAÃ‘OL.
    IMPORTANTE: Dame solo los datos crudos, sin formato de manual aÃºn.`

    const { data: groundingData, error } = await geminiREST('gemini-2.0-flash', query, {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: 'text/plain', // MANDATORY to avoid JSON parse error
        useGrounding: true
    } as any)

    if (error) {
        console.error('[GROUNDING-FETCH] Error:', error)
        return ''
    }

    return (groundingData as string) || ''
}

/**
 * Step 1.6: Fetch Error Codes via Grounding (dedicated search)
 */
async function fetchErrorCodes(brand: string, model: string, type: string): Promise<string> {
    const hasSpecificModel = model && model !== 'No identificado' && model !== 'Desconocido' && model.length > 2

    const query = hasSpecificModel
        ? `Lista COMPLETA de códigos de error y diagnóstico de problemas del ${brand} ${type} modelo ${model}.
Para CADA código o señal de error incluye:
1. Código o indicador (ej: E1, F3, parpadeo 5 veces, icono llave, pitidos)
2. Significado del error
3. Solución paso a paso que puede hacer el usuario en casa
4. Cuándo es necesario contactar con soporte técnico

IMPORTANTE: Incluye TAMBIÉN problemas comunes sin código (no enciende, ruidos extraños, fugas, etc.)
TODO EN ESPAÑOL.`
        : `Lista de códigos de error y problemas más comunes en ${type}s de la marca ${brand}.
Para CADA código o señal incluye:
1. Código o indicador
2. Qué significa
3. Cómo solucionarlo (usuario)
4. Cuándo necesita un profesional

Incluye también problemas comunes sin código específico.
TODO EN ESPAÑOL.`

    try {
        logT(`[ERROR-CODES] Searching error codes for ${brand} ${model || type} (specific: ${hasSpecificModel})...`)

        const { data, error } = await geminiREST('gemini-2.0-flash', query, {
            temperature: 0.1,
            maxOutputTokens: 3000,
            responseMimeType: 'text/plain',
            useGrounding: true
        } as any)

        if (error) {
            logT(`[ERROR-CODES] Grounding error: ${error}`)
            return ''
        }

        const result = (data as string) || ''
        logT(`[ERROR-CODES] Obtained ${result.length} chars of error code data`)

        // Fallback to Brave if grounding returned too little
        if (result.length < 200) {
            logT(`[ERROR-CODES] Grounding data insufficient, trying Brave Search fallback...`)
            return await fetchErrorCodesFromBrave(brand, model, type)
        }

        return result
    } catch (err: any) {
        logT(`[ERROR-CODES] Error: ${err.message}. Trying Brave fallback...`)
        return await fetchErrorCodesFromBrave(brand, model, type)
    }
}

/**
 * Brave Search fallback for error codes
 */
async function fetchErrorCodesFromBrave(brand: string, model: string, type: string): Promise<string> {
    try {
        const searchQuery = model && model !== 'No identificado' && model !== 'Desconocido'
            ? `${brand} ${model} ${type} códigos error solución`
            : `${brand} ${type} códigos error comunes solución`

        const braveResults = await searchBrave(searchQuery, 5, true)
        const braveFormatted = formatBraveResults(braveResults)

        if (braveFormatted.length < 100) {
            logT('[ERROR-CODES-BRAVE] No useful results from Brave')
            return ''
        }

        // Consolidate Brave results into structured error codes
        const { data: consolidated } = await geminiREST('gemini-2.0-flash',
            `Extrae y organiza SOLO los códigos de error y soluciones de estos resultados de búsqueda para ${brand} ${type}.

Formato para cada error:
- Código/Señal: [código]
- Significado: [qué pasa]
- Solución: [qué hacer]
- Requiere técnico: [sí/no]

Resultados de búsqueda:
${braveFormatted.substring(0, 8000)}

SOLO errores y soluciones, sin más. EN ESPAÑOL.`,
            {
                temperature: 0.1,
                maxOutputTokens: 2000,
                responseMimeType: 'text/plain'
            }
        )

        const result = (consolidated as string) || ''
        logT(`[ERROR-CODES-BRAVE] Consolidated ${result.length} chars of error data`)
        return result
    } catch (err: any) {
        logT(`[ERROR-CODES-BRAVE] Error: ${err.message}`)
        return ''
    }
}

/**
 * Returns type-specific instructions for manual generation based on appliance type.
 * Ensures that manuals for each appliance type request the specific, practical information guests need.
 */
function getApplianceSpecificInstructions(applianceType: string): string {
    const type = (applianceType || '').toLowerCase();

    // ═══════════════════════════════════════════════════════
    // COCINA
    // ═══════════════════════════════════════════════════════
    if (/horno/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA HORNO:
- Lista TODOS los modos/programas de cocción con su símbolo y PARA QUÉ SIRVE cada uno en la vida real:
  * Calor arriba y abajo (convencional): para qué platos
  * Aire caliente / convección: cuándo usarlo
  * Grill: para qué
  * Grill + aire: para qué
  * Función pizza (calor inferior + ventilador): para qué
  * Modo eco: cuándo usarlo
  * Cualquier otro modo disponible
- Explica cómo PROGRAMAR el tiempo de cocción (pantalla/botones)
- Describe el sistema de LIMPIEZA (pirolisis, aqualisis, vapor) si lo tiene
- Precalentamiento: cómo saber cuándo está listo
- Si tiene bloqueo infantil, cómo activar/desactivar
- Recomienda la MEJOR función según tipo de plato (pizza, asado, bizcocho, gratinado)`;
    }

    if (/vitrocerámica|vitroceramica|placa|inducción|induccion|encimera/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA PLACA DE COCCIÓN:
- Identifica CADA zona de cocción (cuántas, tamaño, posición)
- Niveles de potencia disponibles y para qué tipo de cocción sirve cada rango
- Función BOOST/Power: qué hace y cuándo usarla
- Cómo ENCENDER y APAGAR cada zona
- Bloqueo infantil: cómo activar/desactivar
- Indicador de calor residual: qué significa
- Si es inducción: qué recipientes son compatibles
- Temporizador individual por zona si lo tiene`;
    }

    if (/microondas/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA MICROONDAS:
- Lista TODOS los niveles de potencia con PARA QUÉ usar cada uno:
  * Potencia máxima: calentar líquidos, cocinar rápido
  * Media: recalentar comida, cocinar
  * Baja: descongelar, fundir chocolate/mantequilla
- Función DESCONGELACIÓN: cómo usarla (por peso o por tiempo)
- Función GRILL si la tiene: para qué
- Función COMBINADO (micro+grill) si la tiene
- Programas automáticos si los tiene (palomitas, pizza, bebidas)
- Tiempos orientativos para las tareas más comunes
- Recipientes que NO se pueden usar (metal, aluminio)`;
    }

    if (/campana|extractor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CAMPANA EXTRACTORA:
- Velocidades disponibles y cuándo usar cada una
- Función intensiva/turbo si la tiene
- Cómo encender/apagar la luz
- Filtros: tipo (carbón activo, metálico) y cuándo cambiarlos/limpiarlos
- Si tiene temporizador automático`;
    }

    // ═══════════════════════════════════════════════════════
    // LAVADO Y LIMPIEZA
    // ═══════════════════════════════════════════════════════
    if (/lavadora/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA LAVADORA:
- Lista TODOS los programas de lavado con temperatura y PARA QUÉ ROPA sirve cada uno:
  * Algodón: ropa de cama, toallas
  * Sintéticos: ropa deportiva, poliéster
  * Delicados/Seda: ropa interior, blusas finas
  * Lana: jerseys, prendas punto
  * Rápido/Express: para poca ropa poco sucia
  * Aclarado + centrifugado
  * Cualquier otro programa disponible
- Cajón del detergente: qué va en cada compartimento (detergente, suavizante, prelavado)
- Velocidades de centrifugado y cuándo reducirla
- Carga máxima recomendada
- Programas rápidos: duración y cuándo usarlos`;
    }

    if (/secadora/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA SECADORA:
- Lista TODOS los programas con PARA QUÉ TIPO DE ROPA:
  * Algodón seco/extra seco: toallas, sábanas
  * Algodón listo para planchar
  * Sintéticos
  * Delicados
  * Rápido/Express
  * Programa antiaarrugas
- Limpieza del filtro: DÓNDE está y cómo limpiarlo (obligatorio cada uso)
- Depósito de agua: dónde está y cómo vaciarlo (si es de condensación)
- Carga máxima recomendada`;
    }

    if (/lavavajillas/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA LAVAVAJILLAS:
- Lista TODOS los programas con duración aproximada y PARA QUÉ:
  * Intensivo/70°: ollas muy sucias, sartenes
  * Normal/Auto: vajilla del día a día
  * Eco: bajo consumo, más largo
  * Rápido: vajilla poco sucia, rápido
  * Frágil/Cristal: copas, cristalería fina
  * Media carga si lo tiene
- Cómo cargar correctamente (bandeja superior vs inferior)
- Dónde poner la PASTILLA de detergente
- Dónde echar SAL y ABRILLANTADOR y por qué
- Significado de los indicadores luminosos (falta sal, falta abrillantador)`;
    }

    // ═══════════════════════════════════════════════════════
    // CLIMATIZACIÓN
    // ═══════════════════════════════════════════════════════
    if (/aire acondicionado|climatizador|split|a\/c/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA AIRE ACONDICIONADO:
- TODOS los modos con PARA QUÉ sirve cada uno:
  * Frío (copo de nieve): enfriar
  * Calor (sol): calentar
  * Auto: ajuste automático
  * Deshumidificar (gota): quitar humedad sin enfriar mucho
  * Ventilador (aspa): solo mover aire
- Cómo usar el MANDO A DISTANCIA: botones principales
- Cómo cambiar la temperatura (rango recomendado)
- Función TIMER/programación
- Función SLEEP/nocturno
- Dirección del flujo de aire (lamas)
- Temperatura recomendada: 24-25°C para confort y ahorro`;
    }

    if (/calefacción|calefaccion|radiador|calefactor|estufa eléctrica/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CALEFACCIÓN/RADIADOR:
- Cómo encender y apagar
- Niveles de potencia/temperatura
- Termostato: cómo ajustar la temperatura deseada
- Temporizador si lo tiene
- Precauciones: distancia a muebles/cortinas, no cubrir
- Consumo energético orientativo`;
    }

    if (/ventilador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA VENTILADOR:
- Velocidades disponibles y recomendación de uso
- Función oscilación: cómo activarla
- Temporizador si lo tiene
- Modo nocturno/silencioso si lo tiene
- Mando a distancia si lo tiene: botones principales
- Cómo orientar el flujo de aire`;
    }

    if (/deshumidificador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA DESHUMIDIFICADOR:
- Cómo encender y ajustar el nivel de humedad deseado
- Depósito de agua: dónde está, cómo vaciarlo, indicador de lleno
- Modos disponibles (continuo, auto, secado ropa)
- Nivel de humedad recomendado (45-55%)`;
    }

    // ═══════════════════════════════════════════════════════
    // AGUA CALIENTE
    // ═══════════════════════════════════════════════════════
    if (/termo|calentador|boiler|caldera/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA TERMO/CALENTADOR DE AGUA:
- Cómo encender y apagar
- Cómo ajustar la temperatura (recomendado 55-60°C)
- Tiempo aproximado de calentamiento
- Indicador de temperatura/estado
- Modo ECO si lo tiene
- Capacidad en litros y ducha aproximada por carga
- Qué hacer si no calienta`;
    }

    // ═══════════════════════════════════════════════════════
    // PEQUEÑOS ELECTRODOMÉSTICOS
    // ═══════════════════════════════════════════════════════
    if (/cafetera|café|cafe/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CAFETERA:
- Tipos de café que puede hacer (espresso, largo, americano, capuchino, etc.)
- Cómo preparar cada tipo paso a paso
- Dónde poner el agua, el café (cápsulas, molido, grano)
- Cómo ajustar la intensidad/cantidad
- Programa de DESCALCIFICACIÓN: cuándo y cómo hacerlo
- Limpieza diaria recomendada
- Si usa cápsulas: tipo/marca compatible`;
    }

    if (/tostadora|tostador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA TOSTADORA:
- Niveles de tostado y recomendación
- Funciones especiales: descongelar, recalentar, cancelar
- Tipos de pan que acepta
- Bandeja recogemigas: dónde está y cómo limpiarla`;
    }

    if (/batidora|licuadora|procesador|robot de cocina|thermomix/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA BATIDORA/ROBOT DE COCINA:
- Velocidades/programas disponibles y para qué sirve cada uno
- Capacidad máxima
- Accesorios incluidos y para qué sirve cada uno
- Cómo montar y desmontar para limpieza
- Precauciones de seguridad (cuchillas, temperatura)`;
    }

    if (/hervidor|kettle/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA HERVIDOR:
- Capacidad máxima y mínima
- Cómo encender (interruptor, base)
- Si tiene selector de temperatura: opciones disponibles
- Tiempo aproximado de hervido
- Apagado automático`;
    }

    if (/plancha/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA PLANCHA:
- Niveles de temperatura y para qué tejido cada uno
- Función vapor: cómo usar, dónde echar el agua
- Golpe de vapor / vapor vertical si lo tiene
- Función autolimpieza/antical si la tiene`;
    }

    // ═══════════════════════════════════════════════════════
    // LIMPIEZA DEL HOGAR
    // ═══════════════════════════════════════════════════════
    if (/aspirador|aspiradora|roomba|robot aspirador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA ASPIRADORA/ROBOT ASPIRADOR:
- Modos de limpieza y para qué superficies
- Cómo encender/programar
- Cómo vaciar el depósito
- Cambio/limpieza de filtros
- Si es robot: cómo cargar, programar horarios, zonas restringidas
- Base de carga: dónde colocarla`;
    }

    // ═══════════════════════════════════════════════════════
    // MULTIMEDIA Y ENTRETENIMIENTO
    // ═══════════════════════════════════════════════════════
    if (/televisión|television|tv|televisor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA TELEVISOR:
- Cómo encender (mando y/o botón del TV)
- Cambiar de canal, subir volumen
- Cambiar FUENTE/INPUT (HDMI, TDT, streaming)
- Apps de streaming disponibles (Netflix, Prime, Disney+): cómo acceder
- Conexión WiFi si es Smart TV
- Si hay cuenta de streaming configurada, mencionarlo`;
    }

    if (/mando|control remoto|remote/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA MANDO A DISTANCIA:
- Identifica A QUÉ APARATO controla este mando
- Botones principales y para qué sirve cada uno
- Cómo encender/apagar el aparato
- Botones de función más usados
- Tipo de pilas y cómo cambiarlas
- Si es mando universal: cómo cambiar entre dispositivos`;
    }

    if (/altavoz|speaker|sonos|bose|echo|alexa|google home/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA ALTAVOZ/ASISTENTE:
- Cómo encender y conectar (Bluetooth, WiFi, cable)
- Cómo vincular el móvil por Bluetooth
- Controles de volumen
- Si es asistente de voz: comandos útiles
- Cómo cambiar de fuente de audio`;
    }

    if (/proyector/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA PROYECTOR:
- Cómo encender y apagar (esperar a que enfríe)
- Cómo conectar el móvil/portátil (HDMI, WiFi, Chromecast)
- Ajuste de enfoque y posición
- Fuente de entrada: cómo cambiarla`;
    }

    // ═══════════════════════════════════════════════════════
    // EXTERIOR Y OCIO
    // ═══════════════════════════════════════════════════════
    if (/barbacoa|bbq|parrilla/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA BARBACOA:
- Tipo (gas, carbón, eléctrica)
- Cómo encender paso a paso (seguridad primero)
- Control de temperatura/llama
- Tiempos orientativos de cocción por tipo de alimento
- Cómo apagar correctamente
- Limpieza después de cada uso
- Precauciones de seguridad (ubicación, niños, viento)`;
    }

    if (/chimenea|estufa de leña|estufa de pellet|pellet/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CHIMENEA/ESTUFA:
- Tipo de combustible (leña, pellets, gas, bioetanol)
- Cómo encender paso a paso
- Cómo regular la intensidad/temperatura
- Tiro/ventilación: cómo abrir y cerrar
- Cuándo y cómo recargar combustible
- Cómo apagar correctamente
- Precauciones de seguridad (pantalla protectora, ventilación, detector CO)
- Limpieza de cenizas`;
    }

    if (/piscina|jacuzzi|spa|hot tub|bañera de hidromasaje/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA PISCINA/JACUZZI:
- Cómo encender los jets/burbujas
- Control de temperatura
- Temporizador
- Cubierta: cómo abrir y cerrar
- Normas de uso (ducharse antes, no cristal, horarios)
- Productos químicos: NO tocar, informar si hay problemas`;
    }

    // ═══════════════════════════════════════════════════════
    // SEGURIDAD Y DOMÓTICA
    // ═══════════════════════════════════════════════════════
    if (/cerradura|smart lock|puerta|acceso/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CERRADURA INTELIGENTE:
- Cómo abrir/cerrar (código, app, llave, huella)
- Qué hacer si no responde (llave de emergencia, pilas)
- Cómo cambiar el código si es posible
- Indicadores de batería baja`;
    }

    if (/caja fuerte|safe|caja de seguridad/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CAJA FUERTE:
- Cómo abrir: código, llave, huella
- Cómo cerrar correctamente
- Qué hacer si se olvida el código
- Llave de emergencia: dónde está`;
    }

    if (/alarma|detector|sensor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA ALARMA/DETECTOR:
- Tipo (humo, CO, intrusión)
- Qué hacer si suena
- Cómo silenciar una falsa alarma
- Indicador de batería baja`;
    }

    // ═══════════════════════════════════════════════════════
    // FRIGORÍFICO Y CONGELADOR
    // ═══════════════════════════════════════════════════════
    if (/frigorífico|frigorifico|nevera|refrigerador|congelador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA FRIGORÍFICO/CONGELADOR:
- Cómo ajustar la temperatura (frigorífico: 3-5°C, congelador: -18°C)
- Cajones y estantes: qué poner en cada zona
- Funciones especiales: enfriamiento rápido, super congelación, modo vacaciones
- Dispensador de agua/hielo si lo tiene
- Si hace ruidos: cuáles son normales y cuáles no`;
    }

    // ═══════════════════════════════════════════════════════
    // GENÉRICO (fallback)
    // ═══════════════════════════════════════════════════════
    return `REQUISITOS PARA ESTE APARATO:
- Describe TODOS los programas, modos o funciones disponibles
- Para CADA función explica PARA QUÉ SIRVE en la vida real con ejemplos prácticos
- No describas botones de forma abstracta — describe qué HACE cada uno
- Si tiene mando a distancia, describe los botones principales`;
}

/**
 * Expert Manual Generation (Optimized for Speed and Stability)
 */
async function generateManualSinglePass(
    imageUrl: string,
    basicAnalysis: any,
    groundingData: string = '',
    errorCodesData: string = ''
): Promise<string> {
    const applianceType = basicAnalysis.appliance_type || 'Electrodoméstico';
    const specificInstructions = getApplianceSpecificInstructions(applianceType);

    const systemInstruction = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

IDENTIDAD Y TONO:
- Idioma: Español (España)
- Tono: Profesional pero amigable, como un anfitrión que te explica cómo funciona todo
- Audiencia: Huéspedes que nunca han visto este aparato y necesitan usarlo YA

REGLAS DE ORO:
1. Empieza directamente con el título h1 (ej: # Guía de Uso: Horno Balay)
2. NO escribas preámbulos como "Aquí tienes el manual..." o "A continuación..."
3. NO repitas información ya escrita
4. Usa markdown limpio (sin bloques de código \`\`\`)
5. NUNCA describas controles de forma abstracta — describe CADA programa/función con su nombre y PARA QUÉ SIRVE en la vida real
6. Para CADA programa/función, describe el SÍMBOLO o ICONO que verá el usuario en el mando/panel (ej: "ventilador con círculo", "dos rayas horizontales", "copo de nieve", "gota de agua"). El huésped necesita identificar visualmente qué botón/posición usar.
7. Si no tienes datos específicos del modelo, usa conocimiento general del tipo de aparato

FORMATO OBLIGATORIO:
- Título: # Guía de Uso: [Tipo de aparato] [Marca] (SIN modelo técnico, ej: "Horno Balay" no "BSH 3HB4331X0")
- 4 secciones principales:
  1. **Panel de Control** - Describe cada botón/mando con QUÉ HACE (no "mando de funciones" sino "mando para elegir el modo de cocción: aire caliente, grill, etc.")
  2. **Programas y Funciones** - Lista CADA programa/modo disponible con: SÍMBOLO/ICONO en el mando + PARA QUÉ SIRVE + cuándo usarlo. Esto es la parte MÁS IMPORTANTE del manual.
  3. **Diagnóstico de Problemas** - Tabla de códigos de error y problemas comunes
  4. **Consejos Prácticos** - Tips de uso diario y mantenimiento
- Máximo 2500 palabras

${specificInstructions}

SECCIÓN "Diagnóstico de Problemas" (OBLIGATORIA):
- Tabla markdown con columnas: | Código/Señal | Significado | Solución |
- Incluir TODOS los códigos de error disponibles
- Incluir problemas comunes sin código (no enciende, ruidos, fugas, etc.)
- Para cada problema: solución que el usuario puede hacer en casa
- Al final: "Si el problema persiste, contacta con el personal de soporte"

PROHIBIDO:
- Mencionar MODELOS TÉCNICOS (3HB4331X0, WMY71433, etc.) en el texto — solo marca y tipo
- Describir botones de forma abstracta ("tiene un mando de funciones")
- Decir "no tengo información" (si falta algo, usa conocimiento general)
- Generar listas interminables o tablas repetitivas
- Mencionar la imagen ("en la foto se ve...")`;

    const userPrompt = `Genera un manual de uso PRÁCTICO para este electrodoméstico.

DATOS DEL APARATO (del análisis visual):
- Tipo: ${applianceType}
- Marca: ${basicAnalysis.brand || 'Desconocida'}
- Modelo (solo para tu referencia, NO lo pongas en el manual): ${basicAnalysis.model || 'No identificado'}
- Controles visibles: ${JSON.stringify(basicAnalysis.visual_controls || [])}

${groundingData ? `
INFORMACIÓN TÉCNICA DEL MANUAL OFICIAL (usa esto para describir los programas específicos):
${groundingData.substring(0, 12000)}
` : `
⚠️ No hay manual oficial disponible. Usa tu conocimiento experto sobre ${applianceType} similares de la marca ${basicAnalysis.brand}. DESCRIBE TODOS los programas/funciones típicos de este tipo de aparato.
`}

${errorCodesData ? `
CÓDIGOS DE ERROR Y DIAGNÓSTICO (del fabricante):
${errorCodesData.substring(0, 5000)}

⚠️ IMPORTANTE: Integra TODOS estos códigos de error en la sección "Diagnóstico de Problemas".
` : `
⚠️ No hay códigos de error específicos. Incluye los problemas más comunes para ${applianceType} de la marca ${basicAnalysis.brand || 'genérica'}.
`}

RECUERDA: La sección más importante es "Programas y Funciones". Lista CADA programa con PARA QUÉ SIRVE en la vida real. Ejemplo para horno: "Aire caliente: ideal para hornear varias bandejas a la vez (galletas, magdalenas)".`;

    try {
        logT(`[GEN-SINGLE] Expert generation for ${basicAnalysis.brand} ${applianceType}`);

        const { data: manual, error } = await geminiVision(imageUrl, userPrompt, {
            systemInstruction,
            responseMimeType: 'text/plain',
            temperature: 0.25,       // Slightly higher for more natural, detailed descriptions
            maxOutputTokens: 6000    // More space for detailed programs/functions
        });

        if (error) {
            logT(`[GEN-ERROR] ${error}`);
            throw new Error(`Gemini error: ${error}`);
        }

        if (!manual || (manual as string).length < 500) {
            logT(`[GEN-ERROR] Manual too short: ${(manual as string)?.length || 0} chars`);
            throw new Error('Generated manual too short');
        }

        // ✅ Simple validation without complex retry logic
        const cleaned = (manual as string).trim();

        if (!cleaned.startsWith('#')) {
            logT(`[VALIDATION] Manual doesn't start with h1, fixing...`);
            const h1Index = cleaned.indexOf('#');
            if (h1Index !== -1) {
                return cleaned.substring(h1Index).trim();
            }
            // Force title if missing
            return `# Guía de Uso: ${basicAnalysis.brand || ''} ${basicAnalysis.model || applianceType}\n\n${cleaned}`;
        }

        logT(`[GEN-SINGLE] ✅ Manual generated: ${cleaned.length} chars`);
        return cleaned;

    } catch (err: any) {
        logT(`[GEN-ERROR] ${err.message}`);
        throw err;
    }
}

