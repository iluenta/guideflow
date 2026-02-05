import { StreamingTextResponse } from 'ai';
import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateOpenAIEmbedding } from '@/lib/ai/openai';
import { streamGeminiREST } from '@/lib/ai/gemini-rest';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';

export const runtime = 'edge';

export async function POST(req: Request) {
    let supabase;
    try {
        supabase = createEdgeAdminClient();
    } catch (err: any) {
        console.error('[CHAT] Initialization Error:', err.message);
        return new Response(JSON.stringify({
            error: 'Database initialization failed. Check environment variables.',
            details: err.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

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

        // 3. Obtener contexto estructurado TOTAL (Propiedad, Branding, Contexto, FAQs y Recomendaciones)
        const [
            { data: propertyInfo },
            { data: propertyBranding },
            { data: propertyContext },
            { data: propertyFaqs },
            { data: propertyRecs }
        ] = await Promise.all([
            supabase.from('properties').select('*').eq('id', propertyId).single(),
            supabase.from('property_branding').select('*').eq('property_id', propertyId).single(),
            supabase.from('property_context').select('category, subcategory, content').eq('property_id', propertyId),
            supabase.from('property_faqs').select('question, answer').eq('property_id', propertyId),
            supabase.from('property_recommendations').select('name, type, description, distance, personal_note, time').eq('property_id', propertyId)
        ]);

        // 4. Formatear contexto enriquecido para el modelo
        const formattedContext = [
            // A. Información base de la propiedad
            ...(propertyInfo ? [`[ESTADÍSTICAS Y UBICACIÓN DEL ALOJAMIENTO]:
Nombre: ${propertyInfo.name}
Descripción: ${propertyInfo.description || ''}
Dirección: ${propertyInfo.full_address || propertyInfo.location || ''}
Ubicación: ${propertyInfo.city || ''}, ${propertyInfo.country || ''}
Capacidad: ${propertyInfo.guests} personas
Distribución: ${propertyInfo.beds} habitaciones, ${propertyInfo.baths} baños`] : []),

            // B. Host y Branding
            ...(propertyBranding ? [`[INFORMACIÓN DEL ANFITRIÓN]:
Anfitrión: ${(propertyBranding as any).host_name || 'El equipo de gestión'}
Mensaje de bienvenida: ${(propertyBranding as any).welcome_message || ''}`] : []),

            // C. RAG (Fragmentos vectoriales más relevantes: Manuales, etc.)
            ...(relevantChunks || []).map((c: any) => {
                const type = c.source_type === 'manual' ? 'GUÍA TÉCNICA' :
                    c.source_type === 'faq' ? 'PREGUNTA FRECUENTE' :
                        c.source_type === 'recommendation' ? 'RECOMENDACIÓN' : 'INFO';
                const label = c.metadata?.appliance ? `${type} - ${c.metadata.appliance.toUpperCase()}` : type;
                return `[${label}]: ${c.content}`;
            }),

            // D. Contexto Estructurado (Normas, Acceso, WiFi, etc.)
            ...(propertyContext || []).map((c: any) => {
                const label = `INFO ${c.category.toUpperCase()}${c.subcategory ? ' - ' + c.subcategory.toUpperCase() : ''}`;
                let content = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);

                // Tratamiento especial para objetos de contexto conocidos
                if (c.category === 'contacts' && typeof c.content === 'object' && c.content !== null) {
                    const ctx = c.content as any;
                    if (ctx.preferred_contact_id) {
                        let preferredName = ctx.preferred_contact_id;
                        if (ctx.preferred_contact_id === 'support') preferredName = ctx.support_name || 'Soporte';
                        else if (ctx.preferred_contact_id === 'host') preferredName = 'Anfitrión';
                        else {
                            const custom = ctx.custom_contacts?.find((cc: any) => cc.id === ctx.preferred_contact_id);
                            if (custom) preferredName = custom.name;
                        }
                        content += `\n[NOTA MODELO]: El contacto preferente/principal es '${preferredName}'. Priorizar siempre su mención y mostrarlo primero.`;
                    }
                }

                return `[${label}]: ${content}`;
            }),

            // E. Recomendaciones Locales
            ...(propertyRecs || []).map((r: any) =>
                `[RECOMENDACIÓN]: ${r.name}\nTipo: ${r.type}\nDescripción: ${r.description || ''}\nDistancia/Tiempo: ${r.distance || ''} (${r.time || ''})\nNota del anfitrión: ${r.personal_note || ''}`
            ),

            // F. Preguntas Frecuentes
            ...(propertyFaqs || []).map((f: any) => `[PREGUNTA FRECUENTE]: ${f.question}\n[RESPUESTA]: ${f.answer}`)
        ].join('\n\n---\n\n');

        // G. Tiempo Real (Para evitar alucinaciones temporales)
        const now = new Date();
        const currentTimeContext = `[FECHA Y HORA ACTUAL DEL SISTEMA]: ${now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

        const systemInstruction = `Eres HostBot, el asistente experto de esta propiedad. Tu misión es resolver dudas de los huéspedes usando el CONTEXTO proporcionado.

IMPORTANTE: Estás hablando con un HUÉSPED en un alojamiento que NO es suyo. 

REGLAS DE ORO:
1. **Verdad Absoluta**: Usa los bloques [GUÍA TÉCNICA], [INFO], [RECOMENDACIÓN] y [PREGUNTA FRECUENTE] como base.
2. **TERMINOLOGÍA PROHIBIDA (CRÍTICO)**: 
    - NUNCA uses las palabras "manual", "manuales" o "documentación técnica" al hablar con el huésped. 
    - En su lugar usa: "Guía del alojamiento", "Normas de la casa", "Instrucciones", "Información de la propiedad" o simplemente "Según la información disponible".
    - NUNCA digas "Según el manual...". Di "Según la guía de uso..." o "He comprobado las indicaciones del anfitrión...".
3. **Lenguaje Neutral y Apropiado**: 
    - NUNCA uses "tu" o "tuyo" para referirte a los aparatos (ej. NO digas "tu campana", "tu termo"). Usa artículos neutros: "**la** campana", "**el** termo", "**el** aire acondicionado".
    - NO repitas el modelo técnico o serie del aparato en el cuerpo de la respuesta. Di simplemente: "Si la campana hace ruido...".
4. **Filtro del Huésped**: NO des instrucciones de reparación técnica. Si es algo complejo, recomienda contactar con el anfitrión.
5. **Soluciones de Usuario**: Céntrate solo en lo que el huésped puede manipular: botones, mandos, termostatos.
6. **Prioridad Eficiencia**: Recomienda siempre el modo "ECO" o más sostenible si aparece en la información.
7. **Condicionalidad de Contacto (IMPORTANTE)**: SOLO proporciona o sugiere información de contacto en dos casos:
    - Si el huésped lo solicita EXPLÍCITAMENTE (ej. "¿Cómo contacto al dueño?", "¿Cuál es el número de soporte?").
    - Si detectas un problema que NO puedes resolver con la información disponible (ej. avería grave, emergencia, objeto perdido).
    - En consultas rutinarias (recomendaciones, WiFi, normas), NO incluyas contactos al final de la respuesta.
8. **Temporalidad (CRÍTICO)**: Usa la información de [FECHA Y HORA ACTUAL DEL SISTEMA] para responder con precisión preguntas sobre horarios (check-out, apertura, ruido). NUNCA digas una hora diferente a la proporcionada en ese bloque.
9. **Tono**: Amable, premium, servicial y directo. Usa Markdown.

CONTEXTO TEMPORAL:
${currentTimeContext}

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
