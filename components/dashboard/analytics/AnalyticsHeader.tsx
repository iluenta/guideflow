'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Property } from '@/app/actions/properties'

interface Props {
  properties: Property[]
  currentPropertyId: string
  year: number | 'all'
}

export function AnalyticsHeader({ properties, currentPropertyId, year }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function navigate(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString())
    value ? p.set(key, value) : p.delete(key)
    router.push(`${pathname}?${p.toString()}`)
  }

  const propName = currentPropertyId === 'all'
    ? 'Todas las propiedades'
    : properties.find(p => p.id === currentPropertyId)?.name ?? 'Propiedad'

  const yearLabel = year === 'all' ? 'Histórico completo' : String(year)

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2 mb-2">
          <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
          Dashboard
        </p>
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
          Analíticas
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          {yearLabel} · {propName}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={currentPropertyId}
          onChange={e => navigate('property_id', e.target.value === 'all' ? '' : e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#1e3a8a]"
        >
          <option value="all">Todas las propiedades</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
