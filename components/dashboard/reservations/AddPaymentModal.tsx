'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
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
import { addPayment } from '@/app/actions/reservations'
import { getPaymentAccounts } from '@/app/actions/payment-accounts'
import { toast } from 'sonner'
import type { PaymentMethodSetting, AddPaymentInput } from '@/types/reservations'
import type { PaymentAccount } from '@/types/treasury'

interface AddPaymentModalProps {
  open: boolean
  onClose: () => void
  reservationId: string
  pendingAmount: number
  paymentMethods: PaymentMethodSetting[]
  onSuccess?: () => void
}

export function AddPaymentModal({
  open,
  onClose,
  reservationId,
  pendingAmount,
  paymentMethods,
  onSuccess,
}: AddPaymentModalProps) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState<AddPaymentInput>({
    payment_method_id: '',
    payment_account_id: null,
    amount: pendingAmount,
    payment_date: today,
    payment_type: 'payment',
    reference: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])

  // Cargar cuentas activas al montar
  useEffect(() => {
    getPaymentAccounts().then(({ accounts: a }) => setAccounts(a.filter(acc => acc.is_active)))
  }, [])

  // Reset amount when modal reopens with new pendingAmount
  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, amount: pendingAmount, payment_method_id: '', payment_account_id: null }))
    }
  }, [open, pendingAmount])

  const handleSubmit = async () => {
    if (!form.payment_method_id) {
      toast.error('Selecciona un método de pago')
      return
    }
    if (form.amount <= 0) {
      toast.error('El importe debe ser mayor que 0')
      return
    }

    setLoading(true)
    const result = await addPayment(reservationId, {
      ...form,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Cobro registrado correctamente')
      onSuccess?.()
      onClose()
    }
  }

  const activeMethods = paymentMethods.filter(m => m.is_active)

  if (!open) return null

  return (
    <>
      {/* Backdrop — por encima del drawer (z-210) */}
      <div
        className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[2px] z-[300]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-[0_24px_80px_-12px_rgba(15,23,42,0.3)] pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-[#eef2f7] flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-1">
                Cobro
              </p>
              <h2 className="text-[20px] font-bold text-[#1e3a8a] tracking-tight">
                Registrar cobro
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-[#f1f4f8] hover:text-slate-700 transition-colors mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Método de pago */}
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select
                value={form.payment_method_id}
                onValueChange={v => {
                  const method = activeMethods.find(m => m.id === v)
                  setForm(f => ({
                    ...f,
                    payment_method_id: v,
                    payment_account_id: method?.payment_account_id ?? null,
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método..." />
                </SelectTrigger>
                <SelectContent>
                  {activeMethods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Importe + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Importe (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount || ''}
                  onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
                {pendingAmount > 0 && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Pendiente: {pendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.payment_type}
                  onValueChange={v => setForm(f => ({ ...f, payment_type: v as AddPaymentInput['payment_type'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Depósito</SelectItem>
                    <SelectItem value="payment">Pago</SelectItem>
                    <SelectItem value="refund">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.payment_date}
                onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              />
            </div>

            {/* Cuenta */}
            {accounts.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Cuenta{' '}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </Label>
                <Select
                  value={form.payment_account_id ?? '_none'}
                  onValueChange={v => setForm(f => ({ ...f, payment_account_id: v === '_none' ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin asignar</SelectItem>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Referencia */}
            <div className="space-y-1.5">
              <Label>
                Referencia{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </Label>
              <Input
                placeholder="Ej: transferencia #12345"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>
                Notas{' '}
                <span className="font-normal text-slate-400">(opcional)</span>
              </Label>
              <Input
                placeholder="Notas internas..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex justify-end gap-2.5">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
            >
              {loading ? 'Guardando...' : 'Registrar cobro'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
