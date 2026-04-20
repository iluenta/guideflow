import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_MEMORY_CACHE = 500;
const memoryCache = new Map<string, string>();

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

export class TranslationService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

  private static cleanTranslation(val: any): string {
    if (!val) return "";

    // 1. Objects
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
      const keys = Object.keys(val);
      const lowerKeys = keys.map(k => k.toLowerCase());
      const priorities = ['t', 'translated', 'translation', 'text', 'result', 'o', 'original', 'value'];
      for (const p of priorities) {
        const idx = lowerKeys.indexOf(p);
        if (idx !== -1) return TranslationService.cleanTranslation(val[keys[idx]]);
      }
      const values = Object.values(val);
      if (values.length > 0) return TranslationService.cleanTranslation(values[0]);
      return JSON.stringify(val);
    }

    // 2. Arrays
    if (Array.isArray(val)) return val.length > 0 ? TranslationService.cleanTranslation(val[0]) : "";

    // 3. Strings
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          return TranslationService.cleanTranslation(parsed);
        } catch (e) {
          const match = trimmed.match(/"(?:o|t|translated|translation|text|value)":\s*"([^"]+)"/i);
          if (match) return match[1];
        }
      }
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
      return trimmed;
    }
    return String(val);
  }

  static async translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    options: TranslationOptions
  ) {
    const startTime = Date.now();
    const propertyId = options?.propertyId;
    if (!propertyId) throw new Error('propertyId required');

    const results: string[] = new Array(texts.length).fill("");
    const missingIndices: number[] = [];

    const getLangName = (code: string) => {
      const names: Record<string, string> = { es: 'Spanish', en: 'English', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', ca: 'Catalan', gl: 'Galician', eu: 'Basque', nl: 'Dutch' };
      return names[code] || code;
    };

    const hashes = await Promise.all(
      texts.map(async (t) => {
        const cleanText = t?.trim() || "";
        if (!cleanText || sourceLang === targetLang) return "";
        const cacheKey = `${propertyId}:${cleanText}|${sourceLang}|${targetLang}`;
        return this.generateHash(cacheKey);
      })
    );

    for (let i = 0; i < texts.length; i++) {
      const cleanText = texts[i]?.trim() || "";
      if (!cleanText || sourceLang === targetLang) {
        results[i] = cleanText;
        continue;
      }

      const cacheKey = `${propertyId}:${cleanText}|${sourceLang}|${targetLang}`;
      if (!options?.skipCache && memoryCache.has(cacheKey)) {
        results[i] = TranslationService.cleanTranslation(memoryCache.get(cacheKey)!);
      } else {
        missingIndices.push(i);
      }
    }

    if (missingIndices.length === 0) {
      return { translations: results, totalTimeMs: Date.now() - startTime, cacheHitRate: 100 };
    }

    const supabase = createEdgeAdminClient();

    if (!options?.skipCache) {
      const pendingHashes = missingIndices.map(idx => hashes[idx]);
      try {
        const { data: cachedItems } = await supabase.from('translation_cache').select('hash, translated_text').eq('property_id', propertyId).in('hash', pendingHashes);
        if (cachedItems?.length) {
          const cacheMap = new Map(cachedItems.map((item: any) => [item.hash, item.translated_text]));
          const stillMissing: number[] = [];
          for (const idx of missingIndices) {
            const hash = hashes[idx];
            if (cacheMap.has(hash)) {
              const cleaned = TranslationService.cleanTranslation(cacheMap.get(hash)!);
              results[idx] = cleaned;
              const cacheKey = `${propertyId}:${texts[idx].trim()}|${sourceLang}|${targetLang}`;
              TranslationService.saveToMemory(cacheKey, cleaned);
            } else { stillMissing.push(idx); }
          }
          missingIndices.splice(0, missingIndices.length, ...stillMissing);
        }
      } catch (err) { console.warn('[TRANSLATION] L2 failed:', err); }
    }

    if (missingIndices.length === 0) {
      return { translations: results, totalTimeMs: Date.now() - startTime, cacheHitRate: (results.filter(r => r !== "").length / texts.length) * 100 };
    }

    try {
      // Dense array: always sequential 0,1,2... so Gemini never re-indexes or loses entries.
      // missingIndices[pos] maps each dense position back to the original results slot.
      const denseTexts = missingIndices.map(idx => texts[idx].trim());
      const prompt = `Translate from ${getLangName(sourceLang)} to ${getLangName(targetLang)}.
      Output a JSON ARRAY with exactly ${denseTexts.length} strings, one per input. Values MUST be PLAIN STRINGS. NO objects.

      CONTEXT: This is for a luxury vacation rental digital guide (concierge). Tone should be helpful and professional.

      Input: ${JSON.stringify(denseTexts)}`;

      const batchModel = TranslationService.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      let result: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await batchModel.generateContent(prompt);
          break;
        } catch (err: any) {
          if (err?.status === 429 && attempt < 2) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      const responseText = result.response.text();
      let translatedBatch: any;

      try {
        translatedBatch = JSON.parse(responseText);
      } catch (e) {
        console.error('[TRANSLATION-AI] ❌ Failed to parse Gemini response as JSON:', responseText);
        throw e;
      }

      // Normalise: accept both array and object keyed by position
      const getAt = (pos: number): any => {
        if (Array.isArray(translatedBatch)) return translatedBatch[pos];
        return translatedBatch[pos] !== undefined ? translatedBatch[pos] : translatedBatch[String(pos)];
      };

      const dbRecords: any[] = [];

      for (let pos = 0; pos < missingIndices.length; pos++) {
        const idx = missingIndices[pos];
        const cleaned = TranslationService.cleanTranslation(getAt(pos));

        if (cleaned) {
          results[idx] = cleaned;
          const cacheKey = `${propertyId}:${texts[idx].trim()}|${sourceLang}|${targetLang}`;
          TranslationService.saveToMemory(cacheKey, cleaned);
          dbRecords.push({
            property_id: propertyId,
            hash: hashes[idx],
            source_text: texts[idx].trim(),
            source_lang: sourceLang,
            target_lang: targetLang,
            translated_text: cleaned,
            translation_time_ms: Math.floor((Date.now() - startTime) / missingIndices.length),
            source_type: 'ui_batch',
            translation_method: 'gemini-batch'
          });
        } else {
          console.warn(`[TRANSLATION-AI] ⚠️ Missing or empty result for index ${idx}:`, texts[idx]);
          results[idx] = texts[idx];
        }
      }
      if (dbRecords.length > 0) TranslationService.saveToDBBulk(supabase, dbRecords);
    } catch (err) {
      console.error('[TRANSLATION] L3 failed:', err);
      for (const idx of missingIndices) { if (!results[idx]) results[idx] = texts[idx]; }
    }

    return { translations: results, totalTimeMs: Date.now() - startTime, cacheHitRate: (results.filter((r, i) => r !== "" && !missingIndices.includes(i)).length / texts.length) * 100 };
  }

  private static async saveToDBBulk(supabase: any, records: any[]) {
    try { await supabase.from('translation_cache').upsert(records, { onConflict: 'hash,property_id' }); } catch (e) {
      console.warn('[TRANSLATION] saveToDBBulk failed:', e);
    }
  }

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

  /**
   * DB-cache-only lookup — no Gemini fallback.
   * Returns { originalText: translatedText } for every cache hit.
   * Used by SSR page to enrich initialTranslations without blocking TTFB on cold cache.
   */
  static async fetchCachedBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    propertyId: string
  ): Promise<Record<string, string>> {
    if (sourceLang === targetLang || !texts.length || !propertyId) return {};

    const clean = texts.map(t => t?.trim()).filter(Boolean);
    if (!clean.length) return {};

    const hashMap = new Map<string, string>(); // hash → original text
    await Promise.all(
      clean.map(async (t) => {
        const cacheKey = `${propertyId}:${t}|${sourceLang}|${targetLang}`;
        const hash = await this.generateHash(cacheKey);
        hashMap.set(hash, t);
      })
    );

    try {
      const supabase = createEdgeAdminClient();
      const { data } = await supabase
        .from('translation_cache')
        .select('hash, translated_text')
        .eq('property_id', propertyId)
        .in('hash', [...hashMap.keys()]);

      if (!data?.length) return {};

      const result: Record<string, string> = {};
      for (const row of data) {
        const original = hashMap.get(row.hash);
        if (original && row.translated_text) {
          result[original] = TranslationService.cleanTranslation(row.translated_text);
        }
      }
      return result;
    } catch {
      return {};
    }
  }

  static async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    options: TranslationOptions
  ): Promise<{ text: string; metrics?: TranslationMetrics }> {
    const startTime = Date.now();
    const { translations } = await this.translateBatch([text], sourceLang, targetLang, options);

    return {
      text: translations[0] || text,
      metrics: {
        cacheHit: false,
        translationTimeMs: Date.now() - startTime,
        textLength: text.length
      }
    };
  }
}
