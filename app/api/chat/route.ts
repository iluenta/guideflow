import { StreamingTextResponse } from 'ai';
import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateOpenAIEmbedding } from '@/lib/ai/openai';
import { streamGeminiREST } from '@/lib/ai/gemini-rest';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { TranslationService } from '@/lib/translation-service';
import { NotificationService } from '@/lib/notifications';

// ═══════════════════════════════════════════════════════
// FRESH RE-COMPILATION TRIGGER
// ═══════════════════════════════════════════════════════
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
        const { messages, propertyId: legacyPropertyId, accessToken, language = 'es' } = await req.json();
        const lastMessage = messages[messages.length - 1].content;
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        let propertyId = legacyPropertyId;
        let propertyTier: 'standard' | 'premium' | 'enterprise' = 'standard';

        // 0. FETCH PROPERTY STATUS (FASE 22)
        const { data: propertyStatus, error: propError } = await supabase
            .from('properties')
            .select('id, tier, is_halted, halt_expires_at, halt_reason')
            .eq('id', propertyId)
            .single();

        if (propError || !propertyStatus) {
            console.error('[CHAT] Property status check failed:', propError?.message);
        } else {
            propertyTier = (propertyStatus.tier as any) || 'standard';
            
            // Check for active halt
            if (propertyStatus.is_halted) {
                const now = new Date();
                const expiresAt = propertyStatus.halt_expires_at ? new Date(propertyStatus.halt_expires_at) : null;
                
                if (!expiresAt || now < expiresAt) {
                    console.warn(`[SECURITY] 🛡️ Request blocked for Halted Property: ${propertyId}. Reason: ${propertyStatus.halt_reason}`);
                    return new Response(JSON.stringify({ 
                        error: 'Servicio temporalmente pausado por seguridad',
                        reason: 'property_halted',
                        haltReason: propertyStatus.halt_reason,
                        resetAt: expiresAt
                    }), { status: 403 });
                } else {
                    // Auto-cooldown expired: Reset status in background
                    supabase.from('properties').update({ is_halted: false }).eq('id', propertyId);
                }
            }
        }

        // 1. VALIDACIÓN DE SEGURIDAD (FASE 4)
        if (accessToken) {
            // 1.1. Validar Token y Ventana Temporal
            const tokenValidation = await validateAccessToken(supabase, accessToken, legacyPropertyId);
            if (!tokenValidation.valid) {
                // If the reason is property mismatch, log it explicitly
                if (tokenValidation.reason === 'invalid_token' && legacyPropertyId) {
                   await logSuspiciousActivity(supabase, accessToken, {
                       type: 'property_mismatch_attempt',
                       details: { providedPropertyId: legacyPropertyId, ip },
                       ip
                   });
                }
                
                return new Response(JSON.stringify({
                    error: 'Acceso denegado',
                    reason: tokenValidation.reason
                }), { status: 403 });
            }

            propertyId = tokenValidation.access.property_id;

            // 1.2. Rate Limiting Multi-Nivel (FASE 22: Tiered)
            const deviceFingerprint = await generateDeviceFingerprint(ip, userAgent);
            const rateLimit = await RateLimiter.checkChatRateLimit(accessToken, ip, deviceFingerprint, propertyId, propertyTier);

            if (!rateLimit.allowed) {
                await logSuspiciousActivity(supabase, accessToken, {
                    type: 'rate_limit_exceeded',
                    details: { reason: rateLimit.reason, ip },
                    ip
                });

                // FASE 22: Check if we should trigger an EMERGENCY_HALT due to volume anomaly
                // We define an anomaly as > 30% of the daily limit in 10 minutes, OR just > 300 requests/hour
                if (rateLimit.reason === 'property_limit_exceeded') {
                    const haltReason = 'Consumo anómalo detectado (Posible abuso/bot)';
                    await supabase.from('properties').update({
                        is_halted: true,
                        halt_reason: haltReason,
                        halt_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour cooldown
                    }).eq('id', propertyId);

                    // MANDATORY NOTIFICATION
                    await NotificationService.notifyEmergencyHalt({
                        propertyId,
                        type: 'EMERGENCY_HALT',
                        reason: haltReason,
                        details: { rateLimitReason: rateLimit.reason, ip }
                    });
                }

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
        let ragQuery = detectedErrorCode
            ? `${lastMessage} código error ${detectedErrorCode} diagnóstico problemas tabla`
            : lastMessage;

        // FASE 11: Si el idioma no es español, traducimos la query para el RAG 
        // ya que el contenido de los manuales/recomendaciones está principalmente indexado en español.
        // Esto mejora drásticamente la relevancia de los resultados vectoriales cross-lingual.
        if (language !== 'es') {
            try {
                const { text: translatedQuery, metrics } = await TranslationService.translate(
                    ragQuery,
                    language,
                    'es',
                    { propertyId, context: 'rag_query' }
                );

                console.log(`[TRANSLATION] RAG Query Translation:`, {
                    cacheHit: metrics.cacheHit,
                    cacheLevel: metrics.cacheLevel,
                    timeMs: metrics.translationTimeMs
                });
                ragQuery = translatedQuery;
            } catch (err: any) {
                console.warn('[TRANSLATION] RAG Query Translation failed, using original:', err.message);
            }
        }

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
        // NOTA: Movemos esto arriba para usarlo en la validación anti-alucinaciones
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

        // Extraer contacto de soporte
        const contactsData = criticalContext?.find((c: any) => c.category === 'contacts')?.content;
        let supportContact = 'el personal de soporte';
        if (contactsData) {
            const name = contactsData.support_name || 'Soporte';
            const mobile = contactsData.support_mobile || contactsData.host_mobile || '';
            const phone = contactsData.support_phone || contactsData.host_phone || '';
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
        const currentTimeContext = `${now.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${now.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;

        const getLanguageName = (code: string) => {
            const names: Record<string, string> = {
                es: 'Spanish (Español)',
                en: 'English',
                fr: 'French (Français)',
                de: 'German (Deutsch)',
                it: 'Italian (Italiano)',
                pt: 'Portuguese (Português)'
            };
            return names[code] || 'English';
        };

        // FASE 15: Si el idioma no es español, forzamos que Gemini responda en español 
        // para que la caché de traducción (ES -> Usuario) funcione correctamente.
        const responseLanguage = language === 'es' ? 'Spanish (Español)' : 'Spanish';
        const targetLanguageName = getLanguageName(language);

        // ═══════════════════════════════════════════════════════
        // PROMPT DINÁMICO según estrategia detectada
        // ═══════════════════════════════════════════════════════
        let systemInstruction: string;

        if (isEmergency) {
            // ⚠️ EMERGENCIA: Respuesta inmediata de seguridad
            systemInstruction = `EMERGENCIA DE SEGURIDAD DETECTADA.
            
# LANGUAGE RULE:
- ALWAYS respond ENTIRELY in ${responseLanguage}. No exceptions.
- Use ONLY natural Spanish expressions.

No añadas nada más. No intentes diagnosticar. Prioridad absoluta: seguridad del huésped.
NUNCA menciones "el manual" ni "la documentación" — el huésped no sabe que existen.`;

        } else if (detectedErrorCode) {
            // 🔧 CÓDIGO DE ERROR: Diagnóstico específico
            systemInstruction = `Eres el asistente del apartamento "${propertyInfo?.name || 'este apartamento'}". El huésped tiene el código de error: ${detectedErrorCode}.
            
# LANGUAGE RULE:
- ALWAYS respond ENTIRELY in ${responseLanguage}. No exceptions.
- Use only pure ${responseLanguage}.

TU MISIÓN: Busca ESTE código EXACTO (${detectedErrorCode}) en la tabla de diagnóstico del contexto.

# SI ENCUENTRAS EL CÓDIGO EN EL CONTEXTO:
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
- Tono natural en ${targetLanguageName}
- SOLO información del contexto, no inventes soluciones
- ❌ NUNCA digas "consulta el manual" ni similar.
- 📍 ${currentTimeContext}

# CONTEXTO:
${fullContext}`;

        } else {
            // 💬 ESTÁNDAR: Asistente personal del apartamento
            // FASE 16: Grounding ultra-estricto y ejemplos anti-alucinación
            const groundingRules = `
# REGLAS DE SEGURIDAD E INFORMACIÓN:
1. Eres un sistema de información CERRADO. SOLO puedes usar el CONTEXTO proporcionado.
2. Si el usuario pregunta por algo que NO está en el CONTEXTO -> Responde amigablemente indicando que no tienes esa información y sugiérele contactar con ${supportContact}.
3. NO inventes instrucciones genéricas.
4. Tu prioridad es la precisión basada en los datos del apartamento.
5. Responde siempre en Español.

# CONTEXTO:
${fullContext}`;

            systemInstruction = language === 'es' 
              ? `Eres el asistente personal del apartamento "${propertyInfo?.name || 'este apartamento'}".
              
# TU FORMA DE SER
- Hablas como un amigo que conoce bien el apartamento.
- Das respuestas PRÁCTICAS y ÚTILES, no técnicas.
${groundingRules}

# REGLAS ABSOLUTAS
- ❌ NUNCA menciones modelos técnicos ni "el manual".
- ✅ Tono natural, como WhatsApp.
- ✅ Si no tienes info, dilo y da el contacto de ${supportContact}.
- 📍 ${currentTimeContext}`
              : `Eres un asistente de procesamiento interno. 
              
# REGLA CRÍTICA: 
- Debes responder EXCLUSIVAMENTE en Español. 
- Tu respuesta será traducida automáticamente por un sistema posterior.
- Si respondes en inglés o cualquier otro idioma, el sistema fallará.
${groundingRules}

# MISIÓN:
- Eres el asistente del apartamento "${propertyInfo?.name || 'este apartamento'}".
- Da consejos prácticos y amigables (siempre en español).
- NO menciones el manual.
- PROHIBIDO INVENTAR: Si el aparato no está en el CONTEXTO, indica que no tienes info y da el contacto con ${supportContact} (en español).
- Fecha y hora: ${currentTimeContext}`;
        }

        // 5. Gemini Call (Streaming con 2.0 Flash)
        const geminiMessages = messages.map((m: any, index: number) => {
            if (language !== 'es' && index === messages.length - 1 && m.role === 'user') {
                return { role: 'user', content: ragQuery };
            }
            return {
                role: m.role === 'user' ? 'user' : 'model',
                content: m.content
            };
        });

        const response = await streamGeminiREST('gemini-2.0-flash', geminiMessages, {
            systemInstruction,
            temperature: 0.0 // 🛡️ Set to 0.0 for maximum determinism and cache hits
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
                let accumulatedText = '';

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
                                        if (language === 'es') {
                                            // Normal flow for Spanish
                                            controller.enqueue(new TextEncoder().encode(text));
                                        } else {
                                            // Translation flow for other languages
                                            accumulatedText += text;
                                            
                                            // OPTIMIZED CHUNKING:
                                            // 1. Split by \n (no space required)
                                            // 2. Split by .!? followed by whitespace
                                            // 3. Split BEFORE a list marker (e.g., " 1. ", " * ")
                                            const boundaryRegex = /(\n|[\.!?]\s+|\s[\*\-]\s|\s\d+\.\s)/g;
                                            let match;
                                            
                                            while ((match = boundaryRegex.exec(accumulatedText)) !== null) {
                                                const breakPoint = match.index + (match[0].startsWith(' ') ? 0 : 1);
                                                const chunkToTranslate = accumulatedText.substring(0, breakPoint).trim();
                                                
                                                if (chunkToTranslate) {
                                                    const { text: translatedChunk } = await TranslationService.translate(
                                                        chunkToTranslate,
                                                        'es',
                                                        language,
                                                        { propertyId, context: 'chat' }
                                                    );
                                                    controller.enqueue(new TextEncoder().encode(translatedChunk + ' '));
                                                }
                                                
                                                accumulatedText = accumulatedText.substring(breakPoint).trimStart();
                                                boundaryRegex.lastIndex = 0; 
                                            }

                                            // Fallback: If a single sentence is too long (> 200 chars), force split
                                            if (accumulatedText.length > 200) {
                                                const lastSpace = accumulatedText.lastIndexOf(' ', 200);
                                                const breakPoint = lastSpace !== -1 ? lastSpace : 200;
                                                const chunkToTranslate = accumulatedText.substring(0, breakPoint).trim();

                                                const { text: translatedChunk } = await TranslationService.translate(
                                                    chunkToTranslate,
                                                    'es',
                                                    language,
                                                    { propertyId, context: 'chat' }
                                                );
                                                controller.enqueue(new TextEncoder().encode(translatedChunk + ' '));
                                                accumulatedText = accumulatedText.substring(breakPoint).trimStart();
                                            }
                                        }
                                    }
                                } catch (e) {
                                    // Ignore partial lines
                                }
                            }
                        }
                    }

                    // Flush remaining text for non-Spanish
                    if (language !== 'es' && accumulatedText.trim()) {
                        const { text: translatedChunk } = await TranslationService.translate(
                            accumulatedText,
                            'es',
                            language,
                            { propertyId, context: 'chat' }
                        );
                        controller.enqueue(new TextEncoder().encode(translatedChunk));
                    }

                } catch (e) {
                    console.error('[CHAT] Streaming error:', e);
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
