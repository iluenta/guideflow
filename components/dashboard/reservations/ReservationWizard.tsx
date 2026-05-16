'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Plus, Trash2, Check } from 'lucide-react'
import { ConfirmGrossChangeModal } from './ConfirmGrossChangeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createReservation, updateReservation } from '@/app/actions/reservations'
import { getChargeTemplates } from '@/app/actions/reservation-settings'
import { getProviders } from '@/app/actions/providers'
import { getPaymentAccounts } from '@/app/actions/payment-accounts'
import { round2, defaultCommissionsFromChannel } from '@/lib/reservations/commission-utils'
import { toast } from 'sonner'
import type {
  ChannelSetting,
  PaymentMethodSetting,
  CommissionOverrides,
  CreateReservationInput,
  CreateReservationChargeInput,
  ChargeType,
  ChargeBeneficiary,
  Provider,
} from '@/types/reservations'
import type { PaymentAccount } from '@/types/treasury'

interface Property {
  id: string
  name: string
  full_address: string | null
}

interface ReservationWizardProps {
  properties: Property[]
  channels: ChannelSetting[]
  paymentMethods: PaymentMethodSetting[]
  editingId?: string
  defaultValues?: Partial<CreateReservationInput>
  isLocked?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}


const CHARGE_TYPE_LABELS: Record<string, string> = {
  accommodation: 'Alojamiento',
  cleaning: 'Limpieza',
  deposit: 'Fianza',
  tourist_tax: 'Tasa turística',
  late_checkout: 'Late checkout',
  early_checkin: 'Early check-in',
  extra_guest: 'Huésped extra',
  pet: 'Mascota',
  other: 'Otro',
}

const STEP_LABELS = ['Datos básicos', 'Cargos y comisiones', 'Cobro inicial']

function defaultCommissions(
  gross: number,
  channel?: ChannelSetting,
  payMethod?: PaymentMethodSetting
): CommissionOverrides {
  if (!channel) {
    return { sale_pct: 0, sale_amount: 0, sale_vat_pct: 0, sale_vat_amount: 0, pay_pct: 0, pay_amount: 0, pay_vat_pct: 0, pay_vat_amount: 0 }
  }
  const base = defaultCommissionsFromChannel(gross, channel)
  if (!payMethod || payMethod.payment_commission_pct === 0) return base
  const payPct    = payMethod.payment_commission_pct
  const payAmt    = round2(gross * (payPct / 100))
  const payVatPct = payMethod.payment_commission_vat_pct
  const payVatAmt = round2(payAmt * (payVatPct / 100))
  return { ...base, pay_pct: payPct, pay_amount: payAmt, pay_vat_pct: payVatPct, pay_vat_amount: payVatAmt }
}

// Detecta el método de pago predeterminado para un canal
// (busca por código: channel.code dentro de payment_method.code, ej: "booking" en "booking_collect")
function findChannelPaymentMethod(
  channel: ChannelSetting | undefined,
  paymentMethods: PaymentMethodSetting[]
): PaymentMethodSetting | undefined {
  if (!channel || channel.collection_party !== 'platform') return undefined
  return paymentMethods.find(
    m => m.is_active && m.code.toLowerCase().includes(channel.code.toLowerCase())
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ReservationWizard({
  properties,
  channels,
  paymentMethods,
  editingId,
  defaultValues,
  isLocked = false,
}: ReservationWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    preview: import('@/types/reservations').GrossChangePreview | null
    pendingInput: CreateReservationInput | null
  }>({ open: false, preview: null, pendingInput: null })

  // Step 1 state
  const [form, setForm] = useState({
    property_id: defaultValues?.property_id ?? (properties[0]?.id ?? ''),
    channel_id: defaultValues?.channel_id ?? (channels.find(c => c.is_active)?.id ?? ''),
    external_id: defaultValues?.external_id ?? '',
    guest_name: defaultValues?.guest_name ?? '',
    guest_email: defaultValues?.guest_email ?? '',
    guest_phone: defaultValues?.guest_phone ?? '',
    guest_country: defaultValues?.guest_country ?? '',
    guests_count: defaultValues?.guests_count ?? 1,
    checkin_date: defaultValues?.checkin_date ?? '',
    checkout_date: defaultValues?.checkout_date ?? '',
    gross_amount: defaultValues?.gross_amount ?? 0,
    currency: defaultValues?.currency ?? 'EUR',
    notes: defaultValues?.notes ?? '',
  })

  const selectedChannel = channels.find(c => c.id === form.channel_id)

  // Step 2 state — charges
  const [charges, setCharges] = useState<CreateReservationChargeInput[]>(
    defaultValues?.charges ?? []
  )
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    getProviders(false).then(({ providers: data }) => setProviders(data ?? []))
  }, [])

  // Método de pago asociado al canal actual (para pre-rellenar comisión de cobro)
  const channelPayMethod = findChannelPaymentMethod(selectedChannel, paymentMethods)

  // Step 2 state — commissions (editables)
  const [commissions, setCommissions] = useState<CommissionOverrides>(
    defaultValues?.commissions ?? defaultCommissions(form.gross_amount, selectedChannel, channelPayMethod)
  )

  // Recalcular comisiones cuando cambia el canal en paso 1
  // Solo si el usuario no ha editado manualmente los valores
  const [commEdited, setCommEdited] = useState(!!defaultValues?.commissions)

  // Recalcular montos cuando cambia gross o canal en paso 1
  useEffect(() => {
    if (!commEdited) {
      const payMethod = findChannelPaymentMethod(selectedChannel, paymentMethods)
      setCommissions(defaultCommissions(form.gross_amount, selectedChannel, payMethod))
    }
  }, [form.gross_amount, form.channel_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 3 state — initial payment
  const [withPayment, setWithPayment] = useState(false)
  const [payment, setPayment] = useState({
    payment_method_id: channelPayMethod?.id ?? paymentMethods.find(m => m.is_active)?.id ?? '',
    payment_account_id: (channelPayMethod ?? paymentMethods.find(m => m.is_active))?.payment_account_id ?? null,
    amount: form.gross_amount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'payment' as 'deposit' | 'payment',
    reference: '',
  })
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])

  useEffect(() => {
    getPaymentAccounts().then(({ accounts }) =>
      setPaymentAccounts(accounts.filter(a => a.is_active))
    )
  }, [])

  useEffect(() => {
    setPayment(p => ({ ...p, amount: form.gross_amount }))
  }, [form.gross_amount])

  // Cuando se selecciona un método de pago en paso 3, actualizar comisión de cobro
  const handlePaymentMethodChange = useCallback(
    (methodId: string) => {
      const accountId = paymentMethods.find(m => m.id === methodId)?.payment_account_id ?? null
      setPayment(p => ({ ...p, payment_method_id: methodId, payment_account_id: accountId }))
      const method = paymentMethods.find(m => m.id === methodId)
      if (method && method.payment_commission_pct > 0) {
        const payPct = method.payment_commission_pct
        const payAmt = round2(form.gross_amount * (payPct / 100))
        const payVatPct = method.payment_commission_vat_pct
        const payVat = round2(payAmt * (payVatPct / 100))
        setCommissions(c => ({
          ...c,
          pay_pct: payPct,
          pay_amount: payAmt,
          pay_vat_pct: payVatPct,
          pay_vat_amount: payVat,
        }))
        setCommEdited(true)
        toast.info(`Comisión de cobro actualizada según ${method.name} (${payPct}%)`)
      } else if (method && method.payment_commission_pct === 0) {
        setCommissions(c => ({
          ...c,
          pay_pct: 0,
          pay_amount: 0,
          pay_vat_pct: 0,
          pay_vat_amount: 0,
        }))
      }
    },
    [paymentMethods, form.gross_amount]
  )

  const loadTemplates = async () => {
    if (!form.property_id || charges.length > 0) return
    setLoadingTemplates(true)
    const { templates } = await getChargeTemplates(form.property_id)
    const active = templates.filter(t => t.is_active)
    if (active.length > 0) {
      setCharges(
        active.map((t, i) => ({
          template_id:       t.id,
          name:              t.name,
          charge_type:       t.charge_type,
          amount:            t.default_amount ?? 0,
          vat_pct:           t.vat_pct ?? 0,
          is_refundable:     t.is_refundable,
          sort_order:        i,
          included_in_gross: t.included_in_gross,
          beneficiary:       (t.default_provider_id ? 'provider' : 'owner') as ChargeBeneficiary,
          provider_id:       t.default_provider_id ?? undefined,
          charge_payment_status: t.included_in_gross ? undefined : 'pending',
        }))
      )
    }
    setLoadingTemplates(false)
  }

  const handleNext = async () => {
    if (step === 0) {
      if (!form.property_id || !form.channel_id || !form.guest_name || !form.checkin_date || !form.checkout_date || form.gross_amount <= 0) {
        toast.error('Completa todos los campos obligatorios')
        return
      }
      if (new Date(form.checkout_date) <= new Date(form.checkin_date)) {
        toast.error('La fecha de salida debe ser posterior a la de entrada')
        return
      }
      await loadTemplates()
      setStep(1)
    } else if (step === 1) {
      setStep(2)
    }
  }

  const handleBack = () => setStep(s => s - 1)

  const buildInput = (): CreateReservationInput => ({
    property_id: form.property_id,
    channel_id: form.channel_id,
    guest_name: form.guest_name,
    guest_email: form.guest_email || undefined,
    guest_phone: form.guest_phone || undefined,
    guest_country: form.guest_country || undefined,
    guests_count: form.guests_count,
    checkin_date: form.checkin_date,
    checkout_date: form.checkout_date,
    gross_amount: form.gross_amount,
    currency: form.currency,
    external_id: form.external_id || undefined,
    notes: form.notes || undefined,
    charges,
    commissions,
    initial_payment:
      withPayment && payment.amount > 0
        ? {
            payment_method_id: payment.payment_method_id,
            payment_account_id: payment.payment_account_id ?? undefined,
            amount: payment.amount,
            payment_date: payment.payment_date,
            payment_type: payment.payment_type,
            reference: payment.reference || undefined,
          }
        : undefined,
  })

  const applyUpdate = async (input: CreateReservationInput, confirmed = false) => {
    const result = await updateReservation(editingId!, { ...input, confirmed })
    if (result.requiresConfirmation && result.preview) {
      setConfirmModal({ open: true, preview: result.preview, pendingInput: input })
      return false
    }
    if (result.error) {
      toast.error(result.error)
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    const input = buildInput()

    if (editingId) {
      const ok = await applyUpdate(input)
      if (!ok) {
        setLoading(false)
        return
      }
      toast.success('Reserva actualizada')
    } else {
      const { error } = await createReservation(input)
      if (error) {
        toast.error(error)
        setLoading(false)
        return
      }
      toast.success('Reserva creada correctamente')
    }

    setLoading(false)
    window.location.href = editingId
      ? `/dashboard/bookings?view=${editingId}`
      : '/dashboard/bookings'
  }

  const handleConfirmGrossChange = async () => {
    if (!confirmModal.pendingInput || !editingId) return
    setLoading(true)
    const result = await updateReservation(editingId, {
      ...confirmModal.pendingInput,
      confirmed: true,
    })
    setLoading(false)
    setConfirmModal({ open: false, preview: null, pendingInput: null })
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Reserva actualizada')
    window.location.href = `/dashboard/bookings?view=${editingId}`
  }

  const addCharge = (included_in_gross = true) => {
    setCharges(prev => [
      ...prev,
      {
        name: '',
        charge_type: 'other' as ChargeType,
        amount: 0,
        vat_pct: 0,
        is_refundable: false,
        sort_order: prev.length,
        included_in_gross,
        beneficiary: 'owner' as ChargeBeneficiary,
        provider_id: undefined,
        provider_name_override: undefined,
        charge_payment_status: included_in_gross ? undefined : 'pending',
      },
    ])
  }

  const updateCharge = (idx: number, field: keyof CreateReservationChargeInput, value: unknown) => {
    setCharges(prev => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)))
  }

  const removeCharge = (idx: number) => {
    setCharges(prev => prev.filter((_, i) => i !== idx))
  }

  // Helpers para editar comisiones con cálculo bidireccional
  const updateSalePct = (pct: number) => {
    const amt = round2(form.gross_amount * (pct / 100))
    const vat = round2(amt * (commissions.sale_vat_pct / 100))
    setCommissions(c => ({ ...c, sale_pct: pct, sale_amount: amt, sale_vat_amount: vat }))
    setCommEdited(true)
  }
  const updateSaleAmt = (amt: number) => {
    const pct = form.gross_amount > 0 ? round2((amt / form.gross_amount) * 100) : 0
    const vat = round2(amt * (commissions.sale_vat_pct / 100))
    setCommissions(c => ({ ...c, sale_pct: pct, sale_amount: amt, sale_vat_amount: vat }))
    setCommEdited(true)
  }
  const updateSaleVatPct = (pct: number) => {
    const vat = round2(commissions.sale_amount * (pct / 100))
    setCommissions(c => ({ ...c, sale_vat_pct: pct, sale_vat_amount: vat }))
    setCommEdited(true)
  }
  const updatePayPct = (pct: number) => {
    const amt = round2(form.gross_amount * (pct / 100))
    const vat = round2(amt * (commissions.pay_vat_pct / 100))
    setCommissions(c => ({ ...c, pay_pct: pct, pay_amount: amt, pay_vat_amount: vat }))
    setCommEdited(true)
  }
  const updatePayAmt = (amt: number) => {
    const pct = form.gross_amount > 0 ? round2((amt / form.gross_amount) * 100) : 0
    const vat = round2(amt * (commissions.pay_vat_pct / 100))
    setCommissions(c => ({ ...c, pay_pct: pct, pay_amount: amt, pay_vat_amount: vat }))
    setCommEdited(true)
  }
  const updatePayVatPct = (pct: number) => {
    const vat = round2(commissions.pay_amount * (pct / 100))
    setCommissions(c => ({ ...c, pay_vat_pct: pct, pay_vat_amount: vat }))
    setCommEdited(true)
  }

  // Cuando cambia el canal en paso 1, resetear comisiones al volver a paso 2
  const handleChannelChange = (channelId: string) => {
    setForm(f => ({ ...f, channel_id: channelId }))
    const ch = channels.find(c => c.id === channelId)
    if (ch) {
      setCommissions(defaultCommissions(form.gross_amount, ch))
      setCommEdited(false)
      // Si ya estamos en paso 2, notificar
      if (step === 1) {
        toast.info(`Comisiones actualizadas según ${ch.name}. Puedes editarlas si esta reserva tiene condiciones distintas.`)
      }
    }
  }

  const grossCharges = charges.filter(c => c.included_in_gross !== false)
  const extraCharges = charges.filter(c => c.included_in_gross === false)
  const chargesTotal = round2(grossCharges.reduce((s, c) => s + (c.amount || 0), 0))
  const chargesDiff = round2(form.gross_amount - chargesTotal)

  const totalCommissions = round2(
    commissions.sale_amount +
      commissions.sale_vat_amount +
      commissions.pay_amount +
      commissions.pay_vat_amount
  )
  const netAmount = round2(form.gross_amount - totalCommissions)
  const activePaymentMethods = paymentMethods.filter(m => m.is_active)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Locked banner */}
      {isLocked && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-800">
          <span className="text-[16px]">🔒</span>
          <span>
            <strong>Esta reserva está completamente cobrada.</strong> Solo puedes editar las notas.
          </span>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                i < step ? 'bg-[#1e3a8a] text-white' : i === step ? 'bg-[#1e3a8a] text-white' : 'bg-[#f1f4f8] text-slate-400'
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[13px] font-medium ${
                i === step ? 'text-[#1e3a8a]' : i < step ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-px w-6 ${i < step ? 'bg-[#1e3a8a]' : 'bg-[#e2e8f0]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ─── STEP 0: Datos básicos ─── */}
      {step === 0 && (
        <div className="bg-white border border-[#eef2f7] rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Propiedad <span className="text-rose-500">*</span></Label>
              <Select
                value={form.property_id}
                onValueChange={v => setForm(f => ({ ...f, property_id: v }))}
                disabled={isLocked}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {properties.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Canal <span className="text-rose-500">*</span></Label>
              <Select
                value={form.channel_id}
                onValueChange={handleChannelChange}
                disabled={isLocked}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {channels.filter(c => c.is_active).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Referencia externa <span className="text-slate-400 font-normal">(opcional)</span></Label>
            <Input
              placeholder="Ej: AIR-12345"
              value={form.external_id}
              onChange={e => setForm(f => ({ ...f, external_id: e.target.value }))}
            />
          </div>

          <hr className="border-[#eef2f7]" />

          <div className="space-y-1.5">
            <Label>Nombre del huésped <span className="text-rose-500">*</span></Label>
            <Input
              placeholder="Nombre completo"
              value={form.guest_name}
              onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Email <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={form.guest_email}
                onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input
                placeholder="+34 600 000 000"
                value={form.guest_phone}
                onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>País <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input
                placeholder="España"
                value={form.guest_country}
                onChange={e => setForm(f => ({ ...f, guest_country: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº huéspedes <span className="text-rose-500">*</span></Label>
              <Input
                type="number"
                min="1"
                value={form.guests_count}
                onChange={e => setForm(f => ({ ...f, guests_count: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <hr className="border-[#eef2f7]" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Check-in <span className="text-rose-500">*</span></Label>
              <Input
                type="date"
                value={form.checkin_date}
                disabled={isLocked}
                onChange={e => setForm(f => ({ ...f, checkin_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out <span className="text-rose-500">*</span></Label>
              <Input
                type="date"
                value={form.checkout_date}
                disabled={isLocked}
                onChange={e => setForm(f => ({ ...f, checkout_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Importe bruto (€) <span className="text-rose-500">*</span></Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.gross_amount || ''}
              disabled={isLocked}
              onChange={e => setForm(f => ({ ...f, gross_amount: parseFloat(e.target.value) || 0 }))}
            />
            <p className="text-[11px] text-slate-400">Lo que pagó el huésped en total</p>
          </div>

          <div className="space-y-1.5">
            <Label>Notas internas <span className="text-slate-400 font-normal">(opcional)</span></Label>
            <Input
              placeholder="Notas privadas..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* ─── STEP 1: Cargos y comisiones ─── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Sección A: Cargos incluidos en el precio del canal */}
          <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eef2f7] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[14px] text-slate-800">Cargos incluidos en el precio</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Desglose informativo del importe bruto del canal</p>
              </div>
              {grossCharges.length > 0 && (
                <span className={`font-mono text-[12px] font-semibold ${Math.abs(chargesDiff) <= 0.01 ? 'text-[#047857]' : 'text-amber-600'}`}>
                  {fmt(chargesTotal)}€ / {fmt(form.gross_amount)}€
                </span>
              )}
            </div>

            {loadingTemplates ? (
              <div className="p-8 text-center text-[13px] text-slate-400">Cargando plantillas...</div>
            ) : (
              <>
                {grossCharges.length > 0 && (
                  <div className="hidden sm:grid grid-cols-[1fr_80px_100px_32px] gap-3 px-4 py-2 bg-[#fafbfc] border-b border-[#eef2f7]">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Concepto</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 text-right">IVA %</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 text-right">Importe</span>
                    <span />
                  </div>
                )}

                {charges.map((c, idx) => c.included_in_gross !== false && (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_32px] gap-3 items-center px-4 py-3 sm:py-2.5 border-b border-[#eef2f7] last:border-b-0">
                    <div className="flex gap-2 min-w-0">
                      <Select
                        value={c.charge_type}
                        onValueChange={v => updateCharge(idx, 'charge_type', v)}
                        disabled={isLocked}
                      >
                        <SelectTrigger className="h-8 text-[12px] w-[120px] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CHARGE_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-[13px] min-w-0"
                        placeholder="Descripción"
                        value={c.name}
                        disabled={isLocked}
                        onChange={e => updateCharge(idx, 'name', e.target.value)}
                      />
                    </div>
                    <Input
                      className="h-8 text-[13px] text-right font-mono"
                      type="number"
                      min="0"
                      step="0.01"
                      value={c.vat_pct}
                      disabled={isLocked}
                      onChange={e => updateCharge(idx, 'vat_pct', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      className="h-8 text-[13px] text-right font-mono"
                      type="number"
                      min="0"
                      step="0.01"
                      value={c.amount || ''}
                      disabled={isLocked}
                      onChange={e => updateCharge(idx, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    {!isLocked && (
                      <button
                        onClick={() => removeCharge(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#ffe4e6] hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {!isLocked && (
                  <div className="px-4 py-3">
                    <button
                      onClick={() => addCharge(true)}
                      className="flex items-center gap-1.5 text-[12px] text-[#1e3a8a] font-medium hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir cargo incluido
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Diferencia cargos/bruto — solo si hay cargos incluidos */}
          {grossCharges.length > 0 && Math.abs(chargesDiff) > 0.01 && (
            <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              {chargesDiff > 0
                ? `Faltan €${fmt(chargesDiff)} para llegar al bruto (€${fmt(form.gross_amount)})`
                : `Los cargos superan el bruto en €${fmt(Math.abs(chargesDiff))}`}
            </p>
          )}

          {/* Sección B: Cargos adicionales (extras fuera del canal) */}
          <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eef2f7]">
              <h3 className="font-semibold text-[14px] text-slate-800">Cargos adicionales</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Extras fuera del canal — fianza, late checkout, mascotas, etc.</p>
            </div>

            {charges.map((c, idx) => c.included_in_gross === false && (
              <div key={idx} className="px-4 py-3 border-b border-[#eef2f7] last:border-b-0 space-y-2">
                {/* Fila 1: tipo + descripción + importe + borrar */}
                <div className="flex gap-2 items-center">
                  <Select
                    value={c.charge_type}
                    onValueChange={v => updateCharge(idx, 'charge_type', v)}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="h-8 text-[12px] w-[130px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHARGE_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-[13px] flex-1 min-w-0"
                    placeholder="Descripción"
                    value={c.name}
                    disabled={isLocked}
                    onChange={e => updateCharge(idx, 'name', e.target.value)}
                  />
                  <Input
                    className="h-8 text-[13px] text-right font-mono w-[90px] shrink-0"
                    type="number"
                    min="0"
                    step="0.01"
                    value={c.amount || ''}
                    disabled={isLocked}
                    onChange={e => updateCharge(idx, 'amount', parseFloat(e.target.value) || 0)}
                  />
                  {!isLocked && (
                    <button
                      onClick={() => removeCharge(idx)}
                      className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#ffe4e6] hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* Fila 2: beneficiario + proveedor (inline si aplica) + estado */}
                <div className="flex items-center gap-2 flex-wrap">

                  {/* Toggle beneficiario */}
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                    {(['owner', 'provider'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        disabled={isLocked}
                        onClick={() => {
                          updateCharge(idx, 'beneficiary', val)
                          if (val === 'owner') {
                            updateCharge(idx, 'provider_id', undefined)
                            updateCharge(idx, 'provider_name_override', undefined)
                          }
                        }}
                        className={`h-8 px-3 text-[12px] font-medium transition-colors ${
                          (c.beneficiary ?? 'owner') === val
                            ? val === 'owner'
                              ? 'bg-[#1e3a8a] text-white'
                              : 'bg-amber-500 text-white'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {val === 'owner' ? 'Anfitrión' : 'Proveedor'}
                      </button>
                    ))}
                  </div>

                  {/* Selector de proveedor — inline, solo si beneficiary=provider */}
                  {c.beneficiary === 'provider' && (
                    <>
                      <Select
                        value={c.provider_id ?? '__adhoc__'}
                        onValueChange={v => {
                          if (v === '__adhoc__') {
                            updateCharge(idx, 'provider_id', undefined)
                          } else {
                            updateCharge(idx, 'provider_id', v)
                            updateCharge(idx, 'provider_name_override', undefined)
                          }
                        }}
                        disabled={isLocked}
                      >
                        <SelectTrigger className="h-8 text-[12px] w-[150px] shrink-0">
                          <SelectValue placeholder="Proveedor..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__adhoc__">Escribir nombre</SelectItem>
                          {providers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(!c.provider_id || c.provider_id === '__adhoc__') && (
                        <Input
                          className="h-8 text-[12px] w-[140px] shrink-0"
                          placeholder="Nombre..."
                          value={c.provider_name_override ?? ''}
                          disabled={isLocked}
                          onChange={e => updateCharge(idx, 'provider_name_override', e.target.value)}
                        />
                      )}
                    </>
                  )}

                  {/* Toggle estado de cobro */}
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-auto shrink-0">
                    {([
                      { value: 'pending',   label: 'Pendiente', active: 'bg-rose-50 text-rose-600 border-rose-200' },
                      { value: 'collected', label: 'Cobrado',   active: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { value: 'waived',    label: 'Condonado', active: 'bg-slate-100 text-slate-500 border-slate-200' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isLocked}
                        onClick={() => updateCharge(idx, 'charge_payment_status', opt.value)}
                        className={`h-8 px-2.5 text-[11px] font-medium transition-colors border-r last:border-r-0 border-slate-200 ${
                          (c.charge_payment_status ?? 'pending') === opt.value
                            ? opt.active
                            : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {!isLocked && (
              <div className="px-4 py-3">
                <button
                  onClick={() => addCharge(false)}
                  className="flex items-center gap-1.5 text-[12px] text-[#1e3a8a] font-medium hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir cargo adicional
                </button>
              </div>
            )}
          </div>

          {/* Sección comisiones */}
          <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eef2f7]">
              <h3 className="font-semibold text-[14px] text-slate-800">
                Comisiones
                {selectedChannel && (
                  <span className="ml-2 font-normal text-[12px] text-slate-400">
                    (calculadas desde {selectedChannel.name}, editables)
                  </span>
                )}
              </h3>
            </div>

            <div className="p-5 space-y-4">
              {/* Comisión de venta */}
              <CommissionBlock
                label="Comisión de venta"
                pct={commissions.sale_pct}
                amount={commissions.sale_amount}
                vatPct={commissions.sale_vat_pct}
                vatAmount={commissions.sale_vat_amount}
                grossAmount={form.gross_amount}
                disabled={isLocked}
                onPctChange={updateSalePct}
                onAmtChange={updateSaleAmt}
                onVatPctChange={updateSaleVatPct}
              />

              <hr className="border-[#eef2f7]" />

              {/* Comisión de cobro */}
              <CommissionBlock
                label="Comisión de cobro"
                pct={commissions.pay_pct}
                amount={commissions.pay_amount}
                vatPct={commissions.pay_vat_pct}
                vatAmount={commissions.pay_vat_amount}
                grossAmount={form.gross_amount}
                disabled={isLocked}
                onPctChange={updatePayPct}
                onAmtChange={updatePayAmt}
                onVatPctChange={updatePayVatPct}
                hint="Se actualizará según el método de cobro seleccionado en el paso 3"
              />

              <hr className="border-[#eef2f7]" />

              {/* Neto */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-[14px] font-bold text-[#1e3a8a]">Neto estimado</span>
                <span className="font-mono font-bold text-[18px] text-[#1e3a8a]">€{fmt(netAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Cobro inicial ─── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Desglose de cargos */}
          {charges.length > 0 && (
            <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#eef2f7]">
                <h3 className="font-semibold text-[14px] text-slate-800">Cargos</h3>
              </div>
              {charges.map((c, i) => (
                <div key={i} className="flex justify-between items-center px-5 py-3 border-b border-[#eef2f7] last:border-b-0 text-[13px]">
                  <span className="text-slate-700">{c.name || CHARGE_TYPE_LABELS[c.charge_type]}</span>
                  <span className="font-mono font-semibold text-slate-800">€{fmt(c.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-5 py-3 bg-[#f1f4f8] text-[13px] font-semibold">
                <span className="text-slate-700">Total cargos</span>
                <span className="font-mono text-[#1e3a8a]">€{fmt(chargesTotal)}</span>
              </div>
            </div>
          )}

          {/* Financial summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
            <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#eef2f7]">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-2">Bruto</p>
              <p className="text-[20px] font-bold text-slate-800">€{fmt(form.gross_amount)}</p>
            </div>
            <div className="p-4 border-b sm:border-b-0 sm:border-r border-[#eef2f7]">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-2">Comisiones</p>
              <p className="text-[20px] font-bold text-rose-600">-€{fmt(totalCommissions)}</p>
            </div>
            <div className="p-4 bg-[#eef2fb]">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#1e3a8a] mb-2">Neto</p>
              <p className="text-[20px] font-bold text-[#1e3a8a]">€{fmt(netAmount)}</p>
            </div>
          </div>

          {/* Toggle cobro */}
          <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-semibold text-slate-800">Registrar un cobro ahora</p>
                <p className="text-[12px] text-slate-400 mt-0.5">Opcional — puedes añadirlo más tarde</p>
              </div>
              <button
                onClick={() => setWithPayment(v => !v)}
                className={`w-9 h-5 rounded-full relative transition-colors ${withPayment ? 'bg-[#1e3a8a]' : 'bg-[#e2e8f0]'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${withPayment ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {withPayment && (
              <div className="space-y-4 pt-4 border-t border-[#eef2f7]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Método de pago</Label>
                    <Select
                      value={payment.payment_method_id}
                      onValueChange={handlePaymentMethodChange}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {activePaymentMethods.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select
                      value={payment.payment_type}
                      onValueChange={v =>
                        setPayment(p => ({ ...p, payment_type: v as 'deposit' | 'payment' }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Depósito</SelectItem>
                        <SelectItem value="payment">Pago completo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Importe (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={e =>
                        setPayment(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={payment.payment_date}
                      onChange={e => setPayment(p => ({ ...p, payment_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Referencia <span className="text-slate-400 font-normal">(opcional)</span></Label>
                    <Input
                      placeholder="Ref. transferencia, etc."
                      value={payment.reference}
                      onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))}
                    />
                  </div>
                  {paymentAccounts.length > 0 && (
                    <div className="space-y-1.5">
                      <Label>Cuenta <span className="text-slate-400 font-normal">(opcional)</span></Label>
                      <Select
                        value={payment.payment_account_id ?? '_none'}
                        onValueChange={v => setPayment(p => ({ ...p, payment_account_id: v === '_none' ? null : v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Sin asignar</SelectItem>
                          {paymentAccounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Resumen cobro */}
                <div className="bg-[#fafbfc] border border-[#eef2f7] rounded-xl p-4 space-y-2 text-[13px]">
                  <SummaryRow label="Bruto" value={`€${fmt(form.gross_amount)}`} />
                  <SummaryRow label="Total comisiones" value={`-€${fmt(totalCommissions)}`} valueClass="text-rose-600" />
                  <SummaryRow label="Neto" value={`€${fmt(netAmount)}`} valueClass="text-[#1e3a8a] font-bold" />
                  <hr className="border-[#eef2f7]" />
                  <SummaryRow label="Cobrado ahora" value={`€${fmt(payment.amount)}`} valueClass="text-[#047857]" />
                  <SummaryRow
                    label="Pendiente"
                    value={`€${fmt(round2(form.gross_amount - payment.amount))}`}
                    valueClass={form.gross_amount - payment.amount > 0 ? 'text-amber-600' : 'text-slate-400'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-10 mb-10">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={step === 0 ? () => router.back() : handleBack}
          disabled={loading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Cancelar' : 'Atrás'}
        </Button>

        {step < 2 ? (
          <Button
            className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
            onClick={handleNext}
            disabled={loading}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear reserva'}
          </Button>
        )}
      </div>

      {/* Modal de confirmación al modificar bruto con pagos existentes */}
      {confirmModal.preview && (
        <ConfirmGrossChangeModal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, preview: null, pendingInput: null })}
          onConfirm={handleConfirmGrossChange}
          preview={confirmModal.preview}
          loading={loading}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CommissionBlockProps {
  label: string
  pct: number
  amount: number
  vatPct: number
  vatAmount: number
  grossAmount: number
  disabled?: boolean
  hint?: string
  onPctChange: (v: number) => void
  onAmtChange: (v: number) => void
  onVatPctChange: (v: number) => void
}

function CommissionBlock({
  label,
  pct,
  amount,
  vatPct,
  vatAmount,
  grossAmount,
  disabled,
  hint,
  onPctChange,
  onAmtChange,
  onVatPctChange,
}: CommissionBlockProps) {
  const effectivePct =
    grossAmount > 0 ? ((amount / grossAmount) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-slate-700">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-400">% sobre bruto</Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={pct}
              disabled={disabled}
              onChange={e => onPctChange(parseFloat(e.target.value) || 0)}
              className="pr-6 font-mono text-[13px]"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-400">
            Importe
            <span className="ml-1 text-slate-300">({effectivePct}% efectivo)</span>
          </Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              disabled={disabled}
              onChange={e => onAmtChange(parseFloat(e.target.value) || 0)}
              className="pr-6 font-mono text-[13px]"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">€</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-400">IVA sobre comisión</Label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={vatPct}
              disabled={disabled}
              onChange={e => onVatPctChange(parseFloat(e.target.value) || 0)}
              className="pr-6 font-mono text-[13px]"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-slate-400">IVA importe</Label>
          <div className="relative">
            <Input
              type="number"
              value={vatAmount.toFixed(2)}
              disabled
              className="pr-6 font-mono text-[13px] bg-[#f1f4f8] text-slate-500"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">€</span>
          </div>
        </div>
      </div>
      {hint && (
        <p className="text-[11px] text-slate-400 italic">{hint}</p>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  valueClass = 'text-slate-800 font-medium',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${valueClass}`}>{value}</span>
    </div>
  )
}
