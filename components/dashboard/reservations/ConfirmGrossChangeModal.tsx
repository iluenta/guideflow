'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import type { GrossChangePreview } from '@/types/reservations'

interface ConfirmGrossChangeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  preview: GrossChangePreview
  loading?: boolean
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function diff(before: number, after: number) {
  const d = after - before
  const sign = d > 0 ? '+' : ''
  return (
    <span className={d > 0 ? 'text-[#047857]' : d < 0 ? 'text-rose-600' : 'text-slate-400'}>
      {sign}{fmt(d)}€
    </span>
  )
}

export function ConfirmGrossChangeModal({
  open,
  onClose,
  onConfirm,
  preview,
  loading,
}: ConfirmGrossChangeModalProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-1">
            Confirmación requerida
          </p>
          <DialogTitle className="text-[22px] font-bold text-[#1e3a8a] tracking-tight">
            Modificar importe de la reserva
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          {/* Alerta de saldo a favor */}
          {preview.is_overpaid && (
            <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-rose-700 leading-relaxed">
                <strong>El importe ya cobrado ({fmt(preview.total_received)}€) supera el nuevo bruto ({fmt(preview.gross_after)}€).</strong>
                {' '}El cliente tiene un saldo a favor de{' '}
                <strong>{fmt(preview.overpaid_amount)}€</strong>.
                Deberás gestionar el reembolso manualmente.
              </p>
            </div>
          )}

          <p className="text-[13px] text-slate-500">
            Esta reserva tiene cobros registrados. Revisa el impacto del cambio antes de confirmar:
          </p>

          {/* Tabla de impacto */}
          <div className="bg-[#fafbfc] border border-[#eef2f7] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_110px_110px_90px] gap-0">
              {/* Header */}
              <div className="px-4 py-2.5 bg-white border-b border-[#eef2f7]" />
              <div className="px-3 py-2.5 bg-white border-b border-[#eef2f7] text-right font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">Antes</div>
              <div className="px-3 py-2.5 bg-white border-b border-[#eef2f7] text-right font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">Ahora</div>
              <div className="px-3 py-2.5 bg-white border-b border-[#eef2f7] text-right font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">Cambio</div>

              {/* Importe bruto */}
              <Row
                label="Importe bruto"
                before={preview.gross_before}
                after={preview.gross_after}
                bold
              />

              {/* Total comisiones */}
              <Row
                label="Total comisiones"
                before={preview.commissions_before}
                after={preview.commissions_after}
              />

              {/* Neto */}
              <Row
                label="Neto"
                before={preview.net_before}
                after={preview.net_after}
                highlight
              />

              {/* Cobros registrados */}
              <div className="px-4 py-3 border-t border-[#eef2f7] text-[13px] text-slate-600">
                Cobros registrados
              </div>
              <div className="px-3 py-3 border-t border-[#eef2f7] text-right font-mono font-semibold text-slate-800">
                {fmt(preview.total_received)}€
              </div>
              <div className="px-3 py-3 border-t border-[#eef2f7] text-right font-mono font-semibold text-slate-800">
                {fmt(preview.total_received)}€
              </div>
              <div className="px-3 py-3 border-t border-[#eef2f7] text-right font-mono text-[11px] text-slate-400">
                sin cambios
              </div>

              {/* Pendiente */}
              <Row
                label="Pendiente"
                before={preview.pending_before}
                after={preview.pending_after}
                pendingStyle
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-[#1e3a8a] hover:bg-[#15296b] text-white rounded-full"
          >
            {loading ? 'Aplicando...' : 'Confirmar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  before,
  after,
  bold,
  highlight,
  pendingStyle,
}: {
  label: string
  before: number
  after: number
  bold?: boolean
  highlight?: boolean
  pendingStyle?: boolean
}) {
  const d = after - before
  const sign = d > 0 ? '+' : ''
  const diffColor = d > 0 ? 'text-[#047857]' : d < 0 ? 'text-rose-600' : 'text-slate-400'
  const valueColor = pendingStyle
    ? after > 0 ? 'text-amber-600' : 'text-slate-400'
    : highlight ? 'text-[#1e3a8a]' : 'text-slate-800'

  return (
    <>
      <div className={`px-4 py-3 border-t border-[#eef2f7] text-[13px] ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'} ${highlight ? 'bg-[#eef2fb]' : ''}`}>
        {label}
      </div>
      <div className={`px-3 py-3 border-t border-[#eef2f7] text-right font-mono ${bold ? 'font-bold' : 'font-semibold'} text-[13px] ${highlight ? 'bg-[#eef2fb] text-[#1e3a8a]' : 'text-slate-600'}`}>
        {fmt(before)}€
      </div>
      <div className={`px-3 py-3 border-t border-[#eef2f7] text-right font-mono ${bold ? 'font-bold' : 'font-semibold'} text-[13px] ${valueColor} ${highlight ? 'bg-[#eef2fb]' : ''}`}>
        {fmt(after)}€
      </div>
      <div className={`px-3 py-3 border-t border-[#eef2f7] text-right font-mono text-[12px] ${diffColor} ${highlight ? 'bg-[#eef2fb]' : ''}`}>
        {d === 0 ? '—' : `${sign}${fmt(Math.abs(d))}€`}
      </div>
    </>
  )
}
