'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { generateSecureToken, validateCheckinToken } from '@/lib/security'
import { revalidatePath } from 'next/cache'
import { scanGuestDocument } from '@/app/actions/checkin-ocr'
import type { ExtractedGuestDocumentData, SesSex } from '@/types/checkin'
import { calculateAge } from '@/lib/checkin/guest-utils'
import { guestCheckinSchema } from '@/lib/checkin/guest-schema'
import { resolveMunicipality } from '@/app/actions/municipalities'
import { ensureGuestAccessToken } from '@/lib/checkin/guest-access'
import {
  hasDocument,
  kindFromSesCode,
  sesCodeForKind,
  type DocumentKind,
} from '@/lib/checkin/documents'
import { sendCheckinCompleted } from '@/lib/email/resend'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://hospyia.com'

function buildCheckinUrl(slug: string, token: string) {
  return `${SITE_URL}/check-in/${slug}/${token}`
}

// Ancla a mediodía UTC antes de sumar días para evitar desfases de zona horaria
// con fechas tipo "2026-08-10" (mismo patrón que app/api/create-guest-access/route.ts).
function checkoutPlus24h(checkoutDate: string): Date {
  const checkout = new Date(`${checkoutDate}T12:00:00Z`)
  const validUntil = new Date(checkout)
  validUntil.setUTCDate(validUntil.getUTCDate() + 1)
  validUntil.setUTCHours(23, 59, 59, 999)
  return validUntil
}

export async function generateCheckinLink(reservationId: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'generate_link')) {
    return { error: 'No tienes permisos para generar enlaces de check-in' }
  }

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('id, tenant_id, property_id, checkout_date, status, property:properties(slug)')
    .eq('id', reservationId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (resError || !reservation) {
    return { error: 'Reserva no encontrada' }
  }

  if (['cancelled', 'no_show'].includes(reservation.status)) {
    return { error: 'No se puede generar un enlace de check-in para una reserva cancelada o no-show' }
  }

  const slug = (reservation.property as unknown as { slug: string | null })?.slug
  if (!slug) {
    return { error: 'La propiedad no tiene un slug configurado. Configúralo antes de generar el enlace.' }
  }

  const admin = createServerAdminClient()

  // Un único enlace activo por reserva: desactivamos el anterior antes de crear uno nuevo.
  await admin
    .from('checkin_links')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('reservation_id', reservationId)
    .eq('is_active', true)

  const accessToken = generateSecureToken()
  const validUntil = checkoutPlus24h(reservation.checkout_date)

  const { error: insertError } = await admin.from('checkin_links').insert({
    tenant_id: reservation.tenant_id,
    property_id: reservation.property_id,
    reservation_id: reservation.id,
    access_token: accessToken,
    valid_from: new Date().toISOString(),
    valid_until: validUntil.toISOString(),
    created_by: profile.id,
  })

  if (insertError) {
    return { error: 'No se pudo generar el enlace de check-in' }
  }

  revalidatePath('/dashboard/bookings')

  return { url: buildCheckinUrl(slug, accessToken) }
}

export interface CheckinLinkStatus {
  hasLink: boolean
  url?: string
  isActive?: boolean
  completedAt?: string | null
  guestsSubmitted: number
  guestsExpected: number
}

export async function getCheckinLinkStatus(reservationId: string): Promise<{ data?: CheckinLinkStatus; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'view')) {
    return { error: 'No tienes permisos para ver el check-in de esta reserva' }
  }

  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .select('id, guests_count, property:properties(slug)')
    .eq('id', reservationId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (resError || !reservation) {
    return { error: 'Reserva no encontrada' }
  }

  const { data: link } = await supabase
    .from('checkin_links')
    .select('id, access_token, is_active, completed_at')
    .eq('reservation_id', reservationId)
    .eq('is_active', true)
    .maybeSingle()

  if (!link) {
    return { data: { hasLink: false, guestsSubmitted: 0, guestsExpected: reservation.guests_count } }
  }

  const { count } = await supabase
    .from('checkin_guests')
    .select('id', { count: 'exact', head: true })
    .eq('checkin_link_id', link.id)

  const slug = (reservation.property as unknown as { slug: string | null })?.slug

  return {
    data: {
      hasLink: true,
      url: slug ? buildCheckinUrl(slug, link.access_token) : undefined,
      isActive: link.is_active,
      completedAt: link.completed_at,
      guestsSubmitted: count ?? 0,
      guestsExpected: reservation.guests_count,
    },
  }
}

// Acción pública (huésped anónimo). Valida el token ANTES de gastar en Gemini
// para que un enlace inválido/caducado no se pueda usar para abusar del OCR.
export async function scanDocument(
  token: string,
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif'
): Promise<{ data?: ExtractedGuestDocumentData; error?: string }> {
  const result = await validateCheckinToken(token)
  if (!result.valid) {
    return { error: 'Enlace no válido o caducado' }
  }

  const data = await scanGuestDocument(imageBase64, mimeType)
  return { data }
}

export interface CheckinGuestExistingData {
  first_name: string
  first_surname: string
  second_surname: string
  document_kind: DocumentKind
  document_number: string
  document_support_number: string
  birth_date: string
  nationality: string
  sex: SesSex
  phone: string
  email: string
  address_street: string
  address_postal_code: string
  address_city: string
  address_country: string
  address_municipality_code: string
  relationship_code: string
  ocrConfidence: string | null
  signatureDataUrl: string | null
}

// Acción pública (huésped anónimo). Permite reabrir un huésped ya guardado
// para corregir un error antes de que el cron lo comunique a SES — sin esto,
// volver a pulsar sobre un huésped completado mostraba el formulario en
// blanco y un reenvío sobrescribía silenciosamente sus datos anteriores.
export async function getCheckinGuestData(
  token: string,
  guestOrder: number
): Promise<{ data?: CheckinGuestExistingData | null; error?: string }> {
  const result = await validateCheckinToken(token)
  if (!result.valid) {
    return { error: 'Enlace no válido o caducado' }
  }
  const { link } = result

  const admin = createServerAdminClient()

  const { data: guest, error } = await admin
    .from('checkin_guests')
    .select('*')
    .eq('checkin_link_id', link.id)
    .eq('guest_order', guestOrder)
    .maybeSingle()

  if (error) {
    return { error: 'No se pudieron recuperar los datos del huésped' }
  }
  if (!guest) {
    return { data: null }
  }

  // M-2 (minimización de PII): una vez el parte se ha comunicado a SES, corregir
  // ya no tiene sentido y los datos están a punto de purgarse. A partir de ese
  // momento el enlace deja de devolver la identidad documental (nº de documento,
  // nº de soporte y firma), de modo que un enlace filtrado no permita cosechar
  // esos datos en la ventana posterior a la comunicación. El resto de campos se
  // conservan para dar contexto si el huésped reabre la ficha.
  const { data: communicated } = await admin
    .from('ses_communications')
    .select('id')
    .eq('reservation_id', link.reservation_id)
    .in('status', ['generated', 'uploaded_manually', 'sent', 'acknowledged'])
    .maybeSingle()
  const identityLocked = !!communicated

  let signatureDataUrl: string | null = null
  if (!identityLocked && guest.signature_url) {
    const { data: file } = await admin.storage.from('checkin_signatures').download(guest.signature_url)
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      signatureDataUrl = `data:image/png;base64,${buffer.toString('base64')}`
    }
  }

  // document_kind es lo que eligió el huésped; en fichas anteriores a esa
  // columna se deduce del código de SES que sí se guardó.
  const documentKind: DocumentKind =
    (guest.document_kind as DocumentKind | null) ?? kindFromSesCode(guest.document_type)

  return {
    data: {
      first_name: guest.first_name,
      first_surname: guest.first_surname,
      second_surname: guest.second_surname ?? '',
      document_kind: documentKind,
      document_number: identityLocked ? '' : (guest.document_number ?? ''),
      document_support_number: identityLocked ? '' : (guest.document_support_number ?? ''),
      birth_date: guest.birth_date,
      nationality: guest.nationality,
      sex: guest.sex as SesSex,
      phone: guest.phone ?? '',
      email: guest.email ?? '',
      address_street: guest.address_street ?? '',
      address_postal_code: guest.address_postal_code ?? '',
      address_city: guest.address_city ?? '',
      address_country: guest.address_country ?? '',
      address_municipality_code: guest.address_municipality_code ?? '',
      relationship_code: guest.relationship_code ?? '',
      ocrConfidence: guest.ocr_confidence,
      signatureDataUrl,
    },
  }
}

export interface CheckinGuestInput {
  first_name: string
  first_surname: string
  second_surname?: string
  document_kind: string
  document_number: string
  document_support_number?: string
  birth_date: string
  nationality: string
  sex: string
  phone?: string
  email?: string
  address_street: string
  address_postal_code: string
  address_city?: string
  address_country: string
  address_municipality_code?: string
  relationship_code?: string
  ocr_confidence?: string | null
}

// Acción pública (huésped anónimo). Revalida el token completo (ventana +
// activo + reserva no cancelada) en cada envío — nunca confía en que la
// página ya lo hiciera antes, porque el envío puede llegar minutos u horas
// después de cargar el formulario.
export async function submitCheckinGuest(
  token: string,
  guestOrder: number,
  data: CheckinGuestInput,
  signatureBase64: string | null
): Promise<{ success?: true; completed?: boolean; guideToken?: string | null; error?: string }> {
  const result = await validateCheckinToken(token)
  if (!result.valid) {
    return { error: 'Enlace no válido o caducado' }
  }
  const { link } = result
  const reservation = link.reservation

  // El cliente ya valida con este mismo esquema, pero esta acción es pública y
  // anónima (solo protegida por el token) — nunca confiar en que la llamada
  // venga realmente del formulario. Se revalida aquí con las mismas reglas
  // (catálogos SES, checksum de DNI/NIE, formato de CP, etc.) antes de guardar
  // nada que acabe en un XML de comunicación a SES Hospedajes.
  const parsed = guestCheckinSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos del huésped no válidos' }
  }
  const validated = parsed.data

  // El municipio se resuelve contra el catálogo del INE, no se acepta tal cual:
  // un código inventado llegaría hasta el XML de SES y lo rechazaría el portal.
  // Además así el nombre guardado en address_city es siempre el oficial, y no
  // depende de lo que enviara el cliente.
  let municipalityCode: string | null = null
  let municipalityName: string | null = validated.address_city || null

  if (validated.address_country === 'ESP') {
    const municipality = await resolveMunicipality(validated.address_municipality_code ?? '')
    if (!municipality) {
      return { error: 'El municipio seleccionado no existe en el catálogo del INE' }
    }
    municipalityCode = municipality.code
    municipalityName = municipality.name
  }

  const admin = createServerAdminClient()

  const { data: property } = await admin
    .from('properties')
    .select('guests')
    .eq('id', link.property_id)
    .single()

  const maxGuests = Math.min(reservation.guests_count, property?.guests ?? reservation.guests_count)
  if (!Number.isInteger(guestOrder) || guestOrder < 1 || guestOrder > maxGuests) {
    return { error: 'Número de huésped fuera de rango' }
  }

  // NUNCA confiar en un flag de firma del cliente: se recalcula aquí desde la
  // fecha de nacimiento frente a la fecha de check-in (RD 933/2021 Art. 4.2).
  const age = calculateAge(validated.birth_date, reservation.checkin_date)
  const signatureRequired = age >= 14

  if (signatureRequired && !signatureBase64) {
    return { error: 'La firma es obligatoria para huéspedes mayores de 14 años' }
  }

  let signatureUrl: string | null = null
  if (signatureBase64) {
    const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const path = `${link.property_id}/${reservation.id}/${guestOrder}.png`
    const { error: uploadError } = await admin.storage
      .from('checkin_signatures')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })
    if (uploadError) {
      return { error: 'No se pudo guardar la firma' }
    }
    signatureUrl = path
  }

  const { error: upsertError } = await admin
    .from('checkin_guests')
    .upsert(
      {
        tenant_id: link.tenant_id,
        property_id: link.property_id,
        reservation_id: reservation.id,
        checkin_link_id: link.id,
        guest_order: guestOrder,
        // Se guardan las dos caras del dato: lo que eligió el huésped
        // (document_kind) y el código que espera SES. Un menor sin
        // documentación no lleva ninguno de los dos.
        document_kind: validated.document_kind,
        document_type: sesCodeForKind(validated.document_kind),
        document_number: hasDocument(validated.document_kind) ? validated.document_number : null,
        document_support_number: validated.document_support_number || null,
        first_name: validated.first_name,
        first_surname: validated.first_surname,
        second_surname: validated.second_surname || null,
        birth_date: validated.birth_date,
        nationality: validated.nationality,
        sex: validated.sex,
        phone: validated.phone || null,
        email: validated.email || null,
        address_street: validated.address_street,
        address_postal_code: validated.address_postal_code,
        address_city: municipalityName,
        address_country: validated.address_country,
        address_municipality_code: municipalityCode,
        relationship_code: validated.relationship_code || null,
        signature_required: signatureRequired,
        signature_url: signatureUrl,
        signed_at: signatureBase64 ? new Date().toISOString() : null,
        ocr_confidence: data.ocr_confidence || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'checkin_link_id,guest_order' }
    )

  if (upsertError) {
    return { error: 'No se pudieron guardar los datos del huésped' }
  }

  const { count } = await admin
    .from('checkin_guests')
    .select('id', { count: 'exact', head: true })
    .eq('checkin_link_id', link.id)

  let completed = false
  let guideToken: string | null = null
  if ((count ?? 0) >= maxGuests) {
    completed = true
    await admin
      .from('checkin_links')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', link.id)

    // El acceso a la guía se devuelve AQUÍ, no solo al cargar la página: el
    // último huésped se guarda sin recargar, así que la pantalla final se
    // pintaba con el token que había al entrar — ninguno — y los enlaces a la
    // guía y a las instrucciones de llegada quedaban muertos.
    // Es idempotente: si ya existe, devuelve el mismo.
    try {
      const { data: lead } = await admin
        .from('checkin_guests')
        .select('first_name, first_surname')
        .eq('checkin_link_id', link.id)
        .order('guest_order')
        .limit(1)
        .maybeSingle()

      guideToken = await ensureGuestAccessToken({
        propertyId: link.property_id,
        tenantId: link.tenant_id,
        reservationId: reservation.id,
        guestName: [lead?.first_name, lead?.first_surname].filter(Boolean).join(' '),
        checkinDate: reservation.checkin_date,
        checkoutDate: reservation.checkout_date,
      })
    } catch (e) {
      // Sin token, la pantalla final muestra las tarjetas atenuadas en vez de
      // enlaces rotos; el check-in en sí ya está guardado y es lo que importa.
      console.error('[submitCheckinGuest] Error generando el acceso a la guía:', e)
    }

    // Aviso al propietario: best-effort, un fallo de email no debe romper el check-in.
    try {
      const [{ data: propertyRow }, { data: landing }] = await Promise.all([
        admin.from('properties').select('name').eq('id', link.property_id).single(),
        admin.from('property_landings').select('contact_email').eq('property_id', link.property_id).single(),
      ])
      if (landing?.contact_email) {
        await sendCheckinCompleted({
          property: { name: propertyRow?.name ?? '' },
          landing: { contact_email: landing.contact_email },
          reservation: { id: reservation.id, checkin_date: reservation.checkin_date, checkout_date: reservation.checkout_date },
          guestsCount: maxGuests,
        })
      }
    } catch (e) {
      console.error('[submitCheckinGuest] Error enviando notificación al propietario:', e)
    }
  }

  return { success: true, completed, guideToken }
}
