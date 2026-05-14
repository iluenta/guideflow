'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Scan, Upload, X, FileText, Image as ImageIcon, Download, Loader2 } from 'lucide-react'
import { createExpense, updateExpense, uploadExpenseDocument } from '@/app/actions/expenses'
import { extractExpenseFromImage } from '@/app/actions/expense-ocr'
import { getProviders } from '@/app/actions/providers'
import { getProperties } from '@/app/actions/properties'
import { getPaymentAccounts } from '@/app/actions/payment-accounts'
import { getExpenseDocumentUrl } from '@/app/actions/expenses'
import { getActiveReservations } from '@/app/actions/reservations'
import { useEffect } from 'react'
import type { PaymentAccount } from '@/types/treasury'
import type {
  ExpenseWithDetails,
  ExpenseCategory,
  ExpenseType,
  VatPct,
  CreateExpenseInput,
} from '@/types/expenses'
import { EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import type { Provider } from '@/types/reservations'

interface ExpenseFormProps {
  mode: 'create' | 'edit'
  expense?: ExpenseWithDetails
  defaultReservationId?: string
  defaultPropertyId?: string
}

type ExtractedData = {
  total_amount: number | null
  amount_without_vat: number | null
  vat_pct: number | null
  expense_date: string | null
  provider_name: string | null
  invoice_number: string | null
  description: string | null
  confidence: 'high' | 'medium' | 'low'
}

export function ExpenseForm({
  mode,
  expense,
  defaultReservationId,
  defaultPropertyId,
}: ExpenseFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const backUrl = searchParams.get('back') ?? '/dashboard/expenses'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ocrInputRef = useRef<HTMLInputElement>(null)

  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [providers, setProviders] = useState<Provider[]>([])

  const [expenseType, setExpenseType] = useState<ExpenseType>(
    expense?.expense_type ?? (defaultReservationId ? 'reservation' : 'property')
  )
  const [propertyId, setPropertyId] = useState(expense?.property_id ?? defaultPropertyId ?? '')
  const [reservationId, setReservationId] = useState(expense?.reservation_id ?? defaultReservationId ?? '')
  const [activeReservations, setActiveReservations] = useState<{ id: string; guest_name: string; checkin_date: string; checkout_date: string }[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'other')

  // Proveedores que tienen la categoría activa entre sus servicios (o ningún servicio = mostrar siempre)
  const filteredProviders = providers.filter(p => {
    const services = p.provider_services ?? []
    if (services.length === 0) return true
    return services.some(s => s.category === category || s.category === 'other')
  })
  const [description, setDescription] = useState(expense?.description ?? '')
  const [providerId, setProviderId] = useState(expense?.provider_id ?? '')
  const [providerOverride, setProviderOverride] = useState(expense?.provider_name_override ?? '')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [vatPct, setVatPct] = useState<VatPct>(expense?.vat_pct ?? 0)
  const [isVatDeductible, setIsVatDeductible] = useState(expense?.is_vat_deductible ?? false)
  const [expenseDate, setExpenseDate] = useState(expense?.expense_date ?? new Date().toISOString().split('T')[0])
  const [invoiceNumber, setInvoiceNumber] = useState(expense?.invoice_number ?? '')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>(expense?.payment_status ?? 'paid')
  const [paymentDate, setPaymentDate] = useState(expense?.payment_date ?? '')
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? '')
  const [paymentAccountId, setPaymentAccountId] = useState<string>((expense as ExpenseWithDetails & { payment_account_id?: string | null })?.payment_account_id ?? '')
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const [ocring, setOcring] = useState(false)
  const [ocrConfidence, setOcrConfidence] = useState<'high' | 'medium' | 'low' | null>(null)
  const [saving, setSaving] = useState(false)
  const [docUrl, setDocUrl] = useState<string | null>(null)

  // Cargar URL firmada del documento si existe
  useEffect(() => {
    if (mode === 'edit' && expense?.id && expense?.document_url) {
      getExpenseDocumentUrl(expense.id).then(({ url }) => {
        if (url) setDocUrl(url)
      })
    }
  }, [mode, expense?.id, expense?.document_url])

  useEffect(() => {
    Promise.all([
      getProperties(),
      getProviders(),
      getPaymentAccounts(),
    ]).then(([props, { providers: provs }, { accounts: accs }]) => {
      setProperties((props as unknown as { id: string; name: string }[]) ?? [])
      setProviders(provs ?? [])
      setAccounts((accs ?? []).filter(a => a.is_active))
    })
  }, [])

  // Cargar reservas cuando cambia la propiedad y el tipo es 'reservation'
  useEffect(() => {
    if (expenseType === 'reservation' && propertyId) {
      setLoadingReservations(true)
      getActiveReservations(propertyId).then(({ reservations, error }) => {
        if (error) {
          toast.error(error)
          setActiveReservations([])
        } else {
          setActiveReservations(reservations ?? [])
          // Si estamos en modo create y el ID actual no está en la lista nueva, resetear
          if (mode === 'create' && reservationId && !reservations?.some(r => r.id === reservationId)) {
            setReservationId('')
          }
        }
        setLoadingReservations(false)
      })
    } else {
      setActiveReservations([])
    }
  }, [propertyId, expenseType, mode])

  const vatAmount = Math.round(parseFloat(amount || '0') * vatPct) / 100
  const totalAmount = Math.round((parseFloat(amount || '0') + vatAmount) * 100) / 100

  async function handleOcr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setOcring(true)
    setAttachedFile(file)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const mime = file.type as Parameters<typeof extractExpenseFromImage>[1]
      const result = await extractExpenseFromImage(base64, mime) as ExtractedData

      if (result.description) setDescription(result.description)
      if (result.expense_date) setExpenseDate(result.expense_date)
      if (result.invoice_number) setInvoiceNumber(result.invoice_number)
      if (result.amount_without_vat) {
        setAmount(String(result.amount_without_vat))
      } else if (result.total_amount) {
        setAmount(String(result.total_amount))
      }
      if (result.vat_pct !== null && [0, 4, 10, 21].includes(result.vat_pct)) {
        setVatPct(result.vat_pct as VatPct)
      }
      if (result.provider_name) setProviderOverride(result.provider_name)

      setOcrConfidence(result.confidence)
      setOcring(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('El importe debe ser mayor que 0')
      return
    }
    if (!propertyId) {
      toast.error('Selecciona una propiedad')
      return
    }

    if (!description.trim()) {
      toast.error('Introduce una descripción')
      return
    }

    setSaving(true)

    const input: CreateExpenseInput = {
      property_id: propertyId,
      reservation_id: expenseType === 'reservation' ? reservationId || null : null,
      expense_type: expenseType,
      category,
      description,
      provider_id: providerId || null,
      provider_name_override: !providerId && providerOverride ? providerOverride : null,
      amount: numAmount,
      vat_pct: vatPct,
      is_vat_deductible: isVatDeductible,
      expense_date: expenseDate,
      invoice_number: invoiceNumber || null,
      payment_status: paymentStatus as 'paid' | 'pending',
      payment_date: paymentStatus === 'paid' ? paymentDate || null : null,
      payment_method: paymentStatus === 'paid' ? paymentMethod || null : null,
      payment_account_id: paymentStatus === 'paid' ? paymentAccountId || null : null,
      notes: notes || null,
    }

    let expenseId: string | undefined

    if (mode === 'create') {
      const { expense: created, error } = await createExpense(input)
      if (error) {
        console.error('[ExpenseForm] createExpense error:', error)
        toast.error(error)
        setSaving(false)
        return
      }
      expenseId = created?.id
    } else if (expense) {
      const { error } = await updateExpense(expense.id, input)
      if (error) {
        console.error('[ExpenseForm] updateExpense error:', error)
        toast.error(error)
        setSaving(false)
        return
      }
      expenseId = expense.id
    }

    if (expenseId && attachedFile) {
      const fd = new FormData()
      fd.append('file', attachedFile)
      const { error: uploadError } = await uploadExpenseDocument(expenseId, fd)
      if (uploadError) console.error('[ExpenseForm] upload error:', uploadError)
    }

    toast.success(mode === 'create' ? 'Gasto creado' : 'Gasto actualizado')
    router.push(backUrl)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* OCR banner */}
      <div className="bg-white rounded-2xl border border-[#eef2f7] p-5">
        <p className="text-[13px] font-semibold text-slate-700 mb-3">Escanear ticket o factura</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => ocrInputRef.current?.click()}
            disabled={ocring}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-landing-navy-tint text-landing-navy text-sm font-medium hover:bg-landing-navy/10 transition-colors disabled:opacity-60"
          >
            <Scan className="h-4 w-4" />
            {ocring ? 'Procesando con IA...' : 'Escanear documento'}
          </button>
          {ocrConfidence && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium ${
              ocrConfidence === 'high' ? 'bg-emerald-50 text-emerald-700' :
              ocrConfidence === 'medium' ? 'bg-amber-50 text-amber-700' :
              'bg-rose-50 text-rose-600'
            }`}>
              {ocrConfidence === 'high' ? '✓ Alta confianza' :
               ocrConfidence === 'medium' ? '⚠ Revisa los datos' :
               '✗ Baja confianza — revisa todo'}
            </span>
          )}
        </div>
        <input
          ref={ocrInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleOcr}
        />
      </div>

      {/* Formulario principal */}
      <div className="bg-white rounded-2xl border border-[#eef2f7] p-5 space-y-5">

        {/* Tipo */}
        <div>
          <label className="block text-[12px] font-medium text-slate-600 mb-2">Tipo de gasto</label>
          <div className="flex gap-2">
            {(['property', 'reservation'] as ExpenseType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setExpenseType(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  expenseType === t
                    ? 'bg-landing-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'property' ? 'De propiedad' : 'De reserva'}
              </button>
            ))}
          </div>
        </div>

        {/* Propiedad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Propiedad *</label>
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
            >
              <option value="">Seleccionar...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {expenseType === 'reservation' && (
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Reserva vinculada *</label>
              <div className="relative">
                <select
                  value={reservationId}
                  onChange={e => setReservationId(e.target.value)}
                  disabled={!propertyId || loadingReservations}
                  required={expenseType === 'reservation'}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{loadingReservations ? 'Cargando reservas...' : propertyId ? 'Seleccionar reserva...' : 'Primero selecciona propiedad'}</option>
                  {activeReservations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.guest_name} ({new Date(r.checkin_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(r.checkout_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })})
                    </option>
                  ))}
                </select>
                {loadingReservations && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              {!loadingReservations && propertyId && activeReservations.length === 0 && (
                <p className="mt-1 text-[11px] text-amber-600 font-medium">No hay reservas abiertas para esta propiedad</p>
              )}
            </div>
          )}
        </div>

        {/* Categoría + Descripción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Categoría *</label>
            <select
              value={category}
              onChange={e => {
                const newCat = e.target.value as ExpenseCategory
                setCategory(newCat)
                // Resetear proveedor si ya no aparece en la lista filtrada
                if (providerId) {
                  const found = providers.find(p => p.id === providerId)
                  if (found) {
                    const services = found.provider_services ?? []
                    const still = services.length === 0 || services.some(s => s.category === newCat || s.category === 'other')
                    if (!still) setProviderId('')
                  }
                }
              }}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
            >
              {EXPENSE_CATEGORIES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Descripción *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              placeholder="Limpieza habitación, Factura luz..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
            />
          </div>
        </div>

        {/* Proveedor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Proveedor (biblioteca)</label>
            <select
              value={providerId}
              onChange={e => { setProviderId(e.target.value); if (e.target.value) setProviderOverride('') }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
            >
              <option value="">Sin proveedor</option>
              {filteredProviders.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {!providerId && (
            <div>
              <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Proveedor (texto libre)</label>
              <input
                type="text"
                value={providerOverride}
                onChange={e => setProviderOverride(e.target.value)}
                placeholder="Nombre del proveedor"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
              />
            </div>
          )}
        </div>

        {/* Importes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Base imponible (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">IVA</label>
            <select
              value={vatPct}
              onChange={e => setVatPct(Number(e.target.value) as VatPct)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
            >
              {[0, 4, 10, 21].map(v => (
                <option key={v} value={v}>{v}%</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Total</label>
            <div className="px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm font-semibold text-landing-navy">
              €{totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* IVA deducible */}
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="vat-deductible"
            checked={isVatDeductible}
            onChange={e => setIsVatDeductible(e.target.checked)}
            className="w-4 h-4 rounded accent-landing-navy"
          />
          <label htmlFor="vat-deductible" className="text-[13px] text-slate-600">
            IVA deducible
          </label>
        </div>

        {/* Fechas y factura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Fecha del gasto *</label>
            <input
              type="date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Nº factura</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="FAC-2026-001"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
            />
          </div>
        </div>

        {/* Pago */}
        <div>
          <label className="block text-[12px] font-medium text-slate-600 mb-2">Estado de pago</label>
          <div className="flex gap-2 mb-3">
            {(['paid', 'pending'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setPaymentStatus(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  paymentStatus === s
                    ? 'bg-landing-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'paid' ? 'Pagado' : 'Pendiente'}
              </button>
            ))}
          </div>
          {paymentStatus === 'paid' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Fecha de pago</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Método de pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Domiciliación">Domiciliación</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Bizum">Bizum</option>
                  </select>
                </div>
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">
                    Cuenta de cargo
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={e => setPaymentAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 bg-white"
                  >
                    <option value="">Sin asignar</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Notas</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Observaciones adicionales..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-landing-navy focus:ring-2 focus:ring-landing-navy/10 resize-none"
          />
        </div>
      </div>

      {/* Adjuntar documento */}
      <div className="bg-white rounded-2xl border border-[#eef2f7] p-5">
        <p className="text-[13px] font-semibold text-slate-700 mb-3">
          {mode === 'edit' && expense?.document_url ? 'Reemplazar documento' : 'Adjuntar documento'}
        </p>

        {mode === 'edit' && expense?.document_url && !attachedFile && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-xl">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-[12px] text-slate-600 flex-1 truncate">
              {expense.document_name ?? 'Documento adjunto'}
            </span>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={expense.document_name ?? 'documento'}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-landing-navy-tint text-landing-navy text-[11px] font-medium hover:bg-landing-navy/10 transition-colors shrink-0"
                title="Descargar documento"
              >
                <Download className="h-3 w-3" />
                Descargar
              </a>
            )}
          </div>
        )}

        {attachedFile ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
            {attachedFile.type.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-emerald-600" />
            ) : (
              <FileText className="h-4 w-4 text-emerald-600" />
            )}
            <span className="text-[12px] text-emerald-700 flex-1 truncate">{attachedFile.name}</span>
            <button type="button" onClick={() => setAttachedFile(null)}>
              <X className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-landing-navy hover:text-landing-navy transition-colors w-full justify-center"
          >
            <Upload className="h-4 w-4" />
            PDF, JPG, PNG o HEIC · máx. 10MB
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
          className="hidden"
          onChange={e => setAttachedFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push(backUrl)}
          className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-landing-navy text-white text-sm font-semibold hover:bg-landing-navy-soft disabled:opacity-60"
        >
          {saving ? 'Guardando...' : mode === 'create' ? 'Crear gasto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
