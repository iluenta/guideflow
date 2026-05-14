'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { ChartEmptyState } from './ChartEmptyState'
import type { MonthlyDataPoint } from '@/types/analytics'

export function OccupancyChart({ data }: { data: MonthlyDataPoint[] }) {
  const hasData = data.some(d => d.occupancy_rate > 0)
  const avg = hasData
    ? Math.round(data.reduce((s, d) => s + d.occupancy_rate, 0) / data.filter(d => d.occupancy_rate > 0).length)
    : 0

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-5">
      <p className="text-[13px] font-semibold text-slate-700 mb-4">Ocupación mensual</p>
      {!hasData ? <ChartEmptyState /> : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1e3a8a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month_label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={40} />
            <Tooltip formatter={(v: number) => [`${v}%`, 'Ocupación']} labelFormatter={l => `${l}`} />
            <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: `Media ${avg}%`, position: 'right', fontSize: 10, fill: '#94a3b8' }} />
            <Area type="monotone" dataKey="occupancy_rate" name="Ocupación" stroke="#1e3a8a" strokeWidth={2} fill="url(#occGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
