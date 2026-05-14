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
    <div className="flex flex-col gap-4 sm:block sm:bg-white sm:rounded-2xl sm:border sm:border-[#eef2f7] sm:overflow-hidden">
      {/* Header (Desktop solo) */}
      <div className="hidden sm:grid grid-cols-[110px_1fr_110px_110px_120px] gap-3 px-5 py-3 border-b border-[#eef2f7] bg-[#f8fafc]">
        {['Fecha', 'Descripción', 'Entrada', 'Salida', 'Saldo'].map(h => (
          <span key={h} className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {movements.map(m => (
        <div
          key={`${m.source}-${m.id}`}
          onClick={() => handleClick(m)}
          className="bg-white border border-[#eef2f7] rounded-xl sm:rounded-none sm:border-0 sm:border-b last:border-b-0 p-4 sm:p-0 sm:grid sm:grid-cols-[110px_1fr_110px_110px_120px] gap-3 items-center sm:px-5 sm:py-4 transition-colors hover:bg-[#fafbfc] cursor-pointer"
        >
          {/* Móvil: Fecha arriba */}
          <div className="flex justify-between items-start mb-2 sm:mb-0">
            <span className="text-[11px] font-mono text-slate-400 sm:text-slate-500">{fmtDate(m.date)}</span>
            <span className="sm:hidden text-[10px] font-mono uppercase tracking-wider text-slate-400">Movimiento</span>
          </div>

          <div className="min-w-0 flex-1 mb-4 sm:mb-0">
            <p className="text-[14px] sm:text-[13px] font-semibold sm:font-medium text-slate-800 truncate">{m.description}</p>
            <p className="text-[11px] text-slate-400 truncate">{m.source_detail}</p>
          </div>

          <div className="grid grid-cols-2 sm:contents gap-2 pt-3 border-t border-slate-50 sm:border-0 sm:pt-0">
            <div className="sm:contents">
              <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Entrada</span>
              <span className={`text-[14px] sm:text-[13px] font-mono font-semibold ${m.type === 'income' ? 'text-emerald-700' : 'text-slate-300'}`}>
                {m.type === 'income' ? `+€${fmt(m.amount)}` : '—'}
              </span>
            </div>

            <div className="sm:contents">
              <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Salida</span>
              <span className={`text-[14px] sm:text-[13px] font-mono font-semibold ${m.type === 'expense' ? 'text-rose-600' : 'text-slate-300'}`}>
                {m.type === 'expense' ? `-€${fmt(m.amount)}` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-50 sm:mt-0 sm:pt-0 sm:border-0 text-right sm:text-left">
            <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">Saldo tras mov.</span>
            <span className={`text-[15px] sm:text-[13px] font-mono font-bold ${m.running_balance >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
              €{fmt(m.running_balance)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
