'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding } from '@/lib/ai/openai'

/**
 * Synchronizes wizard data (FAQs and Context) to the unified context_embeddings table for RAG.
 */
export async function syncWizardDataToRAG(propertyId: string, tenantId: string, category: string, data: any, customClient?: any) {
    const supabase = customClient || await createClient()

    console.log(`[RAG-SYNC] Syncing ${category} for property ${propertyId}...`)

    // Mapeo de source_type según la categoría
    const sourceTypeMap: Record<string, string> = {
        'faqs': 'faq',
        'dining': 'recommendation',
        'property': 'context', // Info básica es context
        'welcome': 'context',
        'access': 'context',
        'rules': 'context',
        'contacts': 'context',
        'tech': 'context',
        'inventory': 'context'
    }
    const sourceType = sourceTypeMap[category] || 'context'

    // 1. Limpiar fragmentos antiguos de esta fuente y categoría
    // Usamos el propertyId como source_id para categorías del wizard, 
    // pero filtramos por tipo y categoría específica en metadata para no borrar otros.
    await supabase.from('context_embeddings')
        .delete()
        .eq('property_id', propertyId)
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
    } else if (category === 'property') {
        contentToEmbed = `[INFORMACIÓN GENERAL DEL ALOJAMIENTO]:\n` +
            `Nombre: ${data.name}\n` +
            `Descripción: ${data.description || ''}\n` +
            `Capacidad: ${data.guests || ''} personas\n` +
            `Dormitorios: ${data.beds || ''}\n` +
            `Baños: ${data.baths || ''}\n` +
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
        contentToEmbed = `[LISTA DE ELECTRODOMÉSTICOS Y EQUIPAMIENTO]:\n${data.text || (typeof data === 'string' ? data : JSON.stringify(data))}`
        metadata = { category: 'inventario', type: 'equipamiento' }
    } else {
        contentToEmbed = `[INFORMAClÓN DE ${category.toUpperCase()}]:\n${typeof data === 'string' ? data : JSON.stringify(data)}`
        metadata = { category: category, type: 'context' }
    }

    // 2. Generar embedding (OpenAI 1536)
    try {
        const embedding = await generateOpenAIEmbedding(contentToEmbed)

        // Deterministic source_id per category to avoid collisions
        // We take the property UUID and replace the last hex chars with a category index
        const categories = ['property', 'welcome', 'access', 'rules', 'contacts', 'tech', 'inventory', 'faqs', 'dining']
        const catIndex = categories.indexOf(category) !== -1 ? categories.indexOf(category) : 9
        const suffix = catIndex.toString(16).padStart(4, '0')
        const deterministicSourceId = propertyId.substring(0, propertyId.length - 4) + suffix

        // 3. Insertar en la tabla unificada (Patrón Delete-then-Insert para evitar problemas con índices funcionales)
        await supabase.from('context_embeddings').delete().eq('source_id', deterministicSourceId)

        const { error: insError } = await supabase.from('context_embeddings').insert({
            property_id: propertyId,
            tenant_id: tenantId,
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
