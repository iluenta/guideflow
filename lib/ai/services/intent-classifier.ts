import { geminiREST } from '@/lib/ai/clients/gemini-rest'

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export type ChatIntent =
    | 'emergency'
    | 'error_code'
    | 'appliance_problem'
    | 'appliance_usage'     // Cómo usar un aparato: "¿cómo pongo la lavadora?"
    | 'appliance_task'      // NUEVO: quiere hacer una tarea: "tengo toallas sucias"
    | 'recommendation_food'
    | 'recommendation_activity'
    | 'recommendation_shopping'
    | 'recommendation_other'
    | 'property_info'
    | 'off_topic'
    | 'standard'

export type FoodSubtype =
    | 'desayuno' | 'almuerzo' | 'cena' | 'tapas' | 'cafe'
    | 'italiano' | 'mediterraneo' | 'hamburguesas' | 'asiatico'
    | 'alta_cocina' | 'internacional' | 'recipe' | 'general' | null

export interface ClassifiedIntent {
    intent: ChatIntent
    foodSubtype: FoodSubtype
    detectedErrorCode: string | null
    isGenericFood: boolean
    confidence: 'high' | 'medium' | 'low'
    detectedTask?: string | null  // tarea detectada (ej: 'lavar_ropa', 'cocinar_pizza')
}

// ═══════════════════════════════════════════════════════
// TASK → APPLIANCE + CONSEJOS
// Mapping centralizado para RAG expansion y consejos prácticos
// ═══════════════════════════════════════════════════════

export const TASK_TO_CONTEXT: Record<string, {
    ragTerms: string       // términos para expandir el RAG query
    practicalTip: string   // consejo práctico general que la IA puede usar
}> = {
    'lavar_ropa': {
        ragTerms: 'lavadora programa temperatura centrifugado ciclo tambor',
        practicalTip: 'Para toallas y ropa de cama, usar programa Algodón a 60°C. Para ropa delicada, programa Delicados a 30°C. No sobrecargar el tambor.'
    },
    'cocinar_pizza': {
        ragTerms: 'horno temperatura precalentar bandeja pizza grill',
        practicalTip: 'Precalentar el horno a 220-250°C. Usar la bandeja inferior o media. Si tiene función Pizza o Grill+Convección, úsala. Tiempo aproximado: 10-15 min.'
    },
    'cocinar_pasta': {
        ragTerms: 'vitrocerámica cocina olla agua hervir fuegos inducción',
        practicalTip: 'Hervir abundante agua con sal. Potencia alta hasta ebullición, luego media. Respetar el tiempo indicado en el paquete.'
    },
    'hacer_cafe': {
        ragTerms: 'cafetera cápsula depósito espresso café agua presión',
        practicalTip: 'Comprobar que el depósito de agua esté lleno. Para cafeteras de cápsulas, insertar la cápsula antes de colocar la taza.'
    },
    'hacer_tostadas': {
        ragTerms: 'tostadora pan ranura nivel dorado',
        practicalTip: 'Ajustar el nivel de tostado según preferencia. No forzar el pan si no cabe, usar rebanadas estándar.'
    },
    'cocinar_huevos': {
        ragTerms: 'vitrocerámica cocina sartén aceite inducción fuegos',
        practicalTip: 'Potencia media en vitrocerámica o inducción. Un poco de aceite o mantequilla. Para tortilla: remover suavemente a fuego medio-bajo.'
    },
    'cocinar_carne': {
        ragTerms: 'horno vitrocerámica cocina sartén temperatura grill',
        practicalTip: 'Para filetes: sartén a fuego fuerte con un poco de aceite. Para piezas grandes: horno a 180-200°C según grosor.'
    },
    'cocinar_pescado': {
        ragTerms: 'horno vitrocerámica cocina sartén temperatura',
        practicalTip: 'Horno a 180°C unos 15-20 min dependiendo del grosor. En sartén: fuego medio con tapa para que se haga por dentro.'
    },
    'calentar_comida': {
        ragTerms: 'microondas calentar potencia segundos plato descongelar',
        practicalTip: 'Microondas: potencia media-alta, tapar el plato con film o tapa. Remover a mitad si es necesario para calentar uniformemente.'
    },
    'planchar': {
        ragTerms: 'plancha vapor temperatura tejido ropa',
        practicalTip: 'Revisar la etiqueta de la prenda. Temperatura baja para sintéticos, alta para algodón. Usar vapor para arrugas difíciles.'
    },
    'poner_frio': {
        ragTerms: 'aire acondicionado climatizador mando temperatura modo frío ventilador',
        practicalTip: 'Modo Frío (❄️), temperatura recomendada 22-24°C. Cerrar ventanas mientras funciona para mayor eficiencia.'
    },
    'poner_calor': {
        ragTerms: 'calefacción radiador termostato temperatura calor aire acondicionado',
        practicalTip: 'Si tiene aire reversible: modo Calor (☀️ o HEAT). Temperatura recomendada 20-22°C. Los radiadores tardan unos minutos en calentar.'
    },
    'lavar_vajilla': {
        ragTerms: 'lavavajillas programa pastilla detergente vajilla ciclo',
        practicalTip: 'Programa Normal para vajilla estándar. Asegurarse de que el dispensador de pastilla esté lleno. No poner madera ni cristal delicado.'
    },
    'general_cooking': {
        ragTerms: 'cocina horno vitrocerámica microondas utensilios menaje instalaciones',
        practicalTip: 'Revisar qué electrodomésticos hay disponibles en la cocina antes de empezar.'
    }
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
  "confidence": "<high|medium|low>",
  "detectedTask": "<tarea detectada o null>"
}

VALORES PERMITIDOS para "intent":
- "emergency": incendio, humo, olor a gas, fuga, inundación, emergencia médica
- "error_code": el huésped menciona un código de error de aparato (E1, F3, etc.)
- "appliance_problem": electrodoméstico roto, no funciona, no enciende, hace ruido, avería
- "appliance_usage": el huésped pregunta CÓMO FUNCIONA o CÓMO SE USA un aparato concreto.
  ej: "¿cómo pongo la lavadora?", "cómo uso el horno", "cómo funciona la cafetera"
- "appliance_task": el huésped quiere REALIZAR UNA TAREA que implica usar un aparato,
  aunque NO mencione el aparato directamente.
  ej: "tengo toallas sucias", "quiero hacer una pizza", "voy a preparar el desayuno",
  "tengo ropa mojada", "me apetece un café", "quiero cocinar algo", "hace mucho calor"
  DIFERENCIA CLAVE: en appliance_usage pregunta POR EL APARATO, en appliance_task pregunta POR LA TAREA.
- "recommendation_food": quiere SALIR a comer/cenar/desayunar, busca restaurante/bar/cafetería
- "recommendation_activity": qué hacer fuera, ocio, turismo, museos, visitas
- "recommendation_shopping": tiendas, compras, mercado, supermercado
- "recommendation_other": otras recomendaciones externas
- "property_info": WiFi, normas, check-in, check-out, acceso, llaves, parking, dirección
- "off_topic": el huésped hace una pregunta que no tiene relación con el alojamiento, su estancia, ni servicios locales. Ejemplos: chistes, filosofía, preguntas sobre IA, conversación general, política, deportes, trivia. NO confundir con "standard" (preguntas válidas sobre la estancia que no encajan en otras categorías).
- "standard": cualquier otra cosa

VALORES PERMITIDOS para "detectedTask" (solo si intent es "appliance_task"):
- "lavar_ropa": toallas sucias, ropa sucia, lavar, centrifugar
- "cocinar_pizza": hacer pizza, pizza en casa
- "cocinar_pasta": hacer pasta, macarrones, espaguetis
- "hacer_cafe": café, cortado, espresso, preparar café EN CASA
- "hacer_tostadas": tostadas, pan tostado
- "cocinar_huevos": huevos fritos, tortilla, huevos revueltos
- "cocinar_carne": carne, filete, pollo
- "cocinar_pescado": pescado, merluza, salmón
- "calentar_comida": calentar, recalentar, descongelar comida
- "planchar": planchar, arrugas en la ropa
- "poner_frio": hace calor, aire acondicionado, fresco, enfriar habitación
- "poner_calor": hace frío, calefacción, calentar habitación
- "lavar_vajilla": platos sucios, fregar, lavavajillas
- "general_cooking": cocinar en general sin especificar
- null: si intent NO es appliance_task

VALORES PERMITIDOS para "foodSubtype" (solo si intent es "recommendation_food"):
- "desayuno", "almuerzo", "cena", "tapas", "cafe", "italiano", "mediterraneo",
  "hamburguesas", "asiatico", "alta_cocina", "internacional", "general"
- null: si intent NO es recommendation_food

ATENCIÓN — DISTINCIÓN CRÍTICA:
- "me apetece un café" = appliance_task (quiere hacerse un café en el apartamento)
- "donde tomo un café" = recommendation_food, foodSubtype: "cafe" (quiere salir)
- "quiero hacer una pizza" = appliance_task (cocinar en casa)
- "me apetece una pizza" SIN contexto de cocinar = recommendation_food, foodSubtype: "italiano"
- "quiero hacer pizza EN CASA" = appliance_task

Para "isGenericFood": true solo si intent es recommendation_food y no especifica tipo de cocina.
Para "detectedErrorCode": código en mayúsculas si existe. null si no hay.

EJEMPLOS:
- "tengo unas toallas sucias" → {"intent":"appliance_task","detectedTask":"lavar_ropa","foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "¿cómo pongo la lavadora?" → {"intent":"appliance_usage","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "hace mucho calor" → {"intent":"appliance_task","detectedTask":"poner_frio","foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "donde tomo un café" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"cafe","detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "me apetece un café" → {"intent":"appliance_task","detectedTask":"hacer_cafe","foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"medium"}
- "la lavadora pone E5" → {"intent":"error_code","detectedTask":null,"foodSubtype":null,"detectedErrorCode":"E5","isGenericFood":false,"confidence":"high"}

Responde SOLO con el JSON. Sin explicaciones, sin markdown, sin backticks.`

// ═══════════════════════════════════════════════════════
// FALLBACK
// ═══════════════════════════════════════════════════════

const DEFAULT_INTENT: ClassifiedIntent = {
    intent: 'standard',
    foodSubtype: null,
    detectedErrorCode: null,
    isGenericFood: false,
    confidence: 'low',
    detectedTask: null
}

// ═══════════════════════════════════════════════════════
// CLASIFICADOR PRINCIPAL
// ═══════════════════════════════════════════════════════

export async function classifyIntent(
    lastMessage: string,
    recentContext: string
): Promise<ClassifiedIntent> {
    const inputForClassifier = recentContext
        ? `[CONTEXTO RECIENTE]: ${recentContext.substring(0, 400)}\n[ÚLTIMO MENSAJE]: ${lastMessage}`
        : lastMessage

    try {
        const { data, error } = await geminiREST('gemini-2.0-flash', inputForClassifier, {
            temperature: 0,
            responseMimeType: 'application/json',
            systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
            maxOutputTokens: 150
        })

        if (error || !data) {
            console.warn('[INTENT] Classifier failed, using fallback:', error)
            return DEFAULT_INTENT
        }

        const result = data as ClassifiedIntent

        const validIntents: ChatIntent[] = [
            'emergency', 'error_code', 'appliance_problem', 'appliance_usage',
            'appliance_task', 'recommendation_food', 'recommendation_activity',
            'recommendation_shopping', 'recommendation_other', 'property_info', 
            'off_topic', 'standard'
        ]

        if (!result.intent || !validIntents.includes(result.intent)) {
            console.warn('[INTENT] Invalid intent returned:', result.intent)
            return DEFAULT_INTENT
        }

        console.log('[INTENT] Classified:', {
            intent: result.intent,
            foodSubtype: result.foodSubtype,
            detectedTask: result.detectedTask,
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
// HELPERS
// ═══════════════════════════════════════════════════════

export function intentToStrategy(intent: ClassifiedIntent): string {
    switch (intent.intent) {
        case 'emergency': return 'emergency'
        case 'error_code': return 'error_code'
        case 'appliance_problem':
        case 'appliance_usage':
        case 'appliance_task': return 'appliance'
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
    return intent.intent === 'appliance_problem'
        || intent.intent === 'appliance_usage'
        || intent.intent === 'appliance_task'
}