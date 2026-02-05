'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOpenAIEmbedding } from '@/lib/ai/openai'

/**
 * Synchronizes wizard data (FAQs and Context) to the unified context_embeddings table for RAG.
 */
export async function syncWizardDataToRAG(propertyId: string, tenantId: string, category: string, data: any) {
    const supabase = await createClient()

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
        contentToEmbed = `[INSTRUCCIONES DE LLEGADA Y ACCESO]:\n` +
            `Dirección completa: ${data.full_address || ''}\n` +
            `Tipo de entrada: ${data.checkin_type || ''}\n` +
            `Instrucciones de entrada: ${data.checkin_instructions || ''}\n` +
            `Desde el Aeropuerto: ${data.from_airport || ''}\n` +
            `Desde el Tren: ${data.from_train || ''}\n` +
            `Parking: ${data.parking || ''}\n` +
            `Transporte cercano: ${data.nearby_transport || ''}`
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
    // Para simplificar FAQs las metemos en un solo bloque si no son demasiadas, 
    // o podríamos dividirlas si superan cierto límite.
    try {
        const embedding = await generateOpenAIEmbedding(contentToEmbed)

        // 3. Insertar en la tabla unificada
        const { error } = await supabase.from('context_embeddings').insert({
            property_id: propertyId,
            tenant_id: tenantId,
            source_type: sourceType,
            source_id: propertyId, // Usamos el ID de la propiedad como UUID válido
            content: contentToEmbed,
            embedding: embedding,
            metadata: metadata
        })

        if (error) console.error(`[RAG-SYNC] Error inserting ${category}:`, error.message)
        else console.log(`[RAG-SYNC] SUCCESS: ${category} indexed.`)

    } catch (err: any) {
        console.error(`[RAG-SYNC] Embedding generation failed for ${category}:`, err.message)
    }
}
