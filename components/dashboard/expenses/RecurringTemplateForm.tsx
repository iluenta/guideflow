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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Propiedad + Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Propiedad *</label>
              <select
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
              >
                <option value="">Seleccionar propiedad...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Ej: Seguro Hogar, WiFi..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Categoría *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
            >
              {EXPENSE_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Proveedor</label>
              <select
                value={providerId}
                onChange={e => { setProviderId(e.target.value); if (e.target.value) setProviderOverride('') }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
              >
                <option value="">Sin proveedor asignado</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!providerId && (
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Proveedor (otro)</label>
                <input
                  type="text"
                  value={providerOverride}
                  onChange={e => setProviderOverride(e.target.value)}
                  placeholder="Nombre del proveedor..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                />
              </div>
            )}
          </div>

          {/* Tipo importe + importe */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Tipo de importe</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {(['fixed', 'estimated'] as RecurringAmountType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAmountType(t)}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                      amountType === t ? 'bg-white text-landing-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t === 'fixed' ? 'Fijo' : 'Estimado'}
                  </button>
                ))}
              </div>
            </div>

            {amountType === 'estimated' && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  <strong>Nota:</strong> Los gastos estimados se generan con el importe de referencia y deben confirmarse manualmente al recibir la factura real.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1 space-y-1.5">
                <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">
                  {amountType === 'fixed' ? 'Importe (€)' : 'Estimado (€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={estimatedAmount}
                  onChange={e => setEstimatedAmount(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] font-mono bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">IVA %</label>
                <select
                  value={vatPct}
                  onChange={e => setVatPct(Number(e.target.value) as VatPct)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                >
                  {[0, 4, 10, 21].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
              <div className="flex items-center sm:pt-6">
                <label className="flex items-center gap-3 p-3 w-full rounded-xl border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isVatDeductible}
                    onChange={e => setIsVatDeductible(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-landing-navy focus:ring-landing-navy"
                  />
                  <span className="text-[13px] font-medium text-slate-700">Deducible</span>
                </label>
              </div>
            </div>
          </div>

          {/* Forma de pago + auto-pago */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Forma de pago</label>
                <select
                  value={defaultPaymentMethod}
                  onChange={e => {
                    setDefaultPaymentMethod(e.target.value)
                    if (!e.target.value) setAutoMarkPaid(false)
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                >
                  <option value="">No especificada</option>
                  <option value="Domiciliación">Domiciliación</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              {accounts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Cuenta cargo</label>
                  <select
                    value={defaultPaymentAccountId}
                    onChange={e => setDefaultPaymentAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                  >
                    <option value="">Sin cuenta asignada</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {amountType === 'fixed' && !!defaultPaymentMethod && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                <input
                  type="checkbox"
                  checked={autoMarkPaid}
                  onChange={e => setAutoMarkPaid(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-slate-300 text-landing-navy focus:ring-landing-navy shrink-0"
                />
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-landing-navy">
                    Auto-pago al generar
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Marcar automáticamente como pagado al generarse el gasto. Útil para recibos domiciliados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Frecuencia */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Frecuencia</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['monthly', 'quarterly', 'biannual', 'annual'] as RecurringFrequency[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`py-2 rounded-xl text-[12px] font-semibold transition-all border ${
                      frequency === f 
                        ? 'bg-landing-navy text-white border-landing-navy shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {f === 'monthly' ? 'Mensual' : f === 'quarterly' ? 'Trimestral' : f === 'biannual' ? 'Semestral' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Día ejecución (1-28)</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfPeriod}
                  onChange={e => setDayOfPeriod(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                />
              </div>
              {frequency === 'annual' && (
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Mes ejecución</label>
                  <select
                    value={monthOfYear}
                    onChange={e => setMonthOfYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
                  >
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Fecha inicio *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Fecha fin (opcional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[12px] font-bold text-[#1e3a8a] uppercase tracking-wider">Observaciones</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalles adicionales sobre la periodicidad o el gasto..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50 focus:bg-white focus:outline-none focus:border-landing-navy transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-3.5 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-[#1e3a8a] text-white text-[14px] font-bold hover:bg-[#15296b] shadow-lg shadow-blue-900/10 disabled:opacity-50 transition-all"
            >
              {saving ? 'Guardando...' : template ? 'Guardar cambios' : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
