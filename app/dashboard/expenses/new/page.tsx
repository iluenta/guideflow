'use client'

import { useSearchParams } from 'next/navigation'
import { ExpenseForm } from '@/components/dashboard/expenses/ExpenseForm'

export default function NewExpensePage() {
  const searchParams = useSearchParams()
  const reservationId = searchParams.get('reservation_id') ?? undefined
  const propertyId    = searchParams.get('property_id') ?? undefined

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 mb-2">
          Gastos
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.02em] text-[#1e3a8a]">
          Nuevo gasto
        </h1>
      </div>
      <ExpenseForm
        mode="create"
        defaultReservationId={reservationId}
        defaultPropertyId={propertyId}
      />
    </div>
  )
}
