import { cn } from '@/lib/utils'
import type { AnalyticsKPIs } from '@/types/analytics'

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 text-xs">—</span>
  const pos = value >= 0
  return (
    <span className={cn('text-xs font-medium', pos ? 'text-green-600' : 'text-red-500')}>
      {pos ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

interface KPICardProps {
  label: string
  value: string
  trend?: number | null
  tooltip?: string
}

function KPICard({ label, value, trend, tooltip }: KPICardProps) {
  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-4 flex flex-col gap-2" title={tooltip}>
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-2xl font-bold text-[#1e3a8a] leading-none">{value}</span>
      {trend !== undefined && <TrendBadge value={trend ?? null} />}
    </div>
  )
}

export function KPISummaryRow({ kpis }: { kpis: AnalyticsKPIs }) {
  const adrValue  = kpis.avg_daily_rate  > 0 ? `€${fmt(kpis.avg_daily_rate,  2)}` : '—'
  const revValue  = kpis.revpar          > 0 ? `€${fmt(kpis.revpar,          2)}` : '—'
  const leadValue = kpis.avg_lead_time !== null ? `${kpis.avg_lead_time}d` : '—'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard label="Ingresos brutos"  value={`€${fmt(kpis.total_gross_income, 2)}`} trend={kpis.vs_previous.gross_income} />
      <KPICard label="Ingresos netos"   value={`€${fmt(kpis.total_net_income,  2)}`} />
      <KPICard label="Ocupación"        value={`${kpis.occupancy_rate}%`}             trend={kpis.vs_previous.occupancy} />
      <KPICard label="ADR"              value={adrValue}  tooltip="Ingreso medio por noche ocupada" />
      <KPICard label="RevPAR"           value={revValue}  tooltip="Ingreso por noche disponible (ocupadas + libres)" />
      <KPICard label="Margen neto"      value={`${fmt(kpis.net_margin_pct, 1)}%`}     trend={kpis.vs_previous.net_margin} />
    </div>
  )
}
