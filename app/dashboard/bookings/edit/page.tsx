import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'
import { getChannels, getPaymentMethods } from '@/app/actions/reservation-settings'
import { getProperties } from '@/app/actions/properties'
import { getReservation } from '@/app/actions/reservations'
import { ReservationWizard } from '@/components/dashboard/reservations/ReservationWizard'

interface EditBookingPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function EditBookingPage({ searchParams }: EditBookingPageProps) {
  const { id } = await searchParams

  if (!id) redirect('/dashboard/bookings')

  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch {
    redirect('/auth/login')
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    redirect('/dashboard/bookings')
  }

  const [{ reservation }, { channels }, { methods }, propsResult] = await Promise.all([
    getReservation(id),
    getChannels(),
    getPaymentMethods(),
    getProperties(),
  ])

  if (!reservation) notFound()

  const properties = (propsResult as unknown as { id: string; name: string; full_address: string | null }[]) ?? []

  const saleComm = reservation.commissions.find(c => c.commission_type === 'sale')
  const payComm  = reservation.commissions.find(c => c.commission_type === 'payment')
  const defaultCommissions = {
    sale_pct:        saleComm?.pct_applied ?? 0,
    sale_amount:     saleComm?.amount ?? 0,
    sale_vat_pct:    saleComm?.vat_pct ?? 0,
    sale_vat_amount: saleComm?.vat_amount ?? 0,
    pay_pct:         payComm?.pct_applied ?? 0,
    pay_amount:      payComm?.amount ?? 0,
    pay_vat_pct:     payComm?.vat_pct ?? 0,
    pay_vat_amount:  payComm?.vat_amount ?? 0,
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
          <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
          Reservas
        </p>
        <h1 className="text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
          Editar reserva
        </h1>
        <p className="text-[15px] text-slate-500 mt-2">{reservation.guest_name}</p>
      </div>

      <ReservationWizard
        properties={properties}
        channels={channels}
        paymentMethods={methods}
        editingId={id}
        isLocked={reservation.is_locked}
        defaultValues={{
          property_id:   reservation.property_id,
          channel_id:    reservation.channel_id ?? undefined,
          guest_name:    reservation.guest_name,
          guest_email:   reservation.guest_email ?? undefined,
          guest_phone:   reservation.guest_phone ?? undefined,
          guest_country: reservation.guest_country ?? undefined,
          guests_count:  reservation.guests_count,
          checkin_date:  reservation.checkin_date,
          checkout_date: reservation.checkout_date,
          gross_amount:  reservation.gross_amount,
          currency:      reservation.currency,
          external_id:   reservation.external_id ?? undefined,
          notes:         reservation.notes ?? undefined,
          charges: reservation.charges.map(c => ({
            template_id:              c.template_id ?? undefined,
            name:                     c.name,
            charge_type:              c.charge_type,
            amount:                   c.amount,
            vat_pct:                  c.vat_pct,
            is_refundable:            c.is_refundable,
            sort_order:               c.sort_order,
            included_in_gross:        c.included_in_gross,
            beneficiary:              c.beneficiary,
            provider_id:              c.provider_id ?? undefined,
            provider_name_override:   c.provider_name_override ?? undefined,
            charge_payment_status:    c.charge_payment_status ?? undefined,
            charge_payment_method_id: c.charge_payment_method_id ?? undefined,
            charge_payment_date:      c.charge_payment_date ?? undefined,
            charge_payment_reference: c.charge_payment_reference ?? undefined,
          })),
          commissions: defaultCommissions,
        }}
      />
    </div>
  )
}
