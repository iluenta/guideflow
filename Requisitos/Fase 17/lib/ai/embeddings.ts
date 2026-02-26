import { generateOpenAIEmbedding } from './openai';

/**
 * Generates an embedding for the given text using text-embedding-3-small (Delegates to new openai utility)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    return generateOpenAIEmbedding(text);
}
