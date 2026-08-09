import { describe, test, expect } from 'vitest'
import {
  documentKindsForNationality,
  isDocumentKindAllowed,
  kindFromSesCode,
  sesCodeForKind,
  hasDocument,
  requiresSupportNumber,
} from '@/lib/checkin/documents'

// El fallo que motiva estos tests: al escanear un DNI, si el OCR no lograba
// leer la nacionalidad, el tipo de documento se descartaba en silencio. La
// causa era que "nacionalidad desconocida" caía en la lista de extranjero, que
// no incluye el DNI — una suposición sin fundamento con consecuencias visibles.

describe('documentKindsForNationality', () => {
  test('española: DNI, NIE, pasaporte y menor sin documentación', () => {
    expect(documentKindsForNationality('ESP').map(d => d.kind)).toEqual([
      'DNI', 'NIE', 'PASAPORTE', 'MENOR_SIN_DOCUMENTO',
    ])
  })

  test('extranjera: sin DNI, con tarjeta y permiso de residencia', () => {
    expect(documentKindsForNationality('DEU').map(d => d.kind)).toEqual([
      'NIE', 'PASAPORTE', 'TARJETA_IDENTIDAD', 'PERMISO_RESIDENCIA', 'MENOR_SIN_DOCUMENTO',
    ])
  })

  test('desconocida: no se restringe nada', () => {
    // Mientras no se sepa la nacionalidad, cualquier documento es posible.
    for (const value of ['', '   ']) {
      const kinds = documentKindsForNationality(value).map(d => d.kind)
      expect(kinds).toContain('DNI')
      expect(kinds).toContain('PERMISO_RESIDENCIA')
      expect(kinds).toHaveLength(6)
    }
  })

  test('el código se compara sin importar mayúsculas ni espacios', () => {
    expect(documentKindsForNationality(' esp ').map(d => d.kind)).toContain('DNI')
  })
})

describe('isDocumentKindAllowed', () => {
  test('un DNI escaneado no se descarta por no saber aún la nacionalidad', () => {
    expect(isDocumentKindAllowed('DNI', '')).toBe(true)
  })

  test('un extranjero no puede presentar DNI', () => {
    expect(isDocumentKindAllowed('DNI', 'DEU')).toBe(false)
  })

  test('un español no presenta permiso de residencia extranjero', () => {
    expect(isDocumentKindAllowed('PERMISO_RESIDENCIA', 'ESP')).toBe(false)
  })

  test('el pasaporte y el menor sin documentación valen para cualquiera', () => {
    for (const nat of ['ESP', 'DEU', '']) {
      expect(isDocumentKindAllowed('PASAPORTE', nat)).toBe(true)
      expect(isDocumentKindAllowed('MENOR_SIN_DOCUMENTO', nat)).toBe(true)
    }
  })
})

describe('traducción al catálogo de SES', () => {
  test('cada opción del formulario tiene su código', () => {
    expect(sesCodeForKind('DNI')).toBe('NIF')
    expect(sesCodeForKind('NIE')).toBe('NIE')
    expect(sesCodeForKind('PASAPORTE')).toBe('PAS')
    // SES solo tiene 6 códigos y ninguno distingue estos dos documentos.
    expect(sesCodeForKind('TARJETA_IDENTIDAD')).toBe('OTRO')
    expect(sesCodeForKind('PERMISO_RESIDENCIA')).toBe('OTRO')
    // Un menor sin documentación no lleva documento que declarar.
    expect(sesCodeForKind('MENOR_SIN_DOCUMENTO')).toBeNull()
  })

  test('el camino de vuelta recupera la opción al reabrir una ficha', () => {
    expect(kindFromSesCode('NIF')).toBe('DNI')
    expect(kindFromSesCode('PAS')).toBe('PASAPORTE')
    expect(kindFromSesCode(null)).toBe('MENOR_SIN_DOCUMENTO')
    // OTRO no se puede desambiguar; en el XML vuelve a salir como OTRO igual.
    expect(kindFromSesCode('OTRO')).toBe('TARJETA_IDENTIDAD')
  })

  test('solo el DNI y el NIE llevan número de soporte impreso', () => {
    expect(requiresSupportNumber('DNI')).toBe(true)
    expect(requiresSupportNumber('NIE')).toBe(true)
    expect(requiresSupportNumber('PASAPORTE')).toBe(false)
  })

  test('solo el menor sin documentación va sin documento', () => {
    expect(hasDocument('MENOR_SIN_DOCUMENTO')).toBe(false)
    expect(hasDocument('DNI')).toBe(true)
  })
})
