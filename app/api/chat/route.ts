import { logger } from '@/lib/logger';
import { type CoreMessage, streamText } from 'ai';
import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { generateOpenAIEmbedding } from '@/lib/ai/clients/openai';
import { streamGeminiREST } from '@/lib/ai/clients/gemini-rest';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { TranslationService } from '@/lib/ai/services/translation-service';
import { NotificationService } from '@/lib/notifications';
import { classifyIntent, intentToStrategy, isRecommendation, isAppliance, TASK_TO_CONTEXT } from '@/lib/ai/services/intent-classifier';

export const runtime = 'nodejs';

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
        const stressSecret = req.headers.get('x-stress-test-secret');
        const isStressTest = stressSecret && stressSecret === process.env.STRESS_TEST_SECRET;

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
                    logger.warn(`[SECURITY] Halted property access attempt blocked`);
                    return new Response(JSON.stringify({
                        error: 'Property suspended',
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

        if (!accessToken && legacyPropertyId && !isStressTest) {
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

            if (!isStressTest) {
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
        } else {
            // FASE 22: Check for host session if no guest token (Security fix A01 + Regression fix)
            const { createClient } = await import('@/lib/supabase/server');
            const userSupabase = await createClient();
            const { data: { user } } = await userSupabase.auth.getUser();

            if (user && legacyPropertyId) {
                // Verify the host owns this property
                const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
                const { data: property } = await supabase.from('properties').select('tenant_id').eq('id', legacyPropertyId).single();

                if (profile?.tenant_id === property?.tenant_id) {
                    propertyId = legacyPropertyId;
                    logger.debug(`[SECURITY] Host session authorized for property`);
                } else {
                    console.warn(`[SECURITY] 🛡️ Host ${user.id} attempted to access unauthorized property: ${legacyPropertyId}`);
                    return new Response(JSON.stringify({ error: 'No autorizado para esta propiedad' }), { status: 403 });
                }
            } else {
                console.warn(`[SECURITY] 🛡️ Unauthorized chat attempt from IP: ${ip} without accessToken or Host session.`);
                return new Response(JSON.stringify({ 
                    error: 'Acceso no autorizado. Se requiere un token válido o sesión de anfitrión.',
                    reason: 'missing_token'
                }), { status: 401 });
            }
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
                    logger.debug(`[TRANSLATION] RAG Query processed`);
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
        const isApplianceTaskQuery = intent.intent === 'appliance_task';
        const isApplianceProblem = intent.intent === 'appliance_problem';
        const isManualRequest = intent.intent === 'manual_request';
        const isEmergency = intent.intent === 'emergency';
        const detectedErrorCode = intent.detectedErrorCode;
        const detectedTask = intent.detectedTask || null;

        logger.debug('[CHAT-DEBUG] Intent classified:', {
            text: lastMessage.substring(0, 50),
            intent: intent.intent,
            confidence: intent.confidence,
            foodSubtype: intent.foodSubtype,
            detectedErrorCode,
            isGenericFood: intent.isGenericFood,
            detectedTask
        });

        // ═══════════════════════════════════════════════════════
        // 2b. CORTOCIRCUITO OFF-TOPIC Y MANUALES — NO LLEGA A GEMINI
        // ═══════════════════════════════════════════════════════
        if (isManualRequest) {
            const stream = new ReadableStream({
                start(controller) {
                    const msg = `Puedo ayudarte con lo que necesites paso a paso 😊 ¿Qué quieres hacer exactamente? ¿Ponerlo en marcha, resolver algún problema o saber algo específico?`
                    controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(msg)}\n`));
                    controller.close();
                }
            });
            return new Response(stream, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' }
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
                    const { text } = await TranslationService.translate(
                        offTopicText, 'es', language, { propertyId, context: 'chat' }
                    );
                    offTopicText = text;
                } catch (err: any) {
                    console.warn('[OFF-TOPIC] Translation failed:', err.message);
                }
            }

            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(offTopicText)}\n`));
                    controller.close();
                }
            });
            
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Vercel-AI-Data-Stream': 'v1',
                }
            });
        }

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
            logger.debug('[CHAT-DEBUG] Expanded recommendation query');

        } else if (isApplianceTaskQuery && detectedTask) {
            // ── NUEVO: appliance_task usa TASK_TO_CONTEXT para expandir el RAG ──
            const taskContext = TASK_TO_CONTEXT[detectedTask]
            if (taskContext) {
                ragQuery = `${ragQuery} ${taskContext.ragTerms}`
            } else {
                ragQuery = `${ragQuery} instrucciones pasos usar aparato`
            }
            logger.debug('[CHAT-DEBUG] Task expansion processed');

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
                logger.debug('[CHAT-DEBUG] Recipe expansion processed');
            } else {
                const expansionTerms = detectedAppliance
                    ? applianceHints[detectedAppliance]
                    : ['usar', 'instrucciones', 'pasos', 'cómo funciona']
                ragQuery = `${ragQuery} ${expansionTerms.join(' ')}`
            }
            logger.debug('[CHAT-DEBUG] Appliance expansion processed');
        }

        const questionEmbedding = await generateOpenAIEmbedding(ragQuery);

        const matchThreshold = isRecommendationQuery ? 0.30 :
            isApplianceTaskQuery ? 0.28 :   // ← umbral más bajo para tareas (query es indirecta)
                isApplianceQuery ? 0.30 :
                    isApplianceUsageQuery ? 0.32 :
                        detectedErrorCode ? 0.30 : 0.28;

        const matchCount = detectedErrorCode ? 30 :
            isRecommendationQuery ? 15 :
                isApplianceTaskQuery ? 6 :                 // ← bajar de 10 a 6
                    isApplianceUsageQuery ? 4 :            // ← bajar de 8 a 4
                        intent.intent === 'manual_request' ? 0 :  // ← sin contexto
                            25;

        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        logger.debug('[CHAT-DEBUG] RAG results processed');

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
                foodSubcatFromIntent = ['restaurant', 'restaurante', 'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'cafe', 'tapas', 'taberna', 'tapas_bar', 'bar_restaurante'];
            } else {
                // Relaciones funcionales entre categorías:
                // Si piden café, mostrar también desayunos. Si piden desayunos, mostrar también cafés.
                const relatedMap: Record<string, string[]> = {
                    'cafe': ['cafe', 'desayuno'],
                    'desayuno': ['desayuno', 'cafe'],
                    'tapas': ['tapas', 'taberna', 'tapas_bar', 'bar_restaurante'],
                    'restaurante': ['restaurante', 'restaurant', 'food', 'comida'],
                };
                foodSubcatFromIntent = relatedMap[intent.foodSubtype] || [intent.foodSubtype];
            }
        }
        const activityTypes = intent.intent === 'recommendation_activity' ? ['ocio', 'naturaleza', 'cultura', 'relax', 'activity'] : [];
        const shoppingTypes = intent.intent === 'recommendation_shopping' ? ['compras', 'supermercados', 'shop', 'service'] : [];
        const detectedTypes = [...foodSubcatFromIntent, ...activityTypes, ...shoppingTypes];

        let directRecommendations: any[] = [];
        let usedFallbackRecs = false;
        if (isRecommendationQuery) {
            const recsQuery = supabase.from('property_recommendations')
                .select('name, type, description, distance, personal_note, price_range, google_place_id, address')
                .eq('property_id', propertyId);

            if (detectedTypes.length > 0) {
                recsQuery.in('type', detectedTypes).limit(15);
            } else {
                recsQuery.order('type').limit(50);
            }

            const { data: recs } = await recsQuery;
            directRecommendations = recs || [];

            // Fallback: si el subtipo específico no tiene resultados, mostramos
            // todos los tipos de comida disponibles para poder cualificar al huésped
            if (directRecommendations.length === 0 && intent.intent === 'recommendation_food' && !isGenericFoodSearch) {
                const ALL_FOOD_TYPES = ['restaurant', 'restaurante', 'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'cafe', 'tapas', 'taberna', 'tapas_bar', 'bar_restaurante'];
                const { data: fallbackRecs } = await supabase.from('property_recommendations')
                    .select('name, type, description, distance, personal_note, price_range, google_place_id, address')
                    .eq('property_id', propertyId)
                    .in('type', ALL_FOOD_TYPES)
                    .limit(20);
                directRecommendations = fallbackRecs || [];
                usedFallbackRecs = directRecommendations.length > 0;
            }

            logger.debug('[CHAT-DEBUG] Direct recs from DB processed');
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
        const hasDirectRecs = isRecommendationQuery && directRecommendations.length > 0;
        const ALL_FOOD_TYPES_LIST = ['restaurant', 'restaurante', 'restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno', 'cafe', 'tapas'];
        const catLabelNamesMap: Record<string, string> = {
            'restaurant': 'Restaurantes', 'restaurante': 'Restaurantes', 'restaurantes': 'Restaurantes',
            'italiano': 'Italiana', 'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
            'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina', 'internacional': 'Internacional',
            'desayuno': 'Desayunos', 'cafe': 'Cafeterías', 'tapas': 'Tapas'
        };
        const foodCatsInDB = Array.from(new Set(directRecommendations.filter(r => ALL_FOOD_TYPES_LIST.includes(getType(r))).map(r => getType(r))));
        const availableCatNames = foodCatsInDB.map(c => catLabelNamesMap[c] || c).join(', ');

        const catLabelMap: Record<string, string> = {
            'restaurant': 'RESTAURANTES_GENERALES', 'restaurante': 'RESTAURANTES_GENERALES', 'restaurantes': 'RESTAURANTES_GENERALES',
            'italiano': 'RESTAURANTES_ITALIANOS', 'mediterraneo': 'RESTAURANTES_MEDITERRANEOS', 'hamburguesas': 'HAMBURGUESAS_Y_AMERICANO',
            'asiatico': 'COCINA_ASIATICA', 'alta_cocina': 'ALTA_COCINA', 'internacional': 'COCINA_INTERNACIONAL',
            'desayuno': 'CAFETERIAS_Y_DESAYUNOS', 'cafe': 'CAFETERIAS', 'tapas': 'TAPAS',
            'ocio': 'LUGARES_DE_OCIO', 'activity': 'LUGARES_DE_OCIO',
            'compras': 'TIENDAS_Y_COMPRAS', 'supermercados': 'SUPERMERCADOS', 'shop': 'TIENDAS_Y_COMPRAS', 'service': 'SERVICIOS_LOCALES',
            'naturaleza': 'NATURALEZA_Y_PARQUES', 'cultura': 'CULTURA_Y_VISITAS', 'relax': 'RELAX_Y_BIENESTAR',
        };

        const formattedContext = [
            // A. Propiedad
            ...(propertyInfo ? [`[PROPIEDAD]: "${propertyInfo.name}". Ciudad: ${propertyInfo.city}. Planta: ${propertyInfo.floor || 'N/A'}. Capacidad: ${propertyInfo.guests} huéspedes. Habitaciones: ${propertyInfo.beds}. Baños: ${propertyInfo.baths}.`] : []),

            // B. Datos estructurados
            ...(criticalContext || []).map((c: any) => {
                const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;
                if (c.category === 'contacts' && (String(c.content).toLowerCase().includes('hospital') || String(c.content).toLowerCase().includes('clinic'))) {
                    return `[SOLO_EMERGENCIAS_MEDICAS]: ${String(JSON.stringify(c.content)).replace(brandRegex, '')}`;
                }
                let contentString = '';
                if (typeof c.content === 'object' && c.content !== null) {
                    if (c.category === 'access') {
                        contentString = `Dirección: ${c.content.full_address || c.content.address || ''}. Parking: ${c.content.parking?.info || 'N/A'}. Transp: ${c.content.from_airport?.instructions || 'N/A'}`;
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
                        'restaurant': 'Restaurantes', 'restaurante': 'Restaurantes', 'restaurantes': 'Restaurantes',
                        'italiano': 'Italiana', 'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
                        'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina', 'internacional': 'Internacional',
                        'desayuno': 'Desayunos', 'cafe': 'Cafeterías', 'tapas': 'Tapas'
                    };
                    const catSummary = foodCatsInDB.map(c => catLabelNames[c] || c).join(', ');
                    
                    // Incluimos también las primeras 5 recomendaciones totales como muestra
                    const previewRecs = directRecommendations.slice(0, 5).map(r => {
                        return `[${catLabelMap[getType(r)] || 'RECOMENDACION'}]: ${r.name}. ${r.description || ''}${r.personal_note ? ` Nota: ${r.personal_note}` : ''} Dist: ${r.distance || ''}`;
                    });

                    return [
                        `[CATEGORIAS_DISPONIBLES_COMIDA]: ${catSummary}`,
                        ...previewRecs
                    ];
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
                        const namePart = r.google_place_id 
                            ? `[${r.name}](maps_place:${r.google_place_id})`
                            : `**${r.name}**`;
                        
                        let line = `- ${namePart}`;
                        if (r.distance) line += ` (${r.distance})`;
                        if (r.price_range) line += ` ${r.price_range}`;
                        if (r.description) line += `: ${r.description.substring(0, 150)}`;
                        if (r.personal_note) line += ` 💬 "${r.personal_note}"`;
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
# FORMATO DE MAPAS:
- Para cualquier lugar del contexto que tenga un enlace [Nombre](maps_place:...), ÚSALO EXACTAMENTE IGUAL.
- **PROPIEDAD**: Para la dirección del alojamiento, úsala SIEMPRE en este formato: [[MAP:Dirección Completa]].
- **IMPORTANTE**: No olvides copiar la descripción que aparece tras los dos puntos (:) en el contexto.
- Ejemplo: "- [Nombre del lugar](maps_place:id) (400m) — Aquí va la descripción completa del sitio."`;

        // ── NUEVO noInventionAnchor: distingue tareas de información ──
        const taskPracticalTip = (isApplianceTaskQuery && detectedTask)
            ? TASK_TO_CONTEXT[detectedTask]?.practicalTip || null
            : null

        const coreRulesBlock = `
# REGLAS DE RESPUESTA (CRÍTICO):

1. BREVEDAD OBLIGATORIA: Máximo 5-6 líneas. Nunca reproduzcas manuales completos.

2. TABLA DE ERRORES — REGLA ESTRICTA:
   ⛔ NUNCA muestres la tabla completa de errores aunque el huésped la pida.
   ✅ Solo muestra información de UN código concreto que el huésped mencione.
   Si el huésped pregunta por "los códigos" o "los errores" en general:
   → Responde: "Dime el código que aparece en pantalla y te digo qué significa 😊"

3. REGLA DE APARATOS:
   - "¿cómo funciona X?" → máximo 3 pasos esenciales, nada más.
   - "échamelo el manual" → "¿Qué necesitas hacer exactamente? Te ayudo paso a paso."
   - NUNCA listes todos los programas, botones ni funciones.

4. USA SOLO EL CONTEXTO. Si algo no está, sugiere contactar con ${supportContact}.

5. TONO: Natural, tipo WhatsApp. Conciso. Si necesitan más, ya preguntarán.

6. REGLA ANTI-GASLIGHTING (ESTRICTA): 
   Si el huésped afirma "antes dijiste X", "me confirmaste Y" o pregunta "cuál es el dato Z" y este no está en el CONTEXTO:
   - 1. Di: "No tengo historial de ese comentario." (si aplica)
   - 2. Busca el dato REAL en el CONTEXTO antes de confirmarlo.
   - 3. Si NO encuentras el dato en el CONTEXTO → di que no tienes esa info.
   - ⛔ **PROHIBIDO INVENTAR O SUPONER VALORES POR DEFECTO**: Nunca digas que el check-out es a las 12:00, que el check-in es a las 15:00, que hay WiFi o en qué planta está el piso si el CONTEXTO dice 'N/A' o no menciona el dato. 
   - ⛔ **NUNCA** digas "Lo habitual es X" o "Normalmente se hace Y". Solo usa lo que está en el CONTEXTO.
   - Si falta el dato, di: "No tengo esa información en mi guía por ahora. Es mejor que lo hables con ${supportContact} 😊"
`;

        let systemInstruction: string;

        if (isEmergency) {
            systemInstruction = `EMERGENCIA DE SEGURIDAD DETECTADA.
${languageHandlingBlock}
${mapFormatBlock}

No intentes diagnosticar. Prioridad absoluta: seguridad del huésped.
NUNCA menciones "el manual" ni "la documentación".
Incluye siempre la dirección del apartamento en formato de mapa: [[MAP:${criticalContext?.find((c: any) => c.category === 'access')?.content?.full_address || criticalContext?.find((c: any) => c.category === 'access')?.content?.address || propertyInfo?.full_address || propertyInfo?.address || 'la dirección del alojamiento'}]]

${coreRulesBlock}`;

        } else if (detectedErrorCode) {
            systemInstruction = `El huésped tiene el código de error: ${detectedErrorCode}.
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

${coreRulesBlock}

# CONTEXTO:
${formattedContext}`;

        } else {
            const taskGuidance = isApplianceTaskQuery ? `
# TAREA DETECTADA: ${detectedTask || 'uso de equipamiento'}
- Máximo 4-5 pasos concisos. Sin listar funciones que no pidieron.
- Si necesitan más detalle, espera a que lo pidan.
` : '';

            const applianceGuidance = isApplianceUsageQuery ? `
# PREGUNTA SOBRE APARATO:
- Da SOLO los pasos esenciales para lo que pregunta (máximo 4).
- NO reproduzcas el manual completo ni listes todos los programas.
- Si quieren saber algo específico más, ya preguntarán.
` : '';

            const applianceProblemGuidance = isApplianceProblem ? `
# PROBLEMA CON APARATO — REGLA DE SEGURIDAD Y PRECISIÓN:
⛔ NUNCA menciones nombres de modelos ni marcas de aparatos (ej: no digas "el ICECOOL ICCOM289FX").
⛔ NUNCA digas "consulta el manual", "en la guía de uso" ni hagas referencia a ningún documento.
⛔ **CRÍTICO: SOLUCIONES SOLO DEL CONTEXTO**: No des consejos de "sentido común" técnico. Solo da soluciones que aparezcan explícitamente en los chunks de [GUÍA_TÉCNICA] o [GUÍA_PERSONALIZADA_ANFITRIÓN].
⛔ **ERROR AC/AGUA**: Si hay un goteo o avería en el Aire Acondicionado o Electrodomésticos, **NUNCA sugieras cerrar la llave de paso de agua general** de la casa (del baño u otra zona), a menos que el manual específico de ese aparato lo indique.
✅ Si el problema es claro según el CONTEXTO, da los pasos exactos. 
✅ Si no hay solución en el CONTEXTO, di: "No tengo instrucciones para resolver ese problema técnico concreto. Por favor, contacta con ${supportContact} para que te ayude directamente."
✅ Tono anfitrión servicial, NO técnico de mantenimiento.
` : '';

            const recommendationGuidance = isRecommendationQuery ? `
# GUÍA PARA RECOMENDACIONES LOCALES:
${hasDirectRecs ? (
                    (isGenericFoodSearch || usedFallbackRecs) && foodCatsInDB.length > 1 ? `
- El CONTEXTO tiene recomendaciones de estas CATEGORÍAS: ${availableCatNames}.
${usedFallbackRecs ? '- El huésped pidió un tipo específico que no tenemos. Infórmale amablemente de qué opciones SÍ hay y usa la misma pregunta de cualificación.' : '- Como el huésped preguntó de forma genérica, haz UNA sola pregunta de cualificación enumerando las categorías disponibles.'}
- NO listes nombres de locales todavía. Espera su respuesta.
- EJEMPLO: "${usedFallbackRecs ? '¡Vaya! No tengo italianos en mi lista, pero sí tengo: **Mediterránea**, **Tapas** y **Restaurantes** 😊 ¿Alguno te apetece?' : '¡Claro! ¿Qué te apetece? Tengo recomendaciones de: **Italiana**, **Asiática**, **Tapas** y **Hamburguesas** 😊'}"` : `
- El CONTEXTO ya incluye las recomendaciones del anfitrión con sus enlaces maps_place vinculados al nombre.
- Da 3-5 opciones siguiendo el formato: "- [Nombre](maps_place:id) ([distancia]) — [Descripción completa que aparece en el contexto]."
- Usa una lista con guiones (-).`
                ) : `
- Si no hay recomendaciones en el contexto, di amablemente que no tienes una lista de favoritos guardada todavía para esta zona específica.
- Sugiere que pueden consultar a ${supportContact} o buscar en Google Maps general.` }
- ⛔ NUNCA sugieras hospitales, clínicas o centros médicos como opciones para comer, ocio o compras. Estos son SOLO para [SOLO_EMERGENCIAS_MEDICAS].
- ⛔ REGLA DE ORO: Si no hay recomendaciones en el CONTEXTO, NUNCA menciones nombres de locales reales (aunque los conozcas por tus conocimientos generales). Solo di que no tienes una lista guardada.
- ⛔ No inventes nombres que no estén en el CONTEXTO.
` : '';

            systemInstruction = `Eres el asistente personal del apartamento "${propertyInfo?.name || 'este apartamento'}".
${languageHandlingBlock}
${mapFormatBlock}
${coreRulesBlock}

# REGLA DE ORO: Eres un asistente de chat, no un manual en PDF.
# Responde como lo haría una persona por WhatsApp: conciso, útil, al grano.
# Si el huésped necesita más, ya preguntará.

${applianceGuidance}
${applianceProblemGuidance}
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

                            // --- ANALYTICS ENHANCEMENT ---
                            const isUnanswered = (relevantChunks?.length === 0 || !relevantChunks) && 
                                               (globalAccumulatedText.includes(supportContact) || globalAccumulatedText.includes('contacta con'));

                            if (isUnanswered) {
                                await supabase.rpc('increment_unanswered_question', {
                                    p_property_id: propertyId,
                                    p_tenant_id: tenantId,
                                    p_question: lastMessage,
                                    p_intent: intent.intent
                                });
                            }

                            const { data: existingChat } = await supabase
                                .from('guest_chats')
                                .select('*')
                                .eq('guest_session_id', guestSessionId)
                                .eq('property_id', propertyId)
                                .maybeSingle();

                            const firstMsgAt = existingChat?.created_at || new Date().toISOString();
                            const duration = Math.floor((Date.now() - new Date(firstMsgAt).getTime()) / 1000);
                            
                            const existingIntents = Array.isArray(existingChat?.intent_summary) ? existingChat.intent_summary : [];
                            const newIntents = [...new Set([...existingIntents, intent.intent])];

                            const updateData = {
                                messages: newMessages,
                                updated_at: new Date().toISOString(),
                                language: language,
                                message_count: newMessages.length,
                                session_duration_seconds: duration,
                                intent_summary: newIntents,
                                unanswered_count: (existingChat?.unanswered_count || 0) + (isUnanswered ? 1 : 0)
                            };

                            if (existingChat) {
                                await supabase.from('guest_chats').update(updateData).eq('id', existingChat.id);
                            } else {
                                await supabase.from('guest_chats').insert({
                                    ...updateData,
                                    property_id: propertyId,
                                    tenant_id: tenantId,
                                    guest_session_id: guestSessionId
                                });
                            }
                            // --- END ANALYTICS ENHANCEMENT ---
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