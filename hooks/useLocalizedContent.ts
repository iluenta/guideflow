'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to handle on-demand translation of content blocks.
 */
export function useLocalizedContent(text: string, language: string, contextType: string = 'general') {
    const [content, setContent] = useState(text);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (!text || language === 'es') {
            setContent(text);
            return;
        }

        const translate = async () => {
            setIsTranslating(true);
            try {
                const response = await fetch('/api/translate-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        targetLanguage: language,
                        contextType
                    })
                });

                const data = await response.json();
                if (data.translatedText) {
                    setContent(data.translatedText);
                }
            } catch (error) {
                console.error('[useLocalizedContent] Translation error:', error);
            } finally {
                setIsTranslating(false);
            }
        };

        translate();
    }, [text, language, contextType]);

    return { content, isTranslating };
}
