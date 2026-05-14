'use client'

import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react'
import { StatCard } from './StatCard'
import { cn } from '@/lib/utils'
import type { DashboardKPIs } from '@/types/analytics'

function fmtTrend(v: number | null): { change: string; trend: 'up' | 'down' | 'flat' } {
  if (v === null) return { change: '—', trend: 'flat' }
  if (v === 0)   return { change: '0%', trend: 'flat' }
  return { change: `${Math.abs(v)}%`, trend: v > 0 ? 'up' : 'down' }
}

function fmtCurrency(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const res  = fmtTrend(kpis.reservations_this_month_trend)
  const occ  = fmtTrend(kpis.occupancy_this_month_trend)
  const gst  = fmtTrend(kpis.active_guests_trend)
  const inc  = fmtTrend(kpis.net_income_this_month_trend)

  return (
    <div className="flex flex-col sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
      <StatCard label="Reservas este mes" value={String(kpis.reservations_this_month)} change={res.change} trend={res.trend} icon={Calendar}     variant="navy" />
      <StatCard label="Ocupación"         value={String(kpis.occupancy_this_month)}    unit="%" change={occ.change} trend={occ.trend} icon={TrendingUp} variant="mint" />
      <StatCard label="Huéspedes activos" value={String(kpis.active_guests_now)}       change={gst.change} trend={gst.trend} icon={Users}       variant="amber" />
      <StatCard label="Ingresos del mes"  value={fmtCurrency(kpis.net_income_this_month)} unit="€" change={inc.change} trend={inc.trend} icon={DollarSign} variant="navy" />
    </div>
  )
}
