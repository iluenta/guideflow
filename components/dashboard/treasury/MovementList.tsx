'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import type { AccountMovement } from '@/types/treasury'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

interface MovementListProps {
  movements: AccountMovement[]
}

export function MovementList({ movements }: MovementListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')

  function handleClick(m: AccountMovement) {
    if (m.source === 'reservation_payment' && m.reservation_id) {
      router.push(`/dashboard/bookings?view=${m.reservation_id}${yearParam ? `&year=${yearParam}` : ''}`)
    } else {
      router.push(`/dashboard/expenses/${m.source_id}/edit${yearParam ? `?year=${yearParam}` : ''}`)
    }
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#eef2f7] p-10 text-center">
        <p className="text-slate-400 text-sm">No hay movimientos registrados para este período.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eef2f7] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[110px_1fr_110px_110px_120px] gap-3 px-5 py-3 border-b border-[#eef2f7] bg-[#f8fafc]">
        {['Fecha', 'Descripción', 'Entrada', 'Salida', 'Saldo'].map(h => (
          <span key={h} className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {movements.map(m => (
        <div
          key={`${m.source}-${m.id}`}
          onClick={() => handleClick(m)}
          className="grid grid-cols-[110px_1fr_110px_110px_120px] gap-3 items-center px-5 py-4 border-b border-[#eef2f7] last:border-b-0 hover:bg-[#fafbfc] cursor-pointer transition-colors"
        >
          <span className="text-[12px] text-slate-500">{fmtDate(m.date)}</span>

          <div className="min-w-0">
            <p className="text-[13px] font-medium text-slate-800 truncate">{m.description}</p>
            <p className="text-[11px] text-slate-400 truncate">{m.source_detail}</p>
          </div>

          <span className={`text-[13px] font-mono font-semibold ${m.type === 'income' ? 'text-emerald-700' : 'text-slate-300'}`}>
            {m.type === 'income' ? `+€${fmt(m.amount)}` : '—'}
          </span>

          <span className={`text-[13px] font-mono font-semibold ${m.type === 'expense' ? 'text-rose-600' : 'text-slate-300'}`}>
            {m.type === 'expense' ? `-€${fmt(m.amount)}` : '—'}
          </span>

          <span className={`text-[13px] font-mono font-bold ${m.running_balance >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
            €{fmt(m.running_balance)}
          </span>
        </div>
      ))}
    </div>
  )
}
