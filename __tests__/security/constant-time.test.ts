/**
 * Tests de safeCompareSecret (L-1).
 * Verifican que la comparación de secretos rechaza correctamente y no valida por
 * accidente cuando el secreto esperado está ausente (evita el "Bearer undefined").
 */

import { describe, it, expect } from 'vitest'
import { safeCompareSecret } from '@/lib/security/constant-time'

describe('safeCompareSecret', () => {
  it('devuelve true para dos cadenas idénticas', () => {
    expect(safeCompareSecret('s3cr3t-token', 's3cr3t-token')).toBe(true)
  })

  it('devuelve false para cadenas distintas de igual longitud', () => {
    expect(safeCompareSecret('aaaaaaaa', 'bbbbbbbb')).toBe(false)
  })

  it('devuelve false para cadenas de distinta longitud', () => {
    expect(safeCompareSecret('short', 'a-much-longer-secret')).toBe(false)
  })

  it('devuelve false si el secreto esperado es undefined (env sin configurar)', () => {
    expect(safeCompareSecret('Bearer undefined', undefined)).toBe(false)
  })

  it('devuelve false si el secreto esperado es cadena vacía', () => {
    expect(safeCompareSecret('anything', '')).toBe(false)
  })

  it('devuelve false si el valor recibido es null o undefined', () => {
    expect(safeCompareSecret(null, 'secret')).toBe(false)
    expect(safeCompareSecret(undefined, 'secret')).toBe(false)
  })

  it('devuelve false cuando ambos están ausentes (no valida vacío contra vacío)', () => {
    expect(safeCompareSecret(undefined, undefined)).toBe(false)
    expect(safeCompareSecret('', '')).toBe(false)
  })

  it('maneja el formato real "Bearer <secreto>"', () => {
    const secret = 'abc123XYZ'
    expect(safeCompareSecret(`Bearer ${secret}`, `Bearer ${secret}`)).toBe(true)
    expect(safeCompareSecret(`Bearer wrong`, `Bearer ${secret}`)).toBe(false)
  })

  it('distingue diferencias de un solo carácter', () => {
    expect(safeCompareSecret('token-A', 'token-B')).toBe(false)
  })

  it('es sensible a mayúsculas/minúsculas', () => {
    expect(safeCompareSecret('Secret', 'secret')).toBe(false)
  })
})
