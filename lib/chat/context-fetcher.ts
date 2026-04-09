// ─── lib/chat/context-fetcher.ts ──────────────────────────────────────────────
// Todas las queries a Supabase + embedding para construir PropertyContext.
// Extraído de app/api/chat/route.ts líneas 380–482.

import { generateOpenAIEmbedding } from '@/lib/ai/clients/openai';
import { logger } from '@/lib/logger';
import { ALL_FOOD_TYPES } from './constants';
import type { PropertyContext, IntentResult } from './types';
import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/edge').createEdgeAdminClient>;

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
    ]);

    if (ragResult.error) console.error('[CHAT-V2 RPC ERROR]', ragResult.error);
    logger.debug('[CHAT-V2] RAG results processed');

    // ── Recomendaciones directas ──────────────────────────────────────────────
    const detectedTypes = buildDetectedTypes(intent);
    const isGenericFoodSearch = intent.intent === 'recommendation_food' && intent.isGenericFood;

    let directRecommendations: any[] = [];
    let usedFallbackRecs = false;

    if (flags.isRecommendationQuery) {
        const recsQuery = supabase
            .from('property_recommendations')
            .select('name, type, description, distance, personal_note, price_range, google_place_id, address')
            .eq('property_id', propertyId);

        if (detectedTypes.length > 0) {
            recsQuery.in('type', detectedTypes).limit(15);
        } else {
            recsQuery.order('type').limit(50);
        }

        const { data: recs } = await recsQuery;
        directRecommendations = recs || [];

        // Fallback: si no hay resultados para el subtipo específico, mostrar todos los tipos de comida
        if (directRecommendations.length === 0 && intent.intent === 'recommendation_food' && !isGenericFoodSearch) {
            const { data: fallbackRecs } = await supabase
                .from('property_recommendations')
                .select('name, type, description, distance, personal_note, price_range, google_place_id, address')
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
    };
}
