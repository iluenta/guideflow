'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding, splitIntoChunks } from '@/lib/ai/openai'
import { sanitizeUUID } from '@/lib/utils'

/**
 * Enriches TV manuals with explicit streaming app access info.
 * Derives which apps have a direct button vs which require Home navigation
 * from the manual content and host notes — so Gemini gets a fact, not an inference.
 */
function enrichTVManual(manualContent: string, hostNotes: string): string {
    const isTV = /televisor|TV\b|tele\b|mando.*TV|televisión|television/i.test(manualContent)
    if (!isTV) return manualContent

    const knownStreamingApps = [
        'Netflix', 'Disney+', 'HBO Max', 'HBO', 'Prime Video', 'Amazon Prime',
        'YouTube', 'Apple TV+', 'Apple TV', 'Movistar+', 'Filmin',
        'Rakuten TV', 'DAZN', 'Atresplayer', 'RTVE Play', 'SkyShowtime'
    ]

    // Busca las apps conocidas mencionadas cerca de "acceso directo" en el manual
    const directButtonSection = manualContent.match(
        /[Bb]otones?\s+de\s+acceso\s+directo[\s\S]{0,500}/
    )?.[0] || ''

    const appsWithButton: string[] = knownStreamingApps.filter(app =>
        directButtonSection.toLowerCase().includes(app.toLowerCase())
    )

    // Extract available apps from host notes
    const appsInNotes = knownStreamingApps.filter(app =>
        hostNotes.toLowerCase().includes(app.toLowerCase())
    )

    if (appsWithButton.length === 0 && appsInNotes.length === 0) return manualContent

    // Apps disponibles pero SIN botón directo
    const appsOnlyViaHome = appsInNotes.filter(app =>
        !appsWithButton.some((b: string) => b.toLowerCase() === app.toLowerCase())
    )

    let note = '\n\n## ACCESO A APPS DE STREAMING\n'

    if (appsWithButton.length > 0) {
        note += `\n**Apps con botón directo en el mando:** ${appsWithButton.join(', ')}.\n`
        note += `Para estas apps: pulsa directamente su botón en el mando.\n`
    }

    if (appsOnlyViaHome.length > 0) {
        note += `\n**Apps disponibles SIN botón directo (acceso por menú):** ${appsOnlyViaHome.join(', ')}.\n`
        note += `Para estas apps: pulsa **Home** en el mando → navega con las flechas hasta la app → pulsa **OK**.\n`
    }

    note += `\n⚠️ REGLA: Si una app no aparece en la lista de botones directos, SIEMPRE se accede desde Home → menú de aplicaciones. Nunca asumir que tiene botón directo.`

    return manualContent + note
}

/**
 * Synchronizes wizard data (FAQs and Context) to the unified context_embeddings table for RAG.
 */
export async function syncWizardDataToRAG(propertyId: string, tenantId: string | null | undefined, category: string, data: any, customClient?: any) {
    const supabase = customClient || await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenantId)

    if (!currentPropId) {
        console.warn(`[RAG-SYNC] Sincronización saltada: propertyId inválido para categoría ${category}`)
        return
    }

    console.log(`[RAG-SYNC] Syncing ${category} for property ${currentPropId}...`)

    const sourceTypeMap: Record<string, string> = {
        'faqs': 'faq',
        'dining': 'recommendation',
        'property': 'context',
        'welcome': 'context',
        'access': 'context',
        'rules': 'context',
        'contacts': 'context',
        'tech': 'context',
        'inventory': 'context'
    }
    const sourceType = sourceTypeMap[category] || 'context'

    await supabase.from('context_embeddings')
        .delete()
        .eq('property_id', currentPropId)
        .eq('source_type', sourceType)
        .filter('metadata->>category', 'eq', category === 'faqs' ? 'guía_uso' : category === 'dining' ? 'ocio' : category)

    let contentToEmbed = ''
    let metadata: any = {}

    if (category === 'faqs') {
        const faqs = data as any[]
        if (!faqs || faqs.length === 0) return
        contentToEmbed = faqs.map(f => `[PREGUNTA]: ${f.question}\n[RESPUESTA]: ${f.answer}`).join('\n\n')
        metadata = { category: 'guía_uso', type: 'faqs' }
    } else if (category === 'dining') {
        const recs = data as any[]
        if (!recs || recs.length === 0) return
        contentToEmbed = recs.map(r =>
            `[RECOMENDACIÓN]: ${r.name}\n` +
            `Tipo: ${r.category || r.type}\n` +
            `Descripción: ${r.description || ''}\n` +
            `Distancia: ${r.distance || ''}\n` +
            `Nota personal del anfitrión: ${r.personal_note || r.metadata?.personal_note || ''}`
        ).join('\n\n---\n\n')
        metadata = { category: 'ocio', type: 'recommendations' }
        contentToEmbed = `[INFORMACIÓN GENERAL DEL ALOJAMIENTO]:\n` +
            `Nombre: ${data.name}\n` +
            `Descripción: ${data.description || ''}\n` +
            `Capacidad: ${data.guests || ''} personas\n` +
            `Dormitorios: ${data.beds || ''}\n` +
            `Baños: ${data.baths || ''}\n` +
            `Parking: ${data.has_parking ? `Sí, disponible. Número de plaza: ${data.parking_number || 'No especificado'}` : 'No disponible'}\n` +
            `Ubicación: ${data.location || ''}`
        metadata = { category: 'propiedad', type: 'info' }
    } else if (category === 'welcome') {
        contentToEmbed = `[MENSAJE DE BIENVENIDA Y ANFITRIÓN]:\n` +
            `Título: ${data.title}\n` +
            `Mensaje: ${data.message}\n` +
            `Anfitrión: ${data.host_name || ''}`
        metadata = { category: 'bienvenida', type: 'info' }
    } else if (category === 'access') {
        const fromAirport = data.from_airport?.instructions || (typeof data.from_airport === 'string' ? data.from_airport : '')
        const fromTrain = data.from_train?.instructions || (typeof data.from_train === 'string' ? data.from_train : '')
        const parking = data.parking?.info || (typeof data.parking === 'string' ? data.parking : '')
        const nearby = Array.isArray(data.nearby_transport)
            ? data.nearby_transport.map((t: any) => `- ${t.type}: ${t.name} (${t.distance})`).join('\n')
            : (typeof data.nearby_transport === 'string' ? data.nearby_transport : '')

        contentToEmbed = `[INSTRUCCIONES DE LLEGADA Y ACCESO]:\n` +
            `Dirección completa: ${data.full_address || ''}\n` +
            `Tipo de entrada: ${data.checkin_type || ''}\n` +
            `Instrucciones de entrada: ${data.checkin_instructions || ''}\n` +
            `Desde el Aeropuerto: ${fromAirport}\n` +
            `Desde el Tren: ${fromTrain}\n` +
            `Parking: ${parking}\n` +
            `Transporte cercano:\n${nearby}`
        metadata = { category: 'acceso', type: 'llegada' }
    } else if (category === 'rules') {
        const rulesItems = (data.rules_items || []).map((ri: any) => `- ${ri.text} (${ri.type === 'allowed' ? 'Permitido' : 'Prohibido'})`).join('\n')
        contentToEmbed = `[NORMAS DE LA CASA Y HORARIOS]:\n` +
            `Hora de salida (Check-out): ${data.checkout_time || ''}\n` +
            `Horario de silencio: ${data.quiet_hours || ''}\n` +
            `Normas específicas:\n${rulesItems}`
        metadata = { category: 'normas', type: 'reglas' }
    } else if (category === 'contacts') {
        const custom = (data.custom_contacts || []).map((cc: any) => `- ${cc.name}: ${cc.phone}`).join('\n')
        contentToEmbed = `[CONTACTOS DE SOPORTE Y EMERGENCIA]:\n` +
            `Contacto principal: ${data.support_name || ''}\n` +
            `Teléfono principal: ${data.support_phone || ''}\n` +
            `Contactos adicionales:\n${custom}`
        metadata = { category: 'contactos', type: 'soporte' }
    } else if (category === 'tech') {
        contentToEmbed = `[WIFI Y TECNOLOGÍA]:\n` +
            `Red WiFi: ${data.wifi_ssid || ''}\n` +
            `Contraseña WiFi: ${data.wifi_password || ''}\n` +
            `Ubicación del router/Notas: ${data.router_notes || ''}`
        metadata = { category: 'tecnologia', type: 'wifi' }
    } else if (category === 'inventory') {
        const inventoryData = data as any
        const selectedItems = inventoryData.selected_items || []

        if (selectedItems.length === 0) return

        contentToEmbed = `[LISTA DE ELECTRODOMÉSTICOS Y EQUIPAMIENTO DISPONIBLE]:\n` +
            selectedItems
                .filter((item: any) => item.isPresent)
                .map((item: any) => `- **${item.name}**: ${item.customContext ? `Ubicación/Nota: ${item.customContext}` : 'Disponible en el alojamiento.'}`)
                .join('\n')

        metadata = { category: 'inventario', type: 'equipamiento' }
    } else {
        contentToEmbed = `[INFORMAClÓN DE ${category.toUpperCase()}]:\n${typeof data === 'string' ? data : JSON.stringify(data)}`
        metadata = { category: category, type: 'context' }
    }

    try {
        const embedding = await generateOpenAIEmbedding(contentToEmbed)

        if (!currentPropId || currentPropId.length < 32) {
            console.error(`[RAG-SYNC] Invalid currentPropId: ${currentPropId}`);
            return;
        }
        const categories = ['property', 'welcome', 'access', 'rules', 'contacts', 'tech', 'inventory', 'faqs', 'dining']
        const catIndex = categories.indexOf(category) !== -1 ? categories.indexOf(category) : 9
        const suffix = catIndex.toString(16).padStart(4, '0')
        const deterministicSourceId = currentPropId.substring(0, currentPropId.length - 4) + suffix

        await supabase.from('context_embeddings').delete().eq('source_id', deterministicSourceId)

        const { error: insError } = await supabase.from('context_embeddings').insert({
            property_id: currentPropId,
            tenant_id: currentTenantId || null,
            source_type: sourceType,
            source_id: deterministicSourceId,
            content: contentToEmbed,
            embedding: embedding,
            metadata: metadata
        })

        if (insError) {
            console.error(`[RAG-SYNC] Error indexing ${category}:`, insError.message)
        } else {
            console.log(`[RAG-SYNC] SUCCESS: ${category} indexed.`)
        }

    } catch (err: any) {
        console.error(`[RAG-SYNC] Embedding generation failed for ${category}:`, err.message)
    }
}

/**
 * Synchronizes a single manual to the RAG context.
 */
export async function syncManualToRAG(
    propertyId: string,
    tenantId: string | null | undefined,
    manualId: string,
    manualContent: string,
    applianceName: string,
    brand: string,
    model?: string
) {
    const supabase = await createClient()

    const currentPropId = sanitizeUUID(propertyId)
    const currentTenantId = sanitizeUUID(tenantId)
    const currentManualId = sanitizeUUID(manualId)

    if (!currentManualId || !currentPropId) {
        console.warn(`[RAG-SYNC-MANUAL] Skipping: Invalid IDs for ${applianceName}`)
        return
    }

    console.log(`[RAG-SYNC-MANUAL] Syncing manual for ${applianceName} (${brand})...`)

    try {
        // 0. Fetch latest metadata to get host notes
        const { data: manual } = await supabase
            .from('property_manuals')
            .select('metadata')
            .eq('id', currentManualId)
            .single()

        const hostNotes = manual?.metadata?.notes || ''

        // ✅ FIX: Enriquecer manuales de TV con nota explícita de acceso a streaming
        // Esto evita que Gemini infiera por analogía que una app tiene botón directo
        const enrichedManual = enrichTVManual(manualContent, hostNotes)

        const augmentedContent = hostNotes
            ? `[NOTAS DEL ANFITRIÓN]: ${hostNotes}\n\n${enrichedManual}`
            : enrichedManual

        // 1. Delete old embeddings for this manual
        await supabase.from('context_embeddings').delete().eq('source_id', currentManualId)

        // 2. Split content into logical chunks (approx 800-1000 chars)
        const chunks = splitIntoChunks(augmentedContent, 800)

        // 3. Generate embeddings with appliance context prepended to each chunk
        const contextEmbeddings = await Promise.all(chunks.map(async (chunk, index) => {
            const enrichedText = `[APARATO: ${brand} ${model || ''} ${applianceName}]\n${chunk}`
            const embedding = await generateOpenAIEmbedding(enrichedText)

            return {
                property_id: currentPropId,
                tenant_id: currentTenantId || null,
                source_type: 'manual',
                source_id: currentManualId,
                content: enrichedText,
                embedding: embedding,
                metadata: {
                    appliance: applianceName,
                    brand: brand,
                    model: model || '',
                    chunk_index: index
                }
            }
        }))

        // 4. Batch insert
        const { error: insError } = await supabase.from('context_embeddings').insert(contextEmbeddings)

        if (insError) {
            console.error(`[RAG-SYNC-MANUAL] Error inserting embeddings for ${applianceName}:`, insError.message)
            throw insError
        }

        console.log(`[RAG-SYNC-MANUAL] SUCCESS: ${contextEmbeddings.length} chunks indexed for ${applianceName}.`)
    } catch (err: any) {
        console.error(`[RAG-SYNC-MANUAL] Sync failed for ${applianceName}:`, err.message)
    }
}