// ─── lib/chat/intent-router.ts ────────────────────────────────────────────────
// Clasificación de intent, expansión de query RAG y short-circuits.
// Extraído de app/api/chat/route.ts líneas 166–404.

import { classifyIntent, intentToStrategy, isRecommendation, isAppliance, TASK_TO_CONTEXT } from '@/lib/ai/services/intent-classifier';
import { TranslationService } from '@/lib/ai/services/translation-service';
import { logger } from '@/lib/logger';
import {
    FOOD_EXPANSION_MAP,
    APPLIANCE_PROBLEM_HINTS,
    APPLIANCE_HINTS,
    FOOD_TO_APPLIANCE,
} from './constants';
import type { IntentResult } from './types';

// ─── Helper privado: detección de aparato en texto ───────────────────────────

function detectApplianceFromContext(
    text: string,
    hints: Record<string, string[]>
): string | undefined {
    const lower = text.toLowerCase();
    return Object.keys(hints).find(appliance =>
        lower.includes(appliance) ||
        (appliance === 'tv' && /tele|televisor|pantalla|disney|netflix|prime|youtube|canal|streaming|hdmi|serie|pelicula|película/i.test(lower)) ||
        (appliance === 'aire' && /aire|ac\b|clima|calefacc/i.test(lower)) ||
        (appliance === 'frigorifico' && /nevera|frigo|congelador/i.test(lower))
    );
}

// ─── Expansión de RAG query por intent ───────────────────────────────────────

async function expandRAGQuery(
    baseQuery: string,
    intent: ReturnType<typeof classifyIntent> extends Promise<infer T> ? T : never,
    recentContext: string,
    language: string,
    propertyId: string
): Promise<string> {
    let ragQuery = baseQuery;

    // Traducir al español si hace falta (para que el embedding sea coherente con los chunks)
    if (language !== 'es') {
        try {
            const { text } = await TranslationService.translate(ragQuery, language, 'es', { propertyId, context: 'rag_query' });
            ragQuery = text;
        } catch (err: any) {
            console.warn('[TRANSLATION] RAG Query failed, using original:', err.message);
        }
    }

    const { detectedErrorCode } = intent;
    const isRecommendationQuery = isRecommendation(intent);
    const isApplianceTaskQuery = intent.intent === 'appliance_task';
    const isApplianceProblem = intent.intent === 'appliance_problem';
    const isApplianceUsageQuery = intent.intent === 'appliance_usage';

    if (detectedErrorCode) {
        ragQuery = `${ragQuery} código error ${detectedErrorCode} diagnóstico problemas tabla`;

    } else if (isRecommendationQuery) {
        if (intent.intent === 'recommendation_activity') {
            ragQuery = `${ragQuery} ocio actividades turismo visitar lugares qué hacer`;
        } else if (intent.intent === 'recommendation_shopping') {
            ragQuery = `${ragQuery} tiendas compras mercado comercios ropa moda zapatos centro comercial mall clothing`;
        } else {
            const subtype = intent.foodSubtype || 'general';
            const expansionTerms = FOOD_EXPANSION_MAP[subtype] || FOOD_EXPANSION_MAP['general'];
            ragQuery = `${ragQuery} ${expansionTerms.join(' ')} recomendaciones zona`;
        }
        logger.debug('[CHAT-V2] Expanded recommendation query');

    } else if (isApplianceTaskQuery && intent.detectedTask) {
        const taskContext = TASK_TO_CONTEXT[intent.detectedTask];
        ragQuery = taskContext
            ? `${ragQuery} ${taskContext.ragTerms}`
            : `${ragQuery} instrucciones pasos usar aparato`;
        logger.debug('[CHAT-V2] Task expansion processed');

    } else if (isApplianceProblem) {
        const combinedContext = `${recentContext} ${baseQuery}`.toLowerCase();
        const detectedAppliance = detectApplianceFromContext(combinedContext, APPLIANCE_PROBLEM_HINTS);
        const expansionTerms = detectedAppliance
            ? APPLIANCE_PROBLEM_HINTS[detectedAppliance]
            : ['avería', 'problema', 'diagnóstico', 'solución', 'error', 'fallo'];
        ragQuery = `${ragQuery} ${expansionTerms.join(' ')} diagnóstico solución avería problema`;
        logger.debug('[CHAT-V2] Appliance problem expansion processed', { detectedAppliance });

    } else if (isApplianceUsageQuery) {
        if (intent.foodSubtype === 'recipe') {
            const msg = baseQuery.toLowerCase();
            const detectedFood = Object.keys(FOOD_TO_APPLIANCE).find(food => msg.includes(food));
            const applianceExpansion = detectedFood ? FOOD_TO_APPLIANCE[detectedFood] : 'horno cocina vitrocerámica microondas';
            ragQuery = `${ragQuery} ${applianceExpansion} instrucciones temperatura tiempo pasos`;
            logger.debug('[CHAT-V2] Recipe expansion processed');
        } else {
            const detectedAppliance = detectApplianceFromContext(baseQuery, APPLIANCE_HINTS);
            const expansionTerms = detectedAppliance
                ? APPLIANCE_HINTS[detectedAppliance]
                : ['usar', 'instrucciones', 'pasos', 'cómo funciona'];
            ragQuery = `${ragQuery} ${expansionTerms.join(' ')}`;
            logger.debug('[CHAT-V2] Appliance expansion processed');
        }
    }

    return ragQuery;
}

// ─── Exportación principal: classify + expand ─────────────────────────────────

export async function classifyAndRoute(
    lastMessage: string,
    recentContext: string,
    language: string,
    propertyId: string
): Promise<IntentResult> {
    const intent = await classifyIntent(lastMessage, recentContext);

    logger.debug('[CHAT-V2] Intent classified:', {
        text: lastMessage.substring(0, 50),
        intent: intent.intent,
        confidence: intent.confidence,
        foodSubtype: intent.foodSubtype,
        detectedErrorCode: intent.detectedErrorCode,
        isGenericFood: intent.isGenericFood,
        detectedTask: intent.detectedTask,
    });

    // Override: reclassify off_topic when message contains property-relevant cues.
    let effectiveIntent = intent;
    if (intent.intent === 'off_topic') {
        const combinedText = `${lastMessage} ${recentContext}`;
        const lower = lastMessage.toLowerCase();

        // Override 1: appliance mention → appliance_problem
        const detectedAppliance =
            detectApplianceFromContext(combinedText, APPLIANCE_PROBLEM_HINTS) ||
            detectApplianceFromContext(combinedText, APPLIANCE_HINTS);
        if (detectedAppliance) {
            effectiveIntent = { ...intent, intent: 'appliance_problem' as const };
            logger.debug('[CHAT-V2] off_topic → appliance_problem override', { detectedAppliance });
        }

        // Override 2: gaslighting / contradiction cues → let Gemini handle anti-gaslighting rule
        const gaslightingCues = ['dijiste', 'me dijiste', 'me confirmaste', 'me prometiste', 'antes dijiste', 'antes me dijiste', 'me habías dicho'];
        if (!detectedAppliance && gaslightingCues.some(cue => lower.includes(cue))) {
            effectiveIntent = { ...intent, intent: 'standard' as const };
            logger.debug('[CHAT-V2] off_topic → standard override (gaslighting cue)');
        }

        // Override 3: apartment entry/access questions misclassified as off_topic
        const entryKeywords = ['cómo entro', 'cómo entrar', 'cómo accedo', 'cómo acceder', 'cómo abro', 'abrir la puerta', 'entro al apartamento', 'entrar al piso'];
        if (!detectedAppliance && entryKeywords.some(k => lower.includes(k))) {
            effectiveIntent = { ...intent, intent: 'standard' as const };
            logger.debug('[CHAT-V2] off_topic → standard override (entry question)');
        }
    }



    const ragQuery = await expandRAGQuery(lastMessage, effectiveIntent, recentContext, language, propertyId);

    const flags = {
        isRecommendationQuery: isRecommendation(effectiveIntent),
        isApplianceQuery: isAppliance(effectiveIntent),
        isApplianceUsageQuery: effectiveIntent.intent === 'appliance_usage',
        isApplianceTaskQuery: effectiveIntent.intent === 'appliance_task',
        isApplianceProblem: effectiveIntent.intent === 'appliance_problem',
isManualRequest: effectiveIntent.intent === 'manual_request',
        isEmergency: effectiveIntent.intent === 'emergency',
        detectedErrorCode: effectiveIntent.detectedErrorCode ?? null,
        detectedTask: effectiveIntent.detectedTask ?? null,
    };

    return { intent: effectiveIntent, ragQuery, flags };
}

// ─── Short-circuit: respuestas sin llamar a Gemini ────────────────────────────

export async function getShortCircuitResponse(
    intent: IntentResult['intent'],
    language: string,
    propertyId: string
): Promise<Response | null> {

    if (intent.intent === 'manual_request') {
        const msg = `Puedo ayudarte con lo que necesites paso a paso 😊 ¿Qué quieres hacer exactamente? ¿Ponerlo en marcha, resolver algún problema o saber algo específico?`;
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(msg)}\n`));
                controller.close();
            },
        });
        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
        });
    }

    if (intent.intent === 'off_topic') {
        const offTopicResponses = [
            'Estoy aquí para ayudarte con todo lo relacionado con tu estancia 🏠 ¿Tienes alguna pregunta sobre el apartamento, acceso, WiFi o recomendaciones de la zona?',
            'Solo puedo ayudarte con cosas relacionadas con tu estancia. ¿Necesitas algo sobre el apartamento o la zona?',
            'Mi especialidad es el apartamento y sus alrededores 😊 ¿En qué puedo ayudarte?',
        ];
        let offTopicText = offTopicResponses[Math.floor(Math.random() * offTopicResponses.length)];

        if (language !== 'es') {
            try {
                const { text } = await TranslationService.translate(offTopicText, 'es', language, { propertyId, context: 'chat' });
                offTopicText = text;
            } catch (err: any) {
                console.warn('[OFF-TOPIC] Translation failed:', err.message);
            }
        }

        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(offTopicText)}\n`));
                controller.close();
            },
        });
        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
        });
    }

    return null;
}
