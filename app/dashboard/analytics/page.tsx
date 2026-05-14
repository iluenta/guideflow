import { Suspense } from 'react'
import {
  getAnalyticsKPIs,
  getMonthlyBreakdown,
  getChannelBreakdown,
  getExpenseBreakdown,
  getProjection,
} from '@/app/actions/analytics'
import { getProperties } from '@/app/actions/properties'
import { KPISummaryRow } from '@/components/dashboard/analytics/KPISummaryRow'
import { AnalyticsHeader } from '@/components/dashboard/analytics/AnalyticsHeader'
import { IncomeExpensesChart } from '@/components/dashboard/analytics/IncomeExpensesChart'
import { OccupancyChart } from '@/components/dashboard/analytics/OccupancyChart'
import { ChannelChart } from '@/components/dashboard/analytics/ChannelChart'
import { ExpensesByCategoryChart } from '@/components/dashboard/analytics/ExpensesByCategoryChart'
import { ProjectionSection } from '@/components/dashboard/analytics/ProjectionSection'

function parseYear(raw: string | undefined): number | 'all' {
  if (!raw || raw === 'all') return new Date().getFullYear()
  const n = parseInt(raw, 10)
  return isNaN(n) ? new Date().getFullYear() : n
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; property_id?: string }>
}) {
  const params     = await searchParams
  const year       = parseYear(params.year)
  const propertyId = params.property_id ?? 'all'

  const filters = { year, property_id: propertyId }

  const [kpis, monthly, channels, expensesByCategory, projection, properties] = await Promise.all([
    getAnalyticsKPIs(filters),
    getMonthlyBreakdown(filters),
    getChannelBreakdown(filters),
    getExpenseBreakdown(filters),
    getProjection(),
    getProperties(),
  ])

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <AnalyticsHeader properties={properties as any[]} currentPropertyId={propertyId} year={year} />
      </Suspense>

      <KPISummaryRow kpis={kpis} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IncomeExpensesChart data={monthly} />
        <OccupancyChart data={monthly} />
        <ChannelChart data={channels} />
        <ExpensesByCategoryChart data={expensesByCategory} />
      </div>

      <ProjectionSection data={projection} />
    </div>
  )
}
