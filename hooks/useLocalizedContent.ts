'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to handle on-demand translation of content blocks.
 */
const translationCache: Record<string, string> = {};

/**
 * FASE 18: Ultra-robust cleaning to strip ANY leaked JSON, objects, or artifacts.
 */
function cleanTranslation(val: any): string {
    if (!val) return "";

    // 1. Handle actual objects
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        // Check for any key that looks like a translation result (case-insensitive)
        const keys = Object.keys(val);
        const lowerKeys = keys.map(k => k.toLowerCase());

        // Priority sequence for candidates
        const priorities = ['t', 'translated', 'translation', 'text', 'result', 'o', 'original', 'value'];
        for (const p of priorities) {
            const idx = lowerKeys.indexOf(p);
            if (idx !== -1) return cleanTranslation(val[keys[idx]]);
        }

        // Final fallback: just take the first value if it's a string
        const values = Object.values(val);
        if (values.length > 0) return cleanTranslation(values[0]);

        return JSON.stringify(val);
    }

    // 2. Handle arrays
    if (Array.isArray(val)) {
        return val.length > 0 ? cleanTranslation(val[0]) : "";
    }

    // 3. Handle strings (might be stringified JSON)
    if (typeof val === 'string') {
        const trimmed = val.trim();

        // Recursive JSON cleaning
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return cleanTranslation(parsed);
            } catch (e) {
                // Not valid JSON, try regex extraction
                const match = trimmed.match(/"(?:o|t|translated|translation|text|value)":\s*"([^"]+)"/i);
                if (match) return match[1];
            }
        }

        // Quote stripping
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }

        return trimmed;
    }

    return String(val);
}

/**
 * Seeds the cache with pre-translated content from the server.
 */
export function seedTranslationCache(translations: Record<string, string>) {
    Object.entries(translations).forEach(([key, value]) => {
        translationCache[key] = cleanTranslation(value);
    });
}

// Group for batching
interface BatchQueueItem {
    text: string;
    resolvers: ((val: string) => void)[];
}

class TranslationManager {
    private static batchGroups: Map<string, {
        queue: Map<string, BatchQueueItem>;
        timer: NodeJS.Timeout | null;
    }> = new Map();

    private static BATCH_DELAY = 50; // Faster batching

    static async request(
        text: string,
        language: string,
        propertyId: string,
        accessToken?: string,
        contextType: string = 'ui'
    ): Promise<string> {
        const cacheKey = `${language}:${text}:${propertyId || 'global'}`;
        const groupKey = `${language}:${propertyId || 'global'}:${accessToken || 'none'}`;

        return new Promise((resolve) => {
            if (!this.batchGroups.has(groupKey)) {
                this.batchGroups.set(groupKey, { queue: new Map(), timer: null });
            }

            const group = this.batchGroups.get(groupKey)!;

            if (group.queue.has(cacheKey)) {
                group.queue.get(cacheKey)!.resolvers.push(resolve);
            } else {
                group.queue.set(cacheKey, { text, resolvers: [resolve] });
            }

            if (!group.timer) {
                group.timer = setTimeout(() => this.processGroup(groupKey), this.BATCH_DELAY);
            }
        });
    }

    private static async processGroup(groupKey: string) {
        const group = this.batchGroups.get(groupKey);
        if (!group) return;

        const currentQueue = new Map(group.queue);
        group.queue.clear();
        group.timer = null;

        const entries = Array.from(currentQueue.entries());
        if (entries.length === 0) return;

        const [language, propertyId, accessToken] = groupKey.split(':');
        const textsToTranslate = entries.map(([_, item]) => item.text);

        try {
            const response = await fetch('/api/translate-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: textsToTranslate,
                    targetLanguage: language,
                    propertyId: propertyId === 'global' ? undefined : propertyId,
                    accessToken: accessToken === 'none' ? undefined : accessToken,
                    contextType: 'ui' // Default to ui for batches
                })
            });

            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const data = await response.json();
            const translations = data.translations || [];

            entries.forEach(([cacheKey, item], index) => {
                const rawTranslated = translations[index];
                const translated = cleanTranslation(rawTranslated);

                if (translated) {
                    translationCache[cacheKey] = translated;
                    item.resolvers.forEach(resolve => resolve(translated));
                } else {
                    item.resolvers.forEach(resolve => resolve(item.text));
                }
            });
        } catch (err) {
            console.error('[TranslationManager] Fatal Error:', err);
            entries.forEach(([_, item]) => {
                item.resolvers.forEach(resolve => resolve(item.text));
            });
        }
    }
}

export function useLocalizedContent(
    text: string,
    language: string,
    contextType: string = 'general',
    accessToken?: string,
    propertyId?: string
) {
    const isSpanish = !text || language === 'es';

    const cacheKey = `${language}:${text}:${propertyId || 'global'}`;
    const cachedValue = translationCache[cacheKey];

    const initialState = isSpanish ? text : (cachedValue || text);
    const [content, setContent] = useState(initialState);
    const [isTranslating, setIsTranslating] = useState(!isSpanish && !cachedValue);

    useEffect(() => {
        if (isSpanish) {
            setContent(text);
            return;
        }

        if (cachedValue) {
            setContent(cachedValue);
            return;
        }

        const translate = async () => {
            if (!accessToken && !propertyId) return;

            setIsTranslating(true);
            try {
                const translated = await TranslationManager.request(
                    text,
                    language,
                    propertyId!,
                    accessToken,
                    contextType
                );
                setContent(translated);
            } catch (error) {
                console.error('[useLocalizedContent] Error:', error);
                setContent(text);
            } finally {
                setIsTranslating(false);
            }
        };

        translate();
    }, [text, language, contextType, accessToken, propertyId, cachedValue, isSpanish, cacheKey]);

    return { content, isTranslating };
}
