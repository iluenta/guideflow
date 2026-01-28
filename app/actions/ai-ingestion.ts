'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GuideSection } from './properties'
import axios from 'axios'
import { generateEmbedding } from '@/lib/ai/embeddings'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

/**
 * Robustly fetches content from a URL using a reader service (like Jina Reader)
 * This is maintainable as it avoids direct DOM scraping and IP blocks.
 */
async function fetchListingContent(url: string, retryCount = 0): Promise<string> {
    const MAX_RETRIES = 1
    try {
        // Jina Reader format: https://r.jina.ai/URL
        // Using encodeURIComponent is safer for listing URLs with complex query params.
        console.log(`Scraping attempt ${retryCount + 1} for: ${url}`)
        const response = await axios.get(`https://r.jina.ai/${encodeURIComponent(url.trim())}`, {
            timeout: 45000, // Aumentamos a 45s ya que Booking/Airbnb pueden ser pesados
            headers: {
                'X-Return-Format': 'markdown'
            }
        })
        return response.data
    } catch (error: any) {
        if (retryCount < MAX_RETRIES) {
            console.warn(`Scraping timeout or error, retrying... (${retryCount + 1}/${MAX_RETRIES})`)
            // Pequeña espera antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 2000))
            return fetchListingContent(url, retryCount + 1)
        }

        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout')
        console.error('Scraping error:', error.response?.data || error.message || error)

        if (isTimeout) {
            throw new Error('El servidor de extracción tardó demasiado en responder (Timeout). Por favor, intenta de nuevo en unos segundos.')
        }
        throw new Error('No se pudo acceder a la URL. Verifica que sea pública y accesible desde internet.')
    }
}

/**
 * Extracts structured guide data from raw text using Gemini 2.0 Flash
 */
async function extractListingData(content: string) {
    console.log('Extracting listing data with Gemini...')

    // Pre-procesamiento: Intentar aislar la sección del anfitrión para mayor precisión
    const hostMarkers = [/Anfitrión:/i, /Acerca del anfitrión/i, /Host profile/i, /About the host/i]
    let hostContext = ''

    for (const marker of hostMarkers) {
        const match = content.match(marker)
        if (match && match.index) {
            // Tomamos una ventana de 4000 caracteres alrededor del marcador
            hostContext = content.substring(match.index, match.index + 4000)
            console.log('Host context isolated based on marker:', marker)
            break
        }
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
    })

    const prompt = `
    Eres un experto en hospitalidad y gestión de alquileres vacacionales. 
    Analiza la información de este anuncio para crear una guía digital.
    
    IMPORTANTE: Hemos extraído una sección que creemos que contiene el perfil del anfitrión. 
    ÚSALO COMO FUENTE PRINCIPAL PARA EL NOMBRE Y EL MENSAJE DE BIENVENIDA.
    
    SECCIÓN DEL ANFITRIÓN (Prioritarias):
    """
    ${hostContext || "No se pudo aislar una sección específica. Busca en el contenido general."}
    """
    
    REGLAS ESTRICTAS PARA EL HOST:
    - **Host Name**: Debe ser el nombre COMPLETO de la persona (ej: "Iván Rodríguez", no solo "Iván"). Búscalo justo después de "Anfitrión:".
    - **Welcome Message**: Copia el texto COMPLETO del mensaje personal del anfitrión. NO lo resumas, NO lo acortes. Queremos todo el párrafo descriptivo donde se presenta y ofrece ayuda (ej: desde "¡Hola! Soy..." hasta "¡Nos vemos pronto!").
    - **PROHIBIDO**: Bajo ninguna circunstancia uses el nombre de la propiedad (ej: "Alto de Torremar") como nombre de anfitrión.

    FORMATO DE SALIDA: JSON estricto con esta estructura:
    {
      "host_name": "Nombre completo de la persona",
      "welcome_message": "Mensaje completo y literal del anfitrión",
      "description": "Resumen corto de la propiedad (máx 200 caracteres)",
      "sections": [
        {
          "title": "Título de la sección",
          "content_type": "text",
          "data": { "text": "Contenido detallado" }
        }
      ]
    }
    
    SECCIONES REQUERIDAS (si están disponibles):
    - "WiFi": Red y contraseña.
    - "Normas de la casa": Check-in, check-out, mascotas, fiestas, etc.
    - "Servicios": Listado estructurado.
    - "Instrucciones de Acceso": Cómo entrar.
    - "Preguntas Frecuentes": 3-4 preguntas comunes.

    CONTENIDO GENERAL DEL ANUNCIO:
    ${content.substring(0, 100000)}
    `

    try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        return JSON.parse(text)
    } catch (error: any) {
        console.error('Gemini Extraction Error:', error.message)
        throw new Error(`Error en el procesamiento de IA: ${error.message}`)
    }
}



/**
 * Analyzes an image (appliance, etc.) and generates a technical manual
 */
export async function generateManualFromImage(propertyId: string, imageUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Fetch image as bytes
    const imageResp = await fetch(imageUrl)
    const imageBuffer = await imageResp.arrayBuffer()

    const prompt = "Actúa como un técnico experto. Analiza esta imagen de un electrodoméstico o instalación doméstica y genera un manual de uso simplificado para un huésped que no sabe usarlo. Incluye: 1. Pasos básicos, 2. Precauciones y 3. Solución de problemas comunes. Usa un tono amable y profesional."

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: Buffer.from(imageBuffer).toString('base64'),
                mimeType: 'image/jpeg'
            }
        }
    ])

    const manualText = result.response.text()

    // Save as a new section
    const { data, error } = await supabase
        .from('guide_sections')
        .insert({
            property_id: propertyId,
            tenant_id: tenant_id,
            title: 'Manual de Instrucciones',
            content_type: 'text',
            data: { text: manualText },
            order_index: 99 // Add to the end
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/properties/${propertyId}`)
    return data
}

/**
 * Defined taxonomy for standardization
 */
const ALLOWED_CATEGORIES = [
    'Campana extractora',
    'Placa de cocina',
    'Horno',
    'Lavavajillas',
    'Microondas',
    'Caldera',
    'Termostato',
    'Lavadora',
    'Secadora',
    'Cafetera',
    'Aire acondicionado',
    'Televisión',
    'Caja fuerte'
]

/**
 * Processes a batch of images to identify appliances and generate manuals/notes
 */
export async function processBatchScans(propertyId: string, imageUrls: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    const tenant_id = user.user_metadata.tenant_id

    // Use Gemini to process multiple images
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
    })

    // Fetch images and convert to base64
    const imageParts = await Promise.all(
        imageUrls.map(async (url) => {
            const resp = await fetch(url)
            const buffer = await resp.arrayBuffer()
            return {
                inlineData: {
                    data: Buffer.from(buffer).toString('base64'),
                    mimeType: 'image/jpeg' // Assume jpeg for simplicity
                }
            }
        })
    )

    const prompt = `
    Eres un perito técnico de alojamientos experto en digitalización de guías. 
    Analiza todas las fotos del lote suministrado como un conjunto único. 
    
    PASO 1: Identifica todos los electrodomésticos en el lote de fotos.
    PASO 2: Para cada uno, elige OBLIGATORIAMENTE la categoría más cercana de esta lista:
    [${ALLOWED_CATEGORIES.join(', ')}]
    PASO 3: Si un objeto tiene varios nombres posibles (ej: Extractor o Campana), usa siempre el de la lista (ej: Campana extractora).
    PASO 4: Genera un único objeto JSON por cada categoría única detectada, unificando los detalles técnicos de todas las fotos donde aparezca (marca, controles, estado).

    INSTRUCCIONES TÉCNICAS:
    - Para cada categoría, identifica marca, modelo y crea un manual rápido de 3 pasos y soluciones de troubleshooting.
    - El campo "category" debe ser EXACTAMENTE uno de la lista anterior.

    FORMATO DE SALIDA (JSON):
    {
      "results": [
        {
          "category": "Nombre exacto de la lista",
          "brand": "Marca detectada",
          "content": "Contenido combinado de manual y troubleshooting en formato Markdown",
          "internal_note": "Nota solo para el anfitrión si hay anomalías, sino dejar vacío"
        }
      ]
    }
    `

    try {
        const result = await model.generateContent([prompt, ...imageParts])
        const text = result.response.text()
        const data = JSON.parse(text)

        // 1. Fetch existing sections to preserve order_index and existing titles/slugs
        const { data: existingSections } = await supabase
            .from('guide_sections')
            .select('title, order_index, section_slug')
            .eq('property_id', propertyId)

        const existingMap = new Map(existingSections?.map(s => [s.section_slug || '', s.order_index]))

        // 2. Process results with standardization and embeddings
        const sectionsToUpsert = await Promise.all(
            data.results.map(async (res: any, index: number) => {
                // Standardization
                const category = res.category
                const normalizedTitle = `Manual de ${category}`
                const sectionSlug = `manual-${category.toLowerCase().replace(/ /g, '-')}`

                // Generate embedding for the combined content
                const embeddingText = `${normalizedTitle}\n${res.content}`
                const embedding = await generateEmbedding(embeddingText)

                // Preserve order_index if it exists
                const preservedOrderIndex = existingMap.get(sectionSlug) ?? (50 + index)

                return {
                    property_id: propertyId,
                    tenant_id: tenant_id,
                    title: normalizedTitle,
                    section_slug: sectionSlug,
                    content_type: 'text',
                    data: {
                        text: res.content,
                        internal_note: res.internal_note,
                        brand: res.brand
                    },
                    order_index: preservedOrderIndex,
                    embedding: embedding.length > 0 ? embedding : null,
                    metadata: {
                        category: 'manual_tecnico',
                        property_id: propertyId
                    }
                }
            })
        )

        // 3. Upsert into guide_sections resolving conflicts on (property_id, section_slug)
        const { error } = await supabase
            .from('guide_sections')
            .upsert(sectionsToUpsert, {
                onConflict: 'property_id, section_slug'
            })

        if (error) throw new Error(error.message)

        revalidatePath(`/dashboard/properties/${propertyId}`)
        return { success: true, count: sectionsToUpsert.length }
    } catch (error: any) {
        console.error('Batch Scan Error:', error.message)
        throw new Error(`Error en el procesamiento visual: ${error.message}`)
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

    // 1. Check for existing sections if NOT overwriting
    if (!options.overwrite) {
        const { count } = await supabase
            .from('guide_sections')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', propertyId)

        if (count && count > 0) {
            return { requiresConfirmation: true, sectionCount: count }
        }
    }

    // 2. Clear existing if overwriting
    if (options.overwrite) {
        await supabase
            .from('guide_sections')
            .delete()
            .eq('property_id', propertyId)
    }

    // 3. Scrape and Extract
    const rawContent = await fetchListingContent(url)
    const structuredData = await extractListingData(rawContent)

    // 4. Update Property Data
    const propertyUpdate: any = { description: structuredData.description }

    // Fetch current property to merge theme_config
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

    // 5. Create Sections
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
