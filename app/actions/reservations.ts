'use server'

import { createClient } from '@/lib/supabase/server'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { revalidatePath } from 'next/cache'
import { round2, calcNights, isReservationLocked } from '@/lib/reservations/commission-utils'
import type {
  Reservation,
  ReservationCharge,
  ReservationWithDetails,
  ReservationListItem,
  ReservationFilters,
  ReservationsSummary,
  ReservationCommission,
  CommissionOverrides,
  GrossChangePreview,
  CreateReservationInput,
  UpdateReservationInput,
  UpdateChargePaymentInput,
  AddPaymentInput,
  ReservationStatus,
  ChargeBeneficiary,
} from '@/types/reservations'

function buildCalculatedFields(
  reservation: Reservation,
  charges: { amount: number; included_in_gross: boolean | null; beneficiary: ChargeBeneficiary; charge_payment_status: string | null }[],
  payments: { amount: number; payment_type: string }[]
) {
  const nights = calcNights(reservation.checkin_date, reservation.checkout_date)

  // null/undefined se trata como true — cargos sin columna o anteriores a migración 053 son del canal
  const isGross = (c: { included_in_gross?: boolean | null }) => c.included_in_gross !== false

  // Cargos incluidos en el bruto (desglose informativo)
  const total_charges = round2(
    charges.filter(isGross).reduce((s, c) => s + c.amount, 0)
  )

  // Extras fuera del canal — anfitrión
  const extrasOwner = charges.filter(c => !isGross(c) && c.beneficiary === 'owner')
  const total_extras_owner           = round2(extrasOwner.reduce((s, c) => s + c.amount, 0))
  const total_extras_owner_collected = round2(extrasOwner.filter(c => c.charge_payment_status === 'collected').reduce((s, c) => s + c.amount, 0))
  const total_extras_owner_pending   = round2(extrasOwner.filter(c => c.charge_payment_status === 'pending').reduce((s, c) => s + c.amount, 0))

  // Extras informativos — proveedor (no afectan al cálculo del anfitrión)
  const total_extras_provider = round2(
    charges.filter(c => !isGross(c) && c.beneficiary === 'provider').reduce((s, c) => s + c.amount, 0)
  )

  // Cobros del canal
  const total_received = round2(
    payments.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + p.amount, 0)
  )
  const pending_amount = round2(reservation.gross_amount - total_received)

  // Comisiones — siempre sobre gross_amount del canal, nunca sobre extras
  const commission_total = round2(
    reservation.total_sale_commission +
    reservation.total_sale_commission_vat +
    reservation.total_pay_commission +
    reservation.total_pay_commission_vat
  )
  const net_amount = round2(reservation.gross_amount - commission_total)
  const commission_pct_effective = reservation.gross_amount > 0
    ? round2((commission_total / reservation.gross_amount) * 100)
    : 0

  // Ingreso total del anfitrión = neto canal + extras anfitrión
  const total_income = round2(net_amount + total_extras_owner)

  // Reserva cerrada: canal cobrado Y todos los extras del anfitrión resueltos
  const canal_locked = total_received >= reservation.gross_amount
  const extras_resolved = extrasOwner.every(
    c => c.charge_payment_status === 'collected' || c.charge_payment_status === 'waived'
  )
  const is_locked = canal_locked && extras_resolved

  return {
    nights,
    total_charges,
    total_received,
    pending_amount,
    net_amount,
    commission_total,
    commission_pct_effective,
    total_extras_owner,
    total_extras_owner_collected,
    total_extras_owner_pending,
    total_extras_provider,
    total_income,
    is_locked,
  }
}

// Construye los objetos a insertar en reservation_commissions
// a partir de los valores que envía el formulario (CommissionOverrides).
function buildCommissionRows(
  tenantId: string,
  grossAmount: number,
  overrides: CommissionOverrides,
  channelId: string | null,
  paymentMethodId: string | null,
  channelName: string
): Omit<ReservationCommission, 'id' | 'reservation_id' | 'created_at'>[] {
  const rows: Omit<ReservationCommission, 'id' | 'reservation_id' | 'created_at'>[] =
    []

  if (overrides.sale_amount > 0 || overrides.sale_pct > 0) {
    rows.push({
      tenant_id: tenantId,
      commission_type: 'sale',
      base_amount: grossAmount,
      pct_applied: overrides.sale_pct,
      amount: overrides.sale_amount,
      vat_pct: overrides.sale_vat_pct,
      vat_amount: overrides.sale_vat_amount,
      vat_treatment: 'standard',
      channel_id: channelId,
      payment_method_id: null,
      description: `Comisión de venta ${channelName} (${overrides.sale_pct}%)`,
    })
  }

  if (overrides.pay_amount > 0 || overrides.pay_pct > 0) {
    rows.push({
      tenant_id: tenantId,
      commission_type: 'payment',
      base_amount: grossAmount,
      pct_applied: overrides.pay_pct,
      amount: overrides.pay_amount,
      vat_pct: overrides.pay_vat_pct,
      vat_amount: overrides.pay_vat_amount,
      vat_treatment: 'standard',
      channel_id: channelId,
      payment_method_id: paymentMethodId,
      description: `Comisión de cobro (${overrides.pay_pct}%)`,
    })
  }

  return rows
}

// ─── Server Actions ────────────────────────────────────────────────────────────

export async function createReservation(
  data: CreateReservationInput
): Promise<{ reservation?: ReservationWithDetails; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'create')) {
    return { error: 'No tienes permisos para crear reservas' }
  }

  if (new Date(data.checkout_date) <= new Date(data.checkin_date)) {
    return { error: 'La fecha de salida debe ser posterior a la de entrada' }
  }

  // Verificar que el canal pertenece al tenant
  const { data: channel } = await supabase
    .from('channel_settings')
    .select('id, name, sale_commission_pct, sale_commission_vat_pct, vat_treatment, collection_party')
    .eq('id', data.channel_id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!channel) {
    return { error: 'Canal no encontrado' }
  }

  const comm = data.commissions

  // INSERT reserva con los totales de comisiones que envía el formulario
  const { data: reservation, error: resError } = await supabase
    .from('reservations')
    .insert({
      tenant_id: profile.tenant_id,
      property_id: data.property_id,
      channel_id: data.channel_id,
      guest_name: data.guest_name,
      guest_email: data.guest_email ?? null,
      guest_phone: data.guest_phone ?? null,
      guest_country: data.guest_country ?? null,
      guests_count: data.guests_count,
      checkin_date: data.checkin_date,
      checkout_date: data.checkout_date,
      gross_amount: data.gross_amount,
      currency: data.currency ?? 'EUR',
      total_sale_commission: comm.sale_amount,
      total_sale_commission_vat: comm.sale_vat_amount,
      total_pay_commission: comm.pay_amount,
      total_pay_commission_vat: comm.pay_vat_amount,
      external_id: data.external_id ?? null,
      notes: data.notes ?? null,
      created_by: profile.id,
    })
    .select()
    .single()

  if (resError || !reservation) {
    return { error: resError?.message ?? 'Error al crear la reserva' }
  }

  // INSERT cargos
  if (data.charges.length > 0) {
    const { error: chargesError } = await supabase
      .from('reservation_charges')
      .insert(
        data.charges.map(c => ({
          tenant_id: profile.tenant_id,
          reservation_id: reservation.id,
          template_id: c.template_id ?? null,
          name: c.name,
          charge_type: c.charge_type,
          amount: c.amount,
          vat_pct: c.vat_pct,
          vat_amount: round2(c.amount * (c.vat_pct / 100)),
          is_refundable: c.is_refundable,
          sort_order: c.sort_order,
          included_in_gross: c.included_in_gross ?? true,
          beneficiary: c.beneficiary ?? 'owner',
          provider_id: c.provider_id ?? null,
          provider_name_override: c.provider_name_override ?? null,
          charge_payment_status: !c.included_in_gross ? (c.charge_payment_status ?? 'pending') : null,
          charge_payment_method_id: c.charge_payment_method_id ?? null,
          charge_payment_date: c.charge_payment_date ?? null,
          charge_payment_reference: c.charge_payment_reference ?? null,
        }))
      )
    if (chargesError) return { error: chargesError.message }
  }

  // INSERT comisiones (snapshot histórico con los valores del formulario)
  const commissionRows = buildCommissionRows(
    profile.tenant_id,
    data.gross_amount,
    comm,
    data.channel_id,
    data.initial_payment?.payment_method_id ?? null,
    channel.name
  )
  if (commissionRows.length > 0) {
    const { error: commError } = await supabase
      .from('reservation_commissions')
      .insert(commissionRows.map(r => ({ ...r, reservation_id: reservation.id })))
    if (commError) return { error: commError.message }
  }

  // INSERT pago inicial si viene
  if (data.initial_payment) {
    const ip = data.initial_payment
    const { error: payError } = await supabase
      .from('reservation_payments')
      .insert({
        tenant_id: profile.tenant_id,
        reservation_id: reservation.id,
        payment_method_id: ip.payment_method_id,
        amount: ip.amount,
        payment_date: ip.payment_date,
        payment_type: ip.payment_type,
        reference: ip.reference ?? null,
        notes: ip.notes ?? null,
      })
    if (payError) return { error: payError.message }
  }

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/calendar')

  const result = await getReservation(reservation.id)
  return { reservation: result.reservation }
}

export async function updateReservation(
  id: string,
  data: UpdateReservationInput
): Promise<{
  reservation?: Reservation
  error?: string
  requiresConfirmation?: boolean
  preview?: GrossChangePreview
}> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'No tienes permisos para editar reservas' }
  }

  // Obtener reserva actual
  const { data: current } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!current) return { error: 'Reserva no encontrada' }

  // Calcular total cobrado actual
  const { data: existingPayments } = await supabase
    .from('reservation_payments')
    .select('amount, payment_type')
    .eq('reservation_id', id)

  const totalReceived = round2(
    (existingPayments ?? [])
      .filter(p => p.payment_type !== 'refund')
      .reduce((s, p) => s + p.amount, 0)
  )

  // Verificar si la reserva está bloqueada
  if (isReservationLocked(current.gross_amount, totalReceived)) {
    // Solo se pueden editar las notas
    const safeFields = ['notes']
    const changedKeys = Object.keys(data).filter(k => k !== 'confirmed')
    const hasNonNoteChange = changedKeys.some(k => !safeFields.includes(k))
    if (hasNonNoteChange) {
      return {
        error:
          'Esta reserva ya está completamente cobrada. No se pueden modificar los importes. Si necesitas registrar un cargo adicional, gestiónalos fuera del sistema.',
      }
    }
  }

  const newGross = data.gross_amount ?? current.gross_amount
  const newChannelId = data.channel_id ?? current.channel_id
  const grossChanged = data.gross_amount !== undefined && data.gross_amount !== current.gross_amount

  // Si cambia el bruto y hay pagos existentes, pedir confirmación
  if (grossChanged && totalReceived > 0 && !data.confirmed) {
    const currentCommTotal = round2(
      current.total_sale_commission +
        current.total_sale_commission_vat +
        current.total_pay_commission +
        current.total_pay_commission_vat
    )
    const currentNet = round2(current.gross_amount - currentCommTotal)

    // Calcular nuevas comisiones manteniendo el pct_applied actual
    let newCommTotal = currentCommTotal
    if (newChannelId) {
      // Obtener comisiones actuales de la reserva para mantener el %
      const { data: existingComms } = await supabase
        .from('reservation_commissions')
        .select('commission_type, pct_applied, vat_pct')
        .eq('reservation_id', id)

      const saleComm = existingComms?.find(c => c.commission_type === 'sale')
      const payComm = existingComms?.find(c => c.commission_type === 'payment')

      const salePct = saleComm?.pct_applied ?? 0
      const saleVatPct = saleComm?.vat_pct ?? 0
      const payPct = payComm?.pct_applied ?? 0
      const payVatPct = payComm?.vat_pct ?? 0

      const saleAmt = round2(newGross * (salePct / 100))
      const saleVat = round2(saleAmt * (saleVatPct / 100))
      const payAmt = round2(newGross * (payPct / 100))
      const payVat = round2(payAmt * (payVatPct / 100))
      newCommTotal = round2(saleAmt + saleVat + payAmt + payVat)
    }

    const newNet = round2(newGross - newCommTotal)
    const pendingBefore = round2(current.gross_amount - totalReceived)
    const pendingAfter = round2(newGross - totalReceived)
    const isOverpaid = totalReceived > newGross

    const preview: GrossChangePreview = {
      gross_before: current.gross_amount,
      gross_after: newGross,
      commissions_before: currentCommTotal,
      commissions_after: newCommTotal,
      net_before: currentNet,
      net_after: newNet,
      total_received: totalReceived,
      pending_before: pendingBefore,
      pending_after: pendingAfter,
      is_overpaid: isOverpaid,
      overpaid_amount: isOverpaid ? round2(totalReceived - newGross) : 0,
    }

    return { requiresConfirmation: true, preview }
  }

  // Calcular nuevas comisiones si cambia gross_amount o channel_id
  // Mantiene el pct_applied actual de la reserva (no resetea al % del canal)
  let commissionUpdate: Partial<Reservation> = {}
  if (grossChanged || data.channel_id !== undefined) {
    const { data: existingComms } = await supabase
      .from('reservation_commissions')
      .select('commission_type, pct_applied, vat_pct, vat_treatment, channel_id, payment_method_id')
      .eq('reservation_id', id)

    const saleComm = existingComms?.find(c => c.commission_type === 'sale')
    const payComm = existingComms?.find(c => c.commission_type === 'payment')

    // Si el usuario pasó comisiones explícitas en data.commissions, usarlas
    const overrides = data.commissions
    const salePct = overrides?.sale_pct ?? saleComm?.pct_applied ?? 0
    const saleVatPct = overrides?.sale_vat_pct ?? saleComm?.vat_pct ?? 0
    const payPct = overrides?.pay_pct ?? payComm?.pct_applied ?? 0
    const payVatPct = overrides?.pay_vat_pct ?? payComm?.vat_pct ?? 0

    const saleAmt = overrides?.sale_amount !== undefined ? overrides.sale_amount : round2(newGross * (salePct / 100))
    const saleVat = overrides?.sale_vat_amount !== undefined ? overrides.sale_vat_amount : round2(saleAmt * (saleVatPct / 100))
    const payAmt = overrides?.pay_amount !== undefined ? overrides.pay_amount : round2(newGross * (payPct / 100))
    const payVat = overrides?.pay_vat_amount !== undefined ? overrides.pay_vat_amount : round2(payAmt * (payVatPct / 100))

    commissionUpdate = {
      total_sale_commission: saleAmt,
      total_sale_commission_vat: saleVat,
      total_pay_commission: payAmt,
      total_pay_commission_vat: payVat,
    }

    // Reemplazar historial de comisiones
    await supabase
      .from('reservation_commissions')
      .delete()
      .eq('reservation_id', id)
      .eq('tenant_id', profile.tenant_id)

    const channelName = data.channel_id ?? 'Canal'
    const newRows: Omit<ReservationCommission, 'id' | 'reservation_id' | 'created_at'>[] = []

    if (saleAmt > 0 || salePct > 0) {
      newRows.push({
        tenant_id: profile.tenant_id,
        commission_type: 'sale',
        base_amount: newGross,
        pct_applied: salePct,
        amount: saleAmt,
        vat_pct: saleVatPct,
        vat_amount: saleVat,
        vat_treatment: saleComm?.vat_treatment ?? 'standard',
        channel_id: newChannelId,
        payment_method_id: null,
        description: `Comisión de venta ${channelName} (${salePct}%)`,
      })
    }

    if (payAmt > 0 || payPct > 0) {
      newRows.push({
        tenant_id: profile.tenant_id,
        commission_type: 'payment',
        base_amount: newGross,
        pct_applied: payPct,
        amount: payAmt,
        vat_pct: payVatPct,
        vat_amount: payVat,
        vat_treatment: payComm?.vat_treatment ?? 'standard',
        channel_id: newChannelId,
        payment_method_id: payComm?.payment_method_id ?? null,
        description: `Comisión de cobro (${payPct}%)`,
      })
    }

    if (newRows.length > 0) {
      await supabase
        .from('reservation_commissions')
        .insert(newRows.map(r => ({ ...r, reservation_id: id })))
    }
  }

  // Solo campos válidos de la tabla reservations — excluir cualquier campo
  // extra que pueda venir del wizard (charges, initial_payment, etc.)
  const validUpdate: Record<string, unknown> = {}
  const allowedFields = [
    'guest_name', 'guest_email', 'guest_phone', 'guest_country',
    'guests_count', 'checkin_date', 'checkout_date', 'gross_amount',
    'channel_id', 'currency', 'external_id', 'notes', 'property_id',
  ] as const
  for (const field of allowedFields) {
    if (data[field as keyof typeof data] !== undefined) {
      validUpdate[field] = data[field as keyof typeof data]
    }
  }

  const { data: updated, error } = await supabase
    .from('reservations')
    .update({
      ...validUpdate,
      ...commissionUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single()

  if (error) return { error: error.message }

  // Actualizar cargos si vienen en el input (delete + reinsert)
  if (data.charges !== undefined) {
    const { error: delErr } = await supabase
      .from('reservation_charges')
      .delete()
      .eq('reservation_id', id)
      .eq('tenant_id', profile.tenant_id)

    if (delErr) console.error('[updateReservation] delete charges error:', delErr.message)

    if (data.charges.length > 0) {
      const { error: insErr } = await supabase.from('reservation_charges').insert(
        data.charges.map(c => ({
          tenant_id: profile.tenant_id,
          reservation_id: id,
          template_id: c.template_id ?? null,
          name: c.name,
          charge_type: c.charge_type,
          amount: c.amount,
          vat_pct: c.vat_pct,
          vat_amount: round2(c.amount * (c.vat_pct / 100)),
          is_refundable: c.is_refundable,
          sort_order: c.sort_order,
          included_in_gross: c.included_in_gross ?? true,
          beneficiary: c.beneficiary ?? 'owner',
          provider_id: c.provider_id ?? null,
          provider_name_override: c.provider_name_override ?? null,
          charge_payment_status: !c.included_in_gross ? (c.charge_payment_status ?? 'pending') : null,
          charge_payment_method_id: c.charge_payment_method_id ?? null,
          charge_payment_date: c.charge_payment_date ?? null,
          charge_payment_reference: c.charge_payment_reference ?? null,
        }))
      )
      if (insErr) console.error('[updateReservation] insert charges error:', insErr.message)
    }
  }

  revalidatePath('/dashboard/bookings')
  revalidatePath('/dashboard/calendar')

  return { reservation: updated }
}

// Transiciones de estado permitidas
const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  const action = status === 'cancelled' ? 'cancel' : 'edit'
  if (!can(profile.tenant_role as TenantRole, 'reservations', action as 'edit' | 'cancel')) {
    return { error: 'No tienes permisos para esta acción' }
  }

  const { data: current } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!current) return { error: 'Reserva no encontrada' }

  const allowed = STATUS_TRANSITIONS[current.status as ReservationStatus]
  if (!allowed.includes(status)) {
    return {
      error: `No se puede pasar de "${current.status}" a "${status}"`,
    }
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  return {}
}

export async function addPayment(
  reservationId: string,
  data: AddPaymentInput
): Promise<{ error?: string; warning?: string; pending_amount?: number }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'No tienes permisos para registrar cobros' }
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('gross_amount')
    .eq('id', reservationId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!reservation) return { error: 'Reserva no encontrada' }

  const { data: existingPayments } = await supabase
    .from('reservation_payments')
    .select('amount, payment_type')
    .eq('reservation_id', reservationId)

  const totalReceived = round2(
    (existingPayments ?? [])
      .filter(p => p.payment_type !== 'refund')
      .reduce((s, p) => s + p.amount, 0)
  )

  let warning: string | undefined
  const newTotal = round2(
    totalReceived + (data.payment_type !== 'refund' ? data.amount : 0)
  )

  if (newTotal > reservation.gross_amount) {
    const saldoFavor = round2(newTotal - reservation.gross_amount)
    warning = `Este importe supera el pendiente. El cliente tendrá saldo a favor de ${saldoFavor.toFixed(2)}€.`
    // NO bloqueamos, solo advertimos
  }

  // Si el modal no mandó cuenta explícita, leerla del método de pago
  let paymentAccountId = data.payment_account_id ?? null
  if (!paymentAccountId && data.payment_method_id) {
    const { data: method } = await supabase
      .from('payment_method_settings')
      .select('payment_account_id')
      .eq('id', data.payment_method_id)
      .single()
    paymentAccountId = (method as { payment_account_id: string | null } | null)?.payment_account_id ?? null
  }

  const { error } = await supabase.from('reservation_payments').insert({
    tenant_id: profile.tenant_id,
    reservation_id: reservationId,
    payment_method_id: data.payment_method_id,
    payment_account_id: paymentAccountId,
    amount: data.amount,
    payment_date: data.payment_date,
    payment_type: data.payment_type,
    reference: data.reference ?? null,
    notes: data.notes ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')

  const newPending = round2(
    reservation.gross_amount - newTotal
  )

  return { pending_amount: newPending, warning }
}

export async function deletePayment(
  paymentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'No tienes permisos para eliminar cobros' }
  }

  const { data: payment } = await supabase
    .from('reservation_payments')
    .select('reservation_id')
    .eq('id', paymentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!payment) return { error: 'Cobro no encontrado' }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('status')
    .eq('id', payment.reservation_id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (reservation?.status === 'checked_out') {
    return {
      error: 'No se pueden eliminar cobros de una reserva con check-out realizado.',
    }
  }

  const { error } = await supabase
    .from('reservation_payments')
    .delete()
    .eq('id', paymentId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bookings')
  return {}
}

export async function getReservation(
  id: string
): Promise<{ reservation?: ReservationWithDetails; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select(`
      *,
      channel:channel_settings(*),
      property:properties(id, name, full_address)
    `)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error || !reservation) {
    return { error: error?.message ?? 'Reserva no encontrada' }
  }

  const [{ data: charges }, { data: commissions }, { data: payments }] =
    await Promise.all([
      supabase
        .from('reservation_charges')
        .select('*, provider:providers(id, name, provider_type)')
        .eq('reservation_id', id)
        .order('sort_order'),
      supabase
        .from('reservation_commissions')
        .select('*')
        .eq('reservation_id', id),
      supabase
        .from('reservation_payments')
        .select('*, payment_method:payment_method_settings(*)')
        .eq('reservation_id', id)
        .order('payment_date'),
    ])

  const calculated = buildCalculatedFields(
    reservation as unknown as Reservation,
    charges ?? [],
    payments ?? []
  )

  return {
    reservation: {
      ...reservation,
      charges: charges ?? [],
      commissions: commissions ?? [],
      payments: payments ?? [],
      ...calculated,
    } as unknown as ReservationWithDetails,
  }
}

export async function getReservations(
  filters: ReservationFilters = {}
): Promise<{
  reservations: ReservationListItem[]
  total: number
  page: number
  per_page: number
  error?: string
}> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return {
      reservations: [],
      total: 0,
      page: 1,
      per_page: 20,
      error: e instanceof Error ? e.message : 'Authentication failed',
    }
  }

  const page = filters.page ?? 1
  const per_page = filters.per_page ?? 20
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('reservations')
    .select(
      `
      *,
      channel:channel_settings(id, name, code, collection_party),
      property:properties(id, name)
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', profile.tenant_id)

  if (filters.property_id) query = query.eq('property_id', filters.property_id)
  if (filters.channel_id) query = query.eq('channel_id', filters.channel_id)
  if (filters.status?.length) query = query.in('status', filters.status)
  if (filters.date_from) query = query.gte('checkin_date', filters.date_from)
  if (filters.date_to) query = query.lte('checkin_date', filters.date_to)
  if (filters.search) query = query.ilike('guest_name', `%${filters.search}%`)

  query = query.order('checkin_date', { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    return { reservations: [], total: 0, page, per_page, error: error.message }
  }

  let reservations = (data ?? []) as unknown as ReservationListItem[]

  // Cargar pagos y cargos para calcular is_locked, pending_amount y total_charges
  const ids = reservations.map(r => r.id)
  if (ids.length > 0) {
    const [{ data: allPayments }, { data: allCharges }] = await Promise.all([
      supabase
        .from('reservation_payments')
        .select('reservation_id, amount, payment_type')
        .in('reservation_id', ids),
      supabase
        .from('reservation_charges')
        .select('reservation_id, amount, included_in_gross, beneficiary, charge_payment_status')
        .in('reservation_id', ids),
    ])

    const paymentsByRes: Record<string, { amount: number; payment_type: string }[]> = {}
    for (const p of allPayments ?? []) {
      if (!paymentsByRes[p.reservation_id]) paymentsByRes[p.reservation_id] = []
      paymentsByRes[p.reservation_id].push(p)
    }

    const chargesByRes: Record<string, { amount: number; included_in_gross: boolean | null; beneficiary: ChargeBeneficiary; charge_payment_status: string | null }[]> = {}
    for (const c of allCharges ?? []) {
      if (!chargesByRes[c.reservation_id]) chargesByRes[c.reservation_id] = []
      chargesByRes[c.reservation_id].push({
        amount: c.amount,
        included_in_gross: c.included_in_gross,
        beneficiary: c.beneficiary as ChargeBeneficiary,
        charge_payment_status: c.charge_payment_status,
      })
    }

    reservations = reservations.map(r => {
      const payments = paymentsByRes[r.id] ?? []
      const charges  = chargesByRes[r.id]  ?? []
      const calculated = buildCalculatedFields(r, charges, payments)
      return { ...r, ...calculated }
    })

    if (filters.has_pending) {
      reservations = reservations.filter(r => r.pending_amount > 0)
    }
  } else {
    reservations = reservations.map(r => ({
      ...r,
      ...buildCalculatedFields(r, [], []),
    }))
  }

  return { reservations, total: count ?? 0, page, per_page }
}

export async function deleteReservation(
  id: string
): Promise<{ error?: string; had_payments: boolean; had_charges: boolean }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed', had_payments: false, had_charges: false }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'delete')) {
    return { error: 'Solo el propietario puede eliminar reservas', had_payments: false, had_charges: false }
  }

  // Verificar que la reserva existe y pertenece al tenant
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!reservation) {
    return { error: 'Reserva no encontrada', had_payments: false, had_charges: false }
  }

  // Comprobar si tenía pagos o cargos (para mensaje informativo)
  const [{ count: paymentCount }, { count: chargeCount }] = await Promise.all([
    supabase.from('reservation_payments').select('id', { count: 'exact', head: true }).eq('reservation_id', id),
    supabase.from('reservation_charges').select('id', { count: 'exact', head: true }).eq('reservation_id', id),
  ])

  const had_payments = (paymentCount ?? 0) > 0
  const had_charges  = (chargeCount ?? 0) > 0

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message, had_payments, had_charges }

  revalidatePath('/dashboard/bookings')
  return { had_payments, had_charges }
}

export async function getReservationsSummary(
  filters: Pick<ReservationFilters, 'property_id' | 'date_from' | 'date_to'> = {}
): Promise<{ summary?: ReservationsSummary; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  let query = supabase
    .from('reservations')
    .select(
      'gross_amount, total_sale_commission, total_sale_commission_vat, total_pay_commission, total_pay_commission_vat, checkin_date, checkout_date, status'
    )
    .eq('tenant_id', profile.tenant_id)
    .not('status', 'in', '("cancelled","no_show")')

  if (filters.property_id) query = query.eq('property_id', filters.property_id)
  if (filters.date_from) query = query.gte('checkin_date', filters.date_from)
  if (filters.date_to) query = query.lte('checkin_date', filters.date_to)

  const { data: rows, error } = await query
  if (error) return { error: error.message }

  const data = rows ?? []
  const gross_total = round2(data.reduce((s, r) => s + r.gross_amount, 0))
  const comm_total = round2(
    data.reduce(
      (s, r) =>
        s +
        r.total_sale_commission +
        r.total_sale_commission_vat +
        r.total_pay_commission +
        r.total_pay_commission_vat,
      0
    )
  )
  const net_total = round2(gross_total - comm_total)

  return {
    summary: {
      total_reservations: data.length,
      gross_total,
      net_total,
      pending_total: 0, // calculado en UI desde lista
      occupancy_pct: 0,
    },
  }
}

export async function updateChargePayment(
  chargeId: string,
  input: {
    charge_payment_status: 'pending' | 'collected' | 'waived'
    charge_payment_method_id?: string
    charge_payment_date?: string
    charge_payment_reference?: string
  }
): Promise<{ error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'Sin permisos para editar cobros de cargos' }
  }

  const { error } = await supabase
    .from('reservation_charges')
    .update({
      charge_payment_status:    input.charge_payment_status,
      charge_payment_method_id: input.charge_payment_method_id ?? null,
      charge_payment_date:      input.charge_payment_date ?? null,
      charge_payment_reference: input.charge_payment_reference ?? null,
    })
    .eq('id', chargeId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/bookings')
  return {}
}

export async function getAvailableYears(): Promise<{ years: number[]; error?: string }> {
  const supabase = await createClient()
  const profile = await requireProfile(supabase)
  const currentYear = new Date().getFullYear()

  const { data } = await supabase
    .from('reservations')
    .select('checkin_date')
    .eq('tenant_id', profile.tenant_id)
    .order('checkin_date', { ascending: true })
    .limit(1)

  const earliestFromData = data?.[0]
    ? new Date(data[0].checkin_date).getFullYear()
    : currentYear

  const startYear = Math.min(earliestFromData, currentYear - 4, 2020)

  const years: number[] = []
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y)
  }

  return { years }
}
