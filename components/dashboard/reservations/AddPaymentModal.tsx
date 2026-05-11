'use client'

import { useState, useEffect } from 'react'
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
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { DialogBody, DialogFooter } from '@/components/ui/dialog'
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

  useEffect(() => {
    getPaymentAccounts().then(({ accounts: a }) => setAccounts(a.filter(acc => acc.is_active)))
  }, [])

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

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={v => !v && onClose()}
      title="Registrar cobro"
      className="max-w-md z-[300]"
      overlayClassName="z-[290]"
    >
      <DialogBody className="space-y-4">
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
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecciona método..." />
            </SelectTrigger>
            <SelectContent>
              {activeMethods.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
              inputMode="decimal"
              min="0"
              step="0.01"
              className="h-11"
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
              <SelectTrigger className="h-11">
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
            className="h-11"
            value={form.payment_date}
            onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
          />
        </div>

        {/* Cuenta */}
        {accounts.length > 0 && (
          <div className="space-y-1.5">
            <Label>Cuenta <span className="font-normal text-slate-400">(opcional)</span></Label>
            <Select
              value={form.payment_account_id ?? '_none'}
              onValueChange={v => setForm(f => ({ ...f, payment_account_id: v === '_none' ? null : v }))}
            >
              <SelectTrigger className="h-11">
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
          <Label>Referencia <span className="font-normal text-slate-400">(opcional)</span></Label>
          <Input
            className="h-11"
            placeholder="Ej: transferencia #12345"
            value={form.reference}
            onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label>Notas <span className="font-normal text-slate-400">(opcional)</span></Label>
          <Input
            className="h-11"
            placeholder="Notas internas..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" className="rounded-full" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
        >
          {loading ? 'Guardando...' : 'Registrar cobro'}
        </Button>
      </DialogFooter>
    </ResponsiveModal>
  )
}
