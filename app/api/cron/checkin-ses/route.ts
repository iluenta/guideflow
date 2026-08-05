import { NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { buildPartesViajerosXml } from '@/lib/ses/xml-builder'
import { generatePartedeEntradaPdf, type PdfGuestInput } from '@/lib/checkin/pdf-generator'
import { sendCheckinReadyForSes } from '@/lib/email/resend'
import type { CheckinGuestRecord } from '@/types/checkin'

export const runtime = 'nodejs'

const PURGE_GRACE_HOURS = 48

async function signatureToDataUri(admin: ReturnType<typeof createServerAdminClient>, path: string | null): Promise<string | null> {
  if (!path) return null
  const { data, error } = await admin.storage.from('checkin_signatures').download(path)
  if (error || !data) return null
  const buffer = Buffer.from(await data.arrayBuffer())
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function processDueCheckins(admin: ReturnType<typeof createServerAdminClient>) {
  const today = new Date().toISOString().slice(0, 10)
  let generated = 0
  let skipped = 0
  let failed = 0

  const { data: links, error: linksError } = await admin
    .from('checkin_links')
    .select(`
      id, tenant_id, property_id, reservation_id, completed_at,
      reservation:reservations(id, checkin_date, checkout_date, guests_count, created_at, channel_id, status),
      property:properties(id, name, ses_establishment_code, ses_communication_enabled)
    `)
    .eq('is_active', true)
    .not('completed_at', 'is', null)

  if (linksError) {
    console.error('[cron/checkin-ses] Error listando checkin_links:', linksError)
    return { generated, skipped, failed }
  }

  for (const link of links ?? []) {
    const reservation = link.reservation as any
    const property = link.property as any

    if (!reservation || !property) { skipped++; continue }
    if (reservation.checkin_date > today) { skipped++; continue }
    if (['cancelled', 'no_show'].includes(reservation.status)) { skipped++; continue }
    if (!property.ses_communication_enabled) { skipped++; continue }
    if (!property.ses_establishment_code) { skipped++; continue }

    const { data: existing } = await admin
      .from('ses_communications')
      .select('id, status')
      .eq('reservation_id', reservation.id)
      .in('status', ['generated', 'uploaded_manually'])
      .maybeSingle()

    if (existing) { skipped++; continue }

    try {
      const { data: guests } = await admin
        .from('checkin_guests')
        .select('*')
        .eq('checkin_link_id', link.id)
        .order('guest_order', { ascending: true })

      if (!guests || guests.length === 0) { skipped++; continue }

      let collectionParty: 'platform' | 'host' = 'host'
      if (reservation.channel_id) {
        const { data: channel } = await admin
          .from('channel_settings')
          .select('collection_party')
          .eq('id', reservation.channel_id)
          .maybeSingle()
        if (channel?.collection_party === 'platform') collectionParty = 'platform'
      }

      const xml = buildPartesViajerosXml({
        establishmentCode: property.ses_establishment_code,
        reservationId: reservation.id,
        reservationCreatedAt: reservation.created_at,
        checkinDate: reservation.checkin_date,
        checkoutDate: reservation.checkout_date,
        collectionParty,
        guests: guests as CheckinGuestRecord[],
      })

      const pdfGuests: PdfGuestInput[] = await Promise.all(
        (guests as CheckinGuestRecord[]).map(async (guest) => ({
          ...guest,
          signatureDataUri: await signatureToDataUri(admin, guest.signature_url),
        }))
      )

      const pdf = await generatePartedeEntradaPdf({
        propertyName: property.name,
        establishmentCode: property.ses_establishment_code,
        reservationId: reservation.id,
        checkinDate: reservation.checkin_date,
        checkoutDate: reservation.checkout_date,
        guests: pdfGuests,
      })

      const { data: landing } = await admin
        .from('property_landings')
        .select('contact_email')
        .eq('property_id', property.id)
        .maybeSingle()

      if (!landing?.contact_email) { skipped++; continue }

      await sendCheckinReadyForSes({
        property: { name: property.name },
        landing: { contact_email: landing.contact_email },
        reservation: { id: reservation.id, checkin_date: reservation.checkin_date, checkout_date: reservation.checkout_date },
        guestsCount: guests.length,
        xml,
        pdf,
      })

      const now = new Date().toISOString()
      await admin.from('ses_communications').insert({
        tenant_id: link.tenant_id,
        property_id: property.id,
        reservation_id: reservation.id,
        checkin_link_id: link.id,
        communication_type: 'parte_entrada',
        status: 'generated',
        attempt_count: 1,
        last_attempt_at: now,
        response_summary: `${guests.length} viajero(s) — XML y PDF generados y enviados por email`,
        guests_count: guests.length,
        checkin_date: reservation.checkin_date,
        pdf_sent_at: now,
      })

      generated++
    } catch (e) {
      console.error(`[cron/checkin-ses] Error procesando reserva ${reservation.id}:`, e)
      failed++
    }
  }

  return { generated, skipped, failed }
}

async function purgeDeliveredCheckinData(admin: ReturnType<typeof createServerAdminClient>) {
  const cutoff = new Date(Date.now() - PURGE_GRACE_HOURS * 60 * 60 * 1000).toISOString()
  let purged = 0

  const { data: due } = await admin
    .from('ses_communications')
    .select('reservation_id, property_id')
    .eq('status', 'generated')
    .lt('pdf_sent_at', cutoff)

  for (const row of due ?? []) {
    const { data: guests } = await admin
      .from('checkin_guests')
      .select('guest_order, signature_url')
      .eq('reservation_id', row.reservation_id)

    for (const guest of guests ?? []) {
      if (guest.signature_url) {
        await admin.storage.from('checkin_signatures').remove([guest.signature_url])
      }
    }

    await admin.from('checkin_guests').delete().eq('reservation_id', row.reservation_id)
    await admin.from('checkin_links').update({ is_active: false }).eq('reservation_id', row.reservation_id)
    purged++
  }

  return { purged }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServerAdminClient()

  const communications = await processDueCheckins(admin)
  const purge = await purgeDeliveredCheckinData(admin)

  return NextResponse.json({ communications, purge })
}
