/**
 * Enlaces de teléfono y WhatsApp a partir de un número escrito a mano.
 *
 * Existe porque los dos formatos tienen reglas OPUESTAS respecto al "+", y
 * usar el mismo valor limpio para ambos rompe uno de los dos:
 *
 *   tel:    NECESITA el "+". Es lo que le dice al móvil que el número es
 *           internacional. Sin él, un huésped con SIM extranjera marca
 *           "34628312648" como si fuera un número de su propio país y la
 *           llamada falla. Desde España casi no se nota, por eso el fallo
 *           sobrevive a las pruebas del propietario.
 *   wa.me   NO admite el "+" ni separadores: solo dígitos, con prefijo de
 *           país incluido.
 *
 * Los números se guardan como los teclea cada usuario en la ficha de la
 * propiedad ("+34 628 312 648", "912-345-678", "(+34) 600 11 22 33"), así que
 * hay que normalizar en el momento de construir el enlace.
 */

interface NormalizedPhone {
  /** Solo dígitos, sin "+" ni separadores. Para wa.me. */
  digits: string
  /** Dígitos conservando el "+" inicial si lo había. Para tel:. */
  dialable: string
}

export function normalizePhone(raw: string | null | undefined): NormalizedPhone {
  const trimmed = (raw ?? '').trim()
  const digits = trimmed.replace(/\D/g, '')

  // El "+" cuenta como prefijo internacional si aparece ANTES del primer
  // dígito: cubre "+34 …" y también "(+34) …", que es como mucha gente lo
  // escribe. Uno que aparezca después ("34+600…") es un error de tecleo, no
  // un prefijo, y añadirlo delante convertiría el número en otro distinto.
  const firstDigit = trimmed.search(/\d/)
  const hasPlus = firstDigit > 0 && trimmed.slice(0, firstDigit).includes('+')

  return {
    digits,
    dialable: hasPlus && digits ? `+${digits}` : digits,
  }
}

/** href para llamar. Devuelve null si no hay número, para poder ocultar el botón. */
export function telHref(raw: string | null | undefined): string | null {
  const { dialable } = normalizePhone(raw)
  return dialable ? `tel:${dialable}` : null
}

/**
 * href de WhatsApp. `text` se codifica como mensaje previo.
 *
 * Ojo: wa.me exige el número con prefijo de país. Un teléfono guardado sin
 * prefijo ("628312648") produce un enlace que WhatsApp no resuelve — no se
 * inventa aquí un "+34" porque la propiedad puede no ser española.
 */
export function whatsappHref(raw: string | null | undefined, text?: string): string | null {
  const { digits } = normalizePhone(raw)
  if (!digits) return null
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}
