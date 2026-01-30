import { StreamingTextResponse } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { generateOpenAIEmbedding } from '@/lib/ai/openai';
import { streamGeminiREST } from '@/lib/ai/gemini-rest';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { messages, propertyId } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        // 1. Generar embedding de la pregunta
        const questionEmbedding = await generateOpenAIEmbedding(lastMessage);

        // 2. Búsqueda vectorial UNIFICADA
        const { data: relevantChunks, error: rpcError } = await supabase.rpc('match_all_context', {
            query_embedding: questionEmbedding,
            match_threshold: 0.4,
            match_count: 10,
            p_property_id: propertyId
        });

        if (rpcError) console.error('[RPC ERROR]', rpcError);

        // 3. Obtener contexto estructurado
        const { data: propertyContext } = await supabase
            .from('property_context')
            .select('category, content')
            .eq('property_id', propertyId);

        // 4. Formatear contexto
        const formattedContext = [
            ... (relevantChunks || []).map((c: any) => `[${c.source_type.toUpperCase()}]: ${c.content}`),
            ... (propertyContext || []).map((c: any) => `[SISTEMA - ${c.category.toUpperCase()}]: ${JSON.stringify(c.content)}`)
        ].join('\n\n---\n\n');

        const systemInstruction = `Eres el Asistente Digital de esta propiedad. Tu objetivo es ayudar al huésped con dudas sobre su estancia.
Responde basándote EXCLUSIVAMENTE en el CONTEXTO proporcionado abajo.
El contexto incluye información sobre: ACCESO, NORMAS, TECNOLOGÍA (WiFi/TV), MANTENIMIENTO, OCIO y SERVICIOS.

REGLAS CRÍTICAS:
1. Si la información no está en el contexto, indica amablemente que no tienes ese detalle y que debe contactar al anfitrión.
2. NUNCA inventes datos (redes wifi, códigos, precios) si no aparecen en el contexto.
3. Sé cálido, profesional y conciso.
4. Responde en el mismo idioma que el huésped.
5. No digas que eres una IA o un modelo de lenguaje.

REGLAS DE FORMATO:
- Usa Markdown para mejorar la legibilidad.
- Usa **negritas** para pasos críticos, códigos de red o nombres de aparatos.
- Usa listas con viñetas para instrucciones paso a paso.
- Usa tablas SOLO para comparativas simples (máx 3 columnas cortas).
- ESTRATEGIA MÓVIL: Si la información es compleja, tiene más de 3 columnas o descripciones largas, usa **Listas con Viñetas** en lugar de tablas para mejorar la legibilidad en pantallas estrechas.
- IMPORTANTE PARA TABLAS: Asegura un salto de línea antes y después de cada tabla. Usa el formato GFM estándar (\`| Col | Col |\` seguido de \`| --- | --- |\`).
- Mantén los párrafos cortos y con espacio entre ellos.

CONTEXTO:
${formattedContext}`;

        // 5. Gemini Call (Streaming)
        const geminiMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            content: m.content
        }));

        const response = await streamGeminiREST('gemini-3-flash-preview', geminiMessages, {
            systemInstruction,
            temperature: 0.2
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
                let buffer = '';

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.substring(6));
                                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (text) {
                                        controller.enqueue(new TextEncoder().encode(text));
                                    }
                                } catch (e) {
                                    // Ignore partial or non-json data lines
                                }
                            }
                        }
                    }
                } catch (e) {
                    controller.error(e);
                } finally {
                    controller.close();
                }
            }
        });

        return new StreamingTextResponse(stream);
    } catch (error: any) {
        console.error('[CHAT ERROR]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
