import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache Configuration
const MAX_MEMORY_CACHE = 500;
const memoryCache = new Map<string, string>();

// Types
export interface TranslationOptions {
  propertyId?: string;
  context?: 'chat' | 'rag_query' | 'ui';
  skipCache?: boolean;
}

export interface TranslationMetrics {
  cacheHit: boolean;
  translationTimeMs: number;
  textLength: number;
  cacheLevel?: 'memory' | 'database' | 'none';
}

/**
 * Phase 15: Specialized Translation Service with Multi-Level Caching
 */
export class TranslationService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  private static model = TranslationService.genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "You are a professional direct translator. You only output the direct translation of the provided text. Never provide explanations, multiple options, alternatives, or any content other than the translated string itself."
  });

  /**
   * Main translation method with L1/L2/L3 strategy
   * FASE 17: propertyId is now REQUIRED for multi-tenancy security.
   */
  static async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options: TranslationOptions // Now required to contain propertyId
  ): Promise<{ text: string; metrics: TranslationMetrics }> {
    const startTime = Date.now();
    const propertyId = options?.propertyId;

    if (!propertyId) {
      console.error('[TRANSLATION] CRITICAL SECURITY ERROR: Missing propertyId for translation');
      throw new Error('Multi-tenancy violation: propertyId is required');
    }
    
    // 0. Cleanup and Bypass
    const cleanText = text?.replace(/\r\n/g, '\n').trim() || "";
    const textLength = cleanText.length;

    if (!cleanText || sourceLang === targetLang) {
      return {
        text: cleanText,
        metrics: { cacheHit: true, translationTimeMs: Date.now() - startTime, textLength, cacheLevel: 'memory' }
      };
    }

    // Stable Cache Key (FASE 17: Include propertyId to isolate L1 memory cache)
    const cacheKey = `${propertyId}:${cleanText}|${sourceLang}|${targetLang}`;
    const hash = await this.generateHash(cacheKey);

    // 1. L1: Memory Cache
    if (!options?.skipCache && memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      return {
        text: cached,
        metrics: { cacheHit: true, translationTimeMs: Date.now() - startTime, textLength, cacheLevel: 'memory' }
      };
    }

    const supabase = createEdgeAdminClient();

    // 2. L2: Supabase Cache (Isolated by property_id)
    if (!options?.skipCache) {
      try {
        const { data: cached, error } = await supabase
          .from('translation_cache')
          .select('translated_text')
          .eq('hash', hash)
          .eq('property_id', propertyId)
          .maybeSingle();

        if (error) {
          console.error('[TRANSLATION] L2 lookup error:', {
            errorMessage: error.message,
            errorCode: error.code,
            hashPreview: hash.substring(0, 8),
            propertyId
          });
        }

        if (cached && !error) {
          const translationTimeMs = Date.now() - startTime;
          console.log(`[TRANSLATION] 💾 L2 Cache HIT | Prop: ${propertyId.substring(0,8)} | hash: ${hash.substring(0,8)}...`);

          // Update usage asynchronously
          this.updateCacheUsage(supabase, hash, propertyId);

          // Save to L1
          this.saveToMemory(cacheKey, cached.translated_text);

          return {
            text: cached.translated_text,
            metrics: { cacheHit: true, translationTimeMs, textLength, cacheLevel: 'database' }
          };
        } else if (!error) {
           console.log(`[TRANSLATION] L2 NOT FOUND | hash: ${hash.substring(0, 8)}... | property: ${propertyId}`);
        }
      } catch (err) {
        console.warn('[TRANSLATION] L2 lookup exception:', err);
      }
    }

    // 3. L3: Gemini API (Cache MISS)
    console.log(`[TRANSLATION] ❌ Cache MISS | Prop: ${propertyId.substring(0,8)} | hash: ${hash.substring(0,8)}...`);
    
    try {
      const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
      Return ONLY the translated text. Do NOT include any explanations, alternatives, or preamble.
      Context: ${options?.context || 'general vacation rental assistance'}.
      
      Text to translate: ${cleanText}`;

      const result = await this.model.generateContent(prompt);
      const translatedText = result.response.text().trim();
      const translationTimeMs = Date.now() - startTime;

      console.log(`[TRANSLATION] ✅ Translated in ${translationTimeMs}ms`);

      // Avoid blocking the main response
      await Promise.allSettled([
        this.saveToDB(supabase, {
          property_id: propertyId, // CRITICAL: Save with propertyId
          hash,
          source_text: cleanText,
          source_lang: sourceLang,
          target_lang: targetLang,
          translated_text: translatedText,
          translation_time_ms: translationTimeMs,
          source_type: options?.context === 'rag_query' ? 'rag_query' : 'chat_text',
          translation_method: 'gemini-api',
          cost_usd: 0
        }),
        this.logMetrics(supabase, {
          cacheHit: false,
          translationTimeMs,
          textLength,
          cacheLevel: 'none'
        }, sourceLang, targetLang, options)
      ]);
      
      this.saveToMemory(cacheKey, translatedText);

      return {
        text: translatedText,
        metrics: { cacheHit: false, translationTimeMs, textLength, cacheLevel: 'none' }
      };

    } catch (err) {
      console.error('[TRANSLATION] L3/Gemini failed:', err);
      return {
        text: cleanText,
        metrics: { cacheHit: false, translationTimeMs: Date.now() - startTime, textLength, cacheLevel: 'none' }
      };
    }
  }

  /**
   * Batch translation
   */
  static async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    options: TranslationOptions // Now required
  ) {
    const startTime = Date.now();
    const results = await Promise.all(
      texts.map(t => this.translate(t, sourceLang, targetLang, options))
    );

    const hitRate = (results.filter(r => r.metrics.cacheHit).length / texts.length) * 100;

    return {
      translations: results.map(r => r.text),
      totalTimeMs: Date.now() - startTime,
      cacheHitRate: hitRate
    };
  }

  // --- PRIVATE HELPERS ---

  private static async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static saveToMemory(key: string, value: string) {
    if (memoryCache.size >= MAX_MEMORY_CACHE) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(key, value);
  }

  private static async saveToDB(supabase: any, data: any) {
    try {
      // FASE 17: Upsert on composite key (hash, property_id)
      const { error } = await supabase.from('translation_cache').upsert(data, { onConflict: 'hash,property_id' });
      if (error) console.error('[TRANSLATION] Save error:', error.message);
    } catch (e) {
      console.error('[TRANSLATION] Save exception:', e);
    }
  }

  private static async updateCacheUsage(supabase: any, hash: string, propertyId: string) {
    try {
      // FASE 17: Track usage by both hash and property
      await supabase.rpc('increment_translation_usage', { 
        p_hash: hash,
        p_property_id: propertyId
      });
    } catch (e) {
      // Sliently fail usage tracking
    }
  }

  private static async logMetrics(
    supabase: any,
    metrics: TranslationMetrics,
    sourceLang: string,
    targetLang: string,
    options?: TranslationOptions
  ) {
    try {
      await supabase.from('translation_metrics').insert({
        property_id: options?.propertyId,
        source_lang: sourceLang,
        target_lang: targetLang,
        cache_hit: metrics.cacheHit,
        translation_time_ms: metrics.translationTimeMs,
        text_length: metrics.textLength
      });
    } catch (e) {
      // Sliently fail metrics
    }
  }
}
