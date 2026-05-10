'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getExpense } from '@/app/actions/expenses'
import { ExpenseForm } from '@/components/dashboard/expenses/ExpenseForm'
import type { ExpenseWithDetails } from '@/types/expenses'

export default function EditExpensePage() {
  const params = useParams()
  const id = params.id as string
  const [expense, setExpense] = useState<ExpenseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExpense(id).then(({ expense: e }) => {
      setExpense(e ?? null)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 text-sm">
        Cargando gasto...
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Gasto no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 mb-2">
          Gastos
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.02em] text-[#1e3a8a]">
          Editar gasto
        </h1>
      </div>
      <ExpenseForm mode="edit" expense={expense} />
    </div>
  )
}
