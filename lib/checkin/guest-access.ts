import 'server-only'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { generateSecureToken } from '@/lib/security'

interface EnsureGuestAccessParams {
  propertyId: string
  tenantId: string
  reservationId: string
  guestName: string
  checkinDate: string
  checkoutDate: string
  language?: string
}

/**
 * Devuelve el token de guía del huésped para una reserva, creándolo si aún no
 * existe. Se llama desde el check-in público (huésped anónimo), por eso usa el
 * cliente admin: createGuestAccess() exige sesión de propietario y no sirve aquí.
 *
 * Es idempotente — se busca por booking_id antes de crear, así que recargar la
 * página de check-in completado no genera tokens nuevos.
 */
export async function ensureGuestAccessToken({
  propertyId,
  tenantId,
  reservationId,
  guestName,
  checkinDate,
  checkoutDate,
  language = 'es',
}: EnsureGuestAccessParams): Promise<string | null> {
  const admin = createServerAdminClient()

  const { data: existing } = await admin
    .from('guest_access_tokens')
    .select('access_token')
    .eq('booking_id', reservationId)
    .eq('is_active', true)
    .maybeSingle()

  if (existing?.access_token) return existing.access_token

  // El acceso arranca YA, no 2 días antes de la entrada como en createGuestAccess():
  // el check-in se completa a menudo con semanas de antelación, y el huésped debe
  // poder leer las instrucciones de llegada desde el momento en que se identifica.
  // Con la ventana original, las tarjetas del check-in completado darían "too_early".
  const from = new Date()

  // Se ancla a mediodía UTC antes de sumar días para que el día natural
  // resultante no dependa de la zona horaria del servidor.
  const until = new Date(`${checkoutDate}T12:00:00Z`)
  until.setUTCDate(until.getUTCDate() + 2)
  until.setUTCHours(23, 59, 59, 999)

  const accessToken = generateSecureToken(12)

  const { error } = await admin.from('guest_access_tokens').insert({
    property_id: propertyId,
    tenant_id: tenantId,
    booking_id: reservationId,
    access_token: accessToken,
    guest_name: guestName || 'Invitado',
    checkin_date: checkinDate,
    checkout_date: checkoutDate,
    valid_from: from.toISOString(),
    valid_until: until.toISOString(),
    language,
    is_active: true,
    daily_chat_limit: 50,
  })

  if (error) {
    console.error('[CHECKIN_GUEST_ACCESS] No se pudo crear el acceso a la guía:', error.message)
    return null
  }

  return accessToken
}
