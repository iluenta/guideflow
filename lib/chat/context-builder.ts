// ─── lib/chat/context-builder.ts ──────────────────────────────────────────────
// Construye el string formattedContext que se inyecta en el system prompt.
// Extraído de app/api/chat/route.ts líneas 515–642.

import { createBrandRegex, createModelNumberRegex, CATEGORY_LABEL_NAMES, CATEGORY_LABEL_MAP } from './constants';
import type { PropertyContext, ChatContextParams } from './types';
import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';
import type { IntentResult } from './types';

const getType = (r: any) => (r.type || r.category || 'general').toLowerCase();

function truncateAtWordBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

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

// Type → context label. Pharmacies and vets are NOT urgency services.
const CONTACT_TYPE_LABEL: Record<string, string> = {
    guardia:      'SERVICIOS_EMERGENCIA',
    policia:      'SERVICIOS_EMERGENCIA',
    bomberos:     'SERVICIOS_EMERGENCIA',
    salud:        'SERVICIOS_MEDICOS',
    farmacia:     'FARMACIAS',
    veterinario:  'SERVICIOS_VETERINARIOS',
    taxi:         'SERVICIOS_TRANSPORTE',
    mantenimiento:'SERVICIOS_MANTENIMIENTO',
};

function formatContact(c: any): string {
    const dist = c.distance && c.distance !== '0 km' ? ` (${c.distance})` : '';
    const phone = c.phone ? ` — ☎ ${c.phone}` : '';
    const placeId = c.google_place_id;
    const isValidId = placeId && placeId.length >= 10 && placeId.length <= 200 && !(/(.{8,})\1{2,}/.test(placeId));
    const link = isValidId ? ` [[MAP_PLACE:${placeId}]]` : '';
    return `- ${c.name}${dist}${phone}${link}`;
}

function buildContactsBlock(content: any, hostName?: string): string {
    const contacts: any[] = content?.emergency_contacts || content?.contacts || [];
    if (!contacts.length) return `[INFO_CONTACTS]: ${JSON.stringify(content)}`;

    // Group by label
    const groups: Record<string, any[]> = {};
    for (const c of contacts) {
        const label = CONTACT_TYPE_LABEL[c.type?.toLowerCase() ?? ''] ?? 'OTROS_CONTACTOS';
        if (!groups[label]) groups[label] = [];
        groups[label].push(c);
    }

    // Also include host/support contact fields.
    // Fallback: si no hay datos de soporte, usa el nombre y teléfono del anfitrión.
    const hostLines: string[] = [];
    const hasSupportInfo = content.support_name || content.support_phone || content.support_mobile;
    if (hasSupportInfo) {
        hostLines.push(`[CONTACTO_ANFITRION]: ${content.support_name || ''} ${content.support_mobile ? '— WhatsApp/móvil: ' + content.support_mobile : ''} ${content.support_phone ? '— Tel: ' + content.support_phone : ''}`.trim());
    } else if (content.host_phone || content.host_mobile) {
        const name = hostName || content.host_name || 'Anfitrión';
        hostLines.push(`[CONTACTO_ANFITRION]: ${name} ${content.host_mobile ? '— WhatsApp/móvil: ' + content.host_mobile : ''} ${content.host_phone ? '— Tel: ' + content.host_phone : ''}`.trim());
    }

    const blocks = Object.entries(groups).map(([label, items]) =>
        `[${label}]:\n${items.map(formatContact).join('\n')}`
    );

    return [...hostLines, ...blocks].join('\n\n');
}

function buildStructuredContextLines(
    criticalContext: Array<{ category: string; content: any }> | null,
    brandRegex: RegExp,
    modelNumberRegex: RegExp
): string[] {
    const welcomeHostName = (criticalContext || []).find((c: any) => c.category === 'welcome')?.content?.host_name;

    return (criticalContext || []).map((c: any) => {
        const label = c.category === 'notes' ? 'NOTAS_ANFITRION' : `INFO_${c.category.toUpperCase()}`;

        if (c.category === 'contacts') {
            return buildContactsBlock(c.content, welcomeHostName);
        }

        let contentString = '';
        if (typeof c.content === 'object' && c.content !== null) {
            if (c.category === 'access') {
                contentString = `Dirección: ${c.content.full_address || c.content.address || ''}. Parking: ${c.content.parking?.info || 'N/A'}. Transp: ${c.content.from_airport?.instructions || 'N/A'}`;
            } else if (c.category === 'tech') {
                let techStr = '';
                if (c.content.wifi_ssid) techStr += `Red WiFi: \`${c.content.wifi_ssid}\`. `;
                if (c.content.wifi_password) techStr += `Contraseña WiFi: \`${c.content.wifi_password}\`. `;
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
    criticalContext: Array<{ category: string; content: any }> | null,
    brandRegex: RegExp,
    modelNumberRegex: RegExp
): string[] {
    return (criticalContext?.filter((c: any) => c.category === 'inventory').map((c: any) => {
        const items = Array.isArray(c.content) ? c.content : (c.content?.selected_items || []);
        const presentItems = items
            .filter((i: any) => i.isPresent)
            .map((i: any) => {
                const name = String(i.name).replace(brandRegex, '').replace(modelNumberRegex, '');
                let text = `- ${name}`;
                if (i.customContext) text += `: ${String(i.customContext).replace(brandRegex, '').replace(modelNumberRegex, '')}`;
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
            const rawPlaceId: string | undefined = r.google_place_id || r.metadata?.google_place_id;
            // Validate: real Google Place IDs are 27–200 chars with no repeated segments
            const isValidPlaceId = rawPlaceId &&
                rawPlaceId.length >= 10 &&
                rawPlaceId.length <= 200 &&
                !/(.{8,})\1{2,}/.test(rawPlaceId);   // reject IDs with 3+ repeated chunks
            const placeId = isValidPlaceId ? rawPlaceId : undefined;
            let namePart: string;
            if (placeId) {
                namePart = `[${r.name}](maps_place:${placeId})`;
            } else {
                const searchTerm = r.address || r.metadata?.address || (city ? `${r.name}, ${city}` : r.name);
                const q = encodeURIComponent(searchTerm);
                namePart = `[${r.name}](maps:${q})`;
            }
            let line = `- ${namePart}`;
            const dist = r.distance;
            if (dist && dist !== 'null' && dist !== 'N/A') line += ` (${dist})`;
            if (r.price_range) line += ` ${r.price_range}`;
            // Use editorial_summary from metadata if no host description
            const desc = r.description || r.metadata?.editorial_summary;
            if (desc) line += `: ${truncateAtWordBoundary(desc, 220)}`;
            // Tags from metadata
            const tags: string[] = r.metadata?.tags || [];
            if (tags.length > 0) line += ` (Características: ${tags.slice(0, 3).join(', ')})`;
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

function buildApplianceManualsBlock(manuals: PropertyContext['applianceManuals']): string[] {
    if (!manuals?.length) return [];
    return manuals.map(m => {
        const parts: string[] = [];
        if (m.notes) parts.push(`INSTRUCCIONES DEL ANFITRIÓN: ${m.notes}`);
        if (m.excerpt) parts.push(m.excerpt);
        return `[MANUAL_APARATO|${m.applianceName}]:\n${parts.join('\n\n')}`;
    });
}

export function buildFormattedContext(
    ctx: PropertyContext,
    params: ChatContextParams
): string {
    // Nuevas instancias por request para evitar bug de lastIndex con flag g
    const brandRegex = createBrandRegex();
    const modelNumberRegex = createModelNumberRegex();

    return [
        // All appliance manuals (notes + excerpt) go FIRST — bypasses RAG ranking issues
        ...buildApplianceManualsBlock(ctx.applianceManuals),
        ...buildPropertyLine(ctx.propertyInfo),
        ...buildStructuredContextLines(ctx.criticalContext, brandRegex, modelNumberRegex),
        ...buildInventoryLines(ctx.criticalContext, brandRegex, modelNumberRegex),
        ...buildRecommendationLines(ctx, params),
        ...buildRAGChunkLines(ctx.relevantChunks, params.isGenericFoodSearch, brandRegex, modelNumberRegex),
    ].join('\n\n\n');
}
