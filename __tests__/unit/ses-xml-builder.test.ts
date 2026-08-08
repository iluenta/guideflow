import { describe, test, expect } from 'vitest'
import { buildPartesViajerosXml } from '@/lib/ses/xml-builder'
import type { CheckinGuestRecord } from '@/types/checkin'

// El bloque <direccion> es el que rechazaba el portal de SES: el manual de
// "alta masiva" exige codigoMunicipio (código INE) cuando el país es ESP, y
// solo admite nombreMunicipio en texto libre para el extranjero.

function guest(overrides: Partial<CheckinGuestRecord> = {}): CheckinGuestRecord {
  return {
    guest_order: 1,
    document_type: 'NIF',
    document_number: '12345678Z',
    document_support_number: null,
    first_name: 'Ana',
    first_surname: 'García',
    second_surname: null,
    birth_date: '1985-03-12',
    nationality: 'ESP',
    sex: 'M',
    phone: '+34600111222',
    email: 'ana@example.com',
    address_street: 'Calle Mayor 14, 3º B',
    address_postal_code: '28013',
    address_city: 'Madrid',
    address_country: 'ESP',
    address_municipality_code: '28079',
    relationship_code: null,
    signature_url: null,
    ...overrides,
  }
}

function build(guests: CheckinGuestRecord[]): string {
  return buildPartesViajerosXml({
    establishmentCode: '0000000123',
    reservationId: '275a8bcb-8b12-4885-919e-bfa19903d334',
    reservationCreatedAt: '2026-07-01T10:00:00.000Z',
    checkinDate: '2026-08-30',
    checkoutDate: '2026-09-03',
    collectionParty: 'platform',
    guests,
  })
}

describe('buildPartesViajerosXml — dirección', () => {
  test('residente en España: informa codigoMunicipio y no nombreMunicipio', () => {
    const xml = build([guest()])

    expect(xml).toContain('<codigoMunicipio>28079</codigoMunicipio>')
    expect(xml).not.toContain('<nombreMunicipio>')
  })

  test('residente en el extranjero: informa nombreMunicipio y no codigoMunicipio', () => {
    const xml = build([
      guest({
        address_country: 'GBR',
        address_city: 'Manchester',
        address_postal_code: 'M11AA',
        address_municipality_code: null,
      }),
    ])

    expect(xml).toContain('<nombreMunicipio>Manchester</nombreMunicipio>')
    expect(xml).not.toContain('<codigoMunicipio>')
    expect(xml).toContain('<codigoPostal>M11AA</codigoPostal>')
  })

  test('el país se compara sin importar mayúsculas', () => {
    const xml = build([guest({ address_country: 'esp' })])
    expect(xml).toContain('<codigoMunicipio>28079</codigoMunicipio>')
  })

  test('la dirección va tal cual en el campo libre "direccion"', () => {
    const xml = build([guest()])
    expect(xml).toContain('<direccion>Calle Mayor 14, 3º B</direccion>')
  })

  test('varios huéspedes producen un bloque persona por cada uno', () => {
    const xml = build([
      guest(),
      guest({ guest_order: 2, first_name: 'Luis', address_municipality_code: '04100', address_city: 'Vera' }),
    ])

    expect(xml.match(/<persona>/g)).toHaveLength(2)
    expect(xml).toContain('<numPersonas>2</numPersonas>')
    expect(xml).toContain('<codigoMunicipio>04100</codigoMunicipio>')
  })

  test('menor sin documentación: no se emiten las etiquetas de documento', () => {
    const xml = build([
      guest({
        first_name: 'Leo',
        document_type: null,
        document_number: null,
        document_support_number: null,
      }),
    ])

    expect(xml).not.toContain('<tipoDocumento>')
    expect(xml).not.toContain('<numeroDocumento>')
    expect(xml).not.toContain('<soporteDocumento>')
    // El resto de la persona sí va: nombre, fecha, nacionalidad, dirección…
    expect(xml).toContain('<nombre>Leo</nombre>')
    expect(xml).toContain('<fechaNacimiento>1985-03-12</fechaNacimiento>')
  })

  test('el XML es bien formado y escapa los caracteres especiales', () => {
    const xml = build([guest({ address_street: 'Calle Ñuño & Cía <1>' })])

    expect(xml).toContain('Calle Ñuño &amp; Cía &lt;1&gt;')
    // Sin parser XML en el proyecto: se comprueba al menos que cada etiqueta
    // abierta tenga su cierre en el mismo orden. El patrón admite atributos
    // (<peticion xmlns="…">) e ignora la declaración <?xml …?>, que empieza
    // por '?' y por tanto no casa con [a-zA-Z].
    const tags = [...xml.matchAll(/<(\/?)([a-zA-Z]+)(?:\s[^>]*)?>/g)]
    const stack: string[] = []
    for (const [, slash, name] of tags) {
      if (slash) expect(stack.pop()).toBe(name)
      else stack.push(name)
    }
    expect(stack).toHaveLength(0)
  })
})
