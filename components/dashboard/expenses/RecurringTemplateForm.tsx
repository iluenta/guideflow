'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { createRecurringTemplate, updateRecurringTemplate } from '@/app/actions/expenses'
import { getProviders } from '@/app/actions/providers'
import { getProperties } from '@/app/actions/properties'
import { getPaymentAccounts } from '@/app/actions/payment-accounts'
import type { PaymentAccount } from '@/types/treasury'
import type {
  RecurringExpenseTemplate,
  ExpenseCategory,
  RecurringFrequency,
  RecurringAmountType,
  VatPct,
} from '@/types/expenses'
import { EXPENSE_CATEGORY_OPTIONS } from '@/types/expenses'
import type { Provider } from '@/types/reservations'

interface RecurringTemplateFormProps {
  template?: RecurringExpenseTemplate
  onClose: () => void
  onSaved: () => void
}

export function RecurringTemplateForm({ template, onClose, onSaved }: RecurringTemplateFormProps) {
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [providers, setProviders] = useState<Provider[]>([])

  const [propertyId, setPropertyId] = useState(template?.property_id ?? '')
  const [name, setName] = useState(template?.name ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(template?.category ?? 'other')
  const [providerId, setProviderId] = useState(template?.provider_id ?? '')
  const [providerOverride, setProviderOverride] = useState(template?.provider_name_override ?? '')
  const [amountType, setAmountType] = useState<RecurringAmountType>(template?.amount_type ?? 'fixed')
  const [estimatedAmount, setEstimatedAmount] = useState(template ? String(template.estimated_amount) : '')
  const [vatPct, setVatPct] = useState<VatPct>(template?.vat_pct ?? 0)
  const [isVatDeductible, setIsVatDeductible] = useState(template?.is_vat_deductible ?? false)
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(template?.default_payment_method ?? '')
  const [defaultPaymentAccountId, setDefaultPaymentAccountId] = useState(template?.default_payment_account_id ?? '')
  const [autoMarkPaid, setAutoMarkPaid] = useState(template?.auto_mark_paid ?? false)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [frequency, setFrequency] = useState<RecurringFrequency>(template?.frequency ?? 'monthly')
  const [dayOfPeriod, setDayOfPeriod] = useState(template?.day_of_period ?? 1)
  const [monthOfYear, setMonthOfYear] = useState(template?.month_of_year ?? 1)
  const [startDate, setStartDate] = useState(template?.start_date ?? new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(template?.end_date ?? '')
  const [notes, setNotes] = useState(template?.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getProperties(), getProviders(), getPaymentAccounts()]).then(
      ([props, { providers: provs }, { accounts: accs }]) => {
        setProperties((props as unknown as { id: string; name: string }[]) ?? [])
        setProviders(provs ?? [])
        setAccounts((accs ?? []).filter(a => a.is_active))
      }
    )
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(estimatedAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Introduce un importe válido'); return }
    if (!propertyId) { toast.error('Selecciona una propiedad'); return }
    if (!name.trim()) { toast.error('Introduce un nombre'); return }

    setSaving(true)

    const input = {
      property_id: propertyId,
      name: name.trim(),
      category,
      provider_id: providerId || null,
      provider_name_override: !providerId && providerOverride ? providerOverride : null,
      amount_type: amountType,
      estimated_amount: amt,
      vat_pct: vatPct,
      is_vat_deductible: isVatDeductible,
      frequency,
      day_of_period: dayOfPeriod,
      month_of_year: frequency === 'annual' ? monthOfYear : null,
      start_date: startDate,
      end_date: endDate || null,
      default_payment_method: defaultPaymentMethod || null,
      default_payment_account_id: defaultPaymentAccountId || null,
      auto_mark_paid: autoMarkPaid,
      notes: notes || null,
    }

    const { error } = template
      ? await updateRecurringTemplate(template.id, input)
      : await createRecurringTemplate(input)

    if (error) { toast.error(error); setSaving(false); return }

    toast.success(template ? 'Plantilla actualizada' : 'Plantilla creada')
    onSaved()
    onClose()
  }

  const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef2f7] sticky top-0 bg-white z-10">
          <h2 className="text-[16px] font-bold text-slate-800">
            {template ? 'Editar plantilla recurrente' : 'Nueva plantilla recurrente'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Propiedad + Nombre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Propiedad *</label>
              <select
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
              >
                <option value="">Seleccionar...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="WiFi casa, Seguro hogar..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Categoría *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
            >
              {EXPENSE_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Proveedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Proveedor</label>
              <select
                value={providerId}
                onChange={e => { setProviderId(e.target.value); if (e.target.value) setProviderOverride('') }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
              >
                <option value="">Sin proveedor</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!providerId && (
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Proveedor (texto)</label>
                <input
                  type="text"
                  value={providerOverride}
                  onChange={e => setProviderOverride(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
                />
              </div>
            )}
          </div>

          {/* Tipo importe + importe */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-2">Tipo de importe</label>
            <div className="flex gap-2 mb-3">
              {(['fixed', 'estimated'] as RecurringAmountType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAmountType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    amountType === t ? 'bg-landing-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'fixed' ? 'Fijo' : 'Estimado'}
                </button>
              ))}
            </div>
            {amountType === 'estimated' && (
              <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                Se generará con este importe como referencia. Deberás confirmar con el importe real al recibir la factura.
              </p>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                  {amountType === 'fixed' ? 'Importe (€)' : 'Importe estimado (€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={estimatedAmount}
                  onChange={e => setEstimatedAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">IVA</label>
                <select
                  value={vatPct}
                  onChange={e => setVatPct(Number(e.target.value) as VatPct)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
                >
                  {[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVatDeductible}
                    onChange={e => setIsVatDeductible(e.target.checked)}
                    className="w-4 h-4 rounded accent-landing-navy"
                  />
                  IVA deducible
                </label>
              </div>
            </div>
          </div>

          {/* Forma de pago + auto-pago */}
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                Forma de pago habitual
              </label>
              <select
                value={defaultPaymentMethod}
                onChange={e => {
                  setDefaultPaymentMethod(e.target.value)
                  if (!e.target.value) setAutoMarkPaid(false)
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
              >
                <option value="">Sin especificar</option>
                <option value="Domiciliación">Domiciliación</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {accounts.length > 0 && (
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                  Cuenta de cargo
                </label>
                <select
                  value={defaultPaymentAccountId}
                  onChange={e => setDefaultPaymentAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
                >
                  <option value="">Sin asignar</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {amountType === 'fixed' && !!defaultPaymentMethod && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-slate-700">
                    Marcar como pagado automáticamente al generar
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Actívalo si este gasto se paga solo (ej: domiciliación bancaria). No aplica a gastos estimados.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoMarkPaid}
                  onChange={e => setAutoMarkPaid(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-landing-navy shrink-0"
                />
              </div>
            )}
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-2">Frecuencia</label>
            <div className="flex gap-2 mb-3">
              {(['monthly', 'quarterly', 'annual'] as RecurringFrequency[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    frequency === f ? 'bg-landing-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'monthly' ? 'Mensual' : f === 'quarterly' ? 'Trimestral' : 'Anual'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                  Día del período (1-28)
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfPeriod}
                  onChange={e => setDayOfPeriod(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
                />
              </div>
              {frequency === 'annual' && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Mes del año</label>
                  <select
                    value={monthOfYear}
                    onChange={e => setMonthOfYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-landing-navy"
                  >
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Fecha de inicio *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Fecha de fin (opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy resize-none"
            />
          </div>

          {/* Footer */}
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
              {saving ? 'Guardando...' : template ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
