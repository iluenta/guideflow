import { geminiREST } from '@/lib/ai/gemini-rest'

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export type ChatIntent =
    | 'emergency'           // Incendio, gas, inundación, emergencia médica
    | 'error_code'          // Código de error de electrodoméstico (E1, F3, etc.)
    | 'appliance_problem'   // Electrodoméstico roto, no funciona, avería
    | 'appliance_usage'     // Cómo usar un electrodoméstico
    | 'recommendation_food' // Dónde comer, desayunar, cenar, tapas, café
    | 'recommendation_activity' // Qué hacer, ocio, turismo, visitas
    | 'recommendation_shopping' // Tiendas, compras, mercados
    | 'recommendation_other'    // Otros tipos de recomendación
    | 'property_info'       // WiFi, normas, acceso, check-in, check-out
    | 'standard'            // Cualquier otra cosa

export type FoodSubtype =
    | 'desayuno'
    | 'almuerzo'
    | 'cena'
    | 'tapas'
    | 'cafe'
    | 'italiano'
    | 'mediterraneo'
    | 'hamburguesas'
    | 'asiatico'
    | 'alta_cocina'
    | 'internacional'
    | 'general'
    | null

export interface ClassifiedIntent {
    intent: ChatIntent
    foodSubtype: FoodSubtype
    detectedErrorCode: string | null
    isGenericFood: boolean   // true si quiere comer pero no especifica qué tipo
    confidence: 'high' | 'medium' | 'low'
}

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT DEL CLASIFICADOR
// ═══════════════════════════════════════════════════════

const CLASSIFIER_SYSTEM_PROMPT = `Eres un clasificador de intención para un asistente de apartamentos turísticos.
Analiza el mensaje del huésped (y el contexto reciente si se proporciona) y devuelve SOLO un objeto JSON con esta estructura exacta:

{
  "intent": "<uno de los valores permitidos>",
  "foodSubtype": "<subtipo o null>",
  "detectedErrorCode": "<código en mayúsculas o null>",
  "isGenericFood": <true|false>,
  "confidence": "<high|medium|low>"
}

VALORES PERMITIDOS para "intent":
- "emergency": incendio, humo, olor a gas, fuga, inundación, emergencia médica, alguien inconsciente
- "error_code": el huésped menciona un código de error de aparato (E1, F3, EA0, d21, etc.)
- "appliance_problem": electrodoméstico roto, no funciona, no enciende, hace ruido, gotea, avería
- "appliance_usage": cómo usar un electrodoméstico, instrucciones, cómo poner la lavadora, hacer café, etc.
- "recommendation_food": quiere comer, cenar, desayunar, tomar algo, le apetece algo, tiene hambre, busca restaurante, bar, cafetería
- "recommendation_activity": qué hacer, ocio, turismo, museos, visitas, actividades, noche, copas
- "recommendation_shopping": tiendas, compras, souvenirs, centro comercial, mercado, ropa, zapatos, moda, clothing store, mall, fashion, supermercado
- "recommendation_other": otras recomendaciones que no encajan en las anteriores
- "property_info": WiFi, contraseña, normas, check-in, check-out, acceso, llaves, parking, dirección
- "standard": cualquier otra pregunta que no encaje arriba

VALORES PERMITIDOS para "foodSubtype" (solo si intent es "recommendation_food"):
- "desayuno": desayuno, brunch, café, mañana, primera comida del día
- "almuerzo": comida del mediodía, almuerzo, menú del día
- "cena": cena, cenar, noche, por la noche
- "tapas": tapas, pinchos, aperitivo
- "cafe": café solo, cortado, tomar un café, cafetería
- "italiano": pizza, pasta, risotto
- "mediterraneo": mediterráneo, griega, mariscos, pescado
- "hamburguesas": hamburguesa, burger, americano
- "asiatico": asiático, japonés, chino, thai, sushi, ramen, wok
- "alta_cocina": gourmet, fine dining, estrella michelin
- "internacional": internacional, fusión, variado
- "general": quiere comer pero no especifica tipo de cocina ni momento del día
- null: si intent NO es "recommendation_food"

Para "isGenericFood": true si el huésped NO ha especificado un tipo de COCINA (ej: italiano, asiático, hamburguesería). 
- Si solo dice "tengo hambre", "donde como", "donde ceno", "donde desayuno" -> isGenericFood: true.
- Si dice "donde como pizza", "restaurante sushi para cenar" -> isGenericFood: false (especifica cocina).

Para "detectedErrorCode": extrae el código en mayúsculas si existe (ej: "E5", "F21", "EA0"). null si no hay código.

EJEMPLOS:
- "no he desayunado, donde me recomiendas" → intent: "recommendation_food", foodSubtype: "desayuno", isGenericFood: true
- "llevo horas sin probar bocado" → intent: "recommendation_food", foodSubtype: "general", isGenericFood: true
- "donde puedo cenar algo rico" → intent: "recommendation_food", foodSubtype: "cena", isGenericFood: true
- "me apetece una pizza" → intent: "recommendation_food", foodSubtype: "italiano", isGenericFood: false
- "la lavadora pone E5" → intent: "error_code", detectedErrorCode: "E5"
- "huele a quemado" → intent: "emergency"
- "el microondas no enciende" → intent: "appliance_problem"
- "cómo pongo el horno" → intent: "appliance_usage"
- "cuál es la contraseña del wifi" → intent: "property_info"
- "a qué hora tengo que salir" → intent: "property_info"
- "qué hay para hacer por aquí" → intent: "recommendation_activity"
- "¿dónde puedo tomarme algo rico?" → intent: "recommendation_food", foodSubtype: "general", isGenericFood: true

Responde SOLO con el JSON. Sin explicaciones, sin markdown, sin backticks.`

// ═══════════════════════════════════════════════════════
// FALLBACK: Intent por defecto si el clasificador falla
// ═══════════════════════════════════════════════════════

const DEFAULT_INTENT: ClassifiedIntent = {
    intent: 'standard',
    foodSubtype: null,
    detectedErrorCode: null,
    isGenericFood: false,
    confidence: 'low'
}

// ═══════════════════════════════════════════════════════
// CLASIFICADOR PRINCIPAL
// ═══════════════════════════════════════════════════════

export async function classifyIntent(
    lastMessage: string,
    recentContext: string // Últimos N mensajes concatenados para contexto de flujo
): Promise<ClassifiedIntent> {
    const inputForClassifier = recentContext
        ? `[CONTEXTO RECIENTE]: ${recentContext.substring(0, 400)}\n[ÚLTIMO MENSAJE]: ${lastMessage}`
        : lastMessage

    try {
        const { data, error } = await geminiREST('gemini-2.0-flash', inputForClassifier, {
            temperature: 0,
            responseMimeType: 'application/json',
            systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
            maxOutputTokens: 150 // El JSON es pequeño, no necesitamos más
        })

        if (error || !data) {
            console.warn('[INTENT] Classifier failed, using fallback:', error)
            return DEFAULT_INTENT
        }

        // geminiREST con application/json ya parsea el JSON automáticamente
        const result = data as ClassifiedIntent

        // Validación mínima: el intent debe ser un valor conocido
        const validIntents: ChatIntent[] = [
            'emergency', 'error_code', 'appliance_problem', 'appliance_usage',
            'recommendation_food', 'recommendation_activity', 'recommendation_shopping',
            'recommendation_other', 'property_info', 'standard'
        ]

        if (!result.intent || !validIntents.includes(result.intent)) {
            console.warn('[INTENT] Invalid intent returned:', result.intent)
            return DEFAULT_INTENT
        }

        console.log('[INTENT] Classified:', {
            intent: result.intent,
            foodSubtype: result.foodSubtype,
            detectedErrorCode: result.detectedErrorCode,
            isGenericFood: result.isGenericFood,
            confidence: result.confidence
        })

        return result

    } catch (err: any) {
        console.error('[INTENT] Classifier error:', err.message)
        return DEFAULT_INTENT
    }
}

// ═══════════════════════════════════════════════════════
// HELPERS para mantener compatibilidad con el resto del código
// ═══════════════════════════════════════════════════════

export function intentToStrategy(intent: ClassifiedIntent): string {
    switch (intent.intent) {
        case 'emergency': return 'emergency'
        case 'error_code': return 'error_code'
        case 'appliance_problem':
        case 'appliance_usage': return 'appliance'
        case 'recommendation_food':
        case 'recommendation_activity':
        case 'recommendation_shopping':
        case 'recommendation_other': return 'recommendation'
        default: return 'standard'
    }
}

export function isRecommendation(intent: ClassifiedIntent): boolean {
    return intent.intent.startsWith('recommendation_')
}

export function isAppliance(intent: ClassifiedIntent): boolean {
    return intent.intent === 'appliance_problem' || intent.intent === 'appliance_usage'
}
