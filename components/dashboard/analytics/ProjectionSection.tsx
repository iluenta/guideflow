'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import type { ProjectionDataPoint } from '@/types/analytics'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ProjectionDataPoint
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1 max-w-[200px]">
      <p className="font-semibold text-slate-700 mb-1">{label} {d.is_current_month ? '(mes actual)' : '(proyección)'}</p>
      <p className="text-[#1e3a8a]">Ingresos confirmados: €{d.projected_income.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
      <p className="text-[11px] text-slate-400">{d.confirmed_reservations} reserva{d.confirmed_reservations !== 1 ? 's' : ''}</p>
      <p className="text-amber-600">Gastos programados: €{d.projected_expenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
      <p className="text-emerald-600 font-medium">Margen proyectado: €{d.projected_margin.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export function ProjectionSection({ data }: { data: ProjectionDataPoint[] }) {
  const hasData = data.some(d => d.projected_income > 0 || d.projected_expenses > 0)

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-slate-700 mb-1">Proyección — próximos 6 meses</p>
      <p className="text-[11px] text-slate-400 mb-4">Basado en reservas confirmadas y gastos recurrentes activos</p>

      {!hasData ? (
        <ChartEmptyState message="No hay datos suficientes para proyectar. Confirma reservas futuras o configura gastos recurrentes." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `€${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} tick={{ fontSize: 11 }} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="projected_income"   name="Ingresos confirmados" maxBarSize={32} radius={[3,3,0,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.is_current_month ? '#1e3a8a' : '#93c5fd'} />)}
            </Bar>
            <Bar dataKey="projected_expenses" name="Gastos programados"   maxBarSize={32} radius={[3,3,0,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.is_current_month ? '#f59e0b' : '#fde68a'} />)}
            </Bar>
            <ReferenceLine y={0} stroke="#e2e8f0" />
          </BarChart>
        </ResponsiveContainer>
      )}

      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Ingresos basados en reservas ya confirmadas. Gastos basados en plantillas de gastos recurrentes activas. No incluye reservas futuras sin confirmar ni gastos variables.
      </p>
    </div>
  )
}
