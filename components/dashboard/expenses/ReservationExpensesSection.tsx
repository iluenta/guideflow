'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getExpenses } from '@/app/actions/expenses'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expenses'
import type { ExpenseWithDetails } from '@/types/expenses'

interface ReservationExpensesSectionProps {
  reservationId: string
  reservationNetAmount: number
  canCreate: boolean
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ReservationExpensesSection({
  reservationId,
  reservationNetAmount,
  canCreate,
}: ReservationExpensesSectionProps) {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const { expenses: rows } = await getExpenses({
      reservation_id: reservationId,
      per_page: 50,
      year: 'all',
    })
    setExpenses(rows)
    setLoading(false)
  }, [reservationId])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const totalExpenses = expenses.reduce((s, e) => s + e.total_amount, 0)
  const margin = reservationNetAmount - totalExpenses

  if (loading) {
    return (
      <div className="text-center text-slate-400 text-[12px] py-4">
        Cargando gastos...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
          Gastos de la reserva
        </p>
        {canCreate && (
          <Link
            href={`/dashboard/expenses/new?reservation_id=${reservationId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-landing-navy-tint text-landing-navy text-[11px] font-medium hover:bg-landing-navy/10 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Añadir gasto
          </Link>
        )}
      </div>

      {/* Lista */}
      {expenses.length === 0 ? (
        <div className="bg-white border border-[#eef2f7] rounded-xl p-4 text-center">
          <p className="text-slate-400 text-[12px]">No hay gastos vinculados a esta reserva.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#eef2f7] rounded-xl overflow-hidden">
          {expenses.map(exp => (
            <div
              key={exp.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#eef2f7] last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-700 truncate">{exp.description}</p>
                <p className="text-[11px] text-slate-400">
                  {EXPENSE_CATEGORY_LABELS[exp.category]} · {exp.expense_date}
                </p>
              </div>
              {exp.status === 'estimated' && (
                <span title="Estimado">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                </span>
              )}
              <span className="font-mono text-[13px] font-semibold text-slate-700 shrink-0">
                −€{fmt(exp.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cálculo de margen */}
      {expenses.length > 0 && (
        <div className="bg-white border border-[#eef2f7] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] text-[13px]">
            <span className="text-slate-500">Neto canal</span>
            <span className="font-mono text-[#047857] font-semibold">+€{fmt(reservationNetAmount)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef2f7] text-[13px]">
            <span className="text-slate-500">Gastos reserva</span>
            <span className="font-mono text-rose-600 font-semibold">−€{fmt(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#eef2fb] text-[13px] font-bold">
            <span className="text-[#1e3a8a]">Margen reserva</span>
            <span className={`font-mono ${margin >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
              €{fmt(margin)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
