'use server'

import type { ExtractedExpenseData } from '@/types/expenses'

const EMPTY_RESULT: ExtractedExpenseData = {
  total_amount: null,
  amount_without_vat: null,
  vat_amount: null,
  vat_pct: null,
  expense_date: null,
  provider_name: null,
  invoice_number: null,
  description: null,
  confidence: 'low',
}

const PROMPT = `Analiza este ticket o factura y extrae la información.
Responde SOLO con un objeto JSON válido, sin texto adicional, sin markdown.

Formato exacto:
{
  "total_amount": number o null,
  "amount_without_vat": number o null,
  "vat_amount": number o null,
  "vat_pct": 0, 4, 10 o 21 (o null si no se puede determinar),
  "expense_date": "YYYY-MM-DD" o null,
  "provider_name": string o null,
  "invoice_number": string o null,
  "description": string o null,
  "confidence": "high", "medium" o "low"
}

Instrucciones:
- Si ves IVA desglosado, extrae amount_without_vat y vat_amount por separado
- Si solo ves el total, pon total_amount y deja los otros en null
- Para expense_date, busca la fecha de emisión del documento en formato YYYY-MM-DD
- Para description, un resumen breve del concepto principal (máximo 60 caracteres)
- Para provider_name, el nombre de la empresa emisora de la factura
- Para invoice_number, el número de factura o referencia
- confidence: "high" si extraes 4+ campos con certeza, "medium" si 2-3, "low" si menos`

export async function extractExpenseFromImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif' | 'application/pdf'
): Promise<ExtractedExpenseData> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('[OCR] GOOGLE_AI_API_KEY no configurada')
    return EMPTY_RESULT
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[OCR] Gemini error:', response.status, errText)
      return EMPTY_RESULT
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('[OCR] Respuesta vacía de Gemini:', JSON.stringify(data))
      return EMPTY_RESULT
    }

    // Limpiar markdown fences si los hay
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    // Extraer el JSON: buscar desde el primer { hasta el último }
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start === -1 || end === -1 || end < start) {
      console.error('[OCR] No se encontró JSON en la respuesta:', clean.slice(0, 200))
      return EMPTY_RESULT
    }

    const parsed = JSON.parse(clean.slice(start, end + 1)) as ExtractedExpenseData

    // Normalizar vat_pct a valores permitidos
    const validVat = [0, 4, 10, 21]
    if (parsed.vat_pct !== null && !validVat.includes(parsed.vat_pct as number)) {
      parsed.vat_pct = null
    }

    // Normalizar confidence
    if (!['high', 'medium', 'low'].includes(parsed.confidence as string)) {
      parsed.confidence = 'medium'
    }

    return parsed
  } catch (e) {
    console.error('[OCR] Error inesperado:', e)
    return EMPTY_RESULT
  }
}
