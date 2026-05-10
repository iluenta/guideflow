'use client'

import { useState, useEffect, Suspense } from 'react'
import { getAvailableYears } from '@/app/actions/reservations'
import { YearFilter } from './YearFilter'

function YearFilterInner() {
  const currentYear = new Date().getFullYear()
  const [years, setYears] = useState<number[]>([currentYear])

  useEffect(() => {
    getAvailableYears().then(({ years: y }) => {
      if (y?.length) setYears(y)
    })
  }, [])

  return <YearFilter availableYears={years} />
}

export function YearFilterLoader() {
  return (
    <Suspense fallback={null}>
      <YearFilterInner />
    </Suspense>
  )
}
