// ─── lib/chat/types.ts ────────────────────────────────────────────────────────
// Interfaces compartidas entre los módulos lib/chat/*.
// Sin lógica, solo contratos de datos.

import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';

export interface ValidatedRequest {
    propertyId: string;
    propertyTier: 'standard' | 'premium' | 'enterprise';
    tenantId: string | null;
    messages: Array<{ role: string; content: string }>;
    lastMessage: string;
    language: string;
    guestSessionId: string;
    accessToken: string | undefined;
    ip: string;
}

export interface PropertyContext {
    propertyInfo: any | null;
    propertyBranding: any | null;
    criticalContext: Array<{ category: string; content: any }> | null;
    directRecommendations: any[];
    relevantChunks: any[] | null;
    supportContact: string;
    usedFallbackRecs: boolean;
    detectedTypes: string[];
    foodCatsInDB: string[];
}

export interface IntentFlags {
    isRecommendationQuery: boolean;
    isApplianceQuery: boolean;
    isApplianceUsageQuery: boolean;
    isApplianceTaskQuery: boolean;
    isApplianceProblem: boolean;
    isArrivalTransportQuery: boolean;
    isManualRequest: boolean;
    isEmergency: boolean;
    detectedErrorCode: string | null;
    detectedTask: string | null;
}

export interface IntentResult {
    intent: ClassifiedIntent;
    ragQuery: string;
    flags: IntentFlags;
}

export interface ChatContextParams {
    intent: ClassifiedIntent;
    flags: IntentFlags;
    isGenericFood: boolean;
    isGenericFoodSearch: boolean;
    hasDirectRecs: boolean;
    usedFallbackRecs: boolean;
    detectedTypes: string[];
    foodCatsInDB: string[];
    availableCatNames: string;
}
