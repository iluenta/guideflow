import { redirect } from 'next/navigation'
import { getPropertyBySlug } from '@/app/actions/properties'
import { validateCheckinToken } from '@/lib/security'
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

  const { reservation } = result.link

  return (
    <CheckinPageClient
      token={token}
      propertyName={property.name ?? ''}
      checkinDate={reservation.checkin_date}
      checkoutDate={reservation.checkout_date}
      guestsCount={reservation.guests_count}
    />
  )
}
