'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { getPaymentAccountsWithBalance } from '@/app/actions/payment-accounts'
import { AccountCard } from '@/components/dashboard/treasury/AccountCard'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type { PaymentAccountWithBalance } from '@/types/treasury'

export default function TreasuryPage() {
  const { profile } = useUserProfile()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')

  const canEdit = profile ? can(profile.tenant_role as TenantRole, 'finances', 'edit') : false

  const [accounts, setAccounts] = useState<PaymentAccountWithBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPaymentAccountsWithBalance().then(({ accounts: a }) => {
      setAccounts(a.filter(acc => acc.is_active))
      setLoading(false)
    })
  }, [])

  const totalBalance = accounts.reduce((s, a) => s + a.balance.estimated_balance, 0)

  return (
    <div className="px-4 py-8 sm:p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-5 md:mb-8 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2 mb-2">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Dashboard
          </p>
          <h1 className="text-3xl sm:text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Tesorería
          </h1>
          {!loading && accounts.length > 0 && (
            <p className="text-[15px] text-slate-500 mt-1">
              Posición total estimada:{' '}
              <span className={`font-semibold ${totalBalance >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
                €{totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          )}
        </div>
        {canEdit && (
          <Link
            href={`/dashboard/settings/accounts${yearParam ? `?year=${yearParam}` : ''}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Configurar cuentas
          </Link>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Cargando cuentas...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eef2f7] p-16 text-center">
          <p className="text-[15px] font-semibold text-slate-700 mb-2">No hay cuentas configuradas</p>
          <p className="text-[13px] text-slate-400 mb-6">
            Crea tus cuentas bancarias y de efectivo para hacer seguimiento de tu posición de tesorería.
          </p>
          {canEdit && (
            <Link
              href="/dashboard/settings/accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e3a8a]/90"
            >
              <Settings2 className="h-4 w-4" />
              Crear primera cuenta
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {accounts.map(acc => (
              <AccountCard key={acc.id} account={acc} />
            ))}
          </div>

          {/* Nota informativa */}
          <p className="text-[11px] text-slate-400 text-center">
            El saldo mostrado es estimado. Se calcula a partir del saldo inicial configurado y los
            movimientos registrados en el sistema. No se sincroniza con tu banco.
          </p>
        </>
      )}
    </div>
  )
}
