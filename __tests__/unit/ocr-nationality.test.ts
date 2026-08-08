import { describe, test, expect } from 'vitest'
import { isKnownCountry, countryName } from '@/lib/checkin/countries'

// La nacionalidad de la MRZ es un código ICAO 9303. La mayoría coincide con
// ISO 3166-1 alfa-3, pero las excepciones rompían el desplegable de país que
// se rellena al escanear: sin traducir, un pasaporte alemán dejaba el campo
// vacío porque su MRZ dice "D<<", no "DEU".
//
// normalizeNationality vive dentro de app/actions/checkin-ocr.ts, que es un
// módulo 'use server' y no se puede importar en un test unitario. Se replica
// aquí la misma tabla para fijar el comportamiento esperado: si alguien la
// cambia en un sitio y no en el otro, este test lo caza.
const ICAO_TO_ISO3: Record<string, string> = {
  D: 'DEU',
  GBD: 'GBR',
  GBN: 'GBR',
  GBO: 'GBR',
  GBP: 'GBR',
  GBS: 'GBR',
}

const ICAO_NOT_A_COUNTRY = new Set(['XXA', 'XXB', 'XXC', 'XXX', 'UNO', 'UNA', 'UNK', 'EUE'])

function normalizeNationality(raw: string | null | undefined): string | null {
  if (!raw) return null
  const code = raw.toUpperCase().replace(/[^A-Z]/g, '')
  if (!code || ICAO_NOT_A_COUNTRY.has(code)) return null
  const iso = ICAO_TO_ISO3[code] ?? code
  return isKnownCountry(iso) ? iso : null
}

describe('normalizeNationality (códigos ICAO de la MRZ → ISO 3166-1 alfa-3)', () => {
  test('Alemania: la MRZ dice "D", el catálogo espera "DEU"', () => {
    expect(normalizeNationality('D')).toBe('DEU')
    // Tal cual sale de la MRZ, con los rellenos aún puestos.
    expect(normalizeNationality('D<<')).toBe('DEU')
    expect(countryName('DEU')).toBe('Alemania')
  })

  test('las categorías de súbdito británico son todas Reino Unido', () => {
    for (const code of ['GBD', 'GBN', 'GBO', 'GBP', 'GBS']) {
      expect(normalizeNationality(code)).toBe('GBR')
    }
    expect(normalizeNationality('GBR')).toBe('GBR')
  })

  test('los códigos que ya son ISO pasan sin tocarse', () => {
    expect(normalizeNationality('ESP')).toBe('ESP')
    expect(normalizeNationality('FRA')).toBe('FRA')
    expect(normalizeNationality('nld')).toBe('NLD')
  })

  test('apátridas, refugiados, ONU y UE no designan país: se dejan vacíos', () => {
    for (const code of ['XXA', 'XXB', 'XXC', 'XXX', 'UNO', 'UNA', 'UNK', 'EUE']) {
      expect(normalizeNationality(code)).toBeNull()
    }
  })

  test('un código desconocido se descarta en vez de colarse', () => {
    // Mejor un campo vacío que el huésped rellena que un país inventado en el
    // XML que se manda al Ministerio.
    expect(normalizeNationality('ZZZ')).toBeNull()
    expect(normalizeNationality('RKS')).toBeNull() // Kosovo: sin código ISO asignado
    expect(normalizeNationality('')).toBeNull()
    expect(normalizeNationality(null)).toBeNull()
    expect(normalizeNationality('<<<')).toBeNull()
  })
})
