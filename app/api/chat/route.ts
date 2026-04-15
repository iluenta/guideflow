// ─── app/api/chat/route.ts ──────────────────────────────────────────────────
// Orquestador del chat de huéspedes. Lógica modularizada en lib/chat/*.

import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { validateChatRequest } from '@/lib/chat/security';
import { classifyAndRoute, getShortCircuitResponse } from '@/lib/chat/intent-router';
import { fetchPropertyContext } from '@/lib/chat/context-fetcher';
import { buildChatContextParams, buildFormattedContext } from '@/lib/chat/context-builder';
import { buildSystemInstruction } from '@/lib/chat/prompt-builder';
import { buildGeminiMessages, createChatStream } from '@/lib/chat/stream-handler';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    let supabase;
    try {
        supabase = createEdgeAdminClient();
    } catch (err: any) {
        console.error('[CHAT] Initialization Error:', err.message);
        return new Response(JSON.stringify({
            error: 'Database initialization failed. Check environment variables.',
            details: err.message,
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // 1. Seguridad + validación
        const validationResult = await validateChatRequest(req, supabase);
        if ('error' in validationResult) return validationResult.error;

        const {
            propertyId, propertyTier, tenantId,
            messages, lastMessage, language, guestSessionId,
        } = validationResult.validated;

        // 2. Intent + expansión RAG + short-circuits
        const recentContext = messages.slice(-10).map((m: any) => m.content).join(' ');
        const { intent, ragQuery, flags } = await classifyAndRoute(lastMessage, recentContext, language, propertyId);

        const shortCircuit = await getShortCircuitResponse(intent, language, propertyId);
        if (shortCircuit) return shortCircuit;

        // 3. Fetch contexto (embedding + queries DB)
        const propertyContext = await fetchPropertyContext(supabase, propertyId, ragQuery, intent, flags);

        // 4. Construir contexto formateado + params
        const params = buildChatContextParams(intent, flags, propertyContext);
        const formattedContext = buildFormattedContext(propertyContext, params);

        // 5. Construir system instruction
        const systemInstruction = buildSystemInstruction(propertyContext, params, formattedContext, language);

        // 6. Mensajes Gemini + stream
        const geminiMessages = buildGeminiMessages(messages, language, ragQuery);

        return createChatStream(
            systemInstruction,
            geminiMessages,
            language,
            propertyId,
            guestSessionId,
            intent,
            propertyContext.relevantChunks,
            propertyContext.supportContact,
            tenantId,
            supabase,
            messages,
            lastMessage,
        );

    } catch (error: any) {
        console.error('[CHAT ERROR]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
