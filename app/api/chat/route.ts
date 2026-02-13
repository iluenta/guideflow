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

        // ═══════════════════════════════════════════════════════
        // DETECCIÓN INTELIGENTE: Códigos de error y emergencias
        // ═══════════════════════════════════════════════════════
        const errorCodePatterns = [
            /\bE\d{1,2}\b/gi,           // E1, E2, E17
            /\bF\d{1,2}\b/gi,           // F1, F3, F21
            /\bEA\d\b/gi,               // EA0
            /código\s+(\w+)/gi,          // "código E5"
            /error\s+(\w+)/gi,           // "error E11"
            /\bd\d{2}\b/gi,             // d01, d21 (lavavajillas)
        ];

        let detectedErrorCode: string | null = null;
        for (const pattern of errorCodePatterns) {
            const match = lastMessage.match(pattern);
            if (match) {
                detectedErrorCode = match[0].toUpperCase();
                break;
            }
        }

        const emergencyKeywords = ['humo', 'fuego', 'chispa', 'chispas', 'quema', 'olor a quemado', 'olor extraño', 'fuga grande', 'explota', 'explosión', 'gas', 'cortocircuito'];
        const isEmergency = emergencyKeywords.some(word => lastMessage.toLowerCase().includes(word));

        const chatStrategy = isEmergency ? 'emergency' : detectedErrorCode ? 'error_code' : 'standard';

        console.log('[CHAT-DEBUG] Detection:', { chatStrategy, detectedErrorCode, isEmergency });

        // ═══════════════════════════════════════════════════════
        // RAG: Búsqueda vectorial adaptativa
        // ═══════════════════════════════════════════════════════
        // Si hay código de error, enriquecemos la query para encontrar la tabla de diagnóstico
        const ragQuery = detectedErrorCode
            ? `${lastMessage} código error ${detectedErrorCode} diagnóstico problemas tabla`
            : lastMessage;

        const questionEmbedding = await generateOpenAIEmbedding(ragQuery);

        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: 0.3,
            match_count: detectedErrorCode ? 30 : 25, // Más chunks si buscamos código específico
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        console.log('[CHAT-DEBUG] RAG results:', {
            totalChunks: relevantChunks?.length || 0,
            enrichedCount: relevantChunks?.filter((c: any) => c.metadata?.enriched === true).length || 0,
            strategy: chatStrategy,
            errorCode: detectedErrorCode,
            propertyId
        });

        // 3. Obtener información ESTRUCTURADA Crítica (Garantía de datos básicos)
        const [
            { data: propertyInfo },
            { data: propertyBranding },
            { data: criticalContext }
        ] = await Promise.all([
            supabase.from('properties').select('*').eq('id', propertyId).single(),
            supabase.from('property_branding').select('*').eq('property_id', propertyId).single(),
            supabase.from('property_context')
                .select('category, content')
                .eq('property_id', propertyId)
                .in('category', ['tech', 'rules', 'access', 'contacts', 'notes'])
        ]);

        // Extraer contacto de soporte (support > host; distinguir teléfono fijo vs móvil/WhatsApp)
        // NOTA: GuestChat.tsx auto-detecta números de teléfono y los convierte en botones de llamada + WhatsApp
        const contactsData = criticalContext?.find((c: any) => c.category === 'contacts')?.content;
        let supportContact = 'el personal de soporte';
        if (contactsData) {
            const name = contactsData.support_name || 'Soporte';
            const mobile = contactsData.support_mobile || contactsData.host_mobile || '';
            const phone = contactsData.support_phone || contactsData.host_phone || '';
            // Preferir móvil (permite llamada + WhatsApp en el chat)
            const bestNumber = mobile || phone;
            if (bestNumber) {
                supportContact = `${name}: ${bestNumber}`;
            }
        }

        // 4. Formatear contexto híbrido (Estructurado + Vectorial)
        const commonBrands = ['TEKA', 'BALAY', 'BOSCH', 'SIEMENS', 'NEFF', 'BSH', 'SAMSUNG', 'LG', 'BEKO', 'WHIRLPOOL'];
        const brandRegex = new RegExp(`\\b(${commonBrands.join('|')})\\b`, 'gi');

        const formattedContext = [
            // A. Datos Generales
            ...(propertyInfo ? [`[PROPIEDAD]: "${propertyInfo.name}". Ciudad: ${propertyInfo.city}.`] : []),

            // B. Datos Estructurados (Seguridad de WiFi, Acceso, etc.)
            ...(criticalContext || []).map((c: any) => {
                const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;
                let contentString = '';

                if (typeof c.content === 'object' && c.content !== null) {
                    if (c.category === 'access') {
                        contentString = `Dirección: ${c.content.full_address || ''}. Parking: ${c.content.parking?.info || 'N/A'}. Transp: ${c.content.from_airport?.instructions || 'N/A'}`;
                    } else {
                        contentString = JSON.stringify(c.content);
                    }
                } else {
                    contentString = String(c.content);
                }

                // Limpiar marcas
                return `[${label}]: ${contentString.replace(brandRegex, '')}`;
            }),

            // C. RAG (Manuales Técnicos, FAQs, Recomendaciones)
            ...(relevantChunks || []).map((c: any) => {
                // ✅ PRIORIZAR MANUALES ENRIQUECIDOS
                const isEnriched = c.metadata?.enriched === true;
                let type = c.source_type === 'manual'
                    ? (isEnriched ? 'GUÍA_PERSONALIZADA_ANFITRIÓN' : 'GUÍA_TÉCNICA')
                    : c.source_type?.toUpperCase();

                if (isEnriched) {
                    console.log('[CHAT-DEBUG] Enriched chunk:', {
                        type,
                        preview: c.content.substring(0, 100),
                        metadata: c.metadata
                    });
                }

                // Limpiar marcas del contenido RAG
                return `[${type}]: ${c.content.replace(brandRegex, '')}`;
            })
        ].join('\n\n\n');

        // ═══════════════════════════════════════════════════════
        // NIVEL 2: Fallback con búsqueda externa (Brave Search)
        // ═══════════════════════════════════════════════════════
        // 🔧 FEATURE FLAG: Cambiar a false para desactivar el fallback
        const ENABLE_CHAT_GROUNDING_FALLBACK = true;

        let fallbackContext = '';
        const isProblemRelated = /no funciona|no va|no enciende|no arranca|error|problema|roto|avería|averia|fallo|no calienta|no enfría|gotea|vibra|ruido|olor|bloqueo|código|no desagua|no centrifuga/i.test(lastMessage);

        if (ENABLE_CHAT_GROUNDING_FALLBACK && isProblemRelated && !isEmergency) {
            // Calcular confianza del RAG: ¿los chunks son relevantes?
            const bestSimilarity = relevantChunks?.[0]?.similarity || 0;
            const manualChunks = relevantChunks?.filter((c: any) => c.source_type === 'manual') || [];
            const ragHasGoodAnswer = bestSimilarity > 0.5 && manualChunks.length >= 2;

            console.log('[CHAT-DEBUG] Fallback check:', { bestSimilarity, manualChunks: manualChunks.length, ragHasGoodAnswer });

            if (!ragHasGoodAnswer) {
                try {
                    // Extraer marca/modelo del contexto de la propiedad para búsqueda más precisa
                    const techContext = criticalContext?.find((c: any) => c.category === 'tech')?.content;
                    const applianceHint = typeof techContext === 'string' ? techContext.substring(0, 200) : '';

                    const braveQuery = detectedErrorCode
                        ? `${detectedErrorCode} electrodoméstico solución ${applianceHint}`
                        : `${lastMessage} solución electrodoméstico`;

                    console.log('[CHAT-DEBUG] Brave fallback search:', braveQuery);

                    const braveResponse = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(braveQuery)}&count=5&extra_snippets=1`, {
                        headers: {
                            'Accept': 'application/json',
                            'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
                        }
                    });

                    if (braveResponse.ok) {
                        const braveData = await braveResponse.json();
                        const results = braveData.web?.results || [];

                        if (results.length > 0) {
                            fallbackContext = '\n\n---\n\n[SOLUCIONES_EXTERNAS] (búsqueda web - usar como apoyo si el contexto principal no tiene respuesta):\n' +
                                results.slice(0, 3).map((r: any) => {
                                    const extra = r.extra_snippets ? ` ${r.extra_snippets.join(' ')}` : '';
                                    return `- ${r.title}: ${r.description}${extra}`;
                                }).join('\n');

                            console.log('[CHAT-DEBUG] Brave fallback: found', results.length, 'results');
                        }
                    }
                } catch (err: any) {
                    console.warn('[CHAT-DEBUG] Brave fallback error (non-blocking):', err.message);
                }
            }
        }

        // Combinar contexto: RAG + fallback externo (si existe)
        const fullContext = formattedContext + fallbackContext;

        // G. Tiempo Real
        const now = new Date();
        const currentTimeContext = `${now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

        // ═══════════════════════════════════════════════════════
        // PROMPT DINÁMICO según estrategia detectada
        // ═══════════════════════════════════════════════════════
        let systemInstruction: string;

        if (isEmergency) {
            // ⚠️ EMERGENCIA: Respuesta inmediata de seguridad
            systemInstruction = `EMERGENCIA DE SEGURIDAD DETECTADA.

Responde EXACTAMENTE con este formato, adaptando al aparato mencionado:

"⚠️ Por seguridad, apaga/desenchufa el aparato AHORA.

Llama inmediatamente a ${supportContact}.

Esto requiere atención urgente."

No añadas nada más. No intentes diagnosticar. Prioridad absoluta: seguridad del huésped.
NUNCA menciones "el manual" ni "la documentación" — el huésped no sabe que existen.`;

        } else if (detectedErrorCode) {
            // 🔧 CÓDIGO DE ERROR: Diagnóstico específico
            systemInstruction = `Eres el asistente del apartamento "${propertyInfo?.name || 'este apartamento'}". El huésped tiene el código de error: ${detectedErrorCode}.

TU MISIÓN: Busca ESTE código EXACTO (${detectedErrorCode}) en la tabla de diagnóstico del contexto.

# SI ENCUENTRAS EL CÓDIGO EN EL CONTEXTO:
Responde así (tono natural, como WhatsApp):

"Código ${detectedErrorCode}: [significado del manual]

Solución:
- [Paso 1 del manual]
- [Paso 2 si existe]

Prueba esto y me cuentas si se soluciona."

# SI EL MANUAL DICE "Contactar con soporte":
"Para este problema es mejor que te ayude directamente ${supportContact}."

# SI NO ENCUENTRAS ESE CÓDIGO:
"No encuentro el código ${detectedErrorCode} en el manual de este aparato.

¿Puedes comprobar que el código sea exactamente ese? A veces se confunde con otros parecidos.

Si persiste, contacta con ${supportContact}."

# REGLAS
- Respuesta máximo 5 líneas
- Tono natural, sin viñetas formales
- SOLO información del contexto, no inventes soluciones
- ❌ NUNCA digas "consulta el manual", "según el manual", "en la documentación" ni similar — el huésped NO sabe que existen manuales, responde como si TÚ supieras la respuesta
- 📍 ${currentTimeContext}

# CONTEXTO:
${fullContext}`;

        } else {
            // 💬 ESTÁNDAR: Asistente personal del apartamento
            systemInstruction = `Eres el asistente personal del apartamento "${propertyInfo?.name || 'este apartamento'}". Eres cercano, práctico y resolutivo. Hablas como un anfitrión amable por WhatsApp.

# TU FORMA DE SER
- Hablas como un amigo que conoce bien el apartamento
- Das respuestas PRÁCTICAS y ÚTILES, no técnicas
- Si algo tiene solución sencilla, la das tú sin derivar a soporte

# EXTENSIÓN DE RESPUESTA (MUY IMPORTANTE)

## Para PREGUNTAS SOBRE USO/FUNCIONES ("qué programas tiene", "cómo funciona", "qué opciones tiene"):
→ Sé COMPLETO: lista TODAS las opciones/programas que tengas en el contexto
→ Para CADA opción incluye: el SÍMBOLO que verá en el mando (si lo sabes) + PARA QUÉ SIRVE
→ Al final recomienda la mejor opción o pregunta qué quiere hacer
→ Extensión: hasta 15 líneas si es necesario para cubrir todas las opciones

Ejemplo BUENO para "¿qué programas tiene el horno?":
"¡Claro! El horno tiene estas funciones (busca estos símbolos en el mando):

- **Calor arriba y abajo** (═ dos rayas horizontales): el clásico. Ideal para asados, bizcochos y panes
- **Aire caliente** (ventilador con círculo): reparte el calor uniforme. Perfecto para hornear en varias alturas
- **Grill** (〰️ línea zigzag arriba): calor intenso desde arriba. Para gratinar pasta, tostar pan o dorar
- **Grill + aire** (zigzag + ventilador): como un asador. Genial para pollo entero
- **Función pizza** (ventilador + raya abajo): mucho calor desde abajo. Base súper crujiente
- **Modo eco** (ventilador con eco): ahorra energía, ideal para cocciones largas

Para una pizza: busca el símbolo del ventilador con raya abajo, ponlo a 220°C unos 12-15 min. ¿Qué vas a preparar?"

Ejemplo MALO: "El horno tiene varias opciones como calor arriba y abajo, grill, etc."

## Para PROBLEMAS TÉCNICOS ("no funciona", "no enciende"):
→ Sé CONCISO: 3-5 líneas
→ Pregunta por código de error si no lo mencionan
→ Da 1-2 soluciones rápidas
→ Solo deriva a soporte si falla todo

## Para PREGUNTAS DIRECTAS ("dónde está", "cuál es la clave WiFi"):
→ Respuesta DIRECTA: 1-3 líneas, sin rodeos

# DIAGNÓSTICO ACTIVO (cuando hay problemas)
1. Si dicen "no funciona" sin código → Pregunta: "¿Aparece algún código en la pantalla?"
2. Si dan código → Busca en la tabla de diagnóstico → Da la solución
3. Si persiste → Deriva a ${supportContact}

# SI EL CONTEXTO NO TIENE RESPUESTA COMPLETA
Si hay sección [SOLUCIONES_EXTERNAS], úsala como apoyo.
Presenta la info como si TÚ la supieras: "Esto suele pasar cuando..." (nunca digas "he buscado" ni "según internet")

# REGLAS ABSOLUTAS
- ❌ NUNCA menciones modelos técnicos (3HB4331X0, WMY71433, etc.)
- ❌ NUNCA digas "consulta el manual", "según el manual", "en la documentación"
- ❌ NUNCA describas mandos de forma abstracta — describe PARA QUÉ SIRVEN
- ❌ NO recortes la lista de programas/funciones — muestra TODOS los que tengas en el contexto
- ❌ NO uses checkmarks (✓✗) ni listas formales tipo informe
- ✅ Para CADA programa/función, describe el SÍMBOLO/ICONO que verá en el aparato (ej: "copo de nieve", "gota de agua", "ventilador") para que pueda identificarlo
- ✅ Usa **negrita** para los nombres de programas/funciones
- ✅ Recomienda la MEJOR opción según lo que quiera hacer
- ✅ Tono natural, como WhatsApp (¡Perfecto! ¡Claro! ¡Genial!)
- ✅ Si no tienes info, dilo y da el contacto de ${supportContact}
- 📍 ${currentTimeContext}

# CONTEXTO:
📦 Chunks: ${relevantChunks?.length || 0} (Enriquecidos: ${relevantChunks?.filter((c: any) => c.metadata?.enriched === true).length || 0})

${fullContext}`;
        }

        // 5. Gemini Call (Streaming con 2.0 Flash)
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
        }));

        const response = await streamGeminiREST('gemini-2.0-flash', geminiMessages, {
            systemInstruction,
            temperature: isEmergency ? 0.1 : 0.7 // Baja para emergencias, natural para resto
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
