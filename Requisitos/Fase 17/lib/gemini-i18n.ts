import { TranslationService } from "./translation-service";

export class Translator {
  /**
   * FASE 17: Refactored to use TranslationService for unified caching and multi-tenancy.
   */
  static async translateText(
    text: string,
    targetLang: string,
    sourceLang: string = 'es',
    context?: string,
    propertyId?: string // Added for multi-tenancy
  ): Promise<string> {
    if (!text || targetLang === sourceLang) return text;

    if (!propertyId) {
       console.warn('[TRANSLATOR] Warning: No propertyId provided, checking context for ID');
       // Try to extract propertyId if it's passed in context string (common pattern in this app)
       const idMatch = context?.match(/property_id:([a-f0-9-]{36})/);
       propertyId = idMatch ? idMatch[1] : undefined;
    }

    if (!propertyId) {
      console.error('[TRANSLATOR] CRITICAL: No propertyId for translation. Isolation failed.');
      return text; // Fallback to original text if no tenant id
    }

    const { text: translated } = await TranslationService.translate(
      text,
      sourceLang,
      targetLang,
      { 
        propertyId, 
        context: 'ui' 
      }
    );

    return translated;
  }

  // Legacy methods kept but emptied to avoid breaking potential internal links or if I missed a call
  // They will be removed once I'm 100% sure.
  private static async getCachedTranslation() { return null; }
  private static async cacheTranslation() { }
  private static async generateId() { return ""; }
  private static async incrementCacheHits() { }

  private static getLanguageName(code: string): string {
    const names: Record<string, string> = {
      es: 'Spanish', en: 'English', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ca: 'Catalan', nl: 'Dutch',
      zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian'
    };
    return names[code] || code;
  }
}
