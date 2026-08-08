import { redirect } from 'next/navigation'
import { getPropertyBySlug } from '@/app/actions/properties'
import { createClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { validateCheckinToken } from '@/lib/security'
import { buildCheckinTheme } from '@/lib/checkin/theme'
import { calculateAge } from '@/lib/checkin/guest-utils'
import { ensureGuestAccessToken } from '@/lib/checkin/guest-access'
import { getGuideTheme } from '@/lib/guide-theme'
import { CheckinPageClient } from '@/components/checkin/CheckinPageClient'

interface Props {
  params: Promise<{ slug: string; token: string }>
}

const REASON_TO_ACCESS_DENIED: Record<string, string> = {
  invalid_token: 'invalid',
  token_deactivated: 'inactive',
  expired: 'expired',
  too_early: 'too_early',
}

export default async function CheckinPage({ params }: Props) {
  const { slug, token } = await params

  const property = await getPropertyBySlug(slug)
  if (!property) {
    redirect('/access-denied?reason=invalid')
  }

  const result = await validateCheckinToken(token, property.id)

  if (!result.valid) {
    const reason = REASON_TO_ACCESS_DENIED[result.reason] ?? 'invalid'
    const dateParam = result.reason === 'too_early' && 'availableFrom' in result
      ? `&date=${encodeURIComponent(result.availableFrom.toISOString())}`
      : ''
    redirect(`/access-denied?reason=${reason}${dateParam}`)
  }

  const { link } = result
  const { reservation } = link

  // Mismo tema que la guía del huésped — si la propiedad no tiene branding
  // configurado, getLayoutTheme() cae al tema por defecto.
  const supabase = await createClient()
  const { data: branding } = await supabase
    .from('property_branding')
    .select('layout_theme_id, computed_theme')
    .eq('property_id', property.id)
    .maybeSingle()

  const layoutThemeId =
    branding?.layout_theme_id ||
    (branding?.computed_theme as { _layout_theme_id?: string } | null)?._layout_theme_id ||
    'modern'

  const theme = buildCheckinTheme(layoutThemeId)

  // Huéspedes ya registrados: permite reanudar el check-in por donde se dejó.
  // Vía admin porque el visitante es anónimo y checkin_guests es tenant-only.
  const admin = createServerAdminClient()
  const { data: savedRows } = await admin
    .from('checkin_guests')
    .select('guest_order, birth_date, first_name, first_surname, phone, email, address_street, address_postal_code, address_city, address_country, address_municipality_code')
    .eq('checkin_link_id', link.id)
    .order('guest_order')

  // isMinor se recalcula aquí y no se guarda: al reanudar hace falta saber si
  // hay menores en el grupo para pedir el parentesco (RD 933/2021).
  // Horario de entrada y contacto salen de la ficha de la propiedad — la misma
  // fuente que usa la guía, para que no convivan dos versiones del mismo dato.
  const { data: contextRows } = await supabase
    .from('property_context')
    .select('category, content')
    .eq('property_id', property.id)
    .in('category', ['checkin', 'contacts', 'welcome'])

  const contentOf = (category: string) =>
    ((contextRows ?? []).find(r => r.category === category)?.content ?? {}) as Record<string, string>

  const checkinTime = contentOf('checkin').checkin_time ?? null

  // Misma regla que la guía (components/guide/GlanceBlock.tsx): si hay teléfono
  // de soporte manda ese, y el nombre mostrado es el que acompaña a ese teléfono.
  const contacts = contentOf('contacts')
  const supportPhone = contacts.support_mobile || contacts.support_phone || ''
  const hostPhone = contacts.host_mobile || contacts.host_phone || ''
  const contactPhone = supportPhone || hostPhone || property.contact_phone || ''
  const contactName = supportPhone
    ? contacts.support_name || ''
    : contacts.host_name || contentOf('welcome').host_name || property.host_name || ''

  const hostContact = contactPhone ? { name: contactName, phone: contactPhone } : null

  const registeredGuests = (savedRows ?? []).map(r => ({
    order: r.guest_order as number,
    isMinor: calculateAge(r.birth_date as string, reservation.checkin_date) < 14,
  }))

  // Contacto y dirección del primero ya registrado, para precargarlos en los
  // siguientes al reanudar en otra sesión (dentro de la misma, lo lleva el cliente).
  const lead = savedRows?.[0]
  const initialSharedContact = lead
    ? {
        phone: lead.phone ?? '',
        email: lead.email ?? '',
        address_street: lead.address_street ?? '',
        address_postal_code: lead.address_postal_code ?? '',
        address_city: lead.address_city ?? '',
        address_country: lead.address_country ?? '',
        address_municipality_code: lead.address_municipality_code ?? '',
      }
    : null

  // Solo al terminar el check-in se le da acceso a la guía: es el momento en
  // que ya está identificado. Idempotente, así que recargar no crea otro token.
  let guideToken: string | null = null
  if (registeredGuests.length >= reservation.guests_count) {
    guideToken = await ensureGuestAccessToken({
      propertyId: property.id,
      tenantId: link.tenant_id,
      reservationId: reservation.id,
      guestName: [lead?.first_name, lead?.first_surname].filter(Boolean).join(' '),
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
    })
  }

  return (
    <div data-theme={theme.themeId} className={`min-h-screen ${theme.fontClass}`} style={theme.style}>
      <CheckinPageClient
        token={token}
        propertyName={property.name ?? ''}
        propertyCity={property.city ?? ''}
        propertyImageUrl={property.main_image_url ?? null}
        checkinDate={reservation.checkin_date}
        checkoutDate={reservation.checkout_date}
        guestsCount={reservation.guests_count}
        registeredGuests={registeredGuests}
        checkinTime={checkinTime}
        hostContact={hostContact}
        guideToken={guideToken}
        initialSharedContact={initialSharedContact}
        guideTheme={getGuideTheme(layoutThemeId)}
      />
    </div>
  )
}
