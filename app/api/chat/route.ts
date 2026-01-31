import { StreamingTextResponse } from 'ai';
import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateOpenAIEmbedding } from '@/lib/ai/openai';
import { streamGeminiREST } from '@/lib/ai/gemini-rest';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';

const supabase = createEdgeAdminClient();

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, propertyId: legacyPropertyId, accessToken } = await req.json();
        const lastMessage = messages[messages.length - 1].content;
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        let propertyId = legacyPropertyId;

        // 1. VALIDACIÓN DE SEGURIDAD (FASE 4)
        if (accessToken) {
            // 1.1. Validar Token y Ventana Temporal
            const tokenValidation = await validateAccessToken(supabase, accessToken);
            if (!tokenValidation.valid) {
                return new Response(JSON.stringify({
                    error: 'Acceso denegado',
                    reason: tokenValidation.reason,
                    resetAt: (tokenValidation as any).availableFrom || (tokenValidation as any).availableTo
                }), { status: 403 });
            }

            propertyId = tokenValidation.access.property_id;

            // 1.2. Rate Limiting Multi-Nivel
            const deviceFingerprint = await generateDeviceFingerprint(ip, userAgent);
            const rateLimit = await RateLimiter.checkChatRateLimit(accessToken, ip, deviceFingerprint);

            if (!rateLimit.allowed) {
                await logSuspiciousActivity(supabase, accessToken, {
                    type: 'rate_limit_exceeded',
                    details: { reason: rateLimit.reason, ip },
                    ip
                });

                return new Response(JSON.stringify({
                    error: rateLimit.message,
                    resetAt: rateLimit.resetAt,
                    reason: rateLimit.reason
                }), { status: 429 });
            }

            // 1.3. Filtro de Prompt Injection & Longitud
            if (lastMessage.length > 500) {
                return new Response(JSON.stringify({ error: 'Mensaje demasiado largo (máximo 500 caracteres)' }), { status: 400 });
            }

            const suspiciousPatterns = [/ignore previous instructions/i, /system prompt/i, /<script>/i, /you are now/i];
            if (suspiciousPatterns.some(p => p.test(lastMessage))) {
                await logSuspiciousActivity(supabase, accessToken, {
                    type: 'prompt_injection_attempt',
                    details: { message: lastMessage },
                    ip
                });
                return new Response(JSON.stringify({ error: 'Contenido no permitido' }), { status: 400 });
            }
        } else if (!legacyPropertyId) {
            return new Response(JSON.stringify({ error: 'Falta identificación de acceso' }), { status: 401 });
        }

        // 1. Generar embedding de la pregunta
        const questionEmbedding = await generateOpenAIEmbedding(lastMessage);

        // 2. Búsqueda vectorial UNIFICADA
        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: 0.05,
            match_count: 25,
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        // 3. Obtener contexto estructurado
        const { data: propertyContext } = await supabase
            .from('property_context')
            .select('category, subcategory, content')
            .eq('property_id', propertyId);

        // 4. Formatear contexto
        const formattedContext = [
            ... (relevantChunks || []).map((c: any) => `[MANUAL - ${c.metadata?.appliance?.toUpperCase() || 'GENERAL'}]: ${c.content}`),
            ... (propertyContext || []).map((c: any) => `[SISTEMA - ${c.category.toUpperCase()}${c.subcategory ? ' - ' + c.subcategory.toUpperCase() : ''}]: ${typeof c.content === 'string' ? c.content : JSON.stringify(c.content)}`)
        ].join('\n\n---\n\n');

        const systemInstruction = `Eres HostBot, el asistente experto de esta propiedad. Tu misión es resolver dudas de los huéspedes usando el CONTEXTO proporcionado.

IMPORTANTE: Estás hablando con un HUÉSPED en un alojamiento que NO es suyo. 

REGLAS DE ORO:
1. **Verdad Absoluta Technical**: Usa los bloques [MANUAL] como fuente de verdad.
2. **Lenguaje Neutral y Apropiado (CRÍTICO)**: 
    - NUNCA uses "tu" o "tuyo" para referirte a los aparatos (ej. NO digas "tu campana", "tu termo"). Usa artículos neutros: "**la** campana", "**el** termo", "**el** aire acondicionado".
    - NO repitas el modelo técnico o serie del aparato en el cuerpo de la respuesta a menos que sea estrictamente necesario (ej. NO digas "Si la campana Teka Serie DBB hace ruido..."). Di simplemente: "Si la campana hace ruido...".
3. **Filtro del Huésped**: NO des instrucciones de reparación técnica o sustitución de piezas internas. Si la solución requiere intervención, indica que el aparato podría tener una incidencia y recomienda contactar con el anfitrión.
4. **Soluciones de Usuario**: Céntrate solo en lo que el huésped puede manipular: botones externos, mandos o trucos de uso.
5. **Sin Excusas**: Si el aparato está en el CONTEXTO, ayuda con la información disponible.
6. **Descripciones Visuales**: Describe iconos visualmente (ej. "el icono del copo de nieve").
7. **Tono**: Amable, profesional y directo. Usa Markdown.

CONTEXTO ACTUAL:
${formattedContext}`;

        // 5. Gemini Call (Streaming)
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
        }));

        const response = await streamGeminiREST('gemini-3-flash-preview', geminiMessages, {
            systemInstruction,
            temperature: 0.2
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error en Gemini API');
        }

        // Custom Stream Transformer for Gemini REST
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) return;

                const decoder = new TextDecoder();
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.substring(6));
                                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (text) {
                                        controller.enqueue(new TextEncoder().encode(text));
                                    }
                                } catch (e) {
                                    // Ignore partial or non-json data lines
                                }
                            }
                        }
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new StreamingTextResponse(stream);
    } catch (error: any) {
        console.error('[CHAT ERROR]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
