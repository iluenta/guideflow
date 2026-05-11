'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getAccountBalance, getAccountMovements, getPaymentAccounts } from '@/app/actions/payment-accounts'
import { MovementList } from '@/components/dashboard/treasury/MovementList'
import type { PaymentAccount, AccountBalance, AccountMovement, AccountMovementFilters } from '@/types/treasury'
import { ACCOUNT_TYPE_LABELS } from '@/types/treasury'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AccountDetailPage() {
  const params = useParams()
  const id = params.id as string
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')

  const [account, setAccount] = useState<PaymentAccount | null>(null)
  const [balance, setBalance] = useState<AccountBalance | null>(null)
  const [movements, setMovements] = useState<AccountMovement[]>([])
  const [loading, setLoading] = useState(true)

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const filters: AccountMovementFilters = {
      type: filterType,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }
    const [{ accounts }, { balance: b }, { movements: m }] = await Promise.all([
      getPaymentAccounts(),
      getAccountBalance(id),
      getAccountMovements(id, filters),
    ])
    const found = accounts.find(a => a.id === id) ?? null
    setAccount(found)
    setBalance(b)
    setMovements(m)
    setLoading(false)
  }, [id, filterType, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const backHref = `/dashboard/treasury${yearParam ? `?year=${yearParam}` : ''}`

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      {/* Breadcrumb */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-landing-navy transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Tesorería
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-1">
          {account ? ACCOUNT_TYPE_LABELS[account.account_type] : '—'}
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.02em] text-[#1e3a8a]">
          {account?.name ?? 'Cuenta'}
        </h1>
      </div>

      {/* KPI de saldo */}
      {balance && (
        <div className="bg-white rounded-2xl border border-[#eef2f7] p-6 mb-6">
          <div className="flex flex-wrap gap-8 items-end">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Saldo estimado actual
              </p>
              <p className={`text-[40px] font-bold tracking-tight leading-none ${balance.estimated_balance >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
                €{fmt(balance.estimated_balance)}
              </p>
            </div>
            <div className="flex gap-6 pb-1">
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Saldo inicial</p>
                <p className="text-[15px] font-semibold text-slate-600">€{fmt(balance.opening_balance)}</p>
              </div>
              <div className="text-slate-300 self-center text-lg">+</div>
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Entradas totales</p>
                <p className="text-[15px] font-semibold text-emerald-700">€{fmt(balance.total_income)}</p>
              </div>
              <div className="text-slate-300 self-center text-lg">−</div>
              <div>
                <p className="text-[10px] text-slate-400 mb-0.5">Salidas totales</p>
                <p className="text-[15px] font-semibold text-rose-600">€{fmt(balance.total_expenses)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
        >
          <option value="all">Todos los movimientos</option>
          <option value="income">Solo entradas</option>
          <option value="expense">Solo salidas</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
        />
        <span className="text-slate-400 text-sm">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
        />

        {loading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
      </div>

      {/* Lista de movimientos */}
      <MovementList movements={movements} />

      {/* Nota informativa */}
      <p className="text-[11px] text-slate-400 text-center mt-6">
        El saldo mostrado es estimado. Se calcula a partir del saldo inicial configurado y los
        movimientos registrados en el sistema. No se sincroniza con tu banco.
      </p>
    </div>
  )
}
