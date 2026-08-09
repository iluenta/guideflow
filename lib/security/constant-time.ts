import { timingSafeEqual } from 'crypto'

/**
 * Compara dos cadenas en tiempo constante para no filtrar información por el
 * tiempo de respuesta (timing attack) al validar secretos como CRON_SECRET o
 * ADMIN_API_KEY. Solo para runtime Node.js (usa el módulo 'crypto').
 *
 * Devuelve false —sin comparar— si el secreto esperado está vacío/ausente, de
 * modo que una variable de entorno sin configurar NUNCA valide (evita que un
 * `Bearer undefined` pase por coincidencia accidental).
 */
export function safeCompareSecret(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected || !provided) return false

  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')

  // timingSafeEqual exige buffers de la misma longitud; comparamos longitudes
  // aparte. La longitud del secreto no es sensible, el contenido sí.
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}
