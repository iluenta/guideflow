import { geminiREST } from '@/lib/ai/clients/gemini-rest'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export type ChatIntent =
    | 'emergency'
    | 'error_code'
    | 'appliance_problem'
    | 'appliance_usage'     // Cómo usar un aparato: "¿cómo pongo la lavadora?"
    | 'appliance_task'      // NUEVO: quiere hacer una tarea: "tengo toallas sucias"
    | 'manual_request'      // NUEVO: pide el manual completo
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
- "appliance_problem": electrodoméstico roto, no funciona, no enciende, hace ruido, avería.
  IMPORTANTE: Si el huésped NO identifica el aparato concreto (ej: "oigo un ruido raro", "algo hace ruido", "hay un pitido", "viene de arriba"), clasifica igualmente como appliance_problem. El asistente hará las preguntas de diagnóstico.
  Si el huésped SÍ menciona el aparato (ej: "el frigorífico hace ruido", "la lavadora no enciende"), también es appliance_problem.
  NUNCA usar appliance_usage para problemas o fallos: appliance_problem es para averías, appliance_usage es solo para preguntar cómo se usa algo.

- "appliance_usage": el huésped pregunta CÓMO FUNCIONA o CÓMO SE USA un aparato concreto.
  ej: "¿cómo pongo la lavadora?", "cómo uso el horno", "cómo funciona la cafetera"
- "manual_request": el huésped pide el manual, todas las instrucciones, o TODOS los códigos/errores de un aparato.
  ej: "échame el manual", "dame todos los códigos de error", "códigos de error del horno", "qué errores puede dar la lavadora", "todos los programas de la lavadora"
  DISTINCIÓN CRÍTICA:
  - "la lavadora pone E5" → error_code (tiene un código concreto)
  - "códigos de error del horno" → manual_request (pide la lista completa)
  - "qué significa E3" → error_code
  - "qué errores puede dar" → manual_request
- "appliance_task": el huésped quiere REALIZAR UNA TAREA que implica usar un aparato, aunque NO mencione el aparato directamente.
- "recommendation_food": quiere SALIR a comer/cenar/desayunar, busca restaurante/bar/cafetería
- "recommendation_activity": qué hacer fuera, ocio, turismo, museos, visitas
- "recommendation_shopping": tiendas, compras, mercado, supermercado
- "recommendation_other": otras recomendaciones externas
- "property_info": WiFi, normas, check-in, check-out, acceso, llaves, parking, dirección
- "off_topic": chistes, filosofía, trivia, conversación no relacionada con la estancia.
- "standard": cualquier otra cosa válida sobre el alojamiento que no encaja arriba.

VALORES PERMITIDOS para "detectedTask" (solo si intent es "appliance_task"):
- "lavar_ropa", "cocinar_pizza", "cocinar_pasta", "hacer_cafe", "hacer_tostadas", "cocinar_huevos", "cocinar_carne", "cocinar_pescado", "calentar_comida", "planchar", "poner_frio", "poner_calor", "lavar_vajilla", "general_cooking"

REGLA DE PRIORIDAD \u2014 MENSAJES CON INTENCIÓN MIXTA:
Cuando el mensaje contiene múltiples intents, SIEMPRE clasifica según la INTENCIÓN FINAL del huésped (lo que pide al final del mensaje), no según menciones anteriores.
- "iba a hacer pasta pero voy a comer fuera, ¿me recomiendas algo?" → recommendation_food (aunque mencione "hacer pasta", la acción final es salir a comer)
- "no tengo ganas de cocinar, ¿dónde puedo cenar?" → recommendation_food
- "el horno no funciona así que quiero pedir comida" → recommendation_food
- "tenía pensado lavar pero al final voy a salir, ¿hay algo cerca?" → recommendation_activity o recommendation_food según contexto
Señales de "comer fuera": "comer fuera", "cenar fuera", "salir a comer", "busco restaurante", "me recomiendas dónde", "hay algún sitio para".
Señales que NO implican comer fuera: "me apetece un café", "quiero hacer pasta", "voy a cocinar" SIN mencionar salir.

EJEMPLOS:
- "tengo unas toallas sucias" → {"intent":"appliance_task","detectedTask":"lavar_ropa","foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "¿cómo pongo la lavadora?" → {"intent":"appliance_usage","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "la lavadora pone E5" → {"intent":"error_code","detectedTask":null,"foodSubtype":null,"detectedErrorCode":"E5","isGenericFood":false,"confidence":"high"}
- "échame el manual del horno" → {"intent":"manual_request","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "¿Cómo funciona la lavadora?" → {"intent":"appliance_usage","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "me apetece un café" → {"intent":"appliance_task","detectedTask":"hacer_cafe","foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "me apetece un café fuera" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"cafe","detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "[CONTEXTO RECIENTE]: me apetece un café / [ÚLTIMO MENSAJE]: quiero fuera" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"cafe","detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "[CONTEXTO RECIENTE]: tengo hambre / [ÚLTIMO MENSAJE]: ¿qué opciones tienes?" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"general","detectedErrorCode":null,"isGenericFood":true,"confidence":"high"}
- "oigo un ruido raro en la cocina" → {"intent":"appliance_problem","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "del frigorífico" → {"intent":"appliance_problem","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "[CONTEXTO RECIENTE]: oigo un ruido / [ÚLTIMO MENSAJE]: no, viene de arriba" → {"intent":"appliance_problem","detectedTask":null,"foodSubtype":null,"detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "iba a hacer pasta pero como no hay agua voy a comer fuera, ¿me recomiendas algún italiano?" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"italiano","detectedErrorCode":null,"isGenericFood":false,"confidence":"high"}
- "el horno no funciona, ¿hay algún restaurante cerca?" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"general","detectedErrorCode":null,"isGenericFood":true,"confidence":"high"}
- "y algún restaurante en general?" → {"intent":"recommendation_food","detectedTask":null,"foodSubtype":"general","detectedErrorCode":null,"isGenericFood":true,"confidence":"high"}

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
            'appliance_task', 'manual_request', 'recommendation_food', 'recommendation_activity',
            'recommendation_shopping', 'recommendation_other', 'property_info',
            'off_topic', 'standard'
        ]

        if (!result.intent || !validIntents.includes(result.intent)) {
            console.warn('[INTENT] Invalid intent returned:', result.intent)
            return DEFAULT_INTENT
        }

        logger.debug('[INTENT] Classified:', {
            text: inputForClassifier.substring(0, 50),
            intent: result.intent,
            confidence: result.confidence
        });

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
        case 'appliance_task':
        case 'manual_request': return 'appliance'
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