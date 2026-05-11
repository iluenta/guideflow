'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, RefreshCw, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import {
  getExpenses,
  getExpensesSummary,
  deleteExpense,
  generatePendingRecurringExpenses,
} from '@/app/actions/expenses'
import { ExpenseKPIs } from '@/components/dashboard/expenses/ExpenseKPIs'
import { ExpenseList } from '@/components/dashboard/expenses/ExpenseList'
import { ConfirmEstimatedModal } from '@/components/dashboard/expenses/ConfirmEstimatedModal'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type {
  ExpenseWithDetails,
  ExpensesSummary,
  ExpenseFilters,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  ExpensePaymentStatus,
} from '@/types/expenses'
import { EXPENSE_CATEGORY_OPTIONS } from '@/types/expenses'

const EMPTY_SUMMARY: ExpensesSummary = {
  total_expenses: 0,
  total_by_category: {},
  total_reservation_expenses: 0,
  total_property_expenses: 0,
  pending_confirmation: 0,
  pending_payment: 0,
}

import { ConfirmationDialog } from '@/components/dashboard/ConfirmationDialog'

export default function ExpensesPage() {
  const { profile } = useUserProfile()
  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year') ?? String(new Date().getFullYear())

  const canCreate = profile ? can(profile.tenant_role as TenantRole, 'finances', 'create') : false
  const canEdit   = profile ? can(profile.tenant_role as TenantRole, 'finances', 'edit')   : false
  const canDelete = profile ? can(profile.tenant_role as TenantRole, 'finances', 'delete') : false

  const [expenses, setExpenses]     = useState<ExpenseWithDetails[]>([])
  const [summary, setSummary]       = useState<ExpensesSummary>(EMPTY_SUMMARY)
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [generatingDone, setGeneratingDone] = useState(false)

  // Filtros
  const [filterType, setFilterType]       = useState<ExpenseType | ''>('')
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('')
  const [filterStatus, setFilterStatus]   = useState<ExpenseStatus | ''>('')
  const [filterPayment, setFilterPayment] = useState<ExpensePaymentStatus | ''>('')

  // Modal confirmar estimado
  const [confirmingExpense, setConfirmingExpense] = useState<ExpenseWithDetails | null>(null)

  // Modal eliminar
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Auto-generar recurrentes al montar (solo una vez)
  useEffect(() => {
    if (generatingDone) return
    setGeneratingDone(true)
    generatePendingRecurringExpenses().then(({ generated, pendingConfirmation }) => {
      if (generated > 0) {
        toast.success(
          `Se generaron ${generated} gasto${generated > 1 ? 's' : ''} recurrente${generated > 1 ? 's' : ''}.` +
          (pendingConfirmation > 0 ? ` ${pendingConfirmation} requieren confirmar importe.` : '')
        )
        fetchAll()
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buildFilters = useCallback((): ExpenseFilters => {
    const year = yearParam === 'all' ? 'all' : parseInt(yearParam, 10)
    return {
      year: year === 'all' ? 'all' : (isNaN(year as number) ? new Date().getFullYear() : year),
      expense_type: filterType || undefined,
      category: filterCategory ? [filterCategory] : undefined,
      status: filterStatus || undefined,
      payment_status: filterPayment || undefined,
      page,
      per_page: 20,
    }
  }, [yearParam, filterType, filterCategory, filterStatus, filterPayment, page])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const filters = buildFilters()
    const [{ expenses: rows, total: t }, { summary: s }] = await Promise.all([
      getExpenses(filters),
      getExpensesSummary(filters),
    ])
    setExpenses(rows)
    setTotal(t)
    setSummary(s)
    setLoading(false)
  }, [buildFilters])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [yearParam, filterType, filterCategory, filterStatus, filterPayment])

  async function handleDelete(id: string) {
    const expense = expenses.find(e => e.id === id)
    if (!expense) return
    setExpenseToDelete(expense)
  }

  async function confirmDelete() {
    if (!expenseToDelete) return
    setIsDeleting(true)

    const { error, account_name, amount_restored } = await deleteExpense(expenseToDelete.id)
    setIsDeleting(false)
    
    if (error) { 
      toast.error(error)
      setExpenseToDelete(null)
      return 
    }

    if (amount_restored && account_name) {
      toast.success(`Gasto eliminado. Saldo de "${account_name}" ajustado en +€${amount_restored.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`)
    } else {
      toast.success('Gasto eliminado')
    }
    
    setExpenseToDelete(null)
    fetchAll()
  }

  const yearLabel = yearParam === 'all' ? 'Histórico completo' : yearParam

  return (
    <div className="p-4 md:p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-5 md:mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2 mb-2">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Dashboard
          </p>
          <h1 className="text-[24px] md:text-[36px] font-bold tracking-[-0.03em] text-[#1e3a8a] leading-[1.05]">
            Gastos
          </h1>
          <p className="text-[13px] md:text-[15px] text-slate-500 mt-1">
            {loading ? '...' : `${total} gasto${total !== 1 ? 's' : ''}`} · {yearLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Recurrentes: solo texto en desktop */}
          <Link
            href={`/dashboard/expenses/recurring${yearParam ? `?year=${yearParam}` : ''}`}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Recurrentes
          </Link>
          {/* Recurrentes: solo icono en mobile */}
          <Link
            href={`/dashboard/expenses/recurring${yearParam ? `?year=${yearParam}` : ''}`}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
          </Link>
          {canCreate && (
            <Link
              href={`/dashboard/expenses/new${yearParam ? `?year=${yearParam}` : ''}`}
              className="flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e3a8a]/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Nuevo gasto</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <ExpenseKPIs summary={summary} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ExpenseType | '')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
        >
          <option value="">Todos los tipos</option>
          <option value="property">De propiedad</option>
          <option value="reservation">De reserva</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as ExpenseCategory | '')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
        >
          <option value="">Todas las categorías</option>
          {EXPENSE_CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as ExpenseStatus | '')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
        >
          <option value="">Todos los estados</option>
          <option value="confirmed">Confirmados</option>
          <option value="estimated">Por confirmar</option>
        </select>

        <select
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value as ExpensePaymentStatus | '')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
        >
          <option value="">Todos los pagos</option>
          <option value="paid">Pagados</option>
          <option value="pending">Pendientes de pago</option>
        </select>

        {loading && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 ml-1">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Cargando...
          </div>
        )}
      </div>

      {/* Lista */}
      <ExpenseList
        expenses={expenses}
        total={total}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={handleDelete}
        onConfirm={exp => setConfirmingExpense(exp)}
        page={page}
        perPage={20}
        onPageChange={setPage}
      />

      {/* Modal confirmar estimado */}
      {confirmingExpense && (
        <ConfirmEstimatedModal
          expense={confirmingExpense}
          onClose={() => setConfirmingExpense(null)}
          onConfirmed={fetchAll}
        />
      )}

      {/* Modal eliminar */}
      <ConfirmationDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`¿Eliminar "${expenseToDelete?.description}"?`}
        description={(() => {
          if (!expenseToDelete) return ''
          let msg = `Importe: €${expenseToDelete.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}\n`
          if (expenseToDelete.payment_status === 'paid') {
            msg += `\n⚠️ Este gasto está marcado como PAGADO.`
            if ((expenseToDelete as any).payment_account_id) {
              msg += `\nEliminarlo ajustará el saldo de la cuenta asociada en +€${expenseToDelete.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}.`
            }
          }
          msg += '\nEsta acción no puede deshacerse.'
          return msg
        })()}
        confirmText="Eliminar gasto"
        variant="danger"
      />
    </div>
  )
}
