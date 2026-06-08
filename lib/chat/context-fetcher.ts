// ─── lib/chat/context-fetcher.ts ──────────────────────────────────────────────
// Todas las queries a Supabase + embedding para construir PropertyContext.
// Extraído de app/api/chat/route.ts líneas 380–482.

import { generateOpenAIEmbedding } from '@/lib/ai/clients/openai';
import { logger } from '@/lib/logger';
import { ALL_FOOD_TYPES } from './constants';
import type { PropertyContext, IntentResult } from './types';
import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/edge').createEdgeAdminClient>;

// ─── Fetch all appliance manuals (excerpt + optional host notes) ──────────────

async function fetchApplianceManuals(
    supabase: SupabaseClient,
    propertyId: string,
): Promise<PropertyContext['applianceManuals']> {
    const { data } = await supabase
        .from('property_manuals')
        .select('appliance_name, manual_content, metadata')
        .eq('property_id', propertyId)

    if (!data) return []

    return data
        .filter((row: any) => row.manual_content?.trim())
        .map((row: any) => ({
            applianceName: row.appliance_name as string,
            notes: (row.metadata?.notes as string | undefined)?.trim() ?? '',
            excerpt: row.manual_content as string,   // full content — no truncation
        }))
}

// ─── Umbrales dinámicos por intent ───────────────────────────────────────────

function getMatchParams(flags: IntentResult['flags']): { threshold: number; count: number } {
    if (flags.detectedErrorCode)       return { threshold: 0.30, count: 30 };
    if (flags.isRecommendationQuery)   return { threshold: 0.30, count: 15 };
    if (flags.isApplianceTaskQuery)    return { threshold: 0.28, count: 10 };
    if (flags.isApplianceUsageQuery)   return { threshold: 0.28, count: 10 };
    if (flags.isApplianceProblem)      return { threshold: 0.28, count: 25 }; // igual que el original: necesita contexto amplio para diagnóstico
    if (flags.isApplianceQuery)        return { threshold: 0.28, count: 10 };
    if (flags.isManualRequest)         return { threshold: 0.28, count: 0 };
    return { threshold: 0.28, count: 25 };
}

// ─── Derivación de tipos detectados para la query de recomendaciones ─────────

function buildDetectedTypes(intent: ClassifiedIntent): string[] {
    let foodSubcatFromIntent: string[] = [];

    if (intent.intent === 'recommendation_food') {
        const isGenericFoodSearch = intent.isGenericFood;
        if (isGenericFoodSearch || !intent.foodSubtype || intent.foodSubtype === 'general') {
            foodSubcatFromIntent = [...ALL_FOOD_TYPES] as string[];
        } else {
            const relatedMap: Record<string, string[]> = {
                'cafe': ['cafe', 'desayuno'],
                'desayuno': ['desayuno', 'cafe'],
                'tapas': ['tapas', 'taberna', 'tapas_bar', 'bar_restaurante'],
                'restaurante': ['restaurante', 'restaurant', 'food', 'comida'],
                'asiatico': ['asiatico', 'asiático', 'asian', 'chino', 'japones', 'japonés', 'thai', 'sushi'],
                'italiano': ['italiano', 'italiana', 'italian'],
                'mediterraneo': ['mediterraneo', 'mediterráneo', 'mediterranean'],
                'hamburguesas': ['hamburguesas', 'hamburguesa', 'burger'],
                'alta_cocina': ['alta_cocina', 'alta cocina', 'gourmet', 'fine_dining'],
                'internacional': ['internacional', 'international', 'fusion', 'fusión'],
            };
            foodSubcatFromIntent = relatedMap[intent.foodSubtype] || [intent.foodSubtype];
        }
    }

    const activityTypes = intent.intent === 'recommendation_activity'
        ? ['ocio', 'naturaleza', 'cultura', 'relax', 'activity']
        : [];
    const shoppingTypes = intent.intent === 'recommendation_shopping'
        ? ['compras', 'supermercados', 'shop', 'service']
        : [];

    return [...foodSubcatFromIntent, ...activityTypes, ...shoppingTypes];
}

// ─── Exportación principal ────────────────────────────────────────────────────

export async function fetchPropertyContext(
    supabase: SupabaseClient,
    propertyId: string,
    ragQuery: string,
    intent: ClassifiedIntent,
    flags: IntentResult['flags']
): Promise<PropertyContext> {
    const { threshold: matchThreshold, count: matchCount } = getMatchParams(flags);

    // Embedding + RPC en paralelo con las queries estructuradas
    const questionEmbedding = await generateOpenAIEmbedding(ragQuery);

    const [
        ragResult,
        { data: propertyInfo },
        { data: propertyBranding },
        { data: criticalContext },
        manualsWithNotes,
    ] = await Promise.all([
        supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
            p_property_id: propertyId,
        }),
        supabase.from('properties').select('*').eq('id', propertyId).single(),
        supabase.from('property_branding').select('*').eq('property_id', propertyId).single(),
        supabase.from('property_context')
            .select('category, content')
            .eq('property_id', propertyId)
            .in('category', ['tech', 'rules', 'access', 'contacts', 'notes', 'inventory', 'welcome', 'checkin']),
        fetchApplianceManuals(supabase, propertyId),
    ]);

    if (ragResult.error) console.error('[CHAT-V2 RPC ERROR]', ragResult.error);
    logger.debug('[CHAT-V2] RAG results processed');

    // ── Recomendaciones directas ──────────────────────────────────────────────
    const detectedTypes = buildDetectedTypes(intent);
    const isGenericFoodSearch = intent.intent === 'recommendation_food' && intent.isGenericFood;

    // Also trigger recommendation loading when food/local keywords appear in the query,
    // even if the intent classifier fell back to 'standard' (e.g. follow-up turns like
    // "dame las hamburguesas de nuevo" or "otra vez las pizzerías").
    // Keyword → food category mapping (mirrors APPLIANCE_HINTS but for food)
    const FOOD_KEYWORD_CATEGORY: Array<{ keywords: string[]; types: string[] }> = [
        { keywords: ['hamburgu', 'burger', 'hamburguesería'], types: ['hamburguesas', 'hamburguesa', 'burger'] },
        { keywords: ['pizza', 'pizzer', 'italiano', 'italiana'], types: ['italiano', 'italiana', 'italian'] },
        { keywords: ['asiátic', 'asiatico', 'sushi', 'japonés', 'japones', 'chino'], types: ['asiatico', 'asiático'] },
        { keywords: ['mediterr', 'paella', 'marisco'], types: ['mediterraneo', 'mediterráneo'] },
        { keywords: ['tapas', 'pintxos', 'pinchos', 'taberna'], types: ['tapas', 'taberna', 'tapas_bar'] },
        { keywords: ['desayun', 'brunch', 'cafeter'], types: ['desayuno', 'cafe'] },
        { keywords: ['supermercado', 'mercadona', 'lidl', 'compra'], types: ['supermercados'] },
        { keywords: ['farmacia', 'medicamento', 'pastilla'], types: ['farmacia'] },
    ];
    const FOOD_TRIGGER_WORDS = [
        'restauran', 'comer', 'cenar', 'sitio', 'lugar', 'recomendaci',
        'donde', 'dónde', 'local', 'chiringuito', 'bar ',
        // all category keywords too
        ...FOOD_KEYWORD_CATEGORY.flatMap(c => c.keywords),
    ];
    const queryLower = ragQuery.toLowerCase();
    const hasFoodKeyword = FOOD_TRIGGER_WORDS.some(w => queryLower.includes(w));

    // Detect specific food category and set detectedTypes so context is filtered correctly
    if (hasFoodKeyword && detectedTypes.length === 0) {
        for (const cat of FOOD_KEYWORD_CATEGORY) {
            if (cat.keywords.some(kw => queryLower.includes(kw))) {
                detectedTypes.push(...cat.types);
                break;
            }
        }
    }

    // Promote flag so context-builder includes the recommendation blocks
    if (hasFoodKeyword && !flags.isRecommendationQuery) {
        flags.isRecommendationQuery = true;
    }
    const shouldLoadRecs = flags.isRecommendationQuery || hasFoodKeyword;

    let directRecommendations: any[] = [];
    let usedFallbackRecs = false;

    if (shouldLoadRecs) {
        const recsQuery = supabase
            .from('property_recommendations')
            .select('name, type, description, distance, personal_note, price_range, google_place_id, address, metadata')
            .eq('property_id', propertyId);

        if (detectedTypes.length > 0) {
            recsQuery.in('type', detectedTypes).limit(50);
        } else {
            // Generic food query: fetch all recommendations so every category appears
            // in the qualification question. 50 was too low — alphabetical order cut off
            // "italiano", "hamburguesas", "mediterráneo", "tapas" when property has 150+ recs.
            recsQuery.order('type').limit(300);
        }

        const { data: recs } = await recsQuery;
        directRecommendations = recs || [];

        // Fallback: si no hay resultados para el subtipo específico, mostrar todos los tipos de comida
        if (directRecommendations.length === 0 && intent.intent === 'recommendation_food' && !isGenericFoodSearch) {
            const { data: fallbackRecs } = await supabase
                .from('property_recommendations')
                .select('name, type, description, distance, personal_note, price_range, google_place_id, address, metadata')
                .eq('property_id', propertyId)
                .in('type', [...ALL_FOOD_TYPES])
                .limit(20);
            directRecommendations = fallbackRecs || [];
            usedFallbackRecs = directRecommendations.length > 0;
        }

        logger.debug('[CHAT-V2] Direct recs from DB processed');
    }

    // ── Support contact ───────────────────────────────────────────────────────
    const contactsData = criticalContext?.find((c: any) => c.category === 'contacts')?.content;
    let supportContact = 'el personal de soporte';
    if (contactsData) {
        const name = contactsData.support_name || 'Soporte';
        const mobile = contactsData.support_mobile || contactsData.host_mobile || '';
        const phone = contactsData.support_phone || contactsData.host_phone || '';
        const parts: string[] = [];
        if (name) parts.push(name);
        if (mobile) parts.push(`WhatsApp/móvil: ${mobile}`);
        if (phone && phone !== mobile) parts.push(`Tel: ${phone}`);
        if (parts.length > 1) {
            supportContact = parts.join(' · ');
        } else if (mobile || phone) {
            supportContact = `${name}: ${mobile || phone}`;
        }
    }

    // ── foodCatsInDB: categorías de comida presentes en las recomendaciones ──
    const getType = (r: any) => (r.type || r.category || 'general').toLowerCase();
    const allFoodSet = new Set(ALL_FOOD_TYPES as readonly string[]);
    const foodCatsInDB = Array.from(
        new Set(directRecommendations.filter(r => allFoodSet.has(getType(r))).map(r => getType(r)))
    );

    return {
        propertyInfo,
        propertyBranding,
        criticalContext: criticalContext ?? null,
        directRecommendations,
        relevantChunks: ragResult.data ?? null,
        supportContact,
        usedFallbackRecs,
        detectedTypes,
        foodCatsInDB,
        applianceManuals: manualsWithNotes ?? [],
    };
}
