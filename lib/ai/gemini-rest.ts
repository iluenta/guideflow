/**
 * Definitive REST-based Gemini Utility
 * Bypasses the @google/generative-ai SDK to avoid uncatchable "empty output" errors.
 */

export interface GeminiPart {
    text?: string;
    inline_data?: {
        mime_type: string;
        data: string;
    };
}

export interface GeminiResponse {
    candidates?: Array<{
        content: {
            parts: Array<{ text: string }>;
        };
        finishReason?: string;
    }>;
    error?: {
        message: string;
        code: number;
        status: string;
    };
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

const DEFAULT_SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
];

/**
 * Common REST calling function
 */
export async function geminiREST(
    modelName: string,
    input: string | (string | { inlineData: { mimeType: string; data: string } })[],
    options: {
        useGrounding?: boolean;
        temperature?: number;
        responseMimeType?: 'application/json' | 'text/plain';
        maxOutputTokens?: number;
        responseSchema?: any;
    } = {}
) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is missing');

    const parts: any[] = Array.isArray(input)
        ? input.map(p => {
            if (typeof p === 'string') return { text: p };
            if ((p as any).inlineData) {
                return {
                    inline_data: {
                        mime_type: (p as any).inlineData.mimeType,
                        data: (p as any).inlineData.data
                    }
                };
            }
            return p;
        })
        : [{ text: input }];

    const payload: any = {
        contents: [{ role: 'user', parts }],
        generationConfig: {
            temperature: options.temperature ?? 0.1,
            responseMimeType: options.responseMimeType ?? 'application/json',
            maxOutputTokens: options.maxOutputTokens ?? 8192,
            ...(options.responseSchema ? { response_schema: options.responseSchema } : {})
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS
    };

    if (options.useGrounding) {
        payload.tools = [{ google_search: {} }];
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data: GeminiResponse = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'Error desconocido de Gemini API';
            console.error('[GEMINI-REST] API Error:', JSON.stringify(data.error, null, 2));
            throw new Error(errorMsg);
        }

        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
            console.warn('[GEMINI-REST] No valid candidates returned.');
            return { data: null, usage: undefined };
        }

        const fullText = candidate.content.parts
            .map(p => p.text || '')
            .join(' ')
            .trim();

        const effectiveMimeType = options.responseMimeType ?? 'application/json';
        const usageMetrics = data.usageMetadata ? {
            prompt_tokens: data.usageMetadata.promptTokenCount,
            candidates_tokens: data.usageMetadata.candidatesTokenCount,
            total_tokens: data.usageMetadata.totalTokenCount
        } : undefined;

        if (effectiveMimeType === 'application/json') {
            let cleaned = fullText.trim();
            if (cleaned.includes('```')) {
                const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) cleaned = match[1].trim();
            }

            try {
                return { data: JSON.parse(cleaned), usage: usageMetrics };
            } catch (e) {
                return { data: cleaned, usage: usageMetrics, error: 'JSON Parse Error' };
            }
        }

        return { data: fullText, usage: usageMetrics };
    } catch (error: any) {
        console.error('[GEMINI-REST] Error:', error.message);
        return { data: null, usage: undefined, error: error.message };
    }
}

/**
 * Simplified helper for image analysis (Vision)
 */
export async function analyzeImageWithGemini(imageUrl: string, prompt: string) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        const input = [
            { inlineData: { mimeType, data: base64Data } },
            prompt
        ];

        const { data } = await geminiREST('gemini-1.5-flash-latest', prompt, {
            temperature: 0.1,
            responseMimeType: 'application/json'
        });
    } catch (error) {
        console.error('[GEMINI-VISION] Error:', error);
        return { data: null, usage: undefined, error: (error as any).message };
    }
}

/**
 * Streaming REST calling function for Chat
 */
export async function streamGeminiREST(
    modelName: string,
    messages: { role: 'user' | 'model'; content: string }[],
    options: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
    } = {}
) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is missing');

    const payload: any = {
        contents: messages.map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        })),
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
        safetySettings: DEFAULT_SAFETY_SETTINGS
    };

    if (options.systemInstruction) {
        payload.system_instruction = {
            parts: [{ text: options.systemInstruction }]
        };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

    return await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}
