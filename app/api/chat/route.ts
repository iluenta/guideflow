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

        // C6 SECURITY: We only check the halt status AFTER token validation (see below).
        // If there is no accessToken (legacy flow), we can do it here with the unvalidated legacyPropertyId.
        // With accessToken, propertyId will be set from the validated token, so we defer the halt check.
        const checkHaltStatus = async (pidToCheck: string) => {
            const { data: propertyStatus, error: propError } = await supabase
                .from('properties')
                .select('id, tier, is_halted, halt_expires_at, halt_reason')
                .eq('id', pidToCheck)
                .single();

            if (propError || !propertyStatus) {
                console.error('[CHAT] Property status check failed:', propError?.message);
                return null;
            }

            propertyTier = (propertyStatus.tier as any) || 'standard';

            if (propertyStatus.is_halted) {
                const now = new Date();
                const expiresAt = propertyStatus.halt_expires_at ? new Date(propertyStatus.halt_expires_at) : null;

                if (!expiresAt || now < expiresAt) {
                    console.warn(`[SECURITY] 🛡️ Request blocked for Halted Property: ${pidToCheck}. Reason: ${propertyStatus.halt_reason}`);
                    return new Response(JSON.stringify({ 
                        error: 'Servicio temporalmente pausado por seguridad',
                        reason: 'property_halted',
                        haltReason: propertyStatus.halt_reason,
                        resetAt: expiresAt
                    }), { status: 403 });
                } else {
                    // Auto-cooldown expired: reset in background
                    supabase.from('properties').update({ is_halted: false }).eq('id', pidToCheck);
                }
            }
            return null; // null = not halted, proceed
        };

        // Without accessToken: check halt with legacyPropertyId now (unvalidated but only path)
        if (!accessToken && legacyPropertyId) {
            const haltResponse = await checkHaltStatus(legacyPropertyId);
            if (haltResponse) return haltResponse;
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

            // C6 SECURITY: Now that we have the real propertyId from the validated token,
            // run the halt check with the trusted propertyId.
            const haltResponse = await checkHaltStatus(propertyId);
            if (haltResponse) return haltResponse;

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
        // DETECCIÓN INTELIGENTE: Códigos de error, emergencias Y RECOMENDACIONES
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

        // C2: Intent detection window expanded to last 10 messages (5 full turns)
        // for regex matching of categories and flows.
        const recentContext = messages
            .slice(-10) 
            .map((m: any) => m.content)
            .join(' ');

        // C4: Context-aware emergency detection — prevents false positives like
        // '¿hay ahumadero cerca?' or '¿gasolinera?' triggering emergency mode.
        const emergencyPatterns = [
            /humo\s*(que sale|hay|se ve|mucho|negro|blanco|denso|del)/i,
            /olor\s*(a\s*)?(gas|quemado|burn|quema)/i,
            /fuga\s*(de\s*)?gas/i,
            /incendio|hay\s+fuego|se\s+(est[aá]|ha)\s+quemando/i,
            /inundaci[oó]n|agua\s+(por\s+todos|desbord|saliendo\s+sola)/i,
            /no\s+(respira|respiro)|desmay|inconsciente/i,
            /cortocircuito|chispa[s]?\s*(eléctricas?|en)/i,
            /explota|explosión/i,
        ];
        const isEmergency = emergencyPatterns.some(p => p.test(recentContext));

        // ✅ RECOMENDACIONES: Excludes place-queries that are NOT food/activity recommendations
        // (parking, farmacia, etc.) to avoid injecting restaurant data into those answers.
        const isPlaceServiceQuery = /parking|aparcamiento|farmacia|hospital|cajero|atm|gasolinera/i.test(recentContext);
        
        // Robust detection: checks recent context (for flow) OR last message (for specific category answers)
        const isRecommendationQuery = !isPlaceServiceQuery && (
            /restaurante|comer|cenar|desayuno|almuerzo|tapas|bar|cafeter[íi]a|café|cafe|comida|d[oó]nde.*comer|sitio.*comer|lugar.*comer|d[oó]nde.*cenar|sitio.*cenar|d[oó]nde ir|qu[eé] recomienda|recomendaci[oó]n|recomendaciones|ocio|visitar|qu[eé] ver|qu[eé] hacer|cosas que hacer|actividad|turismo|museo|compra|tienda/i.test(recentContext)
            || /italian|pizza|pasta|mediterr|hamburgues|burger|american|asiat|japones|chino|thai|sushi|ramen|wok|alta cocina|gourmet|fine dining|brunch|marisco/i.test(lastMessage)
        );
        const isApplianceQuery = /funciona|enciende|calienta|lava|centrifuga|error|problema|no va|roto|aver[íi]a|c[oó]digo|fallo|ruido|vibra|gotea|desagua/i.test(recentContext);
        const isApplianceUsageQuery = /hacerme|hagarme|preparar|calentar agua|hacer (un |el )?(té|te|café|cafe|pasta|arroz|sopa)|c[oó]mo (uso|utilizo|pongo|enciendo|arranco)|poner (el |la |un |una )?(lavadora|lavavajilla|microondas|horno|hervidor|cafetera|tostadora)|encender|arrancar/i.test(recentContext);

        const chatStrategy = isEmergency ? 'emergency' : 
                            detectedErrorCode ? 'error_code' : 
                            (isApplianceQuery || isApplianceUsageQuery) ? 'appliance' :
                            isRecommendationQuery ? 'recommendation' :
                            'standard';

        console.log('[CHAT-DEBUG] Detection:', { 
            chatStrategy, 
            detectedErrorCode, 
            isEmergency,
            isRecommendationQuery,
            isApplianceQuery,
            isApplianceUsageQuery,
            recentContextLength: recentContext.length
        });

        // ═══════════════════════════════════════════════════════
        // RAG: Búsqueda vectorial adaptativa
        // ═══════════════════════════════════════════════════════
        // ✅ MEJORADO: Query expansion según tipo de pregunta
        let ragQuery = lastMessage;

        if (detectedErrorCode) {
            ragQuery = `${lastMessage} código error ${detectedErrorCode} diagnóstico problemas tabla`;
        } else if (isRecommendationQuery) {
            // Expandir query para mejorar matching con recomendaciones
            const expansionTerms = [];
            
            if (/restaurante|comer|cenar|comida|almuerzo/i.test(lastMessage)) {
                expansionTerms.push('restaurantes', 'comer', 'cenar', 'tapas', 'menú', 'cocina');
            }
            if (/desayuno|café|cafetería/i.test(lastMessage)) {
                expansionTerms.push('desayuno', 'café', 'cafetería', 'brunch', 'panadería');
            }
            if (/ocio|visitar|ver|hacer|turismo|museo/i.test(lastMessage)) {
                expansionTerms.push('ocio', 'visitar', 'lugares', 'actividades', 'turismo', 'museos', 'parques');
            }
            if (/compra|tienda|shopping/i.test(lastMessage)) {
                expansionTerms.push('compras', 'tiendas', 'comercios', 'mercado');
            }
            
            ragQuery = `${lastMessage} ${expansionTerms.join(' ')} recomendaciones lugares zona`;
            
            console.log('[CHAT-DEBUG] Expanded recommendation query:', ragQuery);
        } else if (isApplianceUsageQuery) {
            // Expand usage queries to bridge the semantic gap:
            // "quiero hacerme un te" -> adds appliance/action terms so the kettle manual surfaces
            ragQuery = `${lastMessage} usar electrodoméstico instrucciones pasos hervidor cafetera microondas horno preparar calentar`;
            console.log('[CHAT-DEBUG] Expanded appliance usage query:', ragQuery);
        }

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

        // ✅ Threshold adaptativo según tipo de pregunta
        const matchThreshold = isRecommendationQuery ? 0.18 :  // Más permisivo para recomendaciones
                              isApplianceQuery ? 0.35 :         // Más estricto para problemas técnicos
                              isApplianceUsageQuery ? 0.22 :    // Permisivo para uso/how-to (bridging semántico)
                              detectedErrorCode ? 0.3 :          // Estricto para códigos de error
                              0.28;                              // Default ligeramente más permisivo

        const matchCount = detectedErrorCode ? 30 :
                          isRecommendationQuery ? 15 :
                          isApplianceUsageQuery ? 20 :  // Wider net for usage queries
                          25;

        console.log('[CHAT-DEBUG] RAG Config:', { 
            isRecommendationQuery, 
            isApplianceQuery, 
            matchThreshold, 
            matchCount,
            queryLength: ragQuery.length
        });

        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        // ✅ MEJORADO: Logging más detallado
        console.log('[CHAT-DEBUG] RAG results:', {
            totalChunks: relevantChunks?.length || 0,
            enrichedCount: relevantChunks?.filter((c: any) => c.metadata?.enriched === true).length || 0,
            recommendationCount: relevantChunks?.filter((c: any) => 
                c.source_type === 'recommendation' || c.source_type === 'recommendations'
            ).length || 0,
            strategy: chatStrategy,
            errorCode: detectedErrorCode,
            propertyId,
            threshold: matchThreshold,
            topSimilarities: relevantChunks?.slice(0, 3).map((c: any) => ({
                type: c.source_type,
                similarity: c.similarity?.toFixed(3),
                preview: c.content.substring(0, 60) + '...'
            })) || []
        });

        // 3. Obtener información ESTRUCTURADA Crítica (Garantía de datos básicos)
        // Also fetch recommendations directly from DB (not via RAG) when the user asks about food/things to do.
        // This bypasses the RAG indexing gap — many recs have no embeddings yet.
        // Always fetch property basics and context
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

        // ── DETECCIÓN GLOBAL DE INTENCIÓN (DIRECCIONADA A RECOMENDACIONES) ──
        const msg = lastMessage.toLowerCase();
        const contextMsg = recentContext.toLowerCase();
        
        const wantFood = /comer|cenar|restaurante|desayuno|almuerzo|tapas|bar|cafeter|caf[eé]|comida|cena|hambre|donde.*com|sitio.*com/.test(msg);
        const wantShopping = /centro\s+comercial|shopping|moda|tienda\s+de\s+ropa|fashion|boutique|souvenir|regalo|tienda\s+t[ií]pica|artesan[íi]a/.test(contextMsg);
        const wantAct = /ocio|diversion|hacer|noche|copas|bar|baile|fiesta|cine|bolera|karts/.test(contextMsg);
        const wantNature = /parque|naturaleza|senderismo|monte|campo|aire libre|lago|rio|bosque/.test(contextMsg);
        const wantCulture = /museo|monumento|teatro|historia|visit|excursion|iglesia|auditorio/.test(contextMsg);
        const wantRelax = /relax|masaje|spa|balneario|termas|descanso|sauna/.test(contextMsg);
        const wantSuper = /supermerca|mercadona|carrefour|lidl|aldi|dia|mercado\s+de\s+abastos|alimentaci[oó]n|hacer\s+la\s+compra|comprar\s+comida/.test(contextMsg);

        // Detección de subcategorías específicas (Sticky: check full recent context)
        const wantItaliano   = /italian|pizza|pasta|risotto/.test(contextMsg);
        const wantMediter    = /mediterr[aá]neo|griega|griegos|mar|mariscos/.test(contextMsg);
        const wantBurger     = /hamburgues|burger|american/.test(contextMsg);
        const wantAsian      = /asiat|japones|chino|thai|sushi|ramen|wok/.test(contextMsg);
        const wantAltaCocina = /alta cocina|gourmet|fine dining|estrella/.test(contextMsg);
        const wantIntl       = /internacional|fusion|variado/.test(contextMsg);
        const wantDesayuno   = /desayuno|brunch|caf[eé]|cafeter|cruasán|tostadas/.test(contextMsg);
        const wantRestaurantesGeneral = /restaurante/.test(contextMsg);

        const foodSubcat: string[] = [];
        if (wantItaliano)   foodSubcat.push('italiano');
        if (wantMediter)    foodSubcat.push('mediterraneo');
        if (wantBurger)     foodSubcat.push('hamburguesas');
        if (wantAsian)      foodSubcat.push('asiatico');
        if (wantAltaCocina) foodSubcat.push('alta_cocina');
        if (wantIntl)       foodSubcat.push('internacional');
        if (wantDesayuno)   foodSubcat.push('desayuno');
        if (wantRestaurantesGeneral) foodSubcat.push('restaurantes');

        const isGenericFood = wantFood && foodSubcat.length === 0;

        // Efficiency: Only fetch direct recommendations if actually needed
        let directRecommendations: any[] = [];
        if (isRecommendationQuery) {
            const detectedTypes = [
                ...foodSubcat,
                ...(wantShopping ? ['compras'] : []),
                ...(wantAct ? ['ocio'] : []),
                ...(wantNature ? ['naturaleza'] : []),
                ...(wantCulture ? ['cultura'] : []),
                ...(wantRelax ? ['relax'] : []),
                ...(wantSuper ? ['supermercados'] : []),
            ];

            const recsQuery = supabase.from('property_recommendations')
                .select('name, type, description, distance, personal_note, price_range')
                .eq('property_id', propertyId);

            if (detectedTypes.length > 0) {
                // Subcategoría específica detectada → filtrar en DB para evitar pérdida de datos por limit
                recsQuery.in('type', detectedTypes).limit(15);
            } else {
                // Query genérica o sin subcat detectada → fetcheamos muestra para ver categorías disponibles
                recsQuery.order('type').limit(50);
            }

            const { data: recs } = await recsQuery;
            directRecommendations = recs || [];
            console.log('[CHAT-DEBUG] Direct recs from DB (SQL filtered):', { 
                count: directRecommendations.length, 
                types: detectedTypes 
            });
        }

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

        // Mutable object populated/read by context blocks
        const recMeta: { isGenericFood: boolean; availableCats: string[] } = {
            isGenericFood,
            availableCats: []
        };

        const formattedContext = [
            // A. Datos Generales
            ...(propertyInfo ? [`[PROPIEDAD]: "${propertyInfo.name}". Ciudad: ${propertyInfo.city}.`] : []),

            // B. Datos Estructurados (Seguridad de WiFi, Acceso, etc.)
            ...(criticalContext || []).map((c: any) => {
                const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;
                let contentString = '';

                if (typeof c.content === 'object' && c.content !== null) {
                    if (c.category === 'access') {
                        contentString = `Dirección: ${c.content.address || ''}. Parking: ${c.content.parking?.info || 'N/A'}. Transp: ${c.content.from_airport?.instructions || 'N/A'}`;
                    } else if (c.category === 'tech') {
                        let techStr = '';
                        if (c.content.wifi_ssid) {
                            techStr += `Red WiFi: \`${c.content.wifi_ssid}\`. Contraseña WiFi: \`${c.content.wifi_password || ''}\`. `;
                        }
                        if (c.content.router_notes) {
                            techStr += `Notas Router: ${c.content.router_notes}. `;
                        }
                        contentString = techStr.trim() || JSON.stringify(c.content);
                    } else {
                        contentString = JSON.stringify(c.content);
                    }
                } else {
                    contentString = String(c.content);
                }

                // Limpiar marcas
                return `[${label}]: ${contentString.replace(brandRegex, '')}`;
            }),

            // C. RECOMENDACIONES DIRECTAS DE LA BASE DE DATOS
            ...(isRecommendationQuery && directRecommendations && directRecommendations.length > 0 ? (() => {
                // Category flags are derived from global intent flags detect above (msg/lastMessage based)
                // Build available food categories from the DB data
                const ALL_FOOD_TYPES = ['restaurantes','italiano','mediterraneo','hamburguesas','asiatico','alta_cocina','internacional','desayuno'];
                const getType = (r: any) => (r.type || r.category || 'general').toLowerCase();
                const allFoodRecs = (directRecommendations as any[]).filter(r => ALL_FOOD_TYPES.includes(getType(r)));

                // Which food categories are actually in DB?
                const foodCatsInDB = Array.from(new Set(allFoodRecs.map(r => getType(r))));
                recMeta.availableCats = foodCatsInDB;

                // ── GENERIC food query → only inject a category menu, NOT the restaurant list ──
                // But only if there are enough categories to warrant a choice (> 2)
                if (recMeta.isGenericFood && foodCatsInDB.length > 2) {
                    const catLabels: Record<string, string> = {
                        'restaurantes': 'Restaurantes', 'italiano': 'Italiana',
                        'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
                        'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina',
                        'internacional': 'Internacional', 'desayuno': 'Desayunos / Cafeterías'
                    };
                    const catSummary = foodCatsInDB.map(c => catLabels[c] || c).join(', ');
                    // Return only the category list — no restaurant names visible to Gemini
                    return [`[CATEGORIAS_DISPONIBLES_COMIDA]: ${catSummary}`];
                }

                if (foodCatsInDB.length <= 2) {
                    recMeta.isGenericFood = false;
                }

                // ── SPECIFIC subcategory or non-food → inject only the relevant recs ──
                let allowedTypes: string[] = [...foodSubcat];
                if (wantShopping)   allowedTypes.push('compras');
                if (wantAct)        allowedTypes.push('ocio');
                if (wantNature)     allowedTypes.push('naturaleza');
                if (wantCulture)    allowedTypes.push('cultura');
                if (wantRelax)      allowedTypes.push('relax');

                const filteredRecs = allowedTypes.length > 0
                    ? (directRecommendations as any[]).filter(r => allowedTypes.includes(getType(r)))
                    : (directRecommendations as any[]);

                if (filteredRecs.length === 0) return [];

                // Group by type
                const grouped: Record<string, any[]> = {};
                for (const r of filteredRecs) {
                    const cat = getType(r);
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(r);
                }

                const catLabelMap: Record<string, string> = {
                    'restaurantes':  'RESTAURANTES_GENERALES',
                    'italiano':      'RESTAURANTES_ITALIANOS',
                    'mediterraneo':  'RESTAURANTES_MEDITERRANEOS',
                    'hamburguesas':  'HAMBURGUESAS_Y_AMERICANO',
                    'asiatico':      'COCINA_ASIATICA',
                    'alta_cocina':   'ALTA_COCINA',
                    'internacional': 'COCINA_INTERNACIONAL',
                    'desayuno':      'CAFETERIAS_Y_DESAYUNOS',
                    'ocio':          'LUGARES_DE_OCIO',
                    'compras':       'TIENDAS_Y_COMPRAS',
                    'naturaleza':    'NATURALEZA_Y_PARQUES',
                    'cultura':       'CULTURA_Y_VISITAS',
                    'relax':         'RELAX_Y_BIENESTAR',
                };

                return Object.entries(grouped).map(([cat, items]) => {
                    const catLabel = catLabelMap[cat] || 'RECOMENDACIONES_LOCALES';
                    const itemLines = items.map((r: any) => {
                        let line = `- **${r.name}**`;
                        if (r.distance)     line += ` (${r.distance})`;
                        if (r.price_range)  line += ` ${r.price_range}`;
                        if (r.description)  line += `: ${r.description.substring(0, 150)}`;
                        if (r.personal_note) line += ` 💬 Nota del anfitrión: "${r.personal_note}"`;
                        return line;
                    }).join('\n');
                    return `[${catLabel}]:\n${itemLines}`;
                });
            })() : []),

            // D. RAG (Manuales Técnicos, FAQs, otras Recomendaciones)
            // If it's a generic food query, we filter out recommendation chunks to let the concierge flow work.
            ...(relevantChunks || [])
                .filter((c: any) => {
                    const sourceType = c.source_type?.toLowerCase() || '';
                    const isRec = sourceType === 'recommendation' || sourceType === 'recommendations';
                    if (recMeta.isGenericFood && isRec) return false;
                    return true;
                })
                .map((c: any) => {
                const isEnriched = c.metadata?.enriched === true;
                const sourceType = c.source_type?.toLowerCase() || '';
                
                let type: string;
                
                // ✅ MEJORADO: Reconocer todos los tipos de contenido
                if (sourceType === 'manual') {
                    type = isEnriched ? 'GUÍA_PERSONALIZADA_ANFITRIÓN' : 'GUÍA_TÉCNICA';
                } else if (sourceType === 'recommendation' || sourceType === 'recommendations') {
                    // Determinar subtipo de recomendación
                    const category = c.metadata?.category || c.metadata?.type || '';
                    type = category === 'ocio' ? 'LUGARES_Y_ACTIVIDADES' : 
                           category === 'dining' ? 'RESTAURANTES_Y_BARES' :
                           'RECOMENDACIONES_LOCALES';
                } else if (sourceType === 'arrival_instructions' || sourceType === 'access') {
                    type = 'INSTRUCCIONES_LLEGADA';
                } else if (sourceType === 'property' || sourceType === 'welcome') {
                    type = 'INFO_APARTAMENTO';
                } else {
                    type = sourceType.toUpperCase();
                }
                
                // ✅ MEJORADO: Log detallado para debugging
                if (isEnriched || sourceType.includes('recommendation')) {
                    console.log('[CHAT-DEBUG] Special chunk included:', {
                        type,
                        sourceType,
                        similarity: c.similarity?.toFixed(3),
                        preview: c.content.substring(0, 100),
                        metadata: c.metadata
                    });
                }
                
                // Limpiar marcas del contenido RAG (incluyendo el tag interno [[RECOMENDACIÓN:...]])
                // Usamos un regex más robusto que ignore acentos y espacios, y limpie incluso si hay variaciones
                const cleanContent = c.content
                    .replace(/\[\[RECOMENDACI[ÓO]N:\s*(.*?)\s*\]\]/gi, '$1') // Extrae el nombre de forma robusta
                    .replace(/\[\[.*?\]\]/g, '') // Elimina cualquier otro tag residual entre corchetes dobles
                    .replace(brandRegex, '');
                
                return `[${type}]: ${cleanContent}`;
            })
        ].join('\n\n\n');

        // ═══════════════════════════════════════════════════════
        // NIVEL 2: Fallback con búsqueda externa (Brave Search)
        // ═══════════════════════════════════════════════════════
        // 🔧 FEATURE FLAG: Cambiar a false para desactivar el fallback
        // C3: Brave Search DISABLED — RAG with manuales should be sufficient.
        // External search can contaminate with instructions for different appliance models.
        const ENABLE_CHAT_GROUNDING_FALLBACK = false;

        let fallbackContext = '';
        const isProblemRelated = /no funciona|no va|no enciende|no arranca|error|problema|roto|aver[íi]a|fallo|no calienta|no enf[rí]a|gotea|vibra|ruido|olor|bloqueo|c[oó]digo|no desagua|no centrifuga/i.test(recentContext);

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

        // C5: LANGUAGE HANDLING section — for multilingual conversation history.
        // Only the last message is translated for RAG; history goes to Gemini as-is.
        const languageHandlingBlock = `
# LANGUAGE HANDLING:
- The conversation history may contain messages in multiple languages (English, French, German, Italian, Portuguese, etc.).
- You MUST understand all of them, but ALWAYS respond in Spanish only.
- Do not acknowledge any language switch. Just process and respond in Spanish.
- Your Spanish response will be automatically translated for the guest by a downstream system.`;

        // MAP FORMAT: instruct Gemini to emit structured markers for physical addresses.
        // The frontend (GuestChat.tsx) parses [[MAP:...]] and renders a tappable map button.
        const mapFormatBlock = `
# FORMATO DE DIRECCIONES:
Cuando menciones una dirección física concreta (calle, hospital, restaurante, etc.), escríbela así:
[[MAP:Dirección completa, Ciudad:Nombre del lugar]]
Ejemplo: [[MAP:Avenida Castillo de Olivares s/n, Torrelodones, Madrid:Hospital HM Torrelodones]]
NUNCA escribas una dirección como texto plano si dispones de ella.
Solo usa este formato cuando tengas la dirección exacta en el CONTEXTO — no inventes direcciones.`;

        // C1: Anti-hallucination closing anchor — placed at end of every system prompt.
        const noInventionAnchor = `
⛔ REGLA FINAL ABSOLUTA:
Si la información solicitada NO está en el CONTEXTO anterior (excepto si estás en medio de un flujo de recomendación según las etiquetas [CATEGORIAS_DISPONIBLES_...], [RESTAURANTES_...], [RECOMENDACIONES_...], [INFO_COMIDA], etc.), responde exactamente:
"No tengo esa información guardada. Contacta con ${supportContact}."
NUNCA completes, asumas, deduzcas ni inventes con conocimiento externo al CONTEXTO.`;

        if (isEmergency) {
            // ⚠️ EMERGENCIA: Respuesta inmediata de seguridad
            systemInstruction = `EMERGENCIA DE SEGURIDAD DETECTADA.
${languageHandlingBlock}
${mapFormatBlock}
${noInventionAnchor}

No añadas nada más. No intentes diagnosticar. Prioridad absoluta: seguridad del huésped.
NUNCA menciones "el manual" ni "la documentación" — el huésped no sabe que existen.

Incluye siempre la dirección del apartamento al final para que el huésped 
pueda dársela a los servicios de emergencia: ${criticalContext?.find((c: any) => c.category === 'access')?.content?.address || propertyInfo?.address || 'la dirección del alojamiento'}`;

        } else if (detectedErrorCode) {
            // 🔧 CÓDIGO DE ERROR: Diagnóstico específico
            systemInstruction = `Eres el asistente del apartamento "${propertyInfo?.name || 'este apartamento'}". El huésped tiene el código de error: ${detectedErrorCode}.
${languageHandlingBlock}
${mapFormatBlock}

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
- Tono natural
- ❌ NUNCA digas "consulta el manual" ni similar.
- 📍 ${currentTimeContext}

# CONTEXTO:
${fullContext}
${noInventionAnchor}`;

        } else {
            // 💬 ESTÁNDAR: Asistente personal del apartamento
            const hasDirectRecs = isRecommendationQuery && (directRecommendations?.length ?? 0) > 0;

            const groundingRules = `
# REGLAS DE INFORMACIÓN:
1. Eres el asistente experto del apartamento. Tu objetivo es SER ÚTIL al huésped.
2. Para preguntas sobre el apartamento, normas, acceso, electrodomésticos: usa solo el CONTEXTO.
3. Para recomendaciones locales: usa los datos del CONTEXTO que incluye la lista completa guardada por el anfitrión.
4. Para preguntas genéricas de viaje o de la zona: puedes responder con conocimiento general + los datos locales del contexto.
5. NO inventes datos específicos del apartamento (códigos wifi, contraseñas, etc.) si no están en el contexto.
6. FORMATO DE WIFI: Siempre que des el nombre de red o la contraseña del WiFi, ponlos OBLIGATORIAMENTE entre comillas invertidas simples (backticks, \`) para que el huésped pueda copiarlos y pegarlos fácilmente. Ejemplo: La red es \`MiRed_5G\` y la contraseña \`12345678\`. ESTO ES CRÍTICO.
7. Responde siempre en Español.

# CONTEXTO:
${fullContext}`;

            // Recommendation guidance: reads from the local recMeta object populated by the IIFE above
            const isGenericFood: boolean = recMeta.isGenericFood;
            const availableCats: string[] = recMeta.availableCats;

            const catLabels: Record<string, string> = {
                'restaurantes': 'Restaurantes generales', 'italiano': 'Italiana',
                'mediterraneo': 'Mediterránea', 'hamburguesas': 'Hamburguesas',
                'asiatico': 'Asiática', 'alta_cocina': 'Alta cocina',
                'internacional': 'Internacional', 'desayuno': 'Desayunos / Cafeterías'
            };
            const availableCatNames = availableCats
                .map(c => catLabels[c] || c)
                .join(', ');

            const recommendationGuidance = isRecommendationQuery ? `

# GUÍA PARA RECOMENDACIONES LOCALES:
${hasDirectRecs ? (
    isGenericFood ? `
- El CONTEXTO tiene recomendaciones de estas CATEGORÍAS disponibles: ${availableCatNames}.
- REGLA CONCIERGE: Como el huésped preguntó de forma genérica ("¿Dónde puedo comer?"), tu siguiente respuesta debe ser UNA SOLA pregunta de cualificación corta y amigable, listando las categorías disponibles.
- ESTA PREGUNTA SE CONSIDERA UNA RESPUESTA VÁLIDA CON DATOS DEL CONTEXTO. Ignora la regla de "No tengo esa información" en este paso.
- EJEMPLO de respuesta esperada: "¡Claro! ¿Tienes alguna preferencia de cocina? Tengo recomendaciones de: **Italiana**, **Mediterránea**, **Hamburguesas** y **Desayunos / Cafeterías**. 😊"
- Muestra MÁXIMO las categorías que REALMENTE existen en el CONTEXTO. No inventes categorías.
- NO listes restaurantes todavía. Espera la respuesta del huésped.` : `
- El CONTEXTO ya incluye las recomendaciones reales del anfitrión bajo las etiquetas [HAMBURGUESAS_Y_AMERICANO], [CAFETERIAS_Y_DESAYUNOS], [RESTAURANTES_ITALIANOS], etc.
- Da 3-5 opciones COPIANDO literalmente los nombres que aparecen tras "**" en esas etiquetas. No reduzcas, no combines ni traduzas los nombres.
- Formato: "**[Nombre exacto del contexto]** ([distancia si existe]) — [descripción breve del contexto]."
- ⛔ PROHIBIDO ABSOLUTO: Inventar un nombre que no aparezca textualmente en una etiqueta del CONTEXTO. Si no encuentras ningún nombre en el CONTEXTO para la categoría pedida, di "No tengo esa información guardada".`
) : `
- Si no hay recomendaciones en el contexto, di amablemente que no tienes lista guardada para la zona y sugiere preguntar a ${supportContact}.`}
- ⛔ Si el nombre que ibas a escribir no aparece LITERALMENTE en el CONTEXTO → no lo escribas. Solo nombres del CONTEXTO.
` : '';


            systemInstruction = `Eres el asistente personal del apartamento "${propertyInfo?.name || 'este apartamento'}".
${languageHandlingBlock}
${mapFormatBlock}
${noInventionAnchor}

# TU FORMA DE SER
- Hablas como un amigo que conoce bien el apartamento.
- Das respuestas PRÁCTICAS y ÚTILES, no técnicas.

${groundingRules}
${recommendationGuidance}

# REGLAS ABSOLUTAS
- ❌ NUNCA menciones modelos técnicos ni "el manual".
- ✅ Tono natural, como WhatsApp.
- 📍 ${currentTimeContext}`;
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
                let eventBuffer = '';
                let accumulatedText = '';
                let mapMarkerBuffer = ''; // Buffer to prevent splitting [[MAP:...]]

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
                                        if (language === 'es') {
                                            // 🇪🇸 Spanish Flow - Implement Map Marker Buffer
                                            if (text.includes('[[') || mapMarkerBuffer) {
                                                mapMarkerBuffer += text;
                                                if (mapMarkerBuffer.includes(']]')) {
                                                    const chunk = `0:${JSON.stringify(mapMarkerBuffer)}\n`;
                                                    controller.enqueue(new TextEncoder().encode(chunk));
                                                    mapMarkerBuffer = '';
                                                }
                                            } else {
                                                const chunk = `0:${JSON.stringify(text)}\n`;
                                                controller.enqueue(new TextEncoder().encode(chunk));
                                            }
                                        } else {
                                            // 🌍 Translation Flow - Avoid splitting markers inside chunks
                                            accumulatedText += text;
                                            
                                            // Check if we are inside a map marker. If so, don't flush yet.
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
                                                            chunkToTranslate,
                                                            'es',
                                                            language,
                                                            { propertyId, context: 'chat' }
                                                        );
                                                        const chunk = `0:${JSON.stringify(translatedChunk + ' ')}\n`;
                                                        controller.enqueue(new TextEncoder().encode(chunk));
                                                    }
                                                    
                                                    accumulatedText = accumulatedText.substring(breakPoint).trimStart();
                                                    boundaryRegex.lastIndex = 0; 
                                                }
                                            }

                                            // Fallback: If a single sentence is too long (> 200 chars), force split
                                            // but ONLY if we are not in the middle of a map marker.
                                            if (accumulatedText.length > 200 && !isInsideMarker) {
                                                const lastSpace = accumulatedText.lastIndexOf(' ', 200);
                                                const breakPoint = lastSpace !== -1 ? lastSpace : 200;
                                                const chunkToTranslate = accumulatedText.substring(0, breakPoint).trim();

                                                const { text: translatedChunk } = await TranslationService.translate(
                                                    chunkToTranslate,
                                                    'es',
                                                    language,
                                                    { propertyId, context: 'chat' }
                                                );
                                                const chunkFmt = `0:${JSON.stringify(translatedChunk + ' ')}\n`;
                                                controller.enqueue(new TextEncoder().encode(chunkFmt));
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

                    // Final flush
                    if (mapMarkerBuffer) {
                        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(mapMarkerBuffer)}\n`));
                    }

                    if (language !== 'es' && accumulatedText.trim()) {
                        const { text: translatedChunk } = await TranslationService.translate(
                            accumulatedText,
                            'es',
                            language,
                            { propertyId, context: 'chat' }
                        );
                        const flushChunk = `0:${JSON.stringify(translatedChunk)}\n`;
                        controller.enqueue(new TextEncoder().encode(flushChunk));
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