import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_AI_API_KEY,
});

export async function analyzeImageWithClaude(imageUrl: string, prompt: string) {
    try {
        console.log(`[CLAUDE] Fetching image from: ${imageUrl}`);
        const response = await fetch(imageUrl);

        if (!response.ok) {
            console.error(`[CLAUDE] Failed to fetch image. Status: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        console.log(`[CLAUDE] Image fetched. Size: ${buffer.byteLength} bytes. Content-Type: ${response.headers.get('content-type')}`);

        const base64Image = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: contentType as any,
                            data: base64Image,
                        },
                    },
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }]
        });

        const content = message.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return null;
    } catch (error) {
        console.error('[CLAUDE] Image analysis error:', error);
        throw error;
    }
}

export async function generateContentWithClaude(prompt: string, model: 'claude-sonnet-4-5' | 'claude-haiku-4-5' = 'claude-sonnet-4-5') {
    try {
        const message = await anthropic.messages.create({
            model: model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });

        const content = message.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return null;
    } catch (error) {
        console.error('[CLAUDE] Generation error:', error);
        throw error;
    }
}
