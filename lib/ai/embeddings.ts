import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates an embedding for the given text using text-embedding-3-small
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is not defined. Skipping embedding generation.');
        return [];
    }

    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' '), // Preprocessing text is recommended
        });

        return response.data[0].embedding;
    } catch (error: any) {
        console.error('Error generating embedding:', error.message);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
}
