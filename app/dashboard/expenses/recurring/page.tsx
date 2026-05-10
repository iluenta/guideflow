'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  getRecurringTemplates,
  toggleRecurringTemplate,
  deleteRecurringTemplate,
} from '@/app/actions/expenses'
import { RecurringTemplateForm } from '@/components/dashboard/expenses/RecurringTemplateForm'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type { RecurringExpenseTemplate, RecurringFrequency } from '@/types/expenses'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expenses'

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  monthly:   'Mensual',
  quarterly: 'Trimestral',
  annual:    'Anual',
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

import { ConfirmationDialog } from '@/components/dashboard/ConfirmationDialog'

export default function RecurringExpensesPage() {
  const { profile } = useUserProfile()
  const canEdit   = profile ? can(profile.tenant_role as TenantRole, 'finances', 'edit')   : false
  const canDelete = profile ? can(profile.tenant_role as TenantRole, 'finances', 'delete') : false
  const canCreate = profile ? can(profile.tenant_role as TenantRole, 'finances', 'create') : false

  const searchParams = useSearchParams()
  const yearParam = searchParams.get('year')
  const backHref = `/dashboard/expenses${yearParam ? `?year=${yearParam}` : ''}`

  const [templates, setTemplates] = useState<RecurringExpenseTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<RecurringExpenseTemplate | null>(null)
  const [toggling, setToggling]   = useState<string | null>(null)

  // Modal eliminar
  const [templateToDelete, setTemplateToDelete] = useState<RecurringExpenseTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const { templates: tpls } = await getRecurringTemplates()
    setTemplates(tpls)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function handleToggle(tpl: RecurringExpenseTemplate) {
    setToggling(tpl.id)
    const { error } = await toggleRecurringTemplate(tpl.id, !tpl.is_active)
    if (error) { toast.error(error) }
    else {
      setTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, is_active: !t.is_active } : t))
      toast.success(tpl.is_active ? 'Plantilla desactivada' : 'Plantilla activada')
    }
    setToggling(null)
  }

  async function handleDelete(tpl: RecurringExpenseTemplate) {
    setTemplateToDelete(tpl)
  }

  async function confirmDelete() {
    if (!templateToDelete) return
    setIsDeleting(true)
    const { error } = await deleteRecurringTemplate(templateToDelete.id)
    setIsDeleting(false)
    if (error) { 
      toast.error(error)
      setTemplateToDelete(null)
      return 
    }
    toast.success('Plantilla eliminada')
    setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
    setTemplateToDelete(null)
  }

  function openCreate() { setEditing(null); setFormOpen(true) }
  function openEdit(tpl: RecurringExpenseTemplate) { setEditing(tpl); setFormOpen(true) }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-landing-navy transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Gastos
          </Link>
          <h1 className="text-[30px] font-bold tracking-[-0.02em] text-[#1e3a8a]">
            Gastos recurrentes
          </h1>
          <p className="text-[14px] text-slate-500 mt-1">
            {templates.length} plantilla{templates.length !== 1 ? 's' : ''} configurada{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e3a8a]/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva plantilla
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center text-slate-400 text-sm py-12">Cargando plantillas...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eef2f7] p-12 text-center">
          <p className="text-slate-400 text-sm mb-3">
            No hay plantillas de gastos recurrentes.
          </p>
          {canCreate && (
            <button
              onClick={openCreate}
              className="text-landing-navy text-sm font-medium hover:underline"
            >
              Crear la primera plantilla →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#eef2f7] overflow-hidden">
          {/* Header tabla */}
          <div className="grid grid-cols-[2fr_1fr_1fr_100px_120px_100px_80px] gap-3 px-5 py-3 border-b border-[#eef2f7] bg-[#f8fafc]">
            {['Nombre', 'Categoría', 'Frecuencia', 'Importe', 'Próxima gen.', 'Estado', ''].map(h => (
              <span key={h} className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>

          {templates.map(tpl => {
            const nextGen = getNextGenDate(tpl)
            return (
              <div
                key={tpl.id}
                className="grid grid-cols-[2fr_1fr_1fr_100px_120px_100px_80px] gap-3 items-center px-5 py-4 border-b border-[#eef2f7] last:border-b-0 hover:bg-[#fafbfc] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-800 truncate">{tpl.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {tpl.property_name ?? ''} · {tpl.amount_type === 'fixed' ? 'Fijo' : 'Estimado'}
                  </p>
                </div>

                <span className="text-[12px] text-slate-600">
                  {EXPENSE_CATEGORY_LABELS[tpl.category]}
                </span>

                <span className="text-[12px] text-slate-600">
                  {FREQ_LABELS[tpl.frequency]} · día {tpl.day_of_period}
                </span>

                <span className="text-[13px] font-mono font-semibold text-slate-700">
                  €{fmt(tpl.estimated_amount)}
                </span>

                <span className="text-[12px] text-slate-500">
                  {nextGen ?? '—'}
                </span>

                {/* Toggle activo */}
                <div className="flex items-center">
                  <Switch
                    checked={tpl.is_active}
                    onCheckedChange={() => handleToggle(tpl)}
                    disabled={toggling === tpl.id || !canEdit}
                  />
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-end gap-1">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(tpl)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(tpl)}
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
        </div>
      )}

      {/* Modal form */}
      {formOpen && (
        <RecurringTemplateForm
          template={editing ?? undefined}
          onClose={() => setFormOpen(false)}
          onSaved={fetchTemplates}
        />
      )}

      {/* Modal eliminar */}
      <ConfirmationDialog
        isOpen={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`¿Eliminar plantilla?`}
        description={`¿Estás seguro de que quieres eliminar la plantilla "${templateToDelete?.name}"?\nEsta acción no afectará a los gastos ya generados.`}
        confirmText="Eliminar plantilla"
        variant="danger"
      />
    </div>
  )
}

function getNextGenDate(tpl: RecurringExpenseTemplate): string | null {
  const today = new Date()
  const base = tpl.last_generated_at ? new Date(tpl.last_generated_at) : new Date(tpl.start_date)

  if (!tpl.is_active) return null
  if (tpl.end_date && new Date(tpl.end_date) < today) return 'Finalizada'

  let next: Date
  if (tpl.frequency === 'monthly') {
    next = new Date(base.getFullYear(), base.getMonth() + 1, tpl.day_of_period)
  } else if (tpl.frequency === 'quarterly') {
    next = new Date(base.getFullYear(), base.getMonth() + 3, tpl.day_of_period)
  } else {
    const month = (tpl.month_of_year ?? 1) - 1
    next = new Date(base.getFullYear() + 1, month, tpl.day_of_period)
  }

  return next.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
