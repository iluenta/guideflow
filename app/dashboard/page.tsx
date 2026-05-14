import React, { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getDashboardKPIs, getPropertyStatuses, getRecentActivity } from '@/app/actions/analytics'
import { KPICards } from '@/components/dashboard/KPICards'
import { PropertiesSection } from '@/components/dashboard/PropertiesSection'
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection'
import { DashboardErrorHandler } from '@/components/dashboard/DashboardErrorHandler'

export default async function DashboardPage() {
  const [kpis, properties, activity] = await Promise.all([
    getDashboardKPIs(),
    getPropertyStatuses(),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-8">
      <Suspense fallback={null}><DashboardErrorHandler /></Suspense>

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-landing-mint-deep shadow-[0_0_0_4px_rgba(45,212,191,0.2)]" />
            <span className="font-jetbrains text-[11px] tracking-[0.15em] uppercase text-landing-ink-mute">Panel de Control</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-landing-navy leading-[1.05]">
            Bienvenido
          </h1>
          <p className="mt-2 text-landing-ink-soft max-w-[520px] text-[14px] sm:text-[15px] leading-relaxed">
            Resumen de tus alojamientos y actividad reciente.
          </p>
        </div>
        <Link href="/dashboard/properties" className="shrink-0">
          <Button className="bg-landing-navy text-white rounded-full h-11 px-6 hover:bg-landing-navy-deep transition-all shadow-lg shadow-landing-navy/20 active:scale-95 font-medium text-[13px] w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva propiedad
          </Button>
        </Link>
      </div>

      {/* KPIs reales */}
      <KPICards kpis={kpis} />

      {/* Grid principal */}
      <div className="flex flex-col lg:grid gap-6 lg:grid-cols-3 w-full">
        <div className="lg:col-span-2">
          <PropertiesSection properties={properties} />
        </div>
        <div>
          <RecentActivitySection activities={activity} />
        </div>
      </div>
    </div>
  )
}
