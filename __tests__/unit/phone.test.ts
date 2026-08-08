import { describe, test, expect } from 'vitest'
import { normalizePhone, telHref, whatsappHref } from '@/lib/phone'

// El fallo que motiva esto: se usaba un único valor "solo dígitos" para los dos
// enlaces. Vale para wa.me, pero deja el tel: sin "+", y sin "+" una llamada
// desde un móvil extranjero no sale del país del huésped.

describe('telHref — conserva el "+" para que la llamada internacional funcione', () => {
  test('formato guardado en la ficha de la propiedad', () => {
    expect(telHref('+34 628312648')).toBe('tel:+34628312648')
  })

  test('con separadores de todo tipo', () => {
    expect(telHref('(+34) 628-312-648')).toBe('tel:+34628312648')
    expect(telHref('+34 628 31 26 48')).toBe('tel:+34628312648')
  })

  test('un número local se deja sin "+": no se inventa el prefijo', () => {
    expect(telHref('912 345 678')).toBe('tel:912345678')
  })

  test('sin número no hay enlace, para poder ocultar el botón', () => {
    expect(telHref('')).toBeNull()
    expect(telHref(null)).toBeNull()
    expect(telHref('   ')).toBeNull()
  })
})

describe('whatsappHref — solo dígitos, wa.me no admite "+" ni separadores', () => {
  test('quita el "+" y los espacios', () => {
    expect(whatsappHref('+34 628312648')).toBe('https://wa.me/34628312648')
  })

  test('admite un mensaje previo codificado', () => {
    expect(whatsappHref('+34628312648', 'Hola, soy Ana')).toBe(
      'https://wa.me/34628312648?text=Hola%2C%20soy%20Ana'
    )
  })

  test('sin número no hay enlace', () => {
    expect(whatsappHref(null)).toBeNull()
  })
})

describe('normalizePhone', () => {
  test('los dos formatos salen del mismo número', () => {
    expect(normalizePhone('+34 628312648')).toEqual({
      digits: '34628312648',
      dialable: '+34628312648',
    })
  })

  test('un "+" que no va al principio es un error de tecleo, no un prefijo', () => {
    expect(normalizePhone('34+628312648').dialable).toBe('34628312648')
  })

  test('el prefijo internacional en formato 00 se respeta tal cual', () => {
    expect(normalizePhone('0034 628312648').dialable).toBe('0034628312648')
  })
})
