'use client'

import { AlertTriangle, TrendingDown, Clock, CheckCircle } from 'lucide-react'
import type { ExpensesSummary } from '@/types/expenses'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface ExpenseKPIsProps {
  summary: ExpensesSummary
}

export function ExpenseKPIs({ summary }: ExpenseKPIsProps) {
  const kpis = [
    {
      label: 'Total gastos',
      value: `€${fmt(summary.total_expenses)}`,
      icon: TrendingDown,
      color: 'text-landing-navy',
      bg: 'bg-landing-navy-tint',
    },
    {
      label: 'Gastos de reserva',
      value: `€${fmt(summary.total_reservation_expenses)}`,
      icon: CheckCircle,
      color: 'text-landing-mint-deep',
      bg: 'bg-landing-mint-tint',
    },
    {
      label: 'Por confirmar',
      value: summary.pending_confirmation.toString(),
      icon: AlertTriangle,
      color: summary.pending_confirmation > 0 ? 'text-amber-600' : 'text-slate-400',
      bg: summary.pending_confirmation > 0 ? 'bg-amber-50' : 'bg-slate-50',
      suffix: summary.pending_confirmation > 0 ? ' gastos estimados' : ' gastos estimados',
    },
    {
      label: 'Pendiente de pago',
      value: summary.pending_payment.toString(),
      icon: Clock,
      color: summary.pending_payment > 0 ? 'text-rose-600' : 'text-slate-400',
      bg: summary.pending_payment > 0 ? 'bg-rose-50' : 'bg-slate-50',
      suffix: ' gastos',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map(kpi => (
        <div
          key={kpi.label}
          className="bg-white rounded-2xl border border-[#eef2f7] p-5 flex items-start gap-4"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">
              {kpi.label}
            </p>
            <p className={`text-[22px] font-bold leading-tight ${kpi.color}`}>
              {kpi.value}
            </p>
            {kpi.suffix && (
              <p className="text-[11px] text-slate-400 mt-0.5">{kpi.suffix}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
