import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateOpenAIEmbedding } from '@/lib/ai/openai';
import { streamGeminiREST } from '@/lib/ai/gemini-rest';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { TranslationService } from '@/lib/translation-service';
import { NotificationService } from '@/lib/notifications';
import { classifyIntent, intentToStrategy, isRecommendation, isAppliance, TASK_TO_CONTEXT } from '@/lib/ai/intent-classifier';

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
        const { messages, propertyId: legacyPropertyId, accessToken, language = 'es', guestSessionId } = await req.json();
        const lastMessage = messages[messages.length - 1].content;
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        let propertyId = legacyPropertyId;
        let propertyTier: 'standard' | 'premium' | 'enterprise' = 'standard';
        let tenantId: string | null = null;

        const checkHaltStatus = async (pidToCheck: string) => {
            const { data: propertyStatus, error: propError } = await supabase
                .from('properties')
                .select('id, tier, is_halted, halt_expires_at, halt_reason, tenant_id')
                .eq('id', pidToCheck)
                .single();

            if (propError || !propertyStatus) {
                console.error('[CHAT] Property status check failed:', propError?.message);
                return null;
            }

            propertyTier = (propertyStatus.tier as any) || 'standard';
            if (propertyStatus.tenant_id) tenantId = propertyStatus.tenant_id;

            if (propertyStatus.is_halted) {
                const now = new Date();
                const expiresAt = propertyStatus.halt_expires_at ? new Date(propertyStatus.halt_expires_at) : null;
                if (!expiresAt || now < expiresAt) {
                    console.warn(`[SECURITY] 🛡️ Halted Property: ${pidToCheck}. Reason: ${propertyStatus.halt_reason}`);
                    return new Response(JSON.stringify({
                        error: 'Servicio temporalmente pausado por seguridad',
                        reason: 'property_halted',
                        haltReason: propertyStatus.halt_reason,
                        resetAt: expiresAt
                    }), { status: 403 });
                } else {
                    supabase.from('properties').update({ is_halted: false }).eq('id', pidToCheck);
                }
            }
            return null;
        };

        if (!accessToken && legacyPropertyId) {
            const haltResponse = await checkHaltStatus(legacyPropertyId);
            if (haltResponse) return haltResponse;
        }

        // 1. VALIDACIÓN DE SEGURIDAD
        if (accessToken) {
            const tokenValidation = await validateAccessToken(supabase, accessToken, legacyPropertyId);
            if (!tokenValidation.valid) {
                if (tokenValidation.reason === 'invalid_token' && legacyPropertyId) {
                    await logSuspiciousActivity(supabase, accessToken, {
                        type: 'property_mismatch_attempt',
                        details: { providedPropertyId: legacyPropertyId, ip },
                        ip
                    });
                }
                return new Response(JSON.stringify({ error: 'Acceso denegado', reason: tokenValidation.reason }), { status: 403 });
            }

            propertyId = tokenValidation.access.property_id;

            const haltResponse = await checkHaltStatus(propertyId);
            if (haltResponse) return haltResponse;

            const deviceFingerprint = await generateDeviceFingerprint(ip, userAgent);
            const rateLimit = await RateLimiter.checkChatRateLimit(accessToken, ip, deviceFingerprint, propertyId, propertyTier);

            if (!rateLimit.allowed) {
                await logSuspiciousActivity(supabase, accessToken, {
                    type: 'rate_limit_exceeded',
                    details: { reason: rateLimit.reason, ip },
                    ip
                });

                if (rateLimit.reason === 'property_limit_exceeded') {
                    const haltReason = 'Consumo anómalo detectado (Posible abuso/bot)';
                    await supabase.from('properties').update({
                        is_halted: true,
                        halt_reason: haltReason,
                        halt_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
                    }).eq('id', propertyId);

                    await NotificationService.notifyEmergencyHalt({
                        propertyId, type: 'EMERGENCY_HALT', reason: haltReason,
                        details: { rateLimitReason: rateLimit.reason, ip }
                    });
                }

                return new Response(JSON.stringify({
                    error: rateLimit.message, resetAt: rateLimit.resetAt, reason: rateLimit.reason
                }), { status: 429 });
            }

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
        // 2. CLASIFICACIÓN DE INTENT
        // ═══════════════════════════════════════════════════════
        const recentContext = messages.slice(-10).map((m: any) => m.content).join(' ');

        const intentPromise = classifyIntent(lastMessage, recentContext);

        let ragQuery = lastMessage;
        const translateRagIfNeeded = async () => {
            if (language !== 'es') {
                try {
                    const { text: translatedQuery, metrics } = await TranslationService.translate(
                        ragQuery, language, 'es', { propertyId, context: 'rag_query' }
                    );
                    console.log(`[TRANSLATION] RAG Query:`, { cacheHit: metrics?.cacheHit || false, timeMs: metrics?.translationTimeMs || 0 });
                    return translatedQuery;
                } catch (err: any) {
                    console.warn('[TRANSLATION] RAG Query failed, using original:', err.message);
                    return ragQuery;
                }
            }
            return ragQuery;
        };

        const [intent, translatedBase] = await Promise.all([intentPromise, translateRagIfNeeded()]);
        ragQuery = translatedBase;

        const chatStrategy = intentToStrategy(intent);
        const isRecommendationQuery = isRecommendation(intent);
        const isApplianceQuery = isAppliance(intent);
        const isApplianceUsageQuery = intent.intent === 'appliance_usage';
        const isApplianceTaskQuery = intent.intent === 'appliance_task';  // ← NUEVO
        const isEmergency = intent.intent === 'emergency';
        const detectedErrorCode = intent.detectedErrorCode;
        const detectedTask = intent.detectedTask || null  // ← NUEVO

        console.log('[CHAT-DEBUG] Intent classified:', {
            chatStrategy,
            intent: intent.intent,
            detectedTask,
            foodSubtype: intent.foodSubtype,
            detectedErrorCode,
            isGenericFood: intent.isGenericFood,
            confidence: intent.confidence
        });

        // ═══════════════════════════════════════════════════════
        // 3. RAG: Query expansion según intent clasificado
        // ═══════════════════════════════════════════════════════
        if (detectedErrorCode) {
            ragQuery = `${ragQuery} código error ${detectedErrorCode} diagnóstico problemas tabla`;

        } else if (isRecommendationQuery) {
            const expansionMap: Record<string, string[]> = {
                desayuno: ['desayuno', 'café', 'cafetería', 'brunch', 'tostadas', 'panadería'],
                almuerzo: ['comida', 'almuerzo', 'menú del día', 'mediodía'],
                cena: ['cena', 'cenar', 'noche', 'restaurante'],
                tapas: ['tapas', 'pinchos', 'vinos', 'aperitivo', 'bar'],
                cafe: ['café', 'cafetería', 'cortado', 'espresso'],
                italiano: ['pizza', 'pasta', 'italiano', 'risotto'],
                mediterraneo: ['mediterráneo', 'mariscos', 'pescado', 'griega'],
                hamburguesas: ['hamburguesa', 'burger', 'americano'],
                asiatico: ['asiático', 'japonés', 'chino', 'sushi', 'ramen', 'thai', 'wok'],
                alta_cocina: ['alta cocina', 'gourmet', 'fine dining', 'estrella'],
                internacional: ['internacional', 'fusión', 'variado'],
                general: ['restaurante', 'comer', 'cenar', 'tapas', 'menú', 'cocina'],
            };

            const subtype = intent.foodSubtype || 'general';
            const expansionTerms = expansionMap[subtype] || expansionMap['general'];

            if (intent.intent === 'recommendation_activity') {
                ragQuery = `${ragQuery} ocio actividades turismo visitar lugares qué hacer`;
            } else if (intent.intent === 'recommendation_shopping') {
                ragQuery = `${ragQuery} tiendas compras mercado comercios ropa moda zapatos centro comercial mall clothing`;
            } else {
                ragQuery = `${ragQuery} ${expansionTerms.join(' ')} recomendaciones zona`;
            }
            console.log('[CHAT-DEBUG] Expanded recommendation query:', ragQuery);

        } else if (isApplianceTaskQuery && detectedTask) {
            // ── NUEVO: appliance_task usa TASK_TO_CONTEXT para expandir el RAG ──
            const taskContext = TASK_TO_CONTEXT[detectedTask]
            if (taskContext) {
                ragQuery = `${ragQuery} ${taskContext.ragTerms}`
            } else {
                ragQuery = `${ragQuery} instrucciones pasos usar aparato`
            }
            console.log('[CHAT-DEBUG] Task expansion:', { detectedTask, ragQuery: ragQuery.substring(0, 120) })

        } else if (isApplianceUsageQuery) {
            // appliance_usage: el huésped pregunta por un aparato concreto
            const applianceHints: Record<string, string[]> = {
                tv: ['televisor', 'TV', 'tele', 'pantalla', 'mando', 'canales', 'streaming', 'netflix', 'disney', 'prime', 'youtube', 'hdmi', 'apps', 'aplicaciones'],
                lavadora: ['lavadora', 'lavar', 'centrifugar', 'ciclo', 'programa', 'tambor', 'centrifugado'],
                lavavajillas: ['lavavajillas', 'fregar', 'vajilla', 'programa', 'pastilla', 'detergente'],
                horno: ['horno', 'temperatura', 'cocinar', 'precalentar', 'bandeja', 'pizza', 'pirólisis', 'grill'],
                microondas: ['microondas', 'calentar', 'descongelar', 'potencia', 'segundos', 'plato giratorio'],
                cafetera: ['cafetera', 'café', 'espresso', 'cápsula', 'depósito', 'vapor', 'molinillo'],
                calentador: ['calentador', 'agua caliente', 'boiler', 'termo', 'temperatura', 'presión'],
                aire: ['aire acondicionado', 'climatizador', 'frío', 'calor', 'temperatura', 'mando', 'ventilador'],
                hervidor: ['hervidor', 'hervir', 'agua', 'temperatura', 'ebullición'],
                frigorifico: ['frigorífico', 'nevera', 'congelador', 'temperatura', 'frío'],
            }

            const msgLower = lastMessage.toLowerCase()
            const detectedAppliance = Object.keys(applianceHints).find(appliance =>
                msgLower.includes(appliance) ||
                (appliance === 'tv' && /tele|disney|netflix|prime|youtube|canal|streaming|hdmi|serie|pelicula|película/i.test(msgLower)) ||
                (appliance === 'aire' && /aire|ac\b|clima|calefacc/i.test(msgLower)) ||
                (appliance === 'frigorifico' && /nevera|frigo|congelador/i.test(msgLower))
            )

            if (intent.foodSubtype === 'recipe') {
                const FOOD_TO_APPLIANCE: Record<string, string> = {
                    'pizza': 'horno', 'pasta': 'horno vitrocerámica cocina',
                    'cafe': 'cafetera', 'café': 'cafetera', 'tostada': 'tostadora',
                    'arroz': 'vitrocerámica microondas cocina', 'huevo': 'vitrocerámica cocina sartén',
                    'carne': 'horno cocina vitrocerámica', 'pescado': 'horno cocina vitrocerámica',
                }
                const msg = lastMessage.toLowerCase()
                const detectedFood = Object.keys(FOOD_TO_APPLIANCE).find(food => msg.includes(food))
                const applianceExpansion = detectedFood ? FOOD_TO_APPLIANCE[detectedFood] : 'horno cocina vitrocerámica microondas'
                ragQuery = `${ragQuery} ${applianceExpansion} instrucciones temperatura tiempo pasos`
                console.log('[CHAT-DEBUG] Recipe expansion:', { detectedFood, applianceExpansion })
            } else {
                const expansionTerms = detectedAppliance
                    ? applianceHints[detectedAppliance]
                    : ['usar', 'instrucciones', 'pasos', 'cómo funciona']
                ragQuery = `${ragQuery} ${expansionTerms.join(' ')}`
            }
            console.log('[CHAT-DEBUG] Appliance expansion:', { detectedAppliance: lastMessage.substring(0, 30), ragQuery: ragQuery.substring(0, 120) })
        }

        const questionEmbedding = await generateOpenAIEmbedding(ragQuery);

        const matchThreshold = isRecommendationQuery ? 0.30 :
            isApplianceTaskQuery ? 0.28 :   // ← umbral más bajo para tareas (query es indirecta)
                isApplianceQuery ? 0.30 :
                    isApplianceUsageQuery ? 0.32 :
                        detectedErrorCode ? 0.30 : 0.28;

        const matchCount = detectedErrorCode ? 30 :
            isRecommendationQuery ? 15 :
                isApplianceTaskQuery ? 10 :     // ← más chunks para tareas
                    isApplianceUsageQuery ? 8 : 25;

        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        console.log('[CHAT-DEBUG] RAG results:', {
            totalChunks: relevantChunks?.length || 0,
            strategy: chatStrategy,
            threshold: matchThreshold,
            topSimilarities: relevantChunks?.slice(0, 3).map((c: any) => ({
                type: c.source_type,
                similarity: c.similarity?.toFixed(3),
                preview: c.content.substring(0, 60) + '...'
            })) || []
        });

        // ═══════════════════════════════════════════════════════
        // 4. DATOS ESTRUCTURADOS
        // ═══════════════════════════════════════════════════════
        const [
            { data: propertyInfo },
            { data: propertyBranding },
            { data: criticalContext }
        ] = await Promise.all([
            supabase.from('properties').select('*').eq('id', propertyId).single(),
            supabase.from('property_branding').select('*').eq('property_id', propertyId).single(),
            supabase.from('property_context').select('category, content').eq('property_id', propertyId)
                .in('category', ['tech', 'rules', 'access', 'contacts', 'notes', 'inventory', 'welcome', 'checkin'])
        ]);

        const isGenericFoodSearch = intent.intent === 'recommendation_food' && intent.isGenericFood;

        let foodSubcatFromIntent: string[] = [];
        if (intent.intent === 'recommendation_food') {
            if (isGenericFoodSearch || !intent.foodSubtype || intent.foodSubtype === 'general') {
                foodSubcatFromIntent = ['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'cafe', 'tapas'];
            } else {
                foodSubcatFromIntent = [intent.foodSubtype];
            }
        }
        const activityTypes = intent.intent === 'recommendation_activity' ? ['ocio', 'naturaleza', 'cultura', 'relax'] : [];
        const shoppingTypes = intent.intent === 'recommendation_shopping' ? ['compras', 'supermercados'] : [];
        const detectedTypes = [...foodSubcatFromIntent, ...activityTypes, ...shoppingTypes];

        let directRecommendations: any[] = [];
        if (isRecommendationQuery) {
            const recsQuery = supabase.from('property_recommendations')
                .select('name, type, description, distance, personal_note, price_range')
                .eq('property_id', propertyId);

            if (detectedTypes.length > 0) {
                recsQuery.in('type', detectedTypes).limit(15);
            } else {
                recsQuery.order('type').limit(50);
            }

            const { data: recs } = await recsQuery;
            directRecommendations = recs || [];

            console.log('[CHAT-DEBUG] Direct recs from DB:', {
                count: directRecommendations.length,
                requestedTypes: detectedTypes
            });
        }

        const contactsData = criticalContext?.find((c: any) => c.category === 'contacts')?.content;
        let supportContact = 'el personal de soporte';
        if (contactsData) {
            const name = contactsData.support_name || 'Soporte';
            const mobile = contactsData.support_mobile || contactsData.host_mobile || '';
            const phone = contactsData.support_phone || contactsData.host_phone || '';
            const bestNumber = mobile || phone;
            if (bestNumber) supportContact = `${name}: ${bestNumber}`;
        }

        // ═══════════════════════════════════════════════════════
        // 5. CONSTRUCCIÓN DEL CONTEXTO
        // ═══════════════════════════════════════════════════════
        const commonBrands = ['TEKA', 'BALAY', 'BOSCH', 'SIEMENS', 'NEFF', 'BSH', 'SAMSUNG', 'LG', 'BEKO', 'WHIRLPOOL'];
        const brandRegex = new RegExp(`\\b(${commonBrands.join('|')})\\b`, 'gi');
        const getType = (r: any) => (r.type || r.category || 'general').toLowerCase();

        const isGenericFood = intent.isGenericFood;
        const ALL_FOOD_TYPES = ['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'cafe', 'tapas'];
        const allFoodRecs = directRecommendations.filter(r => ALL_FOOD_TYPES.includes(getType(r)));
        const foodCatsInDB = Array.from(new Set(allFoodRecs.map(r => getType(r))));

        console.log('[CHAT-DEBUG] Recommended Categories:', foodCatsInDB);

        const catLabelMap: Record<string, string> = {
            'restaurantes': 'RESTAURANTES_GENERALES', 'italiano': 'RESTAURANTES_ITALIANOS',
            'mediterraneo': 'RESTAURANTES_MEDITERRANEOS', 'hamburguesas': 'HAMBURGUESAS_Y_AMERICANO',
            'asiatico': 'COCINA_ASIATICA', 'alta_cocina': 'ALTA_COCINA',
            'internacional': 'COCINA_INTERNACIONAL', 'desayuno': 'CAFETERIAS_Y_DESAYUNOS',
            'cafe': 'CAFETERIAS', 'tapas': 'TAPAS',
            'ocio': 'LUGARES_DE_OCIO', 'compras': 'TIENDAS_Y_COMPRAS',
            'naturaleza': 'NATURALEZA_Y_PARQUES', 'cultura': 'CULTURA_Y_VISITAS',
            'relax': 'RELAX_Y_BIENESTAR',
        };

        const formattedContext = [
            // A. Propiedad
            ...(propertyInfo ? [`[PROPIEDAD]: "${propertyInfo.name}". Ciudad: ${propertyInfo.city}.`] : []),

            // B. Datos estructurados
            ...(criticalContext || []).map((c: any) => {
                const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;
                let contentString = '';
                if (typeof c.content === 'object' && c.content !== null) {
                    if (c.category === 'access') {
                        contentString = `Dirección: ${c.content.address || ''}. Parking: ${c.content.parking?.info || 'N/A'}. Transp: ${c.content.from_airport?.instructions || 'N/A'}`;
                    } else if (c.category === 'tech') {
                        let techStr = '';
                        if (c.content.wifi_ssid) techStr += `Red WiFi: \`${c.content.wifi_ssid}\`. Contraseña WiFi: \`${c.content.wifi_password || ''}\`. `;
                        if (c.content.router_notes) techStr += `Notas Router: ${c.content.router_notes}. `;
                        contentString = techStr.trim() || JSON.stringify(c.content);
                    } else {
                        contentString = JSON.stringify(c.content);
                    }
                } else {
                    contentString = String(c.content);
                }
                return `[${label}]: ${contentString.replace(brandRegex, '')}`;
            }),

            // B2. Inventario (Equipamiento)
            ...(criticalContext?.filter((c: any) => c.category === 'inventory').map((c: any) => {
                const items = Array.isArray(c.content) ? c.content : (c.content?.selected_items || []);
                const presentItems = items.filter((i: any) => i.isPresent).map((i: any) => {
                    let text = `- ${i.name}`;
                    if (i.customContext) text += `: ${i.customContext}`;
                    return text;
                }).join('\n');
                return `[INVENTARIO_Y_EQUIPAMIENTO]:\n${presentItems}`;
            }) || []),

            // C. Recomendaciones de DB
            ...(isRecommendationQuery && directRecommendations.length > 0 ? (() => {
                if (isGenericFoodSearch && foodCatsInDB.length > 1) {
                    const catLabelNames: Record<string, string> = {
                        'restaurantes': 'Restaurantes', 'italiano': 'Italiana',
                        'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
                        'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina',
                        'internacional': 'Internacional', 'desayuno': 'Desayunos',
                        'cafe': 'Cafeterías', 'tapas': 'Tapas'
                    };
                    const catSummary = foodCatsInDB.map(c => catLabelNames[c] || c).join(', ');
                    return [`[CATEGORIAS_DISPONIBLES_COMIDA]: ${catSummary}`];
                }

                const filteredRecs = detectedTypes.length > 0
                    ? directRecommendations.filter(r => detectedTypes.includes(getType(r)))
                    : directRecommendations;

                if (filteredRecs.length === 0) return [];

                const grouped: Record<string, any[]> = {};
                for (const r of filteredRecs) {
                    const cat = getType(r);
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(r);
                }

                return Object.entries(grouped).map(([cat, items]) => {
                    const catLabel = catLabelMap[cat] || 'RECOMENDACIONES_LOCALES';
                    const itemLines = items.map((r: any) => {
                        let line = `- **${r.name}**`;
                        if (r.distance) line += ` (${r.distance})`;
                        if (r.price_range) line += ` ${r.price_range}`;
                        if (r.description) line += `: ${r.description.substring(0, 150)}`;
                        if (r.personal_note) line += ` 💬 Nota del anfitrión: "${r.personal_note}"`;
                        return line;
                    }).join('\n');
                    return `[${catLabel}]:\n${itemLines}`;
                });
            })() : []),

            // D. Chunks RAG
            ...(relevantChunks || [])
                .filter((c: any) => {
                    const sourceType = c.source_type?.toLowerCase() || '';
                    const isRec = sourceType === 'recommendation' || sourceType === 'recommendations';
                    if (isGenericFoodSearch && isRec) return false;
                    return true;
                })
                .map((c: any) => {
                    const isEnriched = c.metadata?.enriched === true;
                    const sourceType = c.source_type?.toLowerCase() || '';
                    let type: string;

                    if (sourceType === 'manual') {
                        type = isEnriched ? 'GUÍA_PERSONALIZADA_ANFITRIÓN' : 'GUÍA_TÉCNICA';
                    } else if (sourceType === 'recommendation' || sourceType === 'recommendations') {
                        const category = c.metadata?.category || c.metadata?.type || '';
                        type = category === 'ocio' ? 'LUGARES_Y_ACTIVIDADES' :
                            category === 'dining' ? 'RESTAURANTES_Y_BARES' : 'RECOMENDACIONES_LOCALES';
                    } else if (sourceType === 'arrival_instructions' || sourceType === 'access') {
                        type = 'INSTRUCCIONES_LLEGADA';
                    } else if (sourceType === 'property' || sourceType === 'welcome') {
                        type = 'INFO_APARTAMENTO';
                    } else {
                        type = sourceType.toUpperCase();
                    }

                    const cleanContent = c.content
                        .replace(/\[\[RECOMENDACI[ÓO]N:\s*(.*?)\s*\]\]/gi, '$1')
                        .replace(/\[\[.*?\]\]/g, '')
                        .replace(brandRegex, '');

                    return `[${type}]: ${cleanContent}`;
                })
        ].join('\n\n\n');

        // ═══════════════════════════════════════════════════════
        // 6. CONSTRUCCIÓN DEL PROMPT
        // ═══════════════════════════════════════════════════════
        const languageHandlingBlock = `
# IDIOMA:
- El historial puede contener mensajes en varios idiomas. Entiéndelos todos.
- SIEMPRE responde en español. Tu respuesta será traducida automáticamente.
- No indiques que estás cambiando de idioma.`;

        const mapFormatBlock = `
# FORMATO DE DIRECCIONES:
Cuando menciones una dirección física EXTERNA concreta (calle, número, lugar turístico), escríbela así:
[[MAP:Dirección completa, Ciudad:Nombre del lugar]]
REGLA CRÍTICA: NO uses este formato para indicaciones internas de la casa o lugares relativos (ej: "la entrada", "el pasillo", "el cuadro eléctrico", "el salón"). Usa texto plano para eso.
Solo usa este formato cuando tengas la dirección exacta de un lugar fuera del alojamiento en el CONTEXTO. No inventes direcciones.`;

        // ── NUEVO noInventionAnchor: distingue tareas de información ──
        const taskPracticalTip = (isApplianceTaskQuery && detectedTask)
            ? TASK_TO_CONTEXT[detectedTask]?.practicalTip || null
            : null

        const coreRulesBlock = `
# REGLAS DE INFORMACIÓN (CRÍTICO):
1. USA SOLO EL CONTEXTO: No inventes nada. Si algo no está, di que no tienes información y sugiere contactar con ${supportContact}.
2. TAREAS Y EQUIPAMIENTO:
   - Si el huésped busca un objeto (ollas, sartenes, cafetera, etc.):
     a) Busca el objeto en [INVENTARIO_Y_EQUIPAMIENTO].
     b) **LEE LA NOTA COMPLETA**: Cada objeto puede tener una nota del anfitrión tras los dos puntos (:). **LÉELA ENTERA Y CON CUIDADO**. 
     c) **DISTINGUE UBICACIONES**: Si la nota menciona varios lugares para diferentes objetos (ej: "las sartenes en X, las ollas en Y"), responde con esa distinción exacta.
     d) **PRIORIDAD MÁXIMA**: La nota del anfitrión es la ÚNICA verdad. No supongas ubicaciones estándar si hay una nota.
3. TONO: Natural, amistoso, tipo WhatsApp. No menciones etiquetas técnicas ni digas "según el manual".`;

        let systemInstruction: string;

        if (isEmergency) {
            systemInstruction = `EMERGENCIA DE SEGURIDAD DETECTADA.
${languageHandlingBlock}
${mapFormatBlock}

No intentes diagnosticar. Prioridad absoluta: seguridad del huésped.
NUNCA menciones "el manual" ni "la documentación".
Incluye siempre la dirección del apartamento: ${criticalContext?.find((c: any) => c.category === 'access')?.content?.address || propertyInfo?.address || 'la dirección del alojamiento'}

${coreRulesBlock}`;

        } else if (detectedErrorCode) {
            systemInstruction = `Eres el asistente del apartamento "${propertyInfo?.name || 'este apartamento'}". El huésped tiene el código de error: ${detectedErrorCode}.
${languageHandlingBlock}
${mapFormatBlock}

TU MISIÓN: Busca ESTE código EXACTO (${detectedErrorCode}) en la tabla de diagnóstico del contexto.

# SI ENCUENTRAS EL CÓDIGO:
Explica la solución paso a paso, máximo 5 líneas, tono natural.

# SI EL MANUAL DICE "Contactar con soporte":
"Para este problema es mejor que te ayude directamente ${supportContact}."

# SI NO ENCUENTRAS EL CÓDIGO:
"No encuentro el código ${detectedErrorCode} en el manual de este aparato. ¿Puedes comprobar que el código sea exactamente ese? Si persiste, contacta con ${supportContact}."

❌ NUNCA digas "consulta el manual".

# CONTEXTO:
${formattedContext}

${coreRulesBlock}`;

        } else {
            const catLabelNames: Record<string, string> = {
                'restaurantes': 'Restaurantes generales', 'italiano': 'Italiana',
                'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
                'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina',
                'internacional': 'Internacional', 'desayuno': 'Desayunos',
                'cafe': 'Cafeterías', 'tapas': 'Tapas'
            };
            const availableCatNames = foodCatsInDB.map(c => catLabelNames[c] || c).join(', ');
            const hasDirectRecs = isRecommendationQuery && directRecommendations.length > 0;

            const recommendationGuidance = isRecommendationQuery ? `
# GUÍA PARA RECOMENDACIONES LOCALES:
${hasDirectRecs ? (
                    isGenericFoodSearch && foodCatsInDB.length > 1 ? `
- El CONTEXTO tiene recomendaciones de estas CATEGORÍAS: ${availableCatNames}.
- Como el huésped preguntó de forma genérica, haz UNA sola pregunta de cualificación enumerando las categorías disponibles.
- NO listes nombres de locales todavía. Espera su respuesta.
- EJEMPLO: "¡Claro! ¿Qué te apetece? Tengo recomendaciones de: **Italiana**, **Asiática**, **Tapas** y **Hamburguesas** 😊"` : `
- El CONTEXTO ya incluye las recomendaciones del anfitrión.
- Da 3-5 opciones COPIANDO literalmente los nombres que aparecen tras "**" en esas etiquetas.
- Formato OBLIGATORIO: "**[Nombre]** ([distancia]) — [breve descripción]."
- ⛔ PROHIBIDO: Usar listas separadas por comas. Usa una lista con guiones (-).`
                ) : `
- Si no hay recomendaciones en el contexto, di amablemente que no tienes lista guardada y sugiere preguntar a ${supportContact}.`}
- ⛔ Si el nombre no aparece LITERALMENTE en el CONTEXTO → no lo escribas.
` : '';

            // ── NUEVO: bloque específico para tareas ──
            const taskGuidance = isApplianceTaskQuery ? `
# TAREA DETECTADA: ${detectedTask || 'uso de equipamiento'}
1. Confirma si el equipamiento necesario está en el [INVENTARIO_Y_EQUIPAMIENTO] o tiene [GUÍA_TÉCNICA].
2. Si tiene nota de ubicación en el inventario, menciónala inmediatamente.
${taskPracticalTip ? `3. Consejos útiles: ${taskPracticalTip}` : ''}
` : '';

            systemInstruction = `Eres el asistente personal del apartamento "${propertyInfo?.name || 'este apartamento'}".
${languageHandlingBlock}
${mapFormatBlock}
${coreRulesBlock}

# REGLAS ESPECÍFICAS:
1. WiFi: pon SIEMPRE red y contraseña entre backticks (\`). Ejemplo: \`MiRed_5G\` / \`12345678\`.
2. Streaming: Si el manual dice un botón, dilo. No dudes.
3. ⛔ No menciones etiquetas internas ([GUÍA_TÉCNICA], [INVENTARIO_Y_EQUIPAMIENTO], etc.).
4. ⛔ No menciones "el manual" ni "la documentación".
 
${taskGuidance}
${recommendationGuidance}
 
# CONTEXTO:
${formattedContext}`;
        }

        // ═══════════════════════════════════════════════════════
        // 7. LLAMADA A GEMINI (Streaming)
        // ═══════════════════════════════════════════════════════
        const geminiMessages = messages.map((m: any, index: number) => {
            if (language !== 'es' && index === messages.length - 1 && m.role === 'user') {
                return { role: 'user', content: ragQuery };
            }
            return { role: m.role === 'user' ? 'user' : 'model', content: m.content };
        });

        const response = await streamGeminiREST('gemini-2.0-flash', geminiMessages, {
            systemInstruction,
            temperature: 0.1
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error en Gemini API');
        }

        // ═══════════════════════════════════════════════════════
        // 8. STREAM TRANSFORMER
        // ═══════════════════════════════════════════════════════
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) return;

                const decoder = new TextDecoder();
                let eventBuffer = '';
                let accumulatedText = '';
                let mapMarkerBuffer = '';
                let globalAccumulatedText = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        eventBuffer += decoder.decode(value, { stream: true });
                        const lines = eventBuffer.split('\n');
                        eventBuffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.substring(6));
                                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (text) {
                                        globalAccumulatedText += text;
                                        if (language === 'es') {
                                            if (text.includes('[[') || mapMarkerBuffer) {
                                                mapMarkerBuffer += text;
                                                if (mapMarkerBuffer.includes(']]')) {
                                                    controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(mapMarkerBuffer)}\n`));
                                                    mapMarkerBuffer = '';
                                                }
                                            } else {
                                                controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(text)}\n`));
                                            }
                                        } else {
                                            accumulatedText += text;
                                            const hasOpening = accumulatedText.includes('[[');
                                            const hasClosing = accumulatedText.includes(']]');
                                            const isInsideMarker = hasOpening && !hasClosing;

                                            if (!isInsideMarker) {
                                                const boundaryRegex = /(\n|[\.!?]\s+|\s[\*\-]\s|\s\d+\.\s)/g;
                                                let match;
                                                while ((match = boundaryRegex.exec(accumulatedText)) !== null) {
                                                    const breakPoint = match.index + (match[0].startsWith(' ') ? 0 : 1);
                                                    const chunkToTranslate = accumulatedText.substring(0, breakPoint).trim();
                                                    if (chunkToTranslate) {
                                                        const { text: translatedChunk } = await TranslationService.translate(
                                                            chunkToTranslate, 'es', language, { propertyId, context: 'chat' }
                                                        );
                                                        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(translatedChunk + ' ')}\n`));
                                                    }
                                                    accumulatedText = accumulatedText.substring(breakPoint).trimStart();
                                                    boundaryRegex.lastIndex = 0;
                                                }
                                            }

                                            if (accumulatedText.length > 200 && !isInsideMarker) {
                                                const lastSpace = accumulatedText.lastIndexOf(' ', 200);
                                                const breakPoint = lastSpace !== -1 ? lastSpace : 200;
                                                const chunkToTranslate = accumulatedText.substring(0, breakPoint).trim();
                                                const { text: translatedChunk } = await TranslationService.translate(
                                                    chunkToTranslate, 'es', language, { propertyId, context: 'chat' }
                                                );
                                                controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(translatedChunk + ' ')}\n`));
                                                accumulatedText = accumulatedText.substring(breakPoint).trimStart();
                                            }
                                        }
                                    }
                                } catch (e) { /* ignorar líneas parciales */ }
                            }
                        }
                    }

                    // Flush final
                    if (mapMarkerBuffer) {
                        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(mapMarkerBuffer)}\n`));
                    }
                    if (language !== 'es' && accumulatedText.trim()) {
                        const { text: translatedChunk } = await TranslationService.translate(
                            accumulatedText, 'es', language, { propertyId, context: 'chat' }
                        );
                        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(translatedChunk)}\n`));
                    }

                    if (propertyId && guestSessionId && globalAccumulatedText.length > 0) {
                        try {
                            const newMessages = [...messages, { role: 'assistant', content: globalAccumulatedText, timestamp: new Date().toISOString() }];

                            const { data: existingChat } = await supabase
                                .from('guest_chats')
                                .select('id')
                                .eq('guest_session_id', guestSessionId)
                                .maybeSingle();

                            if (existingChat) {
                                await supabase.from('guest_chats').update({
                                    messages: newMessages,
                                    updated_at: new Date().toISOString()
                                }).eq('id', existingChat.id);
                            } else {
                                await supabase.from('guest_chats').insert({
                                    property_id: propertyId,
                                    tenant_id: tenantId,
                                    guest_session_id: guestSessionId,
                                    messages: newMessages
                                });
                            }
                        } catch (err: any) {
                            console.error('[CHAT LOG] Failed to log chat:', err.message);
                        }
                    }
                } catch (e) {
                    console.error('[CHAT] Streaming error:', e);
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Vercel-AI-Data-Stream': 'v1',
            }
        });

    } catch (error: any) {
        console.error('[CHAT ERROR]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}