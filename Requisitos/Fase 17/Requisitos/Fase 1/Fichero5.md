// lib/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(manualId: string, content: string) {
  // Dividir en chunks de ~500 caracteres respetando párrafos
  const chunks = splitIntoChunks(content, 500);
  
  const embeddings = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small", // $0.02 / 1M tokens
        input: chunk,
      });
      return {
        content: chunk,
        embedding: response.data[0].embedding
      };
    })
  );
  
  // Insertar en Supabase
  await supabase.from('manual_embeddings').insert(
    embeddings.map(e => ({
      manual_id: manualId,
      content: e.content,
      embedding: e.embedding
    }))
  );
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const paragraphs = text.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}