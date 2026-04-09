// ─── lib/chat/context-builder.ts ──────────────────────────────────────────────
// Construye el string formattedContext que se inyecta en el system prompt.
// Extraído de app/api/chat/route.ts líneas 515–642.

import { createBrandRegex, createModelNumberRegex, CATEGORY_LABEL_NAMES, CATEGORY_LABEL_MAP } from './constants';
import type { PropertyContext, ChatContextParams } from './types';
import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';
import type { IntentResult } from './types';

const getType = (r: any) => (r.type || r.category || 'general').toLowerCase();

// ─── buildChatContextParams ───────────────────────────────────────────────────

export function buildChatContextParams(
    intent: ClassifiedIntent,
    flags: IntentResult['flags'],
    ctx: PropertyContext
): ChatContextParams {
    const isGenericFoodSearch = intent.intent === 'recommendation_food' && intent.isGenericFood;
    const availableCatNames = ctx.foodCatsInDB.map(c => CATEGORY_LABEL_NAMES[c] || c).join(', ');

    return {
        intent,
        flags,
        isGenericFood: intent.isGenericFood,
        isGenericFoodSearch,
        hasDirectRecs: flags.isRecommendationQuery && ctx.directRecommendations.length > 0,
        usedFallbackRecs: ctx.usedFallbackRecs,
        detectedTypes: ctx.detectedTypes,
        foodCatsInDB: ctx.foodCatsInDB,
        availableCatNames,
    };
}

// ─── Secciones privadas ───────────────────────────────────────────────────────

function buildPropertyLine(propertyInfo: any): string[] {
    if (!propertyInfo) return [];
    return [`[PROPIEDAD]: "${propertyInfo.name}". Ciudad: ${propertyInfo.city}. Planta: ${propertyInfo.floor || 'N/A'}. Capacidad: ${propertyInfo.guests} huéspedes. Habitaciones: ${propertyInfo.beds}. Baños: ${propertyInfo.baths}.`];
}

function buildStructuredContextLines(
    criticalContext: Array<{ category: string; content: any }> | null,
    brandRegex: RegExp,
    modelNumberRegex: RegExp
): string[] {
    return (criticalContext || []).map((c: any) => {
        const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;

        if (c.category === 'contacts' && (
            String(c.content).toLowerCase().includes('hospital') ||
            String(c.content).toLowerCase().includes('clinic')
        )) {
            return `[SOLO_EMERGENCIAS_MEDICAS]: ${String(JSON.stringify(c.content)).replace(brandRegex, '').replace(modelNumberRegex, '')}`;
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

        return `[${label}]: ${contentString.replace(brandRegex, '').replace(modelNumberRegex, '')}`;
    });
}

function buildInventoryLines(
    criticalContext: Array<{ category: string; content: any }> | null
): string[] {
    return (criticalContext?.filter((c: any) => c.category === 'inventory').map((c: any) => {
        const items = Array.isArray(c.content) ? c.content : (c.content?.selected_items || []);
        const presentItems = items
            .filter((i: any) => i.isPresent)
            .map((i: any) => {
                let text = `- ${i.name}`;
                if (i.customContext) text += `: ${i.customContext}`;
                return text;
            }).join('\n');
        return `[INVENTARIO_Y_EQUIPAMIENTO]:\n${presentItems}`;
    }) || []);
}

function buildRecommendationLines(
    ctx: PropertyContext,
    params: ChatContextParams
): string[] {
    if (!params.flags.isRecommendationQuery || ctx.directRecommendations.length === 0) return [];

    const city = ctx.propertyInfo?.city || '';

    if (params.isGenericFoodSearch && ctx.foodCatsInDB.length > 1) {
        const catSummary = ctx.foodCatsInDB.map(c => CATEGORY_LABEL_NAMES[c] || c).join(', ');
        const previewRecs = ctx.directRecommendations.slice(0, 5).map(r =>
            `[${CATEGORY_LABEL_MAP[getType(r)] || 'RECOMENDACION'}]: ${r.name}. ${r.description || ''}${r.personal_note ? ` Nota: ${r.personal_note}` : ''} Dist: ${r.distance || ''}`
        );
        return [`[CATEGORIAS_DISPONIBLES_COMIDA]: ${catSummary}`, ...previewRecs];
    }

    const filteredRecs = params.detectedTypes.length > 0
        ? ctx.directRecommendations.filter(r => params.detectedTypes.includes(getType(r)))
        : ctx.directRecommendations;

    if (filteredRecs.length === 0) return [];

    const grouped: Record<string, any[]> = {};
    for (const r of filteredRecs) {
        const cat = getType(r);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(r);
    }

    return Object.entries(grouped).map(([cat, items]) => {
        const catLabel = CATEGORY_LABEL_MAP[cat] || 'RECOMENDACIONES_LOCALES';
        const itemLines = items.map((r: any) => {
            let namePart: string;
            if (r.google_place_id) {
                // place_id verificado → enlace exacto
                namePart = `[${r.name}](maps_place:${r.google_place_id})`;
            } else {
                // sin place_id → búsqueda nombre + ciudad para acotar geográficamente
                const searchTerm = r.address || (city ? `${r.name}, ${city}` : r.name);
                const q = encodeURIComponent(searchTerm);
                namePart = `[${r.name}](maps:${q})`;
            }
            let line = `- ${namePart}`;
            // Omitir distancia nula o placeholder
            const dist = r.distance;
            if (dist && dist !== 'null' && dist !== 'N/A') line += ` (${dist})`;
            if (r.price_range) line += ` ${r.price_range}`;
            if (r.description) line += `: ${r.description.substring(0, 150)}`;
            if (r.personal_note) line += ` 💬 "${r.personal_note}"`;
            return line;
        }).join('\n');
        return `[${catLabel}]:\n${itemLines}`;
    });
}

function buildRAGChunkLines(
    relevantChunks: any[] | null,
    isGenericFoodSearch: boolean,
    brandRegex: RegExp,
    modelNumberRegex: RegExp
): string[] {
    return (relevantChunks || [])
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
                .replace(brandRegex, '')
                .replace(modelNumberRegex, '');

            return `[${type}]: ${cleanContent}`;
        });
}

// ─── Exportación principal ────────────────────────────────────────────────────

export function buildFormattedContext(
    ctx: PropertyContext,
    params: ChatContextParams
): string {
    // Nuevas instancias por request para evitar bug de lastIndex con flag g
    const brandRegex = createBrandRegex();
    const modelNumberRegex = createModelNumberRegex();

    return [
        ...buildPropertyLine(ctx.propertyInfo),
        ...buildStructuredContextLines(ctx.criticalContext, brandRegex, modelNumberRegex),
        ...buildInventoryLines(ctx.criticalContext),
        ...buildRecommendationLines(ctx, params),
        ...buildRAGChunkLines(ctx.relevantChunks, params.isGenericFoodSearch, brandRegex, modelNumberRegex),
    ].join('\n\n\n');
}
