'use client';

import { useState, useEffect } from 'react';

/**
 * Module-level translation cache.
 * Plain object — fast reads, no overhead.
 */
const translationCache: Record<string, string> = {};

/**
 * Global listener set: called by seedTranslationCache when new translations arrive.
 * Each listener closes over its own cacheKey and updates its component if that key landed.
 * React 18 automatic batching groups all resulting setContent() calls into one commit.
 */
const cacheListeners = new Set<() => void>();

/**
 * FASE 18: Ultra-robust cleaning to strip ANY leaked JSON, objects, or artifacts.
 */
function cleanTranslation(val: any): string {
    if (!val) return "";

    // 1. Handle actual objects
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
        const keys = Object.keys(val);
        const lowerKeys = keys.map(k => k.toLowerCase());
        const priorities = ['t', 'translated', 'translation', 'text', 'result', 'o', 'original', 'value'];
        for (const p of priorities) {
            const idx = lowerKeys.indexOf(p);
            if (idx !== -1) return cleanTranslation(val[keys[idx]]);
        }
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
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return cleanTranslation(parsed);
            } catch (e) {
                const match = trimmed.match(/"(?:o|t|translated|translation|text|value)":\s*"([^"]+)"/i);
                if (match) return match[1];
            }
        }
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            return trimmed.slice(1, -1);
        }
        return trimmed;
    }

    return String(val);
}

/**
 * Silent write — safe to call during render (useMemo).
 * Populates the cache without notifying listeners; child components that mount
 * afterwards will read the warm cache directly via their useState initializer.
 */
export function seedTranslationCacheQuiet(translations: Record<string, string>) {
    Object.entries(translations).forEach(([key, value]) => {
        translationCache[key] = cleanTranslation(value);
    });
}

/**
 * Write + notify — for use inside useEffect only (never during render).
 * Fires all registered listeners so already-mounted components pick up
 * translations that arrived after they first rendered (eager prefetch).
 * React 18 batches all resulting setContent() calls into a single commit.
 */
export function seedTranslationCache(translations: Record<string, string>) {
    seedTranslationCacheQuiet(translations);
    cacheListeners.forEach(listener => listener());
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

    private static BATCH_DELAY = 50;

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
                    contextType: 'ui'
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

    // Initialize from cache synchronously — warm cache (SSR prefetch or prior visit) = no flash at all.
    const [content, setContent] = useState(() =>
        isSpanish ? text : (translationCache[cacheKey] || text)
    );
    const [isTranslating, setIsTranslating] = useState(!isSpanish && !translationCache[cacheKey]);

    // Effect 1: listen for eager-prefetch updates that arrive AFTER this component mounts.
    // Stable deps — never re-runs unless cacheKey or language changes.
    useEffect(() => {
        if (isSpanish) return;

        const checkCache = () => {
            const cached = translationCache[cacheKey];
            if (cached) {
                setContent(cached);
                setIsTranslating(false);
            }
        };

        // Check immediately in case the prefetch completed between render and this effect.
        checkCache();

        cacheListeners.add(checkCache);
        return () => { cacheListeners.delete(checkCache); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, isSpanish]);

    // Effect 2: on-demand translation when still a cache miss after Effect 1 ran.
    // Stable deps — no cascade re-runs when cache is populated.
    useEffect(() => {
        if (isSpanish || translationCache[cacheKey]) return;
        if (!accessToken && !propertyId) return;

        let cancelled = false;
        setIsTranslating(true);

        TranslationManager.request(text, language, propertyId!, accessToken, contextType)
            .then(translated => {
                if (!cancelled) {
                    setContent(translated);
                    setIsTranslating(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setContent(text);
                    setIsTranslating(false);
                }
            });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, language, contextType, accessToken, propertyId]);

    return { content, isTranslating };
}
