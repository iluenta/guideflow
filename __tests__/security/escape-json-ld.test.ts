/**
 * Tests del escape de JSON-LD (M-1).
 * Verifican que el JSON incrustado en <script type="application/ld+json"> no puede
 * cerrar el tag ni ejecutar JS, y que sigue siendo JSON válido con datos intactos.
 */

import { describe, it, expect } from 'vitest'
import { escapeJsonForScript, stringifyJsonLd } from '@/lib/security/escape-json-ld'

const U2028 = String.fromCharCode(0x2028)
const U2029 = String.fromCharCode(0x2029)

describe('escapeJsonForScript', () => {
  it('escapa < y > para que no se pueda cerrar el <script>', () => {
    const out = escapeJsonForScript('{"x":"</script>"}')
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).toContain('\\u003c')
    expect(out).toContain('\\u003e')
  })

  it('escapa &', () => {
    const out = escapeJsonForScript('{"x":"a & b"}')
    expect(out).not.toContain('&')
    expect(out).toContain('\\u0026')
  })

  it('escapa los separadores de línea U+2028 y U+2029', () => {
    const out = escapeJsonForScript(`{"x":"a${U2028}b${U2029}c"}`)
    expect(out).not.toContain(U2028)
    expect(out).not.toContain(U2029)
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('no altera texto sin caracteres peligrosos', () => {
    const safe = '{"name":"Casa del Mar","precio":120}'
    expect(escapeJsonForScript(safe)).toBe(safe)
  })
})

describe('stringifyJsonLd', () => {
  it('neutraliza un intento de XSS en un campo controlado por el usuario', () => {
    const ld = {
      '@type': 'LodgingBusiness',
      name: 'Casa </script><script>alert(document.cookie)</script>',
      description: 'Bonita casa & jardín',
    }
    const out = stringifyJsonLd(ld)

    // No queda ningún tag que un navegador pueda interpretar
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
  })

  it('el resultado sigue siendo JSON válido y conserva los datos originales', () => {
    const ld = {
      name: 'Casa </script> & <b>test</b>',
      note: `linea1${U2028}linea2`,
      nested: { list: ['<a>', '&', '>'] },
    }
    const out = stringifyJsonLd(ld)

    // Un parser JSON revierte los \uXXXX a los caracteres originales
    const parsed = JSON.parse(out)
    expect(parsed.name).toBe(ld.name)
    expect(parsed.note).toBe(ld.note)
    expect(parsed.nested.list).toEqual(ld.nested.list)
  })

  it('produce el mismo objeto que JSON.parse(JSON.stringify) tras el escape', () => {
    const ld = { a: 1, b: 'texto normal', c: [true, null, 2.5] }
    expect(JSON.parse(stringifyJsonLd(ld))).toEqual(ld)
  })
})
