import OpenAI from 'openai';

function getOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('[OPENAI] Missing OPENAI_API_KEY');
    }
    return new OpenAI({ apiKey });
}

export async function generateOpenAIEmbedding(text: string) {
    try {
        const openai = getOpenAI();
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
            dimensions: 1536
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('[OPENAI] Embedding generation error:', error);
        throw error;
    }
}

export function splitIntoChunks(text: string, maxLength: number = 800): string[] {
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        if ((currentChunk + para).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = para;
        } else {
            currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}
