'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to handle on-demand translation of content blocks.
 */
// Simple global cache to avoid redundant requests for the same string/lang in the same session
const translationCache: Record<string, string> = {};

export function useLocalizedContent(
    text: string, 
    language: string, 
    contextType: string = 'general', 
    accessToken?: string,
    propertyId?: string // FASE 17: Added propertyId for multi-tenancy
) {
    const isSpanish = !text || language === 'es';
    
    // Check global cache first
    const cacheKey = `${language}:${text}:${propertyId || 'global'}`;
    const cachedValue = translationCache[cacheKey];

    // If translation is needed and not cached, we start with an empty string to avoid "language popping"
    const initialState = isSpanish ? text : (cachedValue || '');
    const [content, setContent] = useState(initialState);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (isSpanish) {
            setContent(text);
            return;
        }

        // If we have a cached value, use it immediately
        if (cachedValue) {
            setContent(cachedValue);
            return;
        }

        const translate = async () => {
            // Guard: If we don't have a propertyId and no accessToken, we can't authorize the translation
            // This avoids 401 errors during initial render/state settle
            if (!accessToken && !propertyId) {
                console.warn('[useLocalizedContent] Skipping translation: missing propertyId and accessToken');
                return;
            }

            setIsTranslating(true);
            try {
                const response = await fetch('/api/translate-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        targetLanguage: language,
                        contextType,
                        accessToken,
                        propertyId // FASE 17: Passing propertyId
                    })
                });

                if (response.status === 429) {
                    console.warn('[useLocalizedContent] Rate limited (429), falling back to original text');
                    setContent(text);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`[useLocalizedContent] API Error ${response.status}:`, errorData);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.translatedText) {
                    translationCache[cacheKey] = data.translatedText;
                    setContent(data.translatedText);
                } else {
                    setContent(text);
                }
            } catch (error) {
                console.error('[useLocalizedContent] Translation error, falling back:', error);
                setContent(text);
            } finally {
                setIsTranslating(false);
            }
        };

        translate();
    }, [text, language, contextType, accessToken, propertyId, cachedValue, isSpanish, cacheKey]);

    return { content, isTranslating };
}
