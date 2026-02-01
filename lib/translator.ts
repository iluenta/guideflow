import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Usamos Gemini 1.5 Flash por ser el modelo más económico y eficiente para traducciones
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class Translator {

  /**
   * Traduce un texto único con soporte de caché
   */
  static async translateText(
    text: string,
    targetLang: string,
    sourceLang: string = 'es',
    context?: string
  ): Promise<string> {
    if (!text || targetLang === sourceLang) return text;

    // 1. Buscar en caché
    const cached = await this.getCachedTranslation(text, targetLang, sourceLang);
    if (cached) {
      await this.incrementCacheHits(cached.id);
      return cached.translated_text;
    }

    // 2. Traducir con Gemini 1.5 Flash
    const prompt = `Translate the following text from ${this.getLanguageName(sourceLang)} to ${this.getLanguageName(targetLang)}.

${context ? `CONTEXT: ${context}\n\n` : ''}TEXT TO TRANSLATE:
${text}

INSTRUCTIONS:
- Translate naturally and fluently for a vacation rental guest.
- Maintain a premium and friendly tone.
- DO NOT translate proper names (people's names, brands, house name).
- DO NOT translate physical addresses.
- If you see a WiFi password or network name, keep them exact.
- Respond ONLY with the translation, no explanations.

TRANSLATION:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translation = response.text().trim();

    // 3. Guardar en caché
    await this.cacheTranslation({
      sourceText: text,
      translatedText: translation,
      sourceLang,
      targetLang,
      // Metadata simplificado para Gemini Flash
      translationMethod: 'gemini-1.5-flash'
    });

    return translation;
  }

  private static async getCachedTranslation(text: string, targetLang: string, sourceLang: string) {
    const { data } = await supabase
      .from('translation_cache')
      .select('*')
      .eq('source_text', text)
      .eq('target_language', targetLang)
      .eq('source_language', sourceLang)
      .single();
    return data;
  }

  private static async cacheTranslation(data: any) {
    await supabase
      .from('translation_cache')
      .insert({
        source_type: 'generic_text',
        source_id: crypto.createHash('md5').update(data.sourceText).digest('hex'),
        source_text: data.sourceText,
        translated_text: data.translatedText,
        source_language: data.sourceLang,
        target_language: data.targetLang,
        translation_method: data.translationMethod,
        cost_usd: 0 // Gemini 1.5 Flash tiene un tier gratutito muy generoso
      });
  }

  private static async incrementCacheHits(cacheId: string) {
    await supabase.rpc('increment_cache_hits', { cache_id: cacheId });
  }

  private static getLanguageName(code: string): string {
    const names: Record<string, string> = {
      es: 'Spanish', en: 'English', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ca: 'Catalan', nl: 'Dutch',
      zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian'
    };
    return names[code] || code;
  }
}
