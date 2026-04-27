import { createServerAdminClient } from '@/lib/supabase/server-admin';

// Tarifas en USD por 1M tokens (Gemini 2.5 Flash sin thinking)
const RATES: Record<string, { input: number; output: number }> = {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.0-flash': { input: 0.075, output: 0.30 },
    'gpt-4o-mini':      { input: 0.15,  output: 0.60 },
    'gpt-4o':           { input: 5.00,  output: 15.00 },
};

export type AiOperation =
    | 'chat'
    | 'intent'
    | 'manual_vision'
    | 'fill_context'
    | 'arrival'
    | 'geocoding_validation'
    | 'manual_enrichment'
    | 'ingestion'
    | 'translation'
    | 'dining'
    | 'tech_info'
    | 'faqs'
    | 'contacts';

interface UsagePayload {
    operation: AiOperation;
    model: string;
    usage: { prompt_tokens?: number; candidates_tokens?: number; total_tokens?: number } | undefined;
    durationMs?: number;
    propertyId?: string | null;
    tenantId?: string | null;
    isError?: boolean;
}

function estimateCost(model: string, promptTokens: number, outputTokens: number): number {
    const rate = RATES[model] ?? RATES['gemini-2.5-flash'];
    return (promptTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

export async function logAiUsage(payload: UsagePayload): Promise<void> {
    try {
        const promptTokens  = payload.usage?.prompt_tokens ?? 0;
        const outputTokens  = payload.usage?.candidates_tokens ?? 0;
        const totalTokens   = payload.usage?.total_tokens ?? (promptTokens + outputTokens);
        const costUsd       = estimateCost(payload.model, promptTokens, outputTokens);

        const supabase = createServerAdminClient();
        await supabase.from('ai_usage_log').insert({
            operation:    payload.operation,
            model:        payload.model,
            tokens_prompt:  promptTokens || null,
            tokens_output:  outputTokens || null,
            tokens_total:   totalTokens  || null,
            cost_usd:       costUsd > 0 ? costUsd : null,
            duration_ms:    payload.durationMs ?? null,
            property_id:    payload.propertyId ?? null,
            tenant_id:      payload.tenantId   ?? null,
            is_error:       payload.isError ?? false,
        });
    } catch (err) {
        // Non-blocking — never crash the main flow for a log failure
        console.warn('[AI-USAGE-LOG] Failed to log:', (err as any)?.message);
    }
}
