// Pure utility functions for commission calculation — no 'use server', no async.
// Importable both from server actions and client components.

import type { CommissionResult, CommissionOverrides } from '@/types/reservations'

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcNights(checkin: string, checkout: string): number {
  return Math.round(
    (new Date(checkout).getTime() - new Date(checkin).getTime()) /
      (1000 * 60 * 60 * 24)
  )
}

// Calcula comisiones de forma pura. Si se pasan overrides los usa en lugar
// de los valores del canal, permitiendo edición manual en el formulario.
export function calculateCommissions(
  grossAmount: number,
  channel: {
    sale_commission_pct: number
    sale_commission_vat_pct: number
  },
  overrides?: Partial<{
    salePct: number
    saleAmount: number
    saleVatPct: number
    payPct: number
    payAmount: number
    payVatPct: number
  }>
): CommissionResult {
  const salePct = overrides?.salePct ?? channel.sale_commission_pct
  const saleAmount =
    overrides?.saleAmount !== undefined
      ? overrides.saleAmount
      : round2(grossAmount * (salePct / 100))
  const saleVatPct = overrides?.saleVatPct ?? channel.sale_commission_vat_pct
  const saleVatAmount = round2(saleAmount * (saleVatPct / 100))

  const payPct = overrides?.payPct ?? 0
  const payAmount =
    overrides?.payAmount !== undefined
      ? overrides.payAmount
      : round2(grossAmount * (payPct / 100))
  const payVatPct = overrides?.payVatPct ?? 0
  const payVatAmount = round2(payAmount * (payVatPct / 100))

  const totalCommissions = round2(
    saleAmount + saleVatAmount + payAmount + payVatAmount
  )
  const netAmount = round2(grossAmount - totalCommissions)

  return {
    salePct,
    saleAmount,
    saleVatPct,
    saleVatAmount,
    payPct,
    payAmount,
    payVatPct,
    payVatAmount,
    totalCommissions,
    netAmount,
  }
}

// Una reserva está "cerrada" cuando lo cobrado >= bruto.
export function isReservationLocked(
  grossAmount: number,
  totalReceived: number
): boolean {
  return totalReceived >= grossAmount
}

// Defaults de comisiones a partir de un canal, usados en el wizard.
export function defaultCommissionsFromChannel(
  gross: number,
  channel: { sale_commission_pct: number; sale_commission_vat_pct: number }
): CommissionOverrides {
  const salePct = channel.sale_commission_pct
  const saleAmt = round2(gross * (salePct / 100))
  const saleVatPct = channel.sale_commission_vat_pct
  const saleVatAmt = round2(saleAmt * (saleVatPct / 100))
  return {
    sale_pct: salePct,
    sale_amount: saleAmt,
    sale_vat_pct: saleVatPct,
    sale_vat_amount: saleVatAmt,
    pay_pct: 0,
    pay_amount: 0,
    pay_vat_pct: 0,
    pay_vat_amount: 0,
  }
}
