'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { confirmEstimatedExpense, uploadExpenseDocument } from '@/app/actions/expenses'
import type { ExpenseWithDetails } from '@/types/expenses'

interface ConfirmEstimatedModalProps {
  expense: ExpenseWithDetails
  onClose: () => void
  onConfirmed: () => void
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ConfirmEstimatedModal({ expense, onClose, onConfirmed }: ConfirmEstimatedModalProps) {
  const [realAmount, setRealAmount] = useState(String(expense.amount))
  const [invoiceNumber, setInvoiceNumber] = useState(expense.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate] = useState(expense.invoice_date ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    const amount = parseFloat(realAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Introduce un importe válido')
      return
    }

    setSaving(true)
    const { error } = await confirmEstimatedExpense(expense.id, {
      real_amount: amount,
      invoice_number: invoiceNumber || null,
      invoice_date: invoiceDate || null,
    })

    if (error) {
      toast.error(error)
      setSaving(false)
      return
    }

    if (file) {
      const fd = new FormData()
      fd.append('file', file)
      await uploadExpenseDocument(expense.id, fd)
    }

    toast.success('Gasto confirmado con importe real')
    onConfirmed()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef2f7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-[16px] font-bold text-slate-800">Confirmar gasto estimado</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info gasto */}
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-[12px] text-amber-700 font-medium mb-1">{expense.description}</p>
            <p className="text-[11px] text-amber-600">
              Importe estimado original: <strong>€{fmt(expense.amount)}</strong>
            </p>
          </div>

          {/* Importe real */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
              Importe real (sin IVA) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={realAmount}
                onChange={e => setRealAmount(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
              />
            </div>
          </div>

          {/* Número factura */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Nº factura
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="FAC-2026-001"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Fecha factura
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
              />
            </div>
          </div>

          {/* Adjuntar documento */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
              Adjuntar factura (opcional)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-landing-navy-tint file:text-landing-navy hover:file:bg-landing-navy/10 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-[#eef2f7]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-landing-navy text-white text-sm font-medium hover:bg-landing-navy-soft disabled:opacity-60"
          >
            {saving ? 'Confirmando...' : 'Confirmar importe'}
          </button>
        </div>
      </div>
    </div>
  )
}
