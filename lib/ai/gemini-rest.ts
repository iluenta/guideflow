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

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            console.warn(`[GEMINI-REST] Warning: finishReason is ${candidate.finishReason}`);
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
            // WHITESPACE LOOP PROTECTION
            // If the model gets stuck generating infinite spaces/newlines, we collapse them.
            let cleaned = fullText
                .replace(/[ \t]{4,}/g, '   ') // Collapse 4+ spaces/tabs to 3
                .replace(/\n{4,}/g, '\n\n\n') // Collapse 4+ newlines to 3
                .trim();

            if (cleaned.includes('```')) {
                const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    cleaned = codeBlockMatch[1].trim();
                } else {
                    // Truncated code block? Find the first {
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
                // If parse fails, it might be truncated. Try a basic repair.
                if (candidate.finishReason === 'MAX_TOKENS' || cleaned.length > 2000) {
                    try {
                        console.warn('[GEMINI-REST] Parse failed, attempting truncation repair...');
                        const repaired = repairTruncatedJson(cleaned);
                        return JSON.parse(repaired);
                    } catch (repairError) {
                        console.error('[GEMINI-REST] Repair failed.');
                    }
                }
                console.error('[GEMINI-REST] JSON Parse Error. Raw text prefix:', fullText.substring(0, 500));
                console.error('[GEMINI-REST] Cleaned text attempted:', cleaned);
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
 * Basic repair for truncated JSON strings.
 * Closes unclosed quotes and braces.
 */
function repairTruncatedJson(json: string): string {
    let repaired = json.trim();

    // 1. Handle unclosed quotes
    let unescapedQuotes = 0;
    for (let i = 0; i < repaired.length; i++) {
        if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
            unescapedQuotes++;
        }
    }

    if (unescapedQuotes % 2 !== 0) {
        repaired += '"';
    }

    // 2. Remove trailing commas which make JSON invalid
    repaired = repaired.replace(/,\s*$/, '');

    // 3. Handle unclosed braces/brackets
    const stack: string[] = [];
    for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        if (char === '{' || char === '[') {
            stack.push(char);
        } else if (char === '}') {
            if (stack[stack.length - 1] === '{') stack.pop();
        } else if (char === ']') {
            if (stack[stack.length - 1] === '[') stack.pop();
        }
    }

    // Close in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        else if (last === '[') repaired += ']';
    }

    return repaired;
}
