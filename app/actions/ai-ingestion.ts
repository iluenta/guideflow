'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import axios from 'axios'
import { geminiREST, analyzeImageWithGemini, geminiVision, isValidExternalUrl } from '@/lib/ai/clients/gemini-rest'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/clients/openai'
import { syncPropertyApplianceList } from './properties'
import { syncWizardDataToRAG, syncManualToRAG } from './rag-sync'
import { searchBrave, formatBraveResults } from '@/lib/ai/clients/brave'
import { sanitizeUUID } from '@/lib/utils'
import { matchesInventoryItem } from '@/lib/inventory-utils'
import { logAiUsage } from '@/lib/services/ai-usage-logger'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile, requireTenantId } from '@/lib/supabase/get-tenant-id'

function logT(msg: string) {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    console.log(`[${time}] ${msg}`);
}

export async function generateManualFromImage(propertyId: string, imageUrl: string) {
    const supabase = await createClient()
    const { tenant_id, tenant_role } = await requireProfile(supabase)
    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para generar manuales')
    }

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('ID de propiedad requerido')

    if (!isValidExternalUrl(imageUrl)) {
        throw new Error('URL de imagen no permitida por seguridad (SSRF PROTECTION)')
    }

    const prompt = "Analiza esta imagen de un electrodoméstico y genera un manual de uso simplificado en español. Devuelve SOLO el texto del manual en Markdown."

    const response = await analyzeImageWithGemini(imageUrl, prompt, { responseMimeType: 'text/plain' })
    const manualText = response?.data

    // Log tokens and cost
    after(logAiUsage({
        operation: 'manual_vision',
        model: 'gemini-2.5-flash',
        usage: response?.usage,
        propertyId: currentPropId,
        tenantId: tenant_id,
        isError: !!response?.error
    }));

    const { data, error } = await supabase
        .from('property_manuals')
        .insert({
            property_id: currentPropId,
            tenant_id: tenant_id,
            appliance_name: 'Electrodoméstico',
            manual_content: manualText,
            metadata: { source: 'single_image_legacy', usage: response?.usage }
        })
        .select()
        .single()

    if (error) {
        console.error('[INGESTION] Error inserting manual:', error.message)
        throw new Error('Error al guardar el manual generado')
    }

    revalidatePath(`/dashboard/properties/${currentPropId}`)
    return data
}

export async function processBatchScans(propertyId: string, imageUrls: string[], replaceExisting: boolean = false) {
    const supabase = await createClient()
    const { tenant_id, tenant_role } = await requireProfile(supabase)
    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para realizar escaneos')
    }

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('ID de propiedad requerido para escaneos')

    try {
        logT(`[BATCH] Starting TWO-PHASE analysis for ${imageUrls.length} images (Replace: ${replaceExisting})...`)

        await supabase
            .from('properties')
            .update({
                inventory_status: 'identifying',
                inventory_last_scan_at: new Date().toISOString()
            })
            .eq('id', currentPropId)
            .eq('tenant_id', tenant_id)

        const CONCURRENCY_LIMIT = 5;

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
                if (!isValidExternalUrl(url)) throw new Error('URL bloqueada (SSRF)')
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

                // Log tokens and cost
                after(logAiUsage({
                    operation: 'manual_vision',
                    model: 'gemini-2.5-flash',
                    usage: geminiResponse?.usage,
                    propertyId: currentPropId,
                    tenantId: tenant_id,
                    isError: !!geminiResponse?.error
                }));

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

                const { data: imgRecord } = await supabase.from('appliance_images').insert({
                    property_id: currentPropId,
                    tenant_id: tenant_id,
                    image_url: url,
                    analysis_result: analysis,
                    status: 'identified',
                    analysis_started_at: startTime,
                    analysis_finished_at: new Date().toISOString(),
                    ai_model: 'gemini-2.5-flash',
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

        await supabase
            .from('properties')
            .update({ inventory_status: 'generating' })
            .eq('id', currentPropId)

        await syncPropertyApplianceList(currentPropId, tenant_id)
        revalidatePath(`/dashboard/properties/${currentPropId}`)

        const generateManualsInBackground = async () => {
            // Phase 2 runs after the HTTP response — the original cookie-based supabase client
            // loses its session context. Use admin client (service role) for all background DB ops.
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const supabase = await createAdminClient()

            try {
                logT(`[PHASE2] Starting manual generation for ${identifiedAppliances.length} appliances...`)
                const MANUAL_CONCURRENCY = 2; // Reduced from 3 for stability

                // Deduplicación intra-batch
                const processedTypesInBatch = new Set<string>();

                // Fetch existentes UNA sola vez (no N queries en loop)
                const { data: existingManuals } = replaceExisting
                    ? await supabase.from('property_manuals').select('id, appliance_name, brand, model').eq('property_id', currentPropId).eq('tenant_id', tenant_id)
                    : { data: [] as any[] };

                async function generateOneManual(item: IdentificationResult, index: number): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
                    try {
                        const { url, analysis, imgRecordId } = item

                        // Clave de dedup: tipo + marca + modelo
                        // - Mismo tipo SIN marca/modelo conocido → una sola clave → un manual (ej: dos mandos genéricos de TV)
                        // - Mismo tipo CON modelos distintos → claves distintas → dos manuales (ej: TV Samsung QLED + TV LG OLED)
                        const normBrand = ['', 'desconocido', 'desconocida', 'unknown'].includes((analysis.brand || '').toLowerCase().trim())
                            ? '' : (analysis.brand || '').toUpperCase().trim();
                        const normModel = ['', 'no identificado', 'unknown'].includes((analysis.model || '').toLowerCase().trim())
                            ? '' : (analysis.model || '').toUpperCase().trim();
                        const typeKey = `${(analysis.appliance_type || '').toUpperCase().trim()}|${normBrand}|${normModel}`;
                        if (processedTypesInBatch.has(typeKey)) {
                            logT(`[PHASE2] [${index + 1}] SKIPPING DUPLICATE (BATCH): ${typeKey} - A manual for this appliance type/brand/model was already processed in this scan.`);
                            return { success: true, skipped: true };
                        }
                        processedTypesInBatch.add(typeKey);

                        logT(`[PHASE2] [${index + 1}/${identifiedAppliances.length}] Generating: ${analysis.appliance_type} (${analysis.brand || '?'})`)

                        const [groundingResult, errorCodesResult] = await Promise.allSettled([
                            fetchGroundingData(analysis.brand, analysis.model, analysis.appliance_type),
                            fetchErrorCodes(analysis.brand, analysis.model, analysis.appliance_type)
                        ])

                        // Validar contexto ≥ MIN_CONTEXT_CHARS antes de usar
                        const groundingData = (groundingResult.status === 'fulfilled' && (groundingResult.value?.length ?? 0) >= MIN_CONTEXT_CHARS)
                            ? groundingResult.value : '';
                        const errorCodesData = (errorCodesResult.status === 'fulfilled' && (errorCodesResult.value?.length ?? 0) >= MIN_CONTEXT_CHARS)
                            ? errorCodesResult.value : '';
                        logT(`[PHASE2] [${index + 1}] Context: ${groundingData?.length || 0} chars technical + ${errorCodesData?.length || 0} chars errors`)

                        const manualContent = await generateManualSinglePass(url, analysis, groundingData, errorCodesData, { propertyId: currentPropId, tenantId: tenant_id })

                        if (!manualContent || manualContent.length < 300) {
                            throw new Error('Generated manual too short/empty')
                        }
                        logT(`[PHASE2] [${index + 1}] Manual: ${manualContent.length} chars`)

                        if (replaceExisting && existingManuals) {
                            const applianceTypeNorm = (analysis.appliance_type || '').toUpperCase().trim();
                            // filter() en lugar de find() para eliminar TODOS los duplicados existentes,
                            // no solo el primero (evita acumulación de duplicados entre scans).
                            // Doble criterio de matching:
                            //   1. Exacto: tipo|marca|modelo coinciden
                            //   2. Fallback: appliance_name contiene el tipo (cubre casos donde Gemini
                            //      guardó "HORNO CANDY" como nombre completo en lugar de separado)
                            const duplicates = existingManuals.filter((m: any) => {
                                const mType = (m.appliance_name || '').toUpperCase().trim();
                                const mBrand = ['', 'desconocido', 'desconocida', 'unknown'].includes((m.brand || '').toLowerCase().trim())
                                    ? '' : (m.brand || '').toUpperCase().trim();
                                const mModel = ['', 'no identificado', 'unknown'].includes((m.model || '').toLowerCase().trim())
                                    ? '' : (m.model || '').toUpperCase().trim();
                                const exactMatch = `${mType}|${mBrand}|${mModel}` === typeKey;
                                const nameMatch = mType === applianceTypeNorm || mType.startsWith(applianceTypeNorm);
                                return exactMatch || nameMatch;
                            })
                            for (const dup of duplicates) {
                                logT(`[PHASE2] [${index + 1}] Removing duplicate: ${dup.id} (${dup.appliance_name} ${dup.brand || ''})`)
                                await supabase.from('property_manuals').delete().eq('id', dup.id).eq('tenant_id', tenant_id)
                                await supabase.from('context_embeddings').delete().eq('source_id', dup.id).eq('tenant_id', tenant_id)
                            }
                        }

                        const { data: manual, error: manError } = await supabase.from('property_manuals').insert({
                            property_id: currentPropId,
                            tenant_id: tenant_id,
                            appliance_name: analysis.appliance_type || 'Aparato',
                            brand: analysis.brand,
                            model: analysis.model,
                            manual_content: manualContent,
                            metadata: {
                                confidence: 'high',
                                has_pdf: false,
                                has_web: false,
                                generation_version: 2,
                                visual: analysis
                            }
                        }).select().single()

                        if (manError) throw manError
                        if (imgRecordId) {
                            await supabase.from('appliance_images').update({ manual_id: manual.id, status: 'completed' }).eq('id', imgRecordId)
                        }

                        await syncManualToRAG(
                            currentPropId!,
                            tenant_id,
                            manual.id,
                            manualContent,
                            analysis.appliance_type,
                            analysis.brand,
                            analysis.model,
                            supabase
                        )

                        logT(`[PHASE2] [${index + 1}] ✅ Manual saved & vectorized`)
                        
                        // HEARTBEAT: Update the property record to touch 'updated_at' 
                        // and reset the silence timer for recovery logic.
                        await supabase
                            .from('properties')
                            .update({ inventory_status: 'generating' })
                            .eq('id', currentPropId)
                            .eq('tenant_id', tenant_id)

                        return { success: true }
                    } catch (err: any) {
                        logT(`[PHASE2] [${index + 1}] ERROR: ${err.message}`)
                        return { success: false, error: err.message }
                    } finally {
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

                const manualResults: { success: boolean; error?: string; skipped?: boolean }[] = []
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

                for (const item of identifications.filter(r => !r.analysis)) {
                    try {
                        const urlMatch = item.url.match(/property_scans\/(.+)$/)
                        if (urlMatch) {
                            await supabase.storage.from('property_scans').remove([urlMatch[1]])
                        }
                    } catch { }
                }

                const succeeded = manualResults.filter(r => r.success && !r.skipped).length
                const skipped = manualResults.filter(r => r.skipped).length
                const failed = manualResults.filter(r => !r.success).length
                logT(`[PHASE2] ✅ All manuals generated. New: ${succeeded}, Skipped (Duplicate): ${skipped}, Failed: ${failed}`)

                await syncPropertyApplianceList(currentPropId, tenant_id, supabase, true)
                await supabase
                    .from('properties')
                    .update({ inventory_status: 'completed' })
                    .eq('id', currentPropId)
                    .eq('tenant_id', tenant_id)

                logT(`[BATCH] Completed full pipeline for property ${propertyId}`)
            } catch (error: any) {
                console.error('[PHASE2] Fatal error:', error.message)
                await supabase
                    .from('properties')
                    .update({ inventory_status: 'failed' })
                    .eq('id', currentPropId)
                    .eq('tenant_id', tenant_id)
            }
        }

        // Phase 2 corre tras enviar la respuesta HTTP. `after()` garantiza que Vercel
        // mantiene la función viva hasta que la promesa resuelva (Next.js 15+).
        // La UI hace polling de inventory_status (WizardContext.tsx:228) y desbloquea
        // las tarjetas cuando llega a 'completed'.
        after(generateManualsInBackground())

        logT(`[BATCH] Phase 1 complete. Phase 2 scheduled via after() for ${identifiedAppliances.length} appliances.`)
        return { success: true, identifiedCount: identifiedAppliances.length }

    } catch (error: any) {
        console.error('[BATCH] Fatal error in Phase 1:', error.message)
        await supabase
            .from('properties')
            .update({ inventory_status: 'failed' })
            .eq('id', currentPropId)
            .eq('tenant_id', tenant_id)
        throw error
    }
}


export async function processInventoryManuals(propertyId: string, items: any[]) {
    const supabase = await createClient()
    const { tenant_id, tenant_role } = await requireProfile(supabase)
    if (!can(tenant_role as TenantRole, 'properties', 'edit')) {
        throw new Error('No tienes permisos para procesar el inventario')
    }

    const currentPropId = sanitizeUUID(propertyId)
    if (!currentPropId) throw new Error('ID de propiedad requerido para procesar inventario')

    try {
        console.log(`[INVENTORY] Starting background processing for ${items.length} items...`)

        await supabase
            .from('properties')
            .update({ inventory_status: 'generating' })
            .eq('id', currentPropId)
            .eq('tenant_id', tenant_id)

        const { data: existingManuals } = await supabase
            .from('property_manuals')
            .select('appliance_name, brand, model, metadata')
            .eq('property_id', currentPropId)
            .eq('tenant_id', tenant_id)

        const itemsToProcess = items.filter(item => {
            if (!item.isPresent) return false
            
            // 1. Prioridad: Matching por item_id en metadata
            const hasExplicitId = existingManuals?.some(m => 
                m.metadata?.item_id === item.id || m.metadata?.id === item.id
            )
            if (hasExplicitId) return false

            // 2. Fallback: Matching por nombre (robusto con word boundaries)
            const existsByName = existingManuals?.some(m =>
                matchesInventoryItem(m.appliance_name || '', item)
            )
            return !existsByName
        })

        if (itemsToProcess.length === 0) {
            console.log('[INVENTORY] No new items to process.')
            await supabase.from('properties').update({ inventory_status: 'completed' }).eq('id', currentPropId).eq('tenant_id', tenant_id)
            return { success: true, processed: 0 }
        }

        // Proceso en segundo plano
        after(async () => {
            try {
                console.log(`[INVENTORY-BG] Generating ${itemsToProcess.length} new manuals...`)

                for (const item of itemsToProcess) {
                    try {
                        console.log(`[INVENTORY-BG] Generating manual for: ${item.name}...`)

                        const prompt = `Genera una guía de uso rápida y amable para un huésped sobre el siguiente elemento: ${item.name}.
                        ${item.customContext ? `Información específica del anfitrión: ${item.customContext}` : ''}
                        
                        REGLAS CRÍTICAS:
                        1. FORMATO: Markdown estructurado.
                        2. TONO: Útil y directo.
                        3. CONTENIDO: Indica para qué sirve y consejos básicos.
                        4. NO INVENTES: No describas detalles físicos específicos (colores, materiales, tipos exactos, cantidades) que no se hayan proporcionado. Tampoco inventes marcas o modelos técnicos.
                        5. Si no sabes dónde está, usa frases genéricas como "Suele encontrarse en..." o "Pregunta al anfitrión si no lo localizas".
        
                        RESPONDE SOLO CON EL TEXTO DEL MANUAL.`

                        const genResponse = await geminiREST('gemini-2.5-flash', prompt, {
                            responseMimeType: 'text/plain',
                            temperature: 0.7
                        })

                        // Log tokens and cost
                        after(logAiUsage({
                            operation: 'manual_enrichment',
                            model: 'gemini-2.5-flash',
                            usage: genResponse?.usage,
                            propertyId: currentPropId,
                            tenantId: tenant_id,
                            isError: !!genResponse?.error
                        }));

                        const manualContent = genResponse?.data
                        if (!manualContent) continue

                        const { data: manual, error: manError } = await supabase.from('property_manuals').insert({
                            property_id: currentPropId,
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

                        const chunks = splitIntoChunks(manualContent, 800)
                        const contextEmbeddings = await Promise.all(chunks.map(async chunk => {
                            const enrichedContent = `[ELEMENTO: ${item.name}]\n${item.customContext ? `Nota del anfitrión: ${item.customContext}\n` : ''}${chunk}`
                            const enrichedEmbedding = await generateOpenAIEmbedding(enrichedContent)
                            return {
                                property_id: currentPropId,
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

                        await supabase.from('context_embeddings').delete().eq('source_id', manual.id).eq('tenant_id', tenant_id);
                        await supabase.from('context_embeddings').insert(contextEmbeddings);

                    } catch (itemErr: any) {
                        console.error(`[INVENTORY-BG] Error processing ${item.name}:`, itemErr.message)
                    }
                }

                await syncPropertyApplianceList(currentPropId, tenant_id)

                await supabase
                    .from('properties')
                    .update({ inventory_status: 'completed' })
                    .eq('id', currentPropId)
                    .eq('tenant_id', tenant_id)

                console.log('[INVENTORY-BG] Background processing completed.')
            } catch (bgErr: any) {
                console.error('[INVENTORY-BG] Fatal background error:', bgErr.message)
                await supabase
                    .from('properties')
                    .update({ inventory_status: 'failed' })
                    .eq('id', currentPropId)
                    .eq('tenant_id', tenant_id)
            }
        })

        return { success: true, processed: itemsToProcess.length, isBackground: true }

    } catch (error: any) {
        console.error('[INVENTORY] Fatal initialization error:', error.message)
        await supabase.from('properties').update({ inventory_status: 'failed' }).eq('id', currentPropId).eq('tenant_id', tenant_id)
        return { success: false, error: error.message }
    }
}

async function extractPDFManual(pdfUrl: string): Promise<string> {
    try {
        if (!isValidExternalUrl(pdfUrl)) throw new Error('URL de PDF bloqueada (SSRF)')
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
                console.log(`[MANUAL SEARCH] ✅ Found PDF: ${pdfUrl}`)
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

async function scrapeManualContent(urls: string[]): Promise<string> {
    let aggregatedContent = ''
    for (const url of urls.slice(0, 3)) {
        try {
            if (!isValidExternalUrl(url)) throw new Error('URL bloqueada (SSRF)')
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
        'función', 'símbolo', 'programa', 'temperatura',
        'mando', 'panel', 'control', 'uso', 'instrucción',
        'modo', 'cocción', 'nivel', 'accesorio'
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

async function analyzeControlPanelVisually(imageUrl: string): Promise<{
    brand?: string,
    estimatedModel?: string,
    controls: any,
    layout: any
}> {
    const identificationPrompt = `Analiza detenidamente esta imagen de un panel de control de electrodoméstico.

🎯 TAREAS OBLIGATORIAS:

1. **Identificar la marca:**
   - Busca logos, texto, tipografía
   - Si ves "Balay", "Bosch", etc., indícalo
   - Si no hay marca visible, pon "desconocida"

2. **Tipo de aparato:**
   - ¿Horno? ¿Microondas? ¿Placa? ¿Lavavajillas?
   - Razona por los símbolos que ves

3. **Características del panel:**
   - ¿Hay pantalla digital? ¿Qué números/texto muestra?
   - ¿Cuántos mandos hay?
   - ¿Qué rango de temperatura se ve en el mando derecho?

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
        return { brand: 'desconocida', controls: {}, layout: { appliance_type: 'HORNO', confidence_brand: 0 } }
    }

    const phase1 = phase1Response?.data || {}
    console.log('[VISUAL ANALYSIS] Phase 1 result:', JSON.stringify(phase1, null, 2))

    const controlMappingPrompt = `Ahora ENUMERA CADA SÍMBOLO/CONTROL visible en la imagen.

📍 MANDO IZQUIERDO (selector de funciones):
Recorre el mando en sentido horario desde las 12 y lista TODOS los símbolos/iconos que veas.

📍 MANDO DERECHO (temperatura):
- ¿Qué números ves? (ej: 50, 100, 150, 200, 250)

📍 PANTALLA DIGITAL:
- ¿Qué muestra actualmente?
- ¿Qué botones/iconos hay a su alrededor?

RESPONDE SOLO CON ESTE JSON:
{
  "left_knob": {
    "type": "selector_funciones",
    "symbols": [
      { "position": "12h", "description": "bombilla o luz", "likely_meaning": "Iluminación interior" }
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
      { "icon": "campana", "position": "izquierda del display", "likely_function": "temporizador/alarma" }
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
        return { brand: phase1.brand, controls: {}, layout: phase1 }
    }

    const phase2 = phase2Response?.data || {}

    if (!phase2.left_knob?.symbols || phase2.left_knob.symbols.length < 3) {
        console.warn('[VISUAL ANALYSIS] Phase 2 detected too few symbols, retrying...')
        const retryPrompt = `Mira detenidamente el MANDO IZQUIERDO de este horno.
¿CUÁNTOS símbolos/iconos diferentes ves alrededor del mando?
Para CADA UNO, describe brevemente qué figura ves.
FORMATO JSON:
{
  "symbol_count": 8,
  "symbols": [
    {"desc": "bombilla", "meaning": "luz"},
    {"desc": "ventilador en círculo", "meaning": "aire caliente"}
  ]
}`
        const retryResponse = await analyzeImageWithGemini(imageUrl, retryPrompt, {
            responseMimeType: 'application/json' as any,
            temperature: 0.3
        } as any)

        if (retryResponse?.data?.symbols?.length > (phase2.left_knob?.symbols?.length || 0)) {
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

async function generateSymbolsFromPDF(imageUrl: string, pdfContent: string, visualAnalysis: any): Promise<string> {
    const prompt = `Estás creando la sección de SÍMBOLOS Y CONTROLES de una guía de uso.

📄 MANUAL OFICIAL DISPONIBLE:
${pdfContent.substring(0, 20000)}

👁️ PANEL VISIBLE EN LA IMAGEN:
- Mando izquierdo: selector de funciones
- Mando derecho: temperatura (${visualAnalysis.controls?.right_knob?.min_value || '50'} - ${visualAnalysis.controls?.right_knob?.max_value || '250'}°C)
- Display digital: muestra ${visualAnalysis.controls?.digital_display?.current_display || 'tiempo/temperatura'}

🎯 TAREA: Crear una tabla markdown con MÁXIMO 15 FILAS.

## 1. Panel de Control

### Mando de Funciones (Izquierda)
| Símbolo | Nombre del Modo | Para qué sirve | Temp. Recomendada |
|---------|----------------|----------------|-------------------|
| ☀️ | Calor Superior/Inferior | Horneado tradicional | 180-200°C |

### Mando de Temperatura (Derecha)
- **Rango:** ${visualAnalysis.controls?.right_knob?.min_value || '50'}-${visualAnalysis.controls?.right_knob?.max_value || '250'}°C

### Pantalla Digital
${visualAnalysis.controls?.digital_display ? `Muestra el tiempo de cocción programado.` : 'Este modelo tiene pantalla digital.'}

🚫 IMPORTANTE: NO generes más de 15 filas. RESPONDE SOLO CON MARKDOWN.`

    const response = await analyzeImageWithGemini(imageUrl, prompt, {
        responseMimeType: 'text/plain',
        temperature: 0.15,
        maxOutputTokens: 2000,
        stopSequences: ['##', '# ', '\n\n\n']
    } as any)

    return response?.data || '## 1. Panel de Control\n\n(No se pudo generar esta sección)'
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string, mimeType: string } | null> {
    try {
        if (!isValidExternalUrl(imageUrl)) throw new Error('URL bloqueada (SSRF)')
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

async function generateSymbolsFromVisual(imageUrl: string, visualAnalysis: any): Promise<string> {
    const symbolsDetected = visualAnalysis.controls?.left_knob?.symbols || []
    const displayData = visualAnalysis.controls?.digital_display || {}
    const tempData = visualAnalysis.controls?.right_knob || {}

    const imageData = await fetchImageAsBase64(imageUrl)

    const prompt = `Eres un Ingeniero Técnico experto en electrodomésticos. Mira la foto del panel de control y genera una tabla técnica de símbolos.

DATOS PREVIAMENTE DETECTADOS:
${JSON.stringify({ brand: visualAnalysis.brand, symbolsDetected, displayData, tempData }, null, 2)}

🎯 TAREA:
1. Mira la imagen y confirma los símbolos del mando izquierdo.
2. Genera una TABLA MARKDOWN con cada símbolo.
3. Usa nombres técnicos precisos.

## 1. Panel de Control y Funciones

### Selector de Funciones (Izquierda)
| Símbolo | Función Técnica | Aplicación Práctica |
|:-------:|:----------------|:--------------------|
${symbolsDetected.map((s: any) =>
        `| ${s.description} | **${s.likely_meaning}** | [Explica el beneficio] |`
    ).join('\n')}

### Selector de Temperatura (Derecha)
Control de temperatura analógico (${tempData.min_value || '50'}-${tempData.max_value || '275'}°C).

### Pantalla y Botones
${displayData.has_display ?
            `Muestra "${displayData.current_display}". Botones:
${displayData.adjacent_buttons?.map((b: any) => `- **${b.icon}:** ${b.likely_function}`).join('\n')}

⚠️ **CRÍTICO:** Si el reloj parpadea, el horno NO calentará. Ajusta la hora con +/- para activar el aparato.` :
            'Modelo analógico sin requisitos de ajuste de hora.'}

🚫 LÍMITES: No inventes símbolos que no veas en la foto. Máximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.5-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.1,
        maxOutputTokens: 2000
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''
    return cleanContent || '## 1. Panel de Control\n\n(Error en mapeo visual)'
}

async function generateSymbolsTableFallback(imageUrl: string, visualAnalysis: any): Promise<string> {
    const prompt = `Mira esta imagen del panel de control.

Describe TODOS los símbolos visibles y genera una tabla markdown:

## 1. Panel de Control

### Mando de Funciones (Izquierda)
| Símbolo Visible | Función Estimada | Uso Típico |
|----------------|-----------------|-----------|

### Mando de Temperatura (Derecha)
[Describe el rango y números visibles]

### Pantalla
[Describe qué ves]

IMPORTANTE: Lista TODOS los símbolos visibles. RESPONDE SOLO CON MARKDOWN.`

    const response = await analyzeImageWithGemini(imageUrl, prompt, {
        responseMimeType: 'text/plain' as any,
        temperature: 0.25,
        maxOutputTokens: 1500
    } as any)

    return response?.data || '## 1. Panel de Control\n\n(Error al generar tabla)'
}

async function generateSymbolsTable(imageUrl: string, pdfContent: string | undefined, visualAnalysis: any): Promise<string> {
    if (pdfContent && pdfContent.length > 5000) {
        return await generateSymbolsFromPDF(imageUrl, pdfContent, visualAnalysis)
    } else {
        return await generateSymbolsFromVisual(imageUrl, visualAnalysis)
    }
}

async function generateInstructions(pdfContent: string | undefined, webContent: string | undefined, visualAnalysis: any, imageUrl?: string): Promise<string> {
    const hasReliableSource = (pdfContent && pdfContent.length > 5000) || (webContent && webContent.length > 3000)
    const baseContext = pdfContent || webContent || ''
    const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null

    const prompt = `Escribe la sección de INSTRUCCIONES DE USO. SIN SALUDOS.

${hasReliableSource ? `📄 DOCUMENTACIÓN TÉCNICA:\n${baseContext.substring(0, 10000)}` : `⚠️ Contexto: Horno ${visualAnalysis.brand || 'genérico'}.`}

## 2. Instrucciones de Uso

### Puesta en Marcha
1. **Ajuste del Reloj:** Si el display parpadea, ajusta la hora. El aparato bloquea el calor hasta que tiene hora fija.
2. **Mandos:** ${visualAnalysis.layout?.has_retractable_knobs ? 'Presiona los mandos para que salgan.' : 'Los mandos son fijos.'}

### Cómo Cocinar paso a paso
1. **Selección:** Gira el mando izquierdo a la función elegida.
2. **Temperatura:** Selecciona los grados en el mando derecho.
3. **Precalentamiento:** Espera a que el horno alcance la temperatura.
4. **Finalización:** Gira ambos selectores a la posición '0'.

🚫 LÍMITES: Estilo directo. Sin introducciones. Máximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.5-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.15,
        maxOutputTokens: 1500 as any,
        stopSequences: ['##', '# '] as any
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''
    return cleanContent || '## 2. Instrucciones de Uso\n\n(No disponible)'
}

async function generateTipsAndMaintenance(pdfContent: string | undefined, visualAnalysis: any, imageUrl?: string): Promise<string> {
    const imageData = imageUrl ? await fetchImageAsBase64(imageUrl) : null

    const prompt = `Genera la sección de LIMPIEZA Y SOLUCIÓN DE PROBLEMAS. SIN SALUDOS.

## 3. Limpieza y Solución de Problemas

### Mantenimiento y Aquálisis
Si tu modelo incluye Aquálisis:
1. Con el horno frío, vierte **400 ml de agua** con una gota de jabón en la base.
2. Activa la función **Aquálisis** o calor inferior a **80°C**.
3. Deja funcionar **4 minutos** y apaga.
4. Tras enfriar, retira la suciedad con una bayeta.

### Tabla de Resolución de Errores
| Problema Detectado | Causa Frecuente | Acción del Usuario |
|:-------------------|:----------------|:-------------------|
| No calienta (display parpadea) | Reloj desajustado | Configura la hora con +/- |
| Icono de Llave encendido | Bloqueo activo | Pulsa botón llave durante 4 seg |
| Ruido tras apagarlo | Enfriamiento electrónico | Normal, parará solo |
| Condensación excesiva | Vapor de alimentos | Seca el interior tras usarlo |

🚫 LÍMITES: Solo información útil y técnica. Máximo 500 palabras.`

    const input = imageData ? [
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        prompt
    ] : [prompt]

    const response = await geminiREST('gemini-2.5-flash', input as any, {
        responseMimeType: 'text/plain',
        temperature: 0.1,
        maxOutputTokens: 1500
    } as any)

    const cleanContent = response?.data?.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim() || ''
    return cleanContent || '## 3. Consejos\n\n- Usa con precaución\n- Limpia después de usar'
}

// ─── Límites pipeline ────────────────────────────────────────────────────────
const MAX_OUTPUT_TOKENS = 8192;
const MAX_MANUAL_CHARS = 12_000;
const MIN_CONTEXT_CHARS = 50;

async function fetchGroundingData(brand: string, model: string, type: string): Promise<string> {
    const hasSpecificModel = model && model !== 'No identificado' && model !== 'Desconocido' && model.length > 2;
    const brandLabel = (!brand || brand === 'Desconocido' || brand === 'Desconocida') ? '' : brand;
    const modelLabel = hasSpecificModel ? model : '';

    const query = `Busca información técnica detallada, ficha de producto y SOLUCIÓN DE PROBLEMAS (tabla de errores) para el siguiente aparato: ${brandLabel} ${type} ${modelLabel}.
    Necesito saber:
    1. Capacidad real y potencia.
    2. Significado de botones o luces.
    3. Tiempos de funcionamiento/espera estándar.
    4. Tabla de errores frecuentes y cómo resetearlo.

    TODO DEBE ESTAR EN ESPAÑOL.
    IMPORTANTE: Dame solo los datos crudos, sin formato de manual aún.`

    const { data: groundingData, error } = await geminiREST('gemini-2.5-flash', query, {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: 'text/plain',
        useGrounding: true
    } as any)

    if (error) {
        console.error('[GROUNDING-FETCH] Error:', error)
        return ''
    }

    return (groundingData as string) || ''
}

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
        logT(`[ERROR-CODES] Searching error codes for ${brand} ${model || type}...`)

        const { data, error } = await geminiREST('gemini-2.5-flash', query, {
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

        if (result.length < 200) {
            return await fetchErrorCodesFromBrave(brand, model, type)
        }

        return result
    } catch (err: any) {
        logT(`[ERROR-CODES] Error: ${err.message}. Trying Brave fallback...`)
        return await fetchErrorCodesFromBrave(brand, model, type)
    }
}

async function fetchErrorCodesFromBrave(brand: string, model: string, type: string): Promise<string> {
    try {
        const searchQuery = model && model !== 'No identificado' && model !== 'Desconocido'
            ? `${brand} ${model} ${type} códigos error solución`
            : `${brand} ${type} códigos error comunes solución`

        const braveResults = await searchBrave(searchQuery, 5, true)
        const braveFormatted = formatBraveResults(braveResults)

        if (braveFormatted.length < 100) return ''

        const { data: consolidated } = await geminiREST('gemini-2.5-flash',
            `Extrae y organiza SOLO los códigos de error y soluciones de estos resultados para ${brand} ${type}.

Formato:
- Código/Señal: [código]
- Significado: [qué pasa]
- Solución: [qué hacer]
- Requiere técnico: [sí/no]

Resultados:
${braveFormatted.substring(0, 8000)}

SOLO errores y soluciones. EN ESPAÑOL.`,
            { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: 'text/plain' }
        )

        return (consolidated as string) || ''
    } catch (err: any) {
        logT(`[ERROR-CODES-BRAVE] Error: ${err.message}`)
        return ''
    }
}

function getApplianceSpecificInstructions(applianceType: string): string {
    const type = (applianceType || '').toLowerCase();

    if (/horno/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA HORNO:
- Lista TODOS los modos/programas de cocción con su símbolo y PARA QUÉ SIRVE cada uno
- Explica cómo PROGRAMAR el tiempo de cocción
- Describe el sistema de LIMPIEZA si lo tiene
- Precalentamiento: cómo saber cuándo está listo
- Si tiene bloqueo infantil, cómo activar/desactivar
- Recomienda la MEJOR función según tipo de plato`;
    }

    if (/vitrocerámica|vitroceramica|placa|inducción|induccion|encimera/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA PLACA DE COCCIÓN:
- Identifica CADA zona de cocción
- Niveles de potencia y para qué tipo de cocción
- Función BOOST/Power
- Bloqueo infantil
- Indicador de calor residual
- Si es inducción: recipientes compatibles`;
    }

    if (/microondas/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA MICROONDAS:
- Lista TODOS los niveles de potencia con PARA QUÉ usar cada uno
- Función DESCONGELACIÓN
- Función GRILL si la tiene
- Función COMBINADO si la tiene
- Programas automáticos si los tiene
- Recipientes que NO se pueden usar`;
    }

    if (/campana|extractor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CAMPANA EXTRACTORA:
- Velocidades disponibles
- Función intensiva/turbo
- Cómo encender/apagar la luz
- Filtros: tipo y cuándo cambiarlos`;
    }

    if (/lavadora/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA LAVADORA:
- Lista TODOS los programas con temperatura y PARA QUÉ ROPA
- Cajón del detergente: qué va en cada compartimento
- Velocidades de centrifugado
- Carga máxima`;
    }

    if (/secadora/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA SECADORA:
- Lista TODOS los programas con PARA QUÉ TIPO DE ROPA
- Limpieza del filtro
- Depósito de agua si es de condensación
- Carga máxima`;
    }

    if (/lavavajillas/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA LAVAVAJILLAS:
- Lista TODOS los programas con duración y PARA QUÉ
- Cómo cargar correctamente
- Dónde poner la pastilla de detergente
- Dónde echar SAL y ABRILLANTADOR
- Significado de los indicadores luminosos`;
    }

    if (/aire acondicionado|climatizador|split|a\/c/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA AIRE ACONDICIONADO:
- TODOS los modos con PARA QUÉ sirve cada uno
- Cómo usar el MANDO A DISTANCIA
- Temperatura recomendada: 24-25°C
- Función TIMER/programación
- Función SLEEP/nocturno`;
    }

    if (/calefacción|calefaccion|radiador|calefactor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CALEFACCIÓN/RADIADOR:
- Niveles de potencia/temperatura
- Termostato: cómo ajustar
- Temporizador si lo tiene
- Precauciones: distancia a muebles/cortinas`;
    }

    if (/termo|calentador|boiler|caldera/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA TERMO/CALENTADOR DE AGUA:
- Cómo ajustar la temperatura (recomendado 55-60°C)
- Tiempo aproximado de calentamiento
- Modo ECO si lo tiene
- Capacidad en litros`;
    }

    if (/cafetera|café|cafe/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA CAFETERA:
- Tipos de café que puede hacer
- Cómo preparar cada tipo paso a paso
- Programa de DESCALCIFICACIÓN
- Si usa cápsulas: tipo/marca compatible`;
    }

    if (/televisión|television|tv|televisor/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA TELEVISOR:
- REGLA CRÍTICA: Los botones directos de apps que menciones deben ser ÚNICAMENTE los que veas físicamente en la imagen del mando. Si en la imagen NO ves un botón con el logo de una app, NO lo incluyas como botón directo aunque el modelo técnico pueda tenerlo.
- Para apps disponibles pero sin botón visible en la imagen: indica que se accede desde Home → menú de aplicaciones → buscar la app.
- Cómo encender (mando y/o botón del TV)
- Cambiar de canal, subir volumen
- Cambiar FUENTE/INPUT (HDMI, TDT, streaming)
- Si hay cuenta de streaming configurada, mencionarlo`;
    }

    if (/frigorífico|frigorifico|nevera|refrigerador|congelador/.test(type)) {
        return `REQUISITOS ESPECÍFICOS PARA FRIGORÍFICO/CONGELADOR:
- Cómo ajustar la temperatura (frigorífico: 3-5°C, congelador: -18°C)
- Cajones y estantes: qué poner en cada zona
- Funciones especiales: enfriamiento rápido, modo vacaciones`;
    }

    return `REQUISITOS PARA ESTE APARATO:
- Describe TODOS los programas, modos o funciones disponibles
- Para CADA función explica PARA QUÉ SIRVE en la vida real
- Si tiene mando a distancia, describe los botones principales`;
}

async function generateManualSinglePass(
    imageUrl: string,
    basicAnalysis: any,
    groundingData: string = '',
    errorCodesData: string = '',
    loggingContext?: { propertyId?: string | null, tenantId?: string | null }
): Promise<string> {
    const applianceType = basicAnalysis.appliance_type || 'Electrodoméstico';
    const specificInstructions = getApplianceSpecificInstructions(applianceType);
    const brand = basicAnalysis.brand || '';
    const isUnknown = !brand || brand === 'Desconocido' || brand === 'Desconocida';

    // Pass 1: manual body without diagnostic table (keeps output focused and within token budget)
    const systemInstruction = `Eres un experto en electrodomésticos que crea manuales de uso PRÁCTICOS para huéspedes de apartamentos turísticos.

IDENTIDAD Y TONO:
- Idioma: Español (España)
- Tono: Profesional pero amigable
- Audiencia: Huéspedes que nunca han visto este aparato

REGLAS DE ORO:
1. Empieza directamente con el título h1 (ej: # Guía de Uso: Horno Balay)
2. NO escribas preámbulos ni repeticiones
3. Usa markdown limpio (sin bloques de código)
4. NUNCA describas controles de forma abstracta — describe cada función con su nombre
5. Para cada programa/modo, describe el SÍMBOLO o ICONO visible en el panel
6. Máximo 400 palabras en total.

FORMATO OBLIGATORIO:
- Título: # Guía de Uso: [Tipo] [Marca si la conoces]
- 3 secciones ÚNICAMENTE: Primeros Pasos / Programas y Funciones / Consejos Útiles
- Cada sección: máximo 5 puntos
- ⛔ NO incluyas sección de "Diagnóstico de Problemas" — se añade por separado

PROHIBIDO:
- Mencionar MODELOS TÉCNICOS en el texto — solo marca y tipo
- Inventar funciones o botones que no existen en este tipo de aparato
- Decir "no tengo información" — si no tienes datos específicos, usa conocimiento general básico
- Mencionar la imagen ("en la foto se ve...")
- Repetir información ya escrita`;

    const userPrompt = `Genera un manual de uso PRÁCTICO y CONCISO para este electrodoméstico. SIN sección de diagnóstico/errores.

DATOS DEL APARATO:
- Tipo: ${applianceType}
- Marca: ${isUnknown ? 'No identificada' : brand}
- Modelo (solo referencia, NO pongas en el manual): ${basicAnalysis.model || 'No identificado'}

${groundingData ? `
INFORMACIÓN TÉCNICA DEL MANUAL OFICIAL (úsala como base):
${groundingData.substring(0, 8000)}
` : `⚠️ Sin manual oficial. Usa conocimiento general sobre ${applianceType}${isUnknown ? '' : ` de la marca ${brand}`}.`}

RECUERDA: Solo 3 secciones (Primeros Pasos / Programas y Funciones / Consejos Útiles). Máximo 400 palabras.`;

    try {
        logT(`[GEN] Generating: ${brand || 'genérico'} ${applianceType} | groundingData: ${groundingData.length} chars | errorCodesData: ${errorCodesData.length} chars`);

        const opts = {
            systemInstruction,
            responseMimeType: 'text/plain' as const,
            temperature: 0.2,
            maxOutputTokens: 2048,
        };

        // Pass 1: manual body (no diagnostic table)
        let result = imageUrl && isValidExternalUrl(imageUrl)
            ? await geminiVision(imageUrl, userPrompt, opts)
            : await geminiREST('gemini-2.5-flash', userPrompt, opts);

        if (loggingContext) {
            after(logAiUsage({
                operation: 'manual_vision',
                model: 'gemini-2.5-flash',
                usage: result?.usage,
                propertyId: loggingContext.propertyId,
                tenantId: loggingContext.tenantId,
                isError: !!result?.error
            }));
        }

        if (result.error && imageUrl) {
            logT(`[GEN] Image unavailable (${result.error}), retrying without image...`);
            result = await geminiREST('gemini-2.5-flash', userPrompt, opts);
        }

        const { data: manual, error } = result;
        if (error) throw new Error(`Gemini error: ${error}`);
        if (!manual || (manual as string).length < 200) throw new Error('Manual generado demasiado corto');

        let cleaned = (manual as string).trim();
        if (!cleaned.startsWith('#')) {
            const h1Index = cleaned.indexOf('#');
            if (h1Index !== -1) cleaned = cleaned.substring(h1Index).trim();
            else cleaned = `# Guía de Uso: ${isUnknown ? '' : brand + ' '}${applianceType}\n\n${cleaned}`;
        }

        // Pass 2: diagnostic table (separate focused call with error codes data)
        const diagPrompt = errorCodesData
            ? `Genera SOLO la sección "## Diagnóstico de Problemas" para un ${applianceType} ${isUnknown ? '' : brand} usando estos datos reales:

${errorCodesData.substring(0, 6000)}

FORMATO OBLIGATORIO — devuelve EXACTAMENTE esto y nada más:
## Diagnóstico de Problemas

| Código/Señal | Significado | Solución |
|---|---|---|
| [código] | [qué significa] | [qué hacer] |
... (8-10 filas con los errores más frecuentes)

Si el problema persiste, contacta con el soporte del alojamiento.`
            : `Genera SOLO la sección "## Diagnóstico de Problemas" para un ${applianceType} ${isUnknown ? '' : brand}.

FORMATO OBLIGATORIO:
## Diagnóstico de Problemas

| Código/Señal | Significado | Solución |
|---|---|---|
... (5-6 problemas más comunes: no enciende, no lava bien, ruidos, fugas, etc.)

Si el problema persiste, contacta con el soporte del alojamiento.`;

        const diagResponse = await geminiREST('gemini-2.5-flash', diagPrompt, {
            responseMimeType: 'text/plain',
            temperature: 0.1,
            maxOutputTokens: 2048,
        });

        if (loggingContext) {
            after(logAiUsage({
                operation: 'manual_enrichment',
                model: 'gemini-2.5-flash',
                usage: diagResponse?.usage,
                propertyId: loggingContext.propertyId,
                tenantId: loggingContext.tenantId,
                isError: !!diagResponse?.error
            }));
        }

        const diagData = diagResponse?.data;

        const diagSection = (diagData as string || '').trim();
        logT(`[GEN] Diagnostic section: ${diagSection.length} chars | tableRows: ${(diagSection.match(/\|[^|]+\|[^|]+\|[^|]+\|/g) || []).length - 1}`);

        const fullManual = `${cleaned}\n\n${diagSection}`;
        logT(`[GEN] ✅ Manual: ${fullManual.length} chars total`);
        return fullManual;

    } catch (err: any) {
        logT(`[GEN] ERROR: ${err.message}`);
        throw err;
    }
}

// Exportada para uso en endpoints de quality test (no guarda en DB)
export async function generateManualForQualityTest(imageUrl: string, basicAnalysis: any, loggingContext?: { propertyId?: string | null, tenantId?: string | null }): Promise<string> {
    return generateManualSinglePass(imageUrl, basicAnalysis, '', '', loggingContext);
}

export async function regenerateManualAction(manualId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const { data: manual, error: fetchErr } = await supabase
        .from('property_manuals')
        .select('*')
        .eq('id', manualId)
        .single()

    if (fetchErr || !manual) throw new Error('Manual no encontrado')

    logT(`[REGENERATE] Regenerating manual ${manual.appliance_name} (${manual.brand} ${manual.model || ''})...`)

    const [groundingData, errorCodesData] = await Promise.all([
        fetchGroundingData(manual.brand, manual.model, manual.appliance_name),
        fetchErrorCodes(manual.brand, manual.model, manual.appliance_name)
    ])

    logT(`[REGENERATE] groundingData: ${groundingData?.length ?? 0} chars, errorCodesData: ${errorCodesData?.length ?? 0} chars`)
    logT(`[REGENERATE] errorCodesData preview: ${(errorCodesData || '').substring(0, 200)}`)

    const manualContent = await generateManualSinglePass(null as any, {
        appliance_type: manual.appliance_name,
        brand: manual.brand,
        model: manual.model
    }, groundingData, errorCodesData, { propertyId: manual.property_id, tenantId: manual.tenant_id })

    logT(`[REGENERATE] Generated manual length: ${manualContent?.length ?? 0} chars`)
    logT(`[REGENERATE] Manual preview (last 500): ${(manualContent || '').slice(-500)}`)

    if (!manualContent) throw new Error('Error al regenerar el contenido')

    const { error: updateErr } = await supabase
        .from('property_manuals')
        .update({
            manual_content: manualContent,
            updated_at: new Date().toISOString()
        })
        .eq('id', manualId)

    if (updateErr) {
        console.error('[INGESTION] Error updating manual content:', updateErr.message)
        throw new Error('Error al actualizar el contenido del manual')
    }

    await syncManualToRAG(
        manual.property_id,
        manual.tenant_id,
        manualId,
        manualContent,
        manual.appliance_name,
        manual.brand,
        manual.model
    )

    revalidatePath(`/dashboard/properties/${manual.property_id}/setup`)
    return { success: true, content: manualContent }
}