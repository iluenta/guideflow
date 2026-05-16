'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CalendarCheck, Receipt, Search, X, ArrowRight } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/hooks/use-user-profile'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  type: 'property' | 'reservation' | 'expense'
  title: string
  subtitle: string
  href: string
}

const TYPE_CONFIG = {
  property:    { icon: Building2,     label: 'Propiedades',  color: 'bg-blue-50 text-blue-600' },
  reservation: { icon: CalendarCheck, label: 'Reservas',     color: 'bg-emerald-50 text-emerald-600' },
  expense:     { icon: Receipt,        label: 'Gastos',       color: 'bg-amber-50 text-amber-600' },
} as const

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const { profile } = useUserProfile()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebounce(query, 280)

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !profile?.tenant_id) { setResults([]); return }
    const supabase = createClient()
    const term = `%${q.trim()}%`

    const [{ data: props }, { data: reservations }, { data: expenses }] = await Promise.all([
      supabase.from('properties')
        .select('id, name, city, country')
        .eq('tenant_id', profile.tenant_id)
        .or(`name.ilike.${term},city.ilike.${term},full_address.ilike.${term}`)
        .neq('status', 'archived').limit(4),

      supabase.from('reservations')
        .select('id, guest_name, checkin_date, properties(name)')
        .eq('tenant_id', profile.tenant_id)
        .ilike('guest_name', term)
        .not('status', 'in', '(cancelled,no_show)')
        .order('checkin_date', { ascending: false }).limit(4),

      supabase.from('expenses')
        .select('id, description, expense_date, total_amount')
        .eq('tenant_id', profile.tenant_id)
        .ilike('description', term)
        .order('expense_date', { ascending: false }).limit(4),
    ])

    const items: Result[] = []

    for (const p of props ?? []) {
      items.push({
        id: p.id, type: 'property',
        title: p.name,
        subtitle: [p.city, p.country].filter(Boolean).join(', ') || 'Propiedad',
        href: `/dashboard/properties/${p.id}`,
      })
    }
    for (const r of reservations ?? []) {
      const propName = (r.properties as unknown as { name: string } | null)?.name ?? ''
      const checkin = r.checkin_date
        ? new Date(r.checkin_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : ''
      items.push({
        id: r.id, type: 'reservation',
        title: r.guest_name,
        subtitle: [propName, checkin].filter(Boolean).join(' · '),
        href: `/dashboard/bookings/${r.id}/edit`,
      })
    }
    for (const e of expenses ?? []) {
      const date = e.expense_date
        ? new Date(e.expense_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
        : ''
      const amt = e.total_amount != null
        ? `€${(e.total_amount as number).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
        : ''
      items.push({
        id: e.id, type: 'expense',
        title: e.description,
        subtitle: [date, amt].filter(Boolean).join(' · '),
        href: `/dashboard/expenses/${e.id}/edit`,
      })
    }

    setResults(items)
  }, [profile?.tenant_id])

  useEffect(() => {
    startTransition(() => { search(debouncedQuery) })
  }, [debouncedQuery, search])

  function handleSelect(href: string) {
    onOpenChange(false)
    setQuery('')
    router.push(href)
  }

  function handleOpenChange(value: boolean) {
    onOpenChange(value)
    if (!value) { setQuery(''); setResults([]) }
  }

  const grouped = {
    property:    results.filter(r => r.type === 'property'),
    reservation: results.filter(r => r.type === 'reservation'),
    expense:     results.filter(r => r.type === 'expense'),
  } as const

  const hasResults = results.length > 0
  const isSearching = debouncedQuery.trim().length > 0

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel — pegado arriba en mobile, centrado en desktop */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-white shadow-2xl',
            'outline-none',
            // Mobile: ocupa todo el ancho, pegado a la parte superior (bajo el banner dev)
            'inset-x-0 top-0 rounded-b-2xl',
            // Desktop: centrado, ancho fijo, con margen arriba
            'sm:inset-x-auto sm:top-[12vh] sm:left-1/2 sm:-translate-x-1/2',
            'sm:w-[580px] sm:rounded-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
            'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
            'sm:data-[state=closed]:slide-out-to-top-0 sm:data-[state=open]:slide-in-from-top-0',
            'duration-200',
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Búsqueda global</DialogPrimitive.Title>

          <CommandPrimitive shouldFilter={false} className="flex flex-col">

            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search className={cn('h-5 w-5 shrink-0 transition-colors', isSearching ? 'text-[#1e3a8a]' : 'text-slate-400')} />
              <CommandPrimitive.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Buscar propiedades, reservas, gastos..."
                className="flex-1 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-slate-500" />
                </button>
              )}
              <button
                onClick={() => handleOpenChange(false)}
                className="shrink-0 font-mono text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <CommandPrimitive.List className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: 'min(420px, 60vh)' }}
            >
              {/* Estado vacío inicial */}
              {!isSearching && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Search className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-500">Busca en todo el sistema</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">Propiedades, reservas y gastos</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {(['Propiedades', 'Reservas', 'Gastos'] as const).map((label, i) => {
                      const types = ['property', 'reservation', 'expense'] as const
                      const { icon: Icon, color } = TYPE_CONFIG[types[i]]
                      return (
                        <span key={label} className={cn('flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full', color)}>
                          <Icon className="h-3 w-3" />{label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sin resultados */}
              {isSearching && !isPending && !hasResults && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Search className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-500">Sin resultados para</p>
                  <p className="text-[13px] text-slate-800 font-semibold">&ldquo;{query}&rdquo;</p>
                </div>
              )}

              {/* Grupos de resultados */}
              {isSearching && hasResults && (Object.keys(grouped) as Array<keyof typeof grouped>).map(type => {
                const items = grouped[type]
                if (!items.length) return null
                const { icon: Icon, label, color } = TYPE_CONFIG[type]
                return (
                  <div key={type} className="px-2 pt-2 last:pb-2">
                    {/* Group heading */}
                    <div className="flex items-center gap-2 px-2 pb-1">
                      <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', color)}>
                        <Icon className="h-3 w-3" />{label}
                      </span>
                    </div>
                    {items.map(item => (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={`${item.type}-${item.id}`}
                        onSelect={() => handleSelect(item.href)}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-[#f0f4ff] transition-colors"
                      >
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-data-[selected=true]:text-[#1e3a8a] opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-all shrink-0" />
                      </CommandPrimitive.Item>
                    ))}
                  </div>
                )
              })}
            </CommandPrimitive.List>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↵</kbd>
                  abrir
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Esc</kbd>
                  cerrar
                </span>
              </div>
              {isPending && (
                <span className="text-[11px] text-slate-400 animate-pulse">Buscando...</span>
              )}
              {isSearching && !isPending && (
                <span className="text-[11px] text-slate-400">{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
              )}
            </div>

          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
