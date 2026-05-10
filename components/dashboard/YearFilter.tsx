'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface YearFilterProps {
  availableYears: number[]
}

export function YearFilter({ availableYears }: YearFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentYear = String(new Date().getFullYear())
  const activeYear = searchParams.get('year') ?? currentYear

  function navigate(year: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', year)
    router.push(`${pathname}?${params.toString()}`)
  }

  const options = ['all', ...availableYears.map(String)]

  return (
    <div className="flex items-center gap-1">
      {options.map(y => (
        <button
          key={y}
          onClick={() => navigate(y)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeYear === y
              ? 'bg-landing-navy text-white'
              : 'text-landing-ink-soft hover:bg-landing-bg-deep'
          }`}
        >
          {y === 'all' ? 'Todos' : y}
        </button>
      ))}
    </div>
  )
}
