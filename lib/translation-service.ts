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
      const batchPayload = missingIndices.reduce((acc, idx) => { acc[idx] = texts[idx].trim(); return acc; }, {} as Record<number, string>);
      const prompt = `Translate from ${getLangName(sourceLang)} to ${getLangName(targetLang)}. 
      Output JSON with SAME keys. Values MUST be PLAIN STRINGS. NO objects.
      
      CONTEXT: This is for a luxury vacation rental digital guide (concierge). Tone should be helpful and professional.
      
      CRITICAL FOR GALICIAN (gl) AND PORTUGUESE (pt):
      - Ensure the translation is purely the target language, NOT Spanish.
      - DO NOT return the same string if it's Spanish.
      - Even if the strings are identical in some cases, ensure the grammar and specific vocabulary of the target language is used.
      - For Galician: 'Tu Estancia' -> 'A túa estadía', 'Guía de la Casa' -> 'Guía da casa', 'Llegada' -> 'Chegada'.
      - For Portuguese: 'Tu Estancia' -> 'A sua estadia', 'Guía de la Casa' -> 'Guia da Casa', 'Hola' -> 'Olá', 'Bienvenido a casa' -> 'Bem-vindo a casa'.
      
      Payload: ${JSON.stringify(batchPayload)}`;

      const batchModel = TranslationService.genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });
      const result = await batchModel.generateContent(prompt);
      const translatedBatch = JSON.parse(result.response.text());
      console.log(`[TRANSLATION-AI] 🤖 Response for ${targetLang}:`, translatedBatch);
      const dbRecords: any[] = [];

      for (const idx of missingIndices) {
        const cleaned = TranslationService.cleanTranslation(translatedBatch[idx] || translatedBatch[String(idx)]);
        if (cleaned) {
          results[idx] = cleaned;
          const cacheKey = `${propertyId}:${texts[idx].trim()}|${sourceLang}|${targetLang}`;
          TranslationService.saveToMemory(cacheKey, cleaned);
          dbRecords.push({
            property_id: propertyId, hash: hashes[idx], source_text: texts[idx].trim(), source_lang: sourceLang, target_lang: targetLang,
            translated_text: cleaned, translation_time_ms: Math.floor((Date.now() - startTime) / missingIndices.length), source_type: 'ui_batch', translation_method: 'gemini-batch'
          });
        } else { results[idx] = texts[idx]; }
      }
      if (dbRecords.length > 0) TranslationService.saveToDBBulk(supabase, dbRecords);
    } catch (err) {
      console.error('[TRANSLATION] L3 failed:', err);
      for (const idx of missingIndices) { if (!results[idx]) results[idx] = texts[idx]; }
    }

    return { translations: results, totalTimeMs: Date.now() - startTime, cacheHitRate: (results.filter((r, i) => r !== "" && !missingIndices.includes(i)).length / texts.length) * 100 };
  }

  private static async saveToDBBulk(supabase: any, records: any[]) {
    try { await supabase.from('translation_cache').upsert(records, { onConflict: 'hash,property_id' }); } catch (e) { }
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
