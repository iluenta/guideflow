'use client'

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import type { MonthlyDataPoint } from '@/types/analytics'

function fmtY(v: number) {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`
  return `€${v}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as MonthlyDataPoint
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-[#1e3a8a]">Ingresos netos: €{d.net_income.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
      <p className="text-amber-600">Gastos: €{d.expenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
      <p className="text-emerald-600 font-medium">Margen: €{d.real_margin.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export function IncomeExpensesChart({ data }: { data: MonthlyDataPoint[] }) {
  const hasData = data.some(d => d.gross_income > 0 || d.expenses > 0)

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-slate-700 mb-4">Ingresos vs Gastos</p>
      {!hasData ? <ChartEmptyState /> : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month_label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis tickFormatter={fmtY} tick={{ fontSize: 11 }} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="net_income"  name="Ingresos netos" fill="#1e3a8a" radius={[3,3,0,0]} maxBarSize={32} />
            <Bar dataKey="expenses"    name="Gastos"         fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={32} />
            <Line dataKey="real_margin" name="Margen" type="monotone" stroke="#10b981" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
