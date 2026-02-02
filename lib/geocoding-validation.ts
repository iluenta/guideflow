'use server'

import { geminiREST } from './ai/gemini-rest';
import { GeocodingResult } from './geocoding';

export interface ValidationResult {
    isValid: boolean;
    confidence: number;
    warnings: string[];
    suggestions?: string[];
}

export async function validateLocation(
    location: GeocodingResult,
    originalAddress: string
): Promise<ValidationResult> {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 1. Basic confidence check
    if (location.confidence < 0.5) {
        warnings.push('Baja confianza en la ubicación detectada');
        suggestions.push('Verifica que la dirección esté completa y sea correcta');
    }

    // 2. Accuracy level check
    if (location.accuracy === 'city' || location.accuracy === 'region') {
        warnings.push('La ubicación es muy general (nivel ciudad/región)');
        suggestions.push('Intenta añadir el número de calle o portal');
    }

    // 3. AI Semantic Validation using Gemini
    try {
        const aiValidation = await validateWithAI(location, originalAddress);
        if (!aiValidation.is_valid) {
            warnings.push(...(aiValidation.warnings || []));
            if (aiValidation.explanation) {
                warnings.push(aiValidation.explanation);
            }
        }
    } catch (error) {
        console.error('AI Geocoding validation failed:', error);
        // Don't block the user if AI fails, just log it
    }

    return {
        isValid: warnings.length === 0,
        confidence: location.confidence,
        warnings,
        suggestions: suggestions.length > 0 ? suggestions : undefined
    };
}

async function validateWithAI(
    location: GeocodingResult,
    originalAddress: string
): Promise<{ is_valid: boolean; warnings: string[]; explanation: string }> {
    const prompt = `Analiza si este resultado de geocodificación es coherente con la dirección proporcionada por el usuario.
    
DIRECCIÓN ORIGINAL DEL USUARIO: "${originalAddress}"

RESULTADO DEL SISTEMA (GEOCODING):
- Dirección Formateada: "${location.formattedAddress}"
- Ciudad: "${location.city}"
- País: "${location.country}"
- Fuente: "${location.source}"
- Precisión: "${location.accuracy}" (rooftop es la mejor, city es pobre)

¿Es el resultado coherente? Por ejemplo, si el usuario dice Madrid y el sistema devuelve Barcelona, es incoherente. Si el usuario da una calle y el sistema solo encuentra la ciudad, marca warnings.

RESPONDE SOLO EN JSON:
{
  "is_valid": boolean,
  "warnings": ["lista de advertencias cortas"],
  "explanation": "explicación muy breve en español"
}`;

    const { data } = await geminiREST('gemini-1.5-flash', prompt, {
        temperature: 0.1,
        responseMimeType: 'application/json'
    });

    if (!data) {
        return { is_valid: true, warnings: [], explanation: '' };
    }

    return data;
}
