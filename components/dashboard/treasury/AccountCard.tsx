'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Landmark, Wallet, CreditCard, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import type { PaymentAccountWithBalance, AccountType } from '@/types/treasury'
import { ACCOUNT_TYPE_LABELS } from '@/types/treasury'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ACCOUNT_ICONS: Record<AccountType, React.ElementType> = {
  bank_account:    Landmark,
  cash:            Wallet,
  payment_gateway: CreditCard,
}

const ACCOUNT_COLORS: Record<AccountType, { bg: string; icon: string; badge: string }> = {
  bank_account:    { bg: 'bg-landing-navy-tint', icon: 'text-landing-navy', badge: 'bg-landing-navy/10 text-landing-navy' },
  cash:            { bg: 'bg-emerald-50', icon: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  payment_gateway: { bg: 'bg-violet-50', icon: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
}

interface AccountCardProps {
  account: PaymentAccountWithBalance
}

export function AccountCard({ account }: AccountCardProps) {
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const href = `/dashboard/treasury/${account.id}${yearParam ? `?year=${yearParam}` : ''}`

  const Icon = ACCOUNT_ICONS[account.account_type]
  const colors = ACCOUNT_COLORS[account.account_type]
  const { balance } = account
  const isPositive = balance.estimated_balance >= 0

  return (
    <div className="bg-white rounded-2xl border border-[#eef2f7] p-6 flex flex-col gap-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">{account.name}</h3>
            <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
              {ACCOUNT_TYPE_LABELS[account.account_type]}
            </span>
          </div>
        </div>
      </div>

      {/* Saldo estimado */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
          Saldo estimado
        </p>
        <p className={`text-2xl sm:text-[32px] font-bold tracking-tight leading-none ${isPositive ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
          €{fmt(balance.estimated_balance)}
        </p>
      </div>

      {/* Entradas / salidas del mes */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">Entradas este mes</p>
            <p className="text-[13px] font-semibold text-emerald-700">+€{fmt(balance.month_income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400">Salidas este mes</p>
            <p className="text-[13px] font-semibold text-rose-600">-€{fmt(balance.month_expenses)}</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={href}
        className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#f1f4f8] hover:bg-landing-navy-tint hover:text-landing-navy text-slate-600 text-[13px] font-medium transition-colors group"
      >
        Ver movimientos
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}
