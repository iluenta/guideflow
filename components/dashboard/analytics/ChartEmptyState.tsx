'use client'

import { BarChart2 } from 'lucide-react'

export function ChartEmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
      <BarChart2 className="h-10 w-10 mb-2 opacity-30" />
      <p className="text-sm">{message ?? 'Sin datos para este período'}</p>
    </div>
  )
}
