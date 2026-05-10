'use client'

import { Paperclip, Pencil, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import type { ExpenseWithDetails, ExpenseCategory } from '@/types/expenses'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expenses'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; color: string }> = {
  cleaning:    { bg: '#e0f7fa', color: '#00796b' },
  laundry:     { bg: '#f3e5f5', color: '#7b1fa2' },
  checkin:     { bg: '#e8f5e9', color: '#2e7d32' },
  maintenance: { bg: '#fff3e0', color: '#e65100' },
  utilities:   { bg: '#e3f2fd', color: '#1565c0' },
  wifi:        { bg: '#f1f8e9', color: '#558b2f' },
  streaming:   { bg: '#fce4ec', color: '#c62828' },
  community:   { bg: '#f9fbe7', color: '#827717' },
  insurance:   { bg: '#e8eaf6', color: '#283593' },
  ibi:         { bg: '#fafafa', color: '#424242' },
  supplies:    { bg: '#fff8e1', color: '#f57f17' },
  marketing:   { bg: '#fbe9e7', color: '#bf360c' },
  management:  { bg: '#ede7f6', color: '#4527a0' },
  other:       { bg: '#f1f4f8', color: '#475569' },
}

interface ExpenseListProps {
  expenses: ExpenseWithDetails[]
  total: number
  canEdit: boolean
  canDelete: boolean
  onDelete: (id: string) => void
  onConfirm: (expense: ExpenseWithDetails) => void
  page: number
  perPage: number
  onPageChange: (p: number) => void
}

export function ExpenseList({
  expenses,
  total,
  canEdit,
  canDelete,
  onDelete,
  onConfirm,
  page,
  perPage,
  onPageChange,
}: ExpenseListProps) {
  const totalPages = Math.ceil(total / perPage)

  // Pie de totales
  const totalAmount    = expenses.reduce((s, e) => s + e.amount, 0)
  const totalVat       = expenses.reduce((s, e) => s + e.vat_amount, 0)
  const totalWithVat   = expenses.reduce((s, e) => s + e.total_amount, 0)

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#eef2f7] p-12 text-center">
        <p className="text-slate-400 text-sm">No hay gastos para el período seleccionado.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#eef2f7] overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[100px_1fr_130px_130px_80px_80px_90px_90px_70px] gap-3 px-5 py-3 border-b border-[#eef2f7] bg-[#f8fafc]">
        {['Fecha', 'Descripción', 'Categoría', 'Proveedor', 'Base', 'IVA', 'Total', 'Estado', ''].map(h => (
          <span key={h} className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{h}</span>
        ))}
      </div>

      {/* Rows */}
      {expenses.map(exp => {
        const catStyle = CATEGORY_COLORS[exp.category] ?? CATEGORY_COLORS.other
        return (
          <div
            key={exp.id}
            className="grid grid-cols-[100px_1fr_130px_130px_80px_80px_90px_90px_70px] gap-3 items-center px-5 py-4 border-b border-[#eef2f7] last:border-b-0 hover:bg-[#fafbfc] transition-colors"
          >
            <span className="text-[12px] text-slate-500">{fmtDate(exp.expense_date)}</span>

            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-800 truncate">{exp.description}</p>
              {exp.reservation_guest && (
                <p className="text-[11px] text-slate-400 truncate">
                  Reserva: {exp.reservation_guest}
                </p>
              )}
            </div>

            <span
              className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium truncate"
              style={{ background: catStyle.bg, color: catStyle.color }}
            >
              {EXPENSE_CATEGORY_LABELS[exp.category]}
            </span>

            <span className="text-[12px] text-slate-600 truncate">
              {exp.provider_name ?? exp.provider_name_override ?? <span className="text-slate-300">—</span>}
            </span>

            <span className="text-[13px] text-slate-700 font-mono">€{fmt(exp.amount)}</span>
            <span className="text-[13px] text-slate-500 font-mono">€{fmt(exp.vat_amount)}</span>
            <span className="text-[13px] font-semibold text-slate-800 font-mono">€{fmt(exp.total_amount)}</span>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              {exp.status === 'estimated' ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 cursor-pointer hover:bg-amber-100"
                  onClick={() => onConfirm(exp)}
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Estimado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Confirmado
                </span>
              )}
              {exp.payment_status === 'pending' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">
                  <Clock className="h-2.5 w-2.5" />
                  Pendiente
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                  Pagado
                </span>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-1">
              {exp.document_url && (
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400" title="Tiene documento">
                  <Paperclip className="h-3.5 w-3.5" />
                </span>
              )}
              {canEdit && (
                <Link
                  href={`/dashboard/expenses/${exp.id}/edit`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(exp.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Footer totales */}
      <div className="grid grid-cols-[100px_1fr_130px_130px_80px_80px_90px_90px_70px] gap-3 px-5 py-3 border-t border-[#eef2f7] bg-[#f8fafc]">
        <span />
        <span className="text-[11px] font-semibold text-slate-500">{total} gastos</span>
        <span />
        <span className="text-[11px] font-mono font-semibold text-slate-500">Totales</span>
        <span className="text-[13px] font-mono font-bold text-slate-700">€{fmt(totalAmount)}</span>
        <span className="text-[13px] font-mono font-bold text-slate-500">€{fmt(totalVat)}</span>
        <span className="text-[13px] font-mono font-bold text-landing-navy">€{fmt(totalWithVat)}</span>
        <span />
        <span />
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-[#eef2f7]">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-[#eef2fb] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-[#eef2fb] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
