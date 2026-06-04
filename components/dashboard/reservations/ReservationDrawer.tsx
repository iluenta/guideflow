'use client'

import { useState, useCallback } from 'react'
import { X, Edit2, ChevronDown, Plus, Trash2, CreditCard, Lock, CheckCircle2, Clock, MinusCircle, CircleDollarSign, RotateCcw } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddPaymentModal } from './AddPaymentModal'
import { ReservationExpensesSection } from '@/components/dashboard/expenses/ReservationExpensesSection'
import { updateReservationStatus, deletePayment, getReservation, updateChargePayment } from '@/app/actions/reservations'
import { round2 } from '@/lib/reservations/commission-utils'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type {
  ReservationWithDetails,
  ReservationStatus,
  PaymentMethodSetting,
} from '@/types/reservations'
import {
  getDisplayStatus,
  getAvailableActions,
  DISPLAY_STATUS_CONFIG,
} from '@/lib/reservation-display-status'

// ─── Channel chip colors ──────────────────────────────────────────────────────
const CHANNEL_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  airbnb:   { bg: '#ffe5e9', color: '#be185d', dot: '#e11d48' },
  booking:  { bg: '#e0edff', color: '#1d4ed8', dot: '#1d4ed8' },
  direct:   { bg: '#ecfdf9', color: '#0d9488', dot: '#0d9488' },
  manual:   { bg: '#f1f4f8', color: '#475569', dot: '#94a3b8' },
  vrbo:     { bg: '#fef3c7', color: '#b45309', dot: '#d97706' },
}

function getChannelStyle(code: string) {
  return CHANNEL_STYLES[code] ?? CHANNEL_STYLES.manual
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ReservationDrawerProps {
  reservation: ReservationWithDetails | null
  open: boolean
  onClose: () => void
  paymentMethods: PaymentMethodSetting[]
  canEdit: boolean
  canCancel: boolean
  onEditClick: (id: string) => void
  onReservationUpdated: (updated: ReservationWithDetails) => void
}

export function ReservationDrawer({
  reservation,
  open,
  onClose,
  paymentMethods,
  canEdit,
  canCancel,
  onEditClick,
  onReservationUpdated,
}: ReservationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'payments' | 'guest' | 'expenses'>('summary')
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [providerWarningStatus, setProviderWarningStatus] = useState<ReservationStatus | null>(null)
  const [reopenModal, setReopenModal] = useState<'simple' | 'locked' | null>(null)
  const [chargeModal, setChargeModal] = useState<{
    chargeId: string
    date: string
    methodId: string
    reference: string
    loading: boolean
  } | null>(null)

  const doStatusChange = async (status: ReservationStatus) => {
    if (!reservation) return
    setStatusLoading(true)
    setProviderWarningStatus(null)
    const result = await updateReservationStatus(reservation.id, status)
    setStatusLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Estado actualizado')
      const { reservation: updated } = await getReservation(reservation.id)
      if (updated) onReservationUpdated(updated)
    }
  }

  const handleStatusChange = (status: ReservationStatus) => {
    if (!reservation) return
    const pendingProviderCharges = (reservation.charges ?? []).filter(
      c => !c.included_in_gross && c.beneficiary === 'provider' && c.charge_payment_status === 'pending'
    )
    if (pendingProviderCharges.length > 0) {
      setProviderWarningStatus(status)
    } else {
      doStatusChange(status)
    }
  }

  const handleReopenClick = () => {
    if (!reservation) return
    setReopenModal(reservation.is_locked ? 'locked' : 'simple')
  }

  const confirmReopen = async () => {
    setReopenModal(null)
    await doStatusChange('confirmed')
  }

  const openChargeModal = (chargeId: string) => {
    setChargeModal({
      chargeId,
      date: new Date().toISOString().split('T')[0],
      methodId: '',
      reference: '',
      loading: false,
    })
  }

  const handleConfirmChargePaid = async () => {
    if (!reservation || !chargeModal) return
    setChargeModal(m => m ? { ...m, loading: true } : null)
    const result = await updateChargePayment(chargeModal.chargeId, {
      charge_payment_status: 'collected',
      charge_payment_date: chargeModal.date,
      charge_payment_method_id: chargeModal.methodId || undefined,
      charge_payment_reference: chargeModal.reference || undefined,
    })
    setChargeModal(m => m ? { ...m, loading: false } : null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Cargo marcado como cobrado')
      setChargeModal(null)
      const { reservation: updated } = await getReservation(reservation.id)
      if (updated) onReservationUpdated(updated)
    }
  }

  const handleResetCharge = async (chargeId: string) => {
    if (!reservation) return
    const result = await updateChargePayment(chargeId, { charge_payment_status: 'pending' })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Estado restablecido a pendiente')
      const { reservation: updated } = await getReservation(reservation.id)
      if (updated) onReservationUpdated(updated)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!reservation) return
    const result = await deletePayment(paymentId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Cobro eliminado')
      const { reservation: updated } = await getReservation(reservation.id)
      if (updated) onReservationUpdated(updated)
    }
  }

  const handlePaymentSuccess = useCallback(async () => {
    if (!reservation) return
    const { reservation: updated } = await getReservation(reservation.id)
    if (updated) onReservationUpdated(updated)
  }, [reservation, onReservationUpdated])

  if (!reservation) return null

  const channelStyle = reservation.channel
    ? getChannelStyle(reservation.channel.code)
    : getChannelStyle('manual')

  const displayStatus = getDisplayStatus(reservation)
  const displayConfig = DISPLAY_STATUS_CONFIG[displayStatus]
  const availableActions = getAvailableActions(reservation)
  const allowedNextStatuses = availableActions
    .filter(a => a !== 'cancelar' || canCancel)
    .map(a => {
      if (a === 'confirmar') return { value: 'confirmed'  as ReservationStatus, label: 'Confirmar reserva', primary: true }
      if (a === 'finalizar') return { value: 'checked_out' as ReservationStatus, label: 'Finalizar', primary: false }
      if (a === 'cancelar')  return { value: 'cancelled'  as ReservationStatus, label: 'Cancelar', primary: false }
      return                        { value: 'no_show'    as ReservationStatus, label: 'No show', primary: false }
    })

  // El anfitrión recibe el neto (bruto - comisiones). La barra refleja cuánto
  // del neto ya ha entrado en su cuenta.
  const netPending = Math.max(0, round2(reservation.net_amount - reservation.total_received))
  const progressPct =
    reservation.net_amount > 0
      ? Math.min(100, (reservation.total_received / reservation.net_amount) * 100)
      : 0

  // Separar comisiones por tipo para mostrar desglose completo
  // commissions puede estar vacío mientras el detalle completo carga
  const commissions = reservation.commissions ?? []
  const charges = reservation.charges ?? []
  const payments = reservation.payments ?? []
  const saleComm = commissions.find(c => c.commission_type === 'sale')
  const payComm  = commissions.find(c => c.commission_type === 'payment')

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[rgba(15,23,42,0.45)] backdrop-blur-[2px] z-[200] transition-opacity duration-250 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 w-[640px] max-w-full h-screen bg-[#fafbfc] z-[210] flex flex-col shadow-[-20px_0_60px_-20px_rgba(15,23,42,0.2)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transition: 'transform .3s cubic-bezier(.2,.8,.2,1)' }}
      >
        {/* Header */}
        <div className="px-7 py-[22px] bg-white border-b border-[#eef2f7] flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {reservation.channel && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: channelStyle.bg, color: channelStyle.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: channelStyle.dot }} />
                  {reservation.channel.name}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase"
                style={{ background: displayConfig.bg, color: displayConfig.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: displayConfig.dot }} />
                {displayConfig.label}
              </span>
              {/* 🔒 is_locked badge */}
              {reservation.is_locked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-500">
                  <Lock className="h-3 w-3" />
                  Cerrada
                </span>
              )}
            </div>
            <h2 className="text-[22px] font-bold text-[#1e3a8a] tracking-tight leading-tight">
              {reservation.guest_name}
            </h2>
            <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-1 flex-wrap">
              <span>{formatDate(reservation.checkin_date)} → {formatDate(reservation.checkout_date)}</span>
              <span className="font-mono text-[10px] bg-[#f1f4f8] px-1.5 py-0.5 rounded">
                {reservation.nights}n
              </span>
              {reservation.property && <span>{reservation.property.name}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón reabrir — solo en reservas finalizadas */}
            {displayStatus === 'finished' && canEdit && (
              <Button
                variant="outline"
                size="sm"
                disabled={statusLoading}
                className="rounded-full text-[12px] h-8 gap-1.5"
                onClick={handleReopenClick}
              >
                <RotateCcw className="h-3 w-3" />
                Reabrir
              </Button>
            )}

            {/* Confirmar reserva — botón primario visible para pre-reservas */}
            {allowedNextStatuses.filter(s => s.primary).map(s => (
              <Button
                key={s.value}
                size="sm"
                disabled={statusLoading}
                className="rounded-full text-[12px] h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={() => handleStatusChange(s.value)}
              >
                ✓ {s.label}
              </Button>
            ))}

            {/* Dropdown para el resto de transiciones */}
            {allowedNextStatuses.filter(s => !s.primary).length > 0 && canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={statusLoading}
                    className="rounded-full text-[12px] h-8"
                  >
                    Estado <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[300]">
                  {allowedNextStatuses.filter(s => !s.primary).map(s => (
                    <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(s.value)}>
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={() => onEditClick(reservation.id)}
                title={reservation.is_locked ? 'Solo puedes editar las notas' : 'Editar'}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#eef2f7] px-7 bg-white">
          {(['summary', 'payments', 'guest', 'expenses'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'text-[#1e3a8a] border-[#1e3a8a]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              {tab === 'summary' && 'Resumen'}
              {tab === 'payments' && (
                <>
                  Cobros
                  <span className="ml-1.5 font-mono text-[10px] bg-[#f1f4f8] px-1.5 py-0.5 rounded-full">
                    {payments.length}
                  </span>
                </>
              )}
              {tab === 'guest' && 'Huésped'}
              {tab === 'expenses' && 'Gastos'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-7">

          {/* Banner overdue */}
          {displayStatus === 'overdue' && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3 mb-5">
              <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-orange-800">Checkout pendiente de cerrar</p>
                <p className="text-[11px] text-orange-600">El checkout fue el {formatDate(reservation.checkout_date)}</p>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 shrink-0"
                  disabled={statusLoading}
                  onClick={() => doStatusChange('checked_out')}
                >
                  Cerrar
                </Button>
              )}
            </div>
          )}

          {/* ── TAB: RESUMEN ── */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* ── Bloque canal ── */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 mb-3">Canal</h4>
                <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                  {/* Cargos incluidos en el bruto */}
                  {charges.filter(c => c.included_in_gross).map(c => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] text-[13px]">
                      <span className="text-slate-600">{c.name}</span>
                      <span className="font-mono font-medium text-slate-700">€{fmt(c.amount)}</span>
                    </div>
                  ))}
                  {/* Bruto */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] text-[13px] font-semibold">
                    <span className="text-slate-800">Bruto canal</span>
                    <span className="font-mono text-slate-800">€{fmt(reservation.gross_amount)}</span>
                  </div>
                  {/* Comisiones */}
                  {saleComm ? (
                    <>
                      <CommRow label={`Comisión de venta (${saleComm.pct_applied}%)`} amount={-saleComm.amount} />
                      {saleComm.vat_amount > 0 && (
                        <CommRow label={`IVA comisión venta (${saleComm.vat_pct}%)`} amount={-saleComm.vat_amount} muted />
                      )}
                    </>
                  ) : (
                    <CommRow label="Comisión de venta" amount={-reservation.total_sale_commission} />
                  )}
                  {payComm ? (
                    <>
                      <CommRow label={`Comisión de cobro (${payComm.pct_applied}%)`} amount={-payComm.amount} />
                      {payComm.vat_amount > 0 && (
                        <CommRow label={`IVA comisión cobro (${payComm.vat_pct}%)`} amount={-payComm.vat_amount} muted />
                      )}
                    </>
                  ) : reservation.total_pay_commission > 0 ? (
                    <CommRow label="Comisión de cobro" amount={-reservation.total_pay_commission} />
                  ) : null}
                  {/* Neto canal */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#eef2fb] text-[13px] font-bold">
                    <span className="text-[#1e3a8a]">Neto canal</span>
                    <span className="font-mono text-[#1e3a8a]">€{fmt(reservation.net_amount)}</span>
                  </div>
                </div>
              </div>

              {/* ── Bloque extras ── */}
              {charges.filter(c => !c.included_in_gross).length > 0 && (
                <div>
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 mb-3">Cargos adicionales</h4>
                  <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                    {charges.filter(c => !c.included_in_gross).map(c => {
                      const providerName = c.provider?.name ?? c.provider_name_override ?? null
                      const isPending = c.charge_payment_status === 'pending'
                      const isCollected = c.charge_payment_status === 'collected'
                      const isWaived = c.charge_payment_status === 'waived'
                      return (
                        <div key={c.id} className="px-4 py-3 border-b border-[#eef2f7] last:border-b-0 text-[13px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Nombre + proveedor */}
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 font-medium leading-tight">{c.name}</p>
                              {c.beneficiary === 'provider' && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {providerName ? `🔧 ${providerName}` : '🔧 Proveedor externo'}
                                </p>
                              )}
                            </div>
                            {/* Importe */}
                            <span className="font-mono font-semibold text-slate-800 shrink-0">€{fmt(c.amount)}</span>
                            {/* Badge estado */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap shrink-0 ${
                              isCollected ? 'bg-[#ecfdf5] text-[#047857]' :
                              isWaived    ? 'bg-[#f1f4f8] text-slate-500' :
                                            'bg-amber-50 text-amber-700'
                            }`}>
                              {isCollected && <CheckCircle2 className="h-3 w-3" />}
                              {isWaived    && <MinusCircle  className="h-3 w-3" />}
                              {isPending   && <Clock        className="h-3 w-3" />}
                              {isCollected ? 'Cobrado' : isWaived ? 'Condonado' : 'Pendiente'}
                            </span>
                            {/* Fecha si cobrado */}
                            {isCollected && c.charge_payment_date && (
                              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                                {formatDate(c.charge_payment_date)}
                              </span>
                            )}
                            {/* Acciones */}
                            {canEdit && (
                              <>
                                {isPending && (
                                  <button
                                    onClick={() => openChargeModal(c.id)}
                                    title="Marcar como cobrado"
                                    className="w-6 h-6 rounded-md flex items-center justify-center bg-[#ecfdf5] text-[#047857] hover:bg-[#d1fae5] transition-colors shrink-0"
                                  >
                                    <CircleDollarSign className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {(isCollected || isWaived) && (
                                  <button
                                    onClick={() => handleResetCharge(c.id)}
                                    title={isCollected ? 'Deshacer — volver a pendiente' : 'Reactivar — volver a pendiente'}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:bg-[#f1f4f8] hover:text-slate-500 transition-colors shrink-0"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {reservation.total_extras_owner > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-[#fafbfc] border-t border-[#eef2f7] text-[12px]">
                        <span className="text-slate-500">Extras anfitrión</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#047857] font-mono">€{fmt(reservation.total_extras_owner_collected)} cobrados</span>
                          {reservation.total_extras_owner_pending > 0 && (
                            <span className="text-amber-600 font-mono">€{fmt(reservation.total_extras_owner_pending)} pendientes</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Ingreso total del anfitrión ── */}
              <div className="grid grid-cols-3 bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                <div className="p-4 border-r border-[#eef2f7]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">Neto canal</p>
                  <p className="text-[16px] font-bold text-slate-700">€{fmt(reservation.net_amount)}</p>
                </div>
                <div className="p-4 border-r border-[#eef2f7]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-1.5">+ Extras</p>
                  <p className="text-[16px] font-bold text-[#047857]">€{fmt(reservation.total_extras_owner)}</p>
                </div>
                <div className="p-4 bg-[#eef2fb]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#1e3a8a] mb-1.5">Ingreso total</p>
                  <p className="text-[16px] font-bold text-[#1e3a8a]">€{fmt(reservation.total_income)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: COBROS ── */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              {/* is_locked banner */}
              {reservation.is_locked && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-600">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>Reserva cerrada — importe completamente cobrado</span>
                </div>
              )}

              {/* Progress bar */}
              <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Cobrado</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">Pendiente</span>
                </div>
                <div className="h-2 bg-[#f1f4f8] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-[#1e3a8a] rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-mono font-bold text-[18px] text-[#047857]">
                    €{fmt(reservation.total_received)}
                  </span>
                  <span
                    className={`font-mono font-bold text-[18px] ${
                      netPending > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    €{fmt(netPending)}
                  </span>
                </div>
              </div>

              {/* Payment list */}
              {payments.length > 0 ? (
                <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                  {payments.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 border-b border-[#eef2f7] last:border-b-0"
                    >
                      <div className="w-9 h-9 rounded-[10px] bg-[#ecfdf9] text-[#2dd4bf] flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">
                          {p.payment_method?.name ?? 'Método desconocido'}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {formatDate(p.payment_date)} ·{' '}
                          {p.payment_type === 'deposit'
                            ? 'Depósito'
                            : p.payment_type === 'refund'
                            ? 'Devolución'
                            : 'Pago'}
                          {p.reference && ` · ${p.reference}`}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-semibold text-[14px] ${
                          p.payment_type === 'refund' ? 'text-rose-600' : 'text-[#047857]'
                        }`}
                      >
                        {p.payment_type === 'refund' ? '-' : ''}€{fmt(Math.abs(p.amount))}
                      </span>
                      {canEdit && displayStatus !== 'finished' && !reservation.is_locked && (
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#ffe4e6] hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 text-center py-8">
                  No hay cobros registrados
                </p>
              )}

              {/* Botón registrar cobro: oculto si is_locked o checked_out */}
              {canEdit &&
                netPending > 0 &&
                !reservation.is_locked &&
                displayStatus !== 'finished' && (
                  <Button
                    onClick={() => setAddPaymentOpen(true)}
                    className="w-full bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar cobro
                  </Button>
                )}
            </div>
          )}

          {/* ── TAB: HUÉSPED ── */}
          {activeTab === 'guest' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                <InfoRow label="Nombre" value={reservation.guest_name} />
                {reservation.guest_email && (
                  <InfoRow label="Email" value={reservation.guest_email} />
                )}
                {reservation.guest_phone && (
                  <InfoRow label="Teléfono" value={reservation.guest_phone} />
                )}
                {reservation.guest_country && (
                  <InfoRow label="País" value={reservation.guest_country} />
                )}
                <InfoRow label="Nº huéspedes" value={String(reservation.guests_count)} />
              </div>

              <div className="bg-white border border-[#eef2f7] rounded-2xl overflow-hidden">
                <InfoRow label="Propiedad" value={reservation.property?.name ?? '—'} />
                <InfoRow label="Check-in" value={formatDate(reservation.checkin_date)} />
                <InfoRow label="Check-out" value={formatDate(reservation.checkout_date)} />
                <InfoRow label="Noches" value={String(reservation.nights)} />
                {reservation.external_id && (
                  <InfoRow label="Ref. externa" value={reservation.external_id} mono />
                )}
              </div>

              {reservation.notes && (
                <div className="bg-white border border-[#eef2f7] rounded-2xl p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 mb-2">
                    Notas
                  </p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">
                    {reservation.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: GASTOS ── */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <ReservationExpensesSection
                reservationId={reservation.id}
                reservationNetAmount={reservation.net_amount}
                canCreate={canEdit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        reservationId={reservation.id}
        pendingAmount={netPending}
        paymentMethods={paymentMethods}
        onSuccess={handlePaymentSuccess}
      />

      {/* Mini-modal: Marcar cargo como cobrado */}
      {chargeModal && (
        <>
          <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] z-[300]" onClick={() => setChargeModal(null)} />
          <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.3)] pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 border-b border-[#eef2f7] flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-0.5">Cargo</p>
                  <h3 className="text-[18px] font-bold text-[#1e3a8a] tracking-tight">Marcar como cobrado</h3>
                </div>
                <button onClick={() => setChargeModal(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>Fecha de cobro</Label>
                  <Input
                    type="date"
                    value={chargeModal.date}
                    onChange={e => setChargeModal(m => m ? { ...m, date: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Método de pago <span className="text-slate-400 font-normal">(opcional)</span></Label>
                  <Select
                    value={chargeModal.methodId || '__none__'}
                    onValueChange={v => setChargeModal(m => m ? { ...m, methodId: v === '__none__' ? '' : v } : null)}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin especificar</SelectItem>
                      {paymentMethods.filter(m => m.is_active).map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Referencia <span className="text-slate-400 font-normal">(opcional)</span></Label>
                  <Input
                    placeholder="Ej: transferencia #12345"
                    value={chargeModal.reference}
                    onChange={e => setChargeModal(m => m ? { ...m, reference: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-end gap-2.5">
                <Button variant="outline" className="rounded-full" onClick={() => setChargeModal(null)} disabled={chargeModal.loading}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
                  onClick={handleConfirmChargePaid}
                  disabled={chargeModal.loading}
                >
                  {chargeModal.loading ? 'Guardando...' : 'Confirmar cobro'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal reabrir — reserva NO locked (simple) */}
      {reopenModal === 'simple' && (
        <>
          <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] z-[300]" onClick={() => setReopenModal(null)} />
          <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.3)] pointer-events-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#eef2fb] flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5 text-[#1e3a8a]" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-slate-800 mb-1">¿Reabrir esta reserva?</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    La reserva volverá al estado <span className="font-medium text-slate-700">Sin cerrar</span> y podrás registrar cobros y editar los detalles.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <Button variant="outline" className="rounded-full" onClick={() => setReopenModal(null)} disabled={statusLoading}>
                  Cancelar
                </Button>
                <Button className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full" onClick={confirmReopen} disabled={statusLoading}>
                  {statusLoading ? 'Reabriendo...' : 'Reabrir'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal reabrir — reserva locked (con advertencia) */}
      {reopenModal === 'locked' && (
        <>
          <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] z-[300]" onClick={() => setReopenModal(null)} />
          <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.3)] pointer-events-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-slate-800 mb-1">Reserva completamente cobrada</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    Esta reserva tiene todos los cobros registrados y está contablemente cerrada. Reabrirla puede descuadrar tus cuentas de tesorería.
                  </p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-[12px] text-amber-800">
                ⚠️ Solo hazlo si hay un error en los datos o necesitas añadir un cobro adicional.
              </div>
              <div className="flex gap-2.5 justify-end">
                <Button variant="outline" className="rounded-full" onClick={() => setReopenModal(null)} disabled={statusLoading}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                  onClick={confirmReopen}
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Reabriendo...' : 'Reabrir igualmente'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Aviso cargos proveedor pendientes al cambiar estado */}
      {providerWarningStatus && (
        <>
          <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] z-[300]" />
          <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.3)] pointer-events-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-[22px] leading-none mt-0.5">⚠️</span>
                <div>
                  <p className="text-[14px] font-semibold text-slate-800 mb-1">
                    Cargos de proveedor pendientes
                  </p>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    {charges.filter(c => !c.included_in_gross && c.beneficiary === 'provider' && c.charge_payment_status === 'pending')
                      .map(c => {
                        const name = c.provider?.name ?? c.provider_name_override ?? 'Proveedor'
                        return `${c.name} — ${name} (€${fmt(c.amount)})`
                      }).join(', ')}{' '}
                    {charges.filter(c => !c.included_in_gross && c.beneficiary === 'provider' && c.charge_payment_status === 'pending').length === 1
                      ? 'está pendiente de confirmar cobro.'
                      : 'están pendientes de confirmar cobro.'}
                    {' '}Puedes cerrar la reserva igualmente si lo consideras oportuno.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setProviderWarningStatus(null)}
                  disabled={statusLoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
                  onClick={() => doStatusChange(providerWarningStatus)}
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Guardando...' : 'Cerrar igualmente'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-[#eef2f7] last:border-b-0 text-[13px]">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-800 ${mono ? 'font-mono text-[12px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function CommRow({
  label,
  amount,
  muted,
}: {
  label: string
  amount: number
  muted?: boolean
}) {
  const isNeg = amount < 0
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] last:border-b-0 text-[13px]">
      <span className={muted ? 'text-slate-400 text-[12px]' : 'text-slate-700'}>{label}</span>
      <span
        className={`font-mono font-semibold ${
          isNeg ? 'text-rose-600' : 'text-[#047857]'
        } ${muted ? 'text-[12px]' : ''}`}
      >
        {isNeg ? '-' : ''}€{Math.abs(amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
