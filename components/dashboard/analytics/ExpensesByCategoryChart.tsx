'use client'

import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import type { ExpenseCategoryDataPoint } from '@/types/analytics'

const COLORS = ['#1e3a8a','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe','#eff6ff','#94a3b8']

export function ExpensesByCategoryChart({ data }: { data: ExpenseCategoryDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
        <p className="text-[13px] font-semibold text-slate-700 mb-4">Gastos por categoría</p>
        <ChartEmptyState />
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-slate-700 mb-4">Gastos por categoría</p>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
          <XAxis type="number" tickFormatter={v => `€${v}`} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="category_label" width={90} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number, _: string, props: any) => [
              `€${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${props.payload.percentage}%)`,
              props.payload.category_label,
            ]}
          />
          <Bar dataKey="total" radius={[0,4,4,0]} label={{ position: 'right', formatter: (v: number) => `€${v.toLocaleString('es-ES', { minimumFractionDigits: 0 })}`, fontSize: 10, fill: '#64748b' }}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
