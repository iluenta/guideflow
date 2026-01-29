// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // 1. Generar embedding de la pregunta
  const questionEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: lastMessage,
  });

  // 2. Búsqueda vectorial en Supabase
  const { data: relevantChunks } = await supabase.rpc('match_manual_chunks', {
    query_embedding: questionEmbedding.data[0].embedding,
    match_threshold: 0.7,
    match_count: 5,
    filter_property_id: propertyId
  });

  // 3. Construir contexto
  const context = relevantChunks
    ?.map((chunk: any) => chunk.content)
    .join('\n\n---\n\n') || 'No hay información disponible.';

  // 4. Llamada a Claude con streaming
  const stream = await anthropic.messages.stream({
    model: "claude-3-haiku-20240307", // Más económico
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Eres un asistente técnico amable para huéspedes de una propiedad vacacional.

CONTEXTO DE LOS MANUALES DISPONIBLES:
${context}

CONVERSACIÓN PREVIA:
${messages.slice(0, -1).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

PREGUNTA DEL HUÉSPED:
${lastMessage}

INSTRUCCIONES:
1. Responde SOLO basándote en el contexto proporcionado
2. Si la información no está en el contexto, di: "No tengo información específica sobre esto en los manuales. Te recomiendo contactar al anfitrión."
3. Sé conciso y práctico
4. Usa pasos numerados para instrucciones
5. Si hay un problema técnico, da soluciones de primer nivel antes de sugerir llamar al anfitrión
6. Tono amable y servicial

RESPUESTA:`
      }
    ]
  });

  // Convertir stream de Anthropic a formato compatible con Vercel AI SDK
  const textStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && 
            chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    }
  });

  return new StreamingTextResponse(textStream);
}