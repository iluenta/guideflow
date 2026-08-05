'use server'

import type { ExtractedGuestDocumentData, SesSex } from '@/types/checkin'

const EMPTY_RESULT: ExtractedGuestDocumentData = {
  first_name: null,
  first_surname: null,
  second_surname: null,
  document_type: null,
  document_number: null,
  document_support_number: null,
  birth_date: null,
  nationality: null,
  sex: null,
  confidence: 'low',
}

// Gemini es bueno transcribiendo texto monoespaciado línea a línea, pero poco fiable
// haciendo aritmética de posiciones sobre esa transcripción (contar "el carácter 16")
// mientras también intenta leer píxeles borrosos — ahí es donde se confundía el número
// de soporte con el número de DNI real, o la fecha de nacimiento con la de caducidad.
// Por eso le pedimos SOLO transcripción literal de la MRZ (mrz_lines) y el recorte por
// posición de cada campo lo hacemos aquí en código, que no se equivoca contando.
const PROMPT = `Analiza esta foto de un documento de identidad (DNI español, NIE o pasaporte) y extrae los datos del titular.
Responde SOLO con un objeto JSON válido, sin texto adicional, sin markdown.

Formato exacto:
{
  "first_name": string o null,
  "first_surname": string o null,
  "second_surname": string o null,
  "document_type": "NIF", "NIE", "PAS" u "OTRO", o null,
  "document_number": string o null,
  "document_support_number": string o null,
  "birth_date": "YYYY-MM-DD" o null,
  "nationality": string o null,
  "sex": "H", "M" u "O", o null,
  "mrz_lines": array de strings o null,
  "confidence": "high", "medium" o "low"
}

Instrucciones:
- mrz_lines: si el documento tiene zona MRZ (las líneas con caracteres "<" en la parte inferior del pasaporte o en el reverso del DNI/NIE), transcribe cada línea TAL CUAL aparece, carácter por carácter, incluyendo TODOS los "<" de relleno hasta el final de cada línea. NO la interpretes ni separes en campos, es una transcripción literal. Un array de 3 strings para DNI/NIE (formato TD1, 30 caracteres por línea) o de 2 strings para pasaporte (formato TD3, 44 caracteres por línea). Si no hay MRZ visible, deja null.
- document_type, document_number, document_support_number, birth_date, nationality, sex: rellénalos igualmente a partir del texto impreso visible (no de la MRZ) como respaldo, por si la MRZ no se pudiera leer bien — estos valores se descartan si mrz_lines permite calcularlos con precisión.
- document_type: "NIF" para DNI español, "NIE" para tarjeta de extranjero española, "PAS" para pasaporte de cualquier país, "OTRO" si no se reconoce el tipo.
- nationality: código de país en formato ISO 3166-1 alfa-3 (ejemplo: ESP, FRA, GBR, USA).
- birth_date en formato YYYY-MM-DD.
- confidence: "high" si extraes 6+ campos con certeza, "medium" si 3-5, "low" si menos.`

function stripFiller(s: string): string {
  return s.replace(/</g, ' ').trim()
}

function mrzDateToIso(yymmdd: string): string | null {
  if (!/^\d{6}$/.test(yymmdd)) return null
  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  // La MRZ no lleva siglo: si el año de nacimiento resultante quedaría en el futuro,
  // asumimos que en realidad es del siglo pasado (nadie nace en la MRZ del futuro).
  const currentYY = new Date().getFullYear() % 100
  const century = yy > currentYY + 5 ? 1900 : 2000
  return `${century + yy}-${mm}-${dd}`
}

function mrzSexToSes(char: string): SesSex | null {
  if (char === 'M') return 'H'
  if (char === 'F') return 'M'
  return null
}

function parseMrzName(nameBlock: string): { firstSurname: string | null; secondSurname: string | null; firstName: string | null } {
  const [surnamePart, givenPart] = nameBlock.split('<<')
  const surnames = (surnamePart ?? '').split('<').map(s => s.trim()).filter(Boolean)
  const firstName = stripFiller(givenPart ?? '').split(/\s+/).filter(Boolean).join(' ') || null
  return {
    firstSurname: surnames[0] || null,
    secondSurname: surnames[1] || null,
    firstName,
  }
}

// DNI / NIE español — TD1, 3 líneas de 30 caracteres (ICAO 9303).
function parseTD1(lines: string[]): Partial<ExtractedGuestDocumentData> | null {
  if (lines.length !== 3) return null
  const l1 = lines[0].padEnd(30, '<').slice(0, 30)
  const l2 = lines[1].padEnd(30, '<').slice(0, 30)
  const l3 = lines[2].padEnd(30, '<').slice(0, 30)

  const issuingCountry = l1.slice(2, 5)
  const fieldNumber = stripFiller(l1.slice(5, 14))
  const optionalData1 = stripFiller(l1.slice(15, 30))

  // España es un caso particular: el DNI/NIE tiene un "número de soporte" (IDESP) en este
  // campo de la línea 1, y el número de documento real (DNI/NIF) va embebido en los datos
  // opcionales, detrás. El resto de documentos TD1 europeos (CI italiana, CNI francesa,
  // Personalausweis alemán...) no tienen ese doble número: este campo ES el documento real
  // y los datos opcionales no representan un número de soporte, así que no lo inventamos.
  const documentNumber = issuingCountry === 'ESP' ? (optionalData1 || fieldNumber || null) : (fieldNumber || null)
  const supportNumber = issuingCountry === 'ESP' && optionalData1 ? (fieldNumber || null) : null

  const { firstSurname, secondSurname, firstName } = parseMrzName(l3)

  return {
    document_number: documentNumber,
    document_support_number: supportNumber,
    birth_date: mrzDateToIso(l2.slice(0, 6)),
    sex: mrzSexToSes(l2[7] ?? ''),
    nationality: stripFiller(l2.slice(15, 18)) || null,
    first_surname: firstSurname,
    second_surname: secondSurname,
    first_name: firstName,
  }
}

// Pasaporte — TD3, 2 líneas de 44 caracteres (ICAO 9303).
function parseTD3(lines: string[]): Partial<ExtractedGuestDocumentData> | null {
  if (lines.length !== 2) return null
  const l1 = lines[0].padEnd(44, '<').slice(0, 44)
  const l2 = lines[1].padEnd(44, '<').slice(0, 44)

  const { firstSurname, secondSurname, firstName } = parseMrzName(l1.slice(5))

  return {
    document_number: stripFiller(l2.slice(0, 9)) || null,
    document_support_number: null,
    nationality: stripFiller(l2.slice(10, 13)) || null,
    birth_date: mrzDateToIso(l2.slice(13, 19)),
    sex: mrzSexToSes(l2[20] ?? ''),
    first_surname: firstSurname,
    second_surname: secondSurname,
    first_name: firstName,
  }
}

// El corte por posición de la MRZ es aritmética exacta — si Gemini transcribió las líneas
// bien, esto siempre acierta el campo, a diferencia de pedirle que además haga el recorte él.
function applyMrzOverride(parsed: ExtractedGuestDocumentData & { mrz_lines?: unknown }): ExtractedGuestDocumentData {
  const { mrz_lines, ...rest } = parsed
  if (!Array.isArray(mrz_lines) || !mrz_lines.every(l => typeof l === 'string')) {
    return rest
  }

  const mrzFields = parseTD1(mrz_lines) ?? parseTD3(mrz_lines)
  if (!mrzFields) return rest

  const merged = { ...rest }
  for (const [key, value] of Object.entries(mrzFields)) {
    if (value !== null && value !== undefined && value !== '') {
      ;(merged as Record<string, unknown>)[key] = value
    }
  }
  return merged
}

export async function scanGuestDocument(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif'
): Promise<ExtractedGuestDocumentData> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('[CHECKIN_OCR] GOOGLE_AI_API_KEY no configurada')
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
            maxOutputTokens: 2048,
            // gemini-2.5-flash razona internamente antes de responder y ese "pensamiento"
            // consume el mismo presupuesto de maxOutputTokens que la respuesta final —
            // con documentos de identidad (MRZ, texto denso) puede agotarlo y cortar el
            // JSON a mitad. Lo desactivamos: no hace falta razonar para transcribir un documento.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[CHECKIN_OCR] Gemini error:', response.status, errText)
      return EMPTY_RESULT
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('[CHECKIN_OCR] Respuesta vacía de Gemini:', JSON.stringify(data))
      return EMPTY_RESULT
    }

    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start === -1 || end === -1 || end < start) {
      console.error('[CHECKIN_OCR] No se encontró JSON en la respuesta:', clean.slice(0, 200))
      return EMPTY_RESULT
    }

    const rawParsed = JSON.parse(clean.slice(start, end + 1)) as ExtractedGuestDocumentData & { mrz_lines?: unknown }
    const parsed = applyMrzOverride(rawParsed)

    const validDocTypes = ['NIF', 'NIE', 'PAS', 'OTRO']
    if (parsed.document_type !== null && !validDocTypes.includes(parsed.document_type as string)) {
      parsed.document_type = null
    }

    const validSex = ['H', 'M', 'O']
    if (parsed.sex !== null && !validSex.includes(parsed.sex as string)) {
      parsed.sex = null
    }

    if (!['high', 'medium', 'low'].includes(parsed.confidence as string)) {
      parsed.confidence = 'medium'
    }

    return parsed
  } catch (e) {
    console.error('[CHECKIN_OCR] Error inesperado:', e)
    return EMPTY_RESULT
  }
}
