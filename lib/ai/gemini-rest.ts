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

    // Normalize parts to REST format
    const parts: any[] = Array.isArray(input)
        ? input.map(p => {
            if (typeof p === 'string') return { text: p };
            if (p.inlineData) {
                return {
                    inline_data: {
                        mime_type: p.inlineData.mimeType,
                        data: p.inlineData.data
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
            console.warn('[GEMINI-REST] No valid candidates or parts candidates returned. Full data:', JSON.stringify(data, null, 2));
            return null;
        }

        const fullText = candidate.content.parts
            .map(p => p.text || '')
            .join(' ')
            .trim();

        if (!fullText) {
            console.warn('[GEMINI-REST] Combined parts text is empty.');
            return null;
        }

        const effectiveMimeType = options.responseMimeType ?? 'application/json';

        if (effectiveMimeType === 'application/json') {
            let cleaned = fullText
                .replace(/[ \t]{4,}/g, '   ')
                .replace(/\n{4,}/g, '\n\n\n')
                .trim();

            if (cleaned.includes('```')) {
                const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    cleaned = codeBlockMatch[1].trim();
                } else {
                    const firstBrace = cleaned.indexOf('{');
                    if (firstBrace !== -1) cleaned = cleaned.substring(firstBrace);
                }
            } else if (!cleaned.startsWith('{')) {
                const firstBrace = cleaned.indexOf('{');
                if (firstBrace !== -1) cleaned = cleaned.substring(firstBrace);
            }

            try {
                return JSON.parse(cleaned);
            } catch (e) {
                if (candidate.finishReason === 'MAX_TOKENS' || cleaned.length > 2000) {
                    try {
                        const repaired = repairTruncatedJson(cleaned);
                        return JSON.parse(repaired);
                    } catch (repairError) {
                        console.error('[GEMINI-REST] Repair failed.');
                    }
                }
                console.error('[GEMINI-REST] JSON Parse Error');
                return null;
            }
        }

        return fullText;
    } catch (error: any) {
        console.error('[GEMINI-REST] Fetch Exception:', error.message);
        return null;
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

function repairTruncatedJson(json: string): string {
    let repaired = json.trim();
    let unescapedQuotes = 0;
    for (let i = 0; i < repaired.length; i++) {
        if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
            unescapedQuotes++;
        }
    }
    if (unescapedQuotes % 2 !== 0) repaired += '"';
    repaired = repaired.replace(/,\s*$/, '');
    const stack: string[] = [];
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '{' || char === '[') stack.push(char);
        else if (char === '}') { if (stack[stack.length - 1] === '{') stack.pop(); }
        else if (char === ']') { if (stack[stack.length - 1] === '[') stack.pop(); }
    }
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        else if (last === '[') repaired += ']';
    }
    return repaired;
}
