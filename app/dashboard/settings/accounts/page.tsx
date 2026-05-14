'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import {
  getPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  togglePaymentAccount,
  getAccountBalance,
} from '@/app/actions/payment-accounts'
import { useUserProfile } from '@/hooks/use-user-profile'
import { can, type TenantRole } from '@/lib/permissions'
import type { PaymentAccount, AccountType, CreatePaymentAccountInput } from '@/types/treasury'
import { ACCOUNT_TYPE_LABELS } from '@/types/treasury'

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface AccountFormData {
  name: string
  account_type: AccountType
  opening_balance: string
  opening_balance_date: string
  notes: string
}

const EMPTY_FORM: AccountFormData = {
  name: '',
  account_type: 'bank_account',
  opening_balance: '0',
  opening_balance_date: new Date().toISOString().split('T')[0],
  notes: '',
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function AccountModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: PaymentAccount | null
  onClose: () => void
  onSaved: (a: PaymentAccount) => void
}) {
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingBalance, setEditingBalance] = useState(false)

  useEffect(() => {
    if (open) {
      setEditingBalance(false)
      setForm(
        editing
          ? {
              name: editing.name,
              account_type: editing.account_type,
              opening_balance: String(editing.opening_balance),
              opening_balance_date: editing.opening_balance_date,
              notes: editing.notes ?? '',
            }
          : EMPTY_FORM
      )
    }
  }, [open, editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const balance = parseFloat(form.opening_balance)
    if (isNaN(balance)) { toast.error('Introduce un saldo inicial válido'); return }
    if (!form.name.trim()) { toast.error('Introduce un nombre'); return }

    setSaving(true)
    const input: CreatePaymentAccountInput = {
      name: form.name.trim(),
      account_type: form.account_type,
      opening_balance: balance,
      opening_balance_date: form.opening_balance_date,
      notes: form.notes || null,
    }

    const { account, error } = editing
      ? await updatePaymentAccount(editing.id, input)
      : await createPaymentAccount(input)

    if (error) { toast.error(error); setSaving(false); return }
    toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada')
    if (account) onSaved(account)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef2f7]">
          <h2 className="text-[16px] font-bold text-slate-800">
            {editing ? 'Editar cuenta' : 'Nueva cuenta'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="Cuenta BBVA, Efectivo VeraTespera..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Tipo</label>
            <select
              value={form.account_type}
              onChange={e => setForm(f => ({ ...f, account_type: e.target.value as AccountType }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
            >
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(t => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Saldo inicial (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={e => {
                  setForm(f => ({ ...f, opening_balance: e.target.value }))
                  if (editing) setEditingBalance(true)
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={form.opening_balance_date}
                onChange={e => setForm(f => ({ ...f, opening_balance_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
              />
            </div>
          </div>

          {editing && editingBalance && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">
                Cambiar el saldo inicial afectará al saldo estimado de todos los movimientos registrados desde esa fecha.
              </p>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
              Notas (IBAN parcial, email PayPal...)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="**** 1234, paypal@ejemplo.com..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-landing-navy text-white text-sm font-semibold hover:bg-landing-navy-soft disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsSettingsPage() {
  const { profile } = useUserProfile()
  const canEdit   = profile ? can(profile.tenant_role as TenantRole, 'finances', 'edit')   : false
  const canCreate = profile ? can(profile.tenant_role as TenantRole, 'finances', 'create') : false

  const [accounts, setAccounts] = useState<(PaymentAccount & { estimated_balance?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentAccount | null>(null)

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    const { accounts: list } = await getPaymentAccounts()
    // Cargar saldos en paralelo
    const withBalances = await Promise.all(
      list.map(async acc => {
        const { balance } = await getAccountBalance(acc.id)
        return { ...acc, estimated_balance: balance.estimated_balance }
      })
    )
    setAccounts(withBalances)
    setLoading(false)
  }, [])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  async function handleToggle(acc: PaymentAccount) {
    setToggling(acc.id)
    const { error } = await togglePaymentAccount(acc.id, !acc.is_active)
    if (error) { toast.error(error) }
    else {
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, is_active: !a.is_active } : a))
      toast.success(acc.is_active ? 'Cuenta desactivada' : 'Cuenta activada')
    }
    setToggling(null)
  }

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(acc: PaymentAccount) { setEditing(acc); setModalOpen(true) }

  function handleSaved(saved: PaymentAccount) {
    setAccounts(prev => {
      const exists = prev.find(a => a.id === saved.id)
      return exists
        ? prev.map(a => a.id === saved.id ? { ...a, ...saved } : a)
        : [{ ...saved, estimated_balance: saved.opening_balance }, ...prev]
    })
  }

  return (
    <div className="px-4 py-8 sm:p-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2.5 mb-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#2dd4bf] shadow-[0_0_0_4px_rgba(45,212,191,0.2)] inline-block" />
            Configuración
          </p>
          <h1 className="text-3xl sm:text-[32px] font-bold tracking-tight text-[#1e293b]">Cuentas</h1>
          <p className="text-slate-500 text-[14px] mt-1">
            {accounts.filter(a => a.is_active).length} cuenta{accounts.filter(a => a.is_active).length !== 1 ? 's' : ''} activa{accounts.filter(a => a.is_active).length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e3a8a]/90 transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-[14px]">Cargando...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[15px] font-semibold text-slate-700 mb-1">Sin cuentas</p>
          <p className="text-[13px] text-slate-400 mb-5">
            Añade tus cuentas bancarias y de efectivo para hacer seguimiento de tu tesorería.
          </p>
          {canCreate && (
            <button
              onClick={openCreate}
              className="px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold"
            >
              Crear primera cuenta
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:block sm:bg-white sm:rounded-2xl sm:border sm:border-[#eef2f7] sm:overflow-hidden">
          {/* Header tabla (Desktop) */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_120px_80px_80px] gap-4 px-5 py-3 border-b border-[#eef2f7] bg-[#f8fafc]">
            {['Nombre', 'Tipo', 'Saldo inicial', 'Saldo estimado', 'Estado', ''].map(h => (
              <span key={h} className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{h}</span>
            ))}
          </div>

          {accounts.map(acc => (
            <div
              key={acc.id}
              className={`bg-white border border-[#eef2f7] rounded-xl sm:rounded-none sm:border-0 sm:border-b last:border-b-0 p-4 sm:p-0 sm:grid sm:grid-cols-[2fr_1fr_1fr_120px_80px_80px] gap-4 items-center sm:px-5 sm:py-4 transition-colors ${!acc.is_active ? 'opacity-50' : 'hover:bg-[#fafbfc]'}`}
            >
              <div className="mb-3 sm:mb-0">
                <p className="text-[14px] font-semibold text-slate-800">{acc.name}</p>
                {acc.notes && <p className="text-[11px] text-slate-400 truncate">{acc.notes}</p>}
              </div>

              <div className="flex sm:contents justify-between items-center mb-2 sm:mb-0">
                <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tipo</span>
                <span className="text-[12px] text-slate-600">
                  {ACCOUNT_TYPE_LABELS[acc.account_type]}
                </span>
              </div>

              <div className="flex sm:contents justify-between items-center mb-2 sm:mb-0">
                <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider">Saldo inicial</span>
                <span className="text-[13px] font-mono text-slate-600">
                  €{fmt(acc.opening_balance)}
                </span>
              </div>

              <div className="flex sm:contents justify-between items-center mb-4 sm:mb-0">
                <span className="sm:hidden text-[10px] font-mono text-slate-400 uppercase tracking-wider">Saldo estimado</span>
                <span className={`text-[14px] sm:text-[13px] font-mono font-semibold ${(acc.estimated_balance ?? 0) >= 0 ? 'text-[#1e3a8a]' : 'text-rose-600'}`}>
                  €{fmt(acc.estimated_balance ?? acc.opening_balance)}
                </span>
              </div>

              <div className="flex items-center justify-between sm:justify-start border-t border-[#f8fafc] pt-3 sm:pt-0 sm:border-0">
                <div className="flex items-center gap-2">
                  <span className="sm:hidden text-[12px] text-slate-500 font-medium">Estado</span>
                  <Switch
                    checked={acc.is_active}
                    onCheckedChange={() => handleToggle(acc)}
                    disabled={toggling === acc.id || !canEdit}
                  />
                </div>

                <div className="flex items-center justify-end">
                  {canEdit && (
                    <button
                      onClick={() => openEdit(acc)}
                      className="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-[#eef2fb] hover:text-[#1e3a8a] transition-colors border border-slate-100 sm:border-0"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccountModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
