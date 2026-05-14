'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import type { ChannelDataPoint } from '@/types/analytics'

const CHANNEL_COLORS: Record<string, string> = {
  airbnb:  '#FF5A5F',
  booking: '#003580',
  direct:  '#10B981',
  manual:  '#6B7280',
  default: '#9CA3AF',
}

function getColor(code: string) {
  return CHANNEL_COLORS[code] ?? CHANNEL_COLORS.default
}

export function ChannelChart({ data }: { data: ChannelDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
        <p className="text-[13px] font-semibold text-slate-700 mb-4">Desglose por canal</p>
        <ChartEmptyState message="Sin reservas en este período" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-slate-700 mb-4">Desglose por canal</p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="gross_income" nameKey="channel_name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.channel_code)} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number, name: string) => [`€${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, name]} />
          <Legend
            formatter={(value, entry: any) => (
              <span className="text-xs text-slate-600">
                {value} — €{(entry.payload.gross_income ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })} ({entry.payload.percentage}%)
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
