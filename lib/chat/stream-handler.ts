// ─── lib/chat/stream-handler.ts ───────────────────────────────────────────────
// Construye mensajes Gemini, llama a la API en streaming, traduce y registra analytics.
// Extraído de app/api/chat/route.ts líneas 802–979.

import { streamGeminiREST } from '@/lib/ai/clients/gemini-rest';
import type { ClassifiedIntent } from '@/lib/ai/services/intent-classifier';

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/edge').createEdgeAdminClient>;

// ─── Formateador de mensajes para Gemini ─────────────────────────────────────

export function buildGeminiMessages(
    messages: Array<{ role: string; content: string }>,
    language: string,
    ragQuery: string
): Array<{ role: 'user' | 'model'; content: string }> {
    return messages.map((m: any, index: number) => {
        if (language !== 'es' && index === messages.length - 1 && m.role === 'user') {
            return { role: 'user' as const, content: ragQuery };
        }
        return { role: m.role === 'user' ? 'user' as const : 'model' as const, content: m.content };
    });
}

// ─── Analytics (privado, no bloquea el stream) ───────────────────────────────

async function logChatSession(params: {
    supabase: SupabaseClient;
    propertyId: string;
    tenantId: string | null;
    guestSessionId: string;
    messages: Array<{ role: string; content: string }>;
    lastMessage: string;
    language: string;
    intent: ClassifiedIntent;
    relevantChunks: any[] | null;
    supportContact: string;
    globalAccumulatedText: string;
}): Promise<void> {
    const {
        supabase, propertyId, tenantId, guestSessionId, messages,
        lastMessage, language, intent, relevantChunks, supportContact, globalAccumulatedText,
    } = params;

    try {
        const newMessages = [
            ...messages,
            { role: 'assistant', content: globalAccumulatedText, timestamp: new Date().toISOString() },
        ];

        const isUnanswered = (relevantChunks?.length === 0 || !relevantChunks) &&
            (globalAccumulatedText.includes(supportContact) || globalAccumulatedText.includes('contacta con'));

        if (isUnanswered) {
            await supabase.rpc('increment_unanswered_question', {
                p_property_id: propertyId,
                p_tenant_id: tenantId,
                p_question: lastMessage,
                p_intent: intent.intent,
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
            language,
            message_count: newMessages.length,
            session_duration_seconds: duration,
            intent_summary: newIntents,
            unanswered_count: (existingChat?.unanswered_count || 0) + (isUnanswered ? 1 : 0),
        };

        if (existingChat) {
            await supabase.from('guest_chats').update(updateData).eq('id', existingChat.id);
        } else {
            await supabase.from('guest_chats').insert({
                ...updateData,
                property_id: propertyId,
                tenant_id: tenantId,
                guest_session_id: guestSessionId,
            });
        }
    } catch (err: any) {
        console.error('[CHAT-V2 LOG] Failed to log chat:', err.message);
    }
}

// ─── Exportación principal ────────────────────────────────────────────────────

export async function createChatStream(
    systemInstruction: string,
    geminiMessages: Array<{ role: 'user' | 'model'; content: string }>,
    language: string,
    propertyId: string,
    guestSessionId: string,
    intent: ClassifiedIntent,
    relevantChunks: any[] | null,
    supportContact: string,
    tenantId: string | null,
    supabase: SupabaseClient,
    messages: Array<{ role: string; content: string }>,
    lastMessage: string
): Promise<Response> {
    const geminiResponse = await streamGeminiREST('gemini-2.0-flash', geminiMessages, {
        systemInstruction,
        temperature: 0.1,
    });

    if (!geminiResponse.ok) {
        const error = await geminiResponse.json();
        throw new Error(error.error?.message || 'Error en Gemini API');
    }

    const stream = new ReadableStream({
        async start(controller) {
            const reader = geminiResponse.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let eventBuffer = '';
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
                                    // AI responde directamente en el idioma del huésped — stream directo
                                    if (text.includes('[[') || mapMarkerBuffer) {
                                        mapMarkerBuffer += text;
                                        if (mapMarkerBuffer.includes(']]')) {
                                            controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(mapMarkerBuffer)}\n`));
                                            mapMarkerBuffer = '';
                                        }
                                    } else {
                                        controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(text)}\n`));
                                    }
                                }
                            } catch (e) { /* ignorar líneas SSE parciales */ }
                        }
                    }
                }

                // Flush final
                if (mapMarkerBuffer) {
                    controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(mapMarkerBuffer)}\n`));
                }

                // Analytics: no bloquea el cierre del stream
                if (propertyId && guestSessionId && globalAccumulatedText.length > 0) {
                    logChatSession({
                        supabase, propertyId, tenantId, guestSessionId,
                        messages, lastMessage, language, intent,
                        relevantChunks, supportContact, globalAccumulatedText,
                    });
                }

            } catch (e) {
                console.error('[CHAT-V2] Streaming error:', e);
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1',
        },
    });
}
