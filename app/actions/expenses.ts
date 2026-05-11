'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import type {
  Expense,
  ExpenseWithDetails,
  ExpenseFilters,
  ExpensesSummary,
  CreateExpenseInput,
  UpdateExpenseInput,
  ConfirmEstimatedInput,
  RecurringExpenseTemplate,
  CreateRecurringTemplateInput,
  UpdateRecurringTemplateInput,
  ExpenseCategory,
} from '@/types/expenses'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcVat(amount: number, vatPct: number) {
  const vat_amount = Math.round(amount * vatPct) / 100
  return {
    vat_amount,
    total_amount: Math.round((amount + vat_amount) * 100) / 100,
  }
}

function yearToDateRange(year: number | 'all'): { date_from?: string; date_to?: string } {
  if (year === 'all') return {}
  return { date_from: `${year}-01-01`, date_to: `${year}-12-31` }
}

function applyDateFilters(
  query: ReturnType<ReturnType<typeof createClient> extends Promise<infer C> ? never : never>,
  filters: ExpenseFilters
) {
  return query
}

// ─── getExpenses ──────────────────────────────────────────────────────────────

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<{ expenses: ExpenseWithDetails[]; total: number; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const {
      year,
      property_id,
      expense_type,
      category,
      status,
      payment_status,
      reservation_id,
      date_from: filterDateFrom,
      date_to: filterDateTo,
      page = 1,
      per_page = 20,
    } = filters

    const dateRange = year !== undefined ? yearToDateRange(year) : {}
    const date_from = filterDateFrom ?? dateRange.date_from
    const date_to   = filterDateTo   ?? dateRange.date_to

    let query = supabase
      .from('expenses')
      .select(`
        *,
        properties!inner(name),
        providers(name),
        reservations(guest_name, checkin_date)
      `, { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .order('expense_date', { ascending: false })

    if (property_id)     query = query.eq('property_id', property_id)
    if (expense_type)    query = query.eq('expense_type', expense_type)
    if (status)          query = query.eq('status', status)
    if (payment_status)  query = query.eq('payment_status', payment_status)
    if (reservation_id)  query = query.eq('reservation_id', reservation_id)
    if (category?.length) query = query.in('category', category)
    if (date_from)       query = query.gte('expense_date', date_from)
    if (date_to)         query = query.lte('expense_date', date_to)

    const from = (page - 1) * per_page
    query = query.range(from, from + per_page - 1)

    const { data, error, count } = await query

    if (error) return { expenses: [], total: 0, error: error.message }

    const expenses: ExpenseWithDetails[] = (data ?? []).map((row: Record<string, unknown>) => ({
      ...(row as unknown as Expense),
      property_name: (row.properties as { name: string } | null)?.name ?? '',
      provider_name: (row.providers as { name: string } | null)?.name ?? null,
      reservation_guest: (row.reservations as { guest_name: string } | null)?.guest_name ?? null,
      reservation_checkin: (row.reservations as { checkin_date: string } | null)?.checkin_date ?? null,
    }))

    return { expenses, total: count ?? 0 }
  } catch (e: unknown) {
    return { expenses: [], total: 0, error: (e as Error).message }
  }
}

// ─── getExpense (single) ──────────────────────────────────────────────────────

export async function getExpense(
  id: string
): Promise<{ expense?: ExpenseWithDetails; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const { data, error } = await supabase
      .from('expenses')
      .select(`*, properties!inner(name), providers(name), reservations(guest_name, checkin_date)`)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (error) return { error: error.message }

    const row = data as Record<string, unknown>
    return {
      expense: {
        ...(row as unknown as Expense),
        property_name: (row.properties as { name: string } | null)?.name ?? '',
        provider_name: (row.providers as { name: string } | null)?.name ?? null,
        reservation_guest: (row.reservations as { guest_name: string } | null)?.guest_name ?? null,
        reservation_checkin: (row.reservations as { checkin_date: string } | null)?.checkin_date ?? null,
      },
    }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── getExpensesSummary ───────────────────────────────────────────────────────

export async function getExpensesSummary(
  filters: ExpenseFilters = {}
): Promise<{ summary: ExpensesSummary; error?: string }> {
  const empty: ExpensesSummary = {
    total_expenses: 0,
    total_by_category: {},
    total_reservation_expenses: 0,
    total_property_expenses: 0,
    pending_confirmation: 0,
    pending_payment: 0,
  }

  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const dateRange = filters.year !== undefined ? yearToDateRange(filters.year) : {}
    const date_from = filters.date_from ?? dateRange.date_from
    const date_to   = filters.date_to   ?? dateRange.date_to

    let query = supabase
      .from('expenses')
      .select('total_amount, category, expense_type, status, payment_status')
      .eq('tenant_id', profile.tenant_id)

    if (filters.property_id) query = query.eq('property_id', filters.property_id)
    if (date_from) query = query.gte('expense_date', date_from)
    if (date_to)   query = query.lte('expense_date', date_to)

    const { data, error } = await query
    if (error) return { summary: empty, error: error.message }

    const rows = data ?? []
    const summary: ExpensesSummary = { ...empty }

    for (const row of rows) {
      summary.total_expenses += row.total_amount
      summary.total_by_category[row.category as ExpenseCategory] =
        (summary.total_by_category[row.category as ExpenseCategory] ?? 0) + row.total_amount
      if (row.expense_type === 'reservation') summary.total_reservation_expenses += row.total_amount
      else summary.total_property_expenses += row.total_amount
      if (row.status === 'estimated') summary.pending_confirmation++
      if (row.payment_status === 'pending') summary.pending_payment++
    }

    return { summary }
  } catch (e: unknown) {
    return { summary: empty, error: (e as Error).message }
  }
}

// ─── createExpense ────────────────────────────────────────────────────────────

export async function createExpense(
  input: CreateExpenseInput
): Promise<{ expense?: Expense; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'create')) {
      return { error: 'Sin permisos' }
    }

    const { vat_amount, total_amount } = calcVat(input.amount, input.vat_pct)

    // Security check: If reservation_id is provided, verify it belongs to this tenant and property
    if (input.reservation_id) {
      const { data: resData, error: resErr } = await supabase
        .from('reservations')
        .select('id')
        .eq('id', input.reservation_id)
        .eq('property_id', input.property_id)
        .eq('tenant_id', profile.tenant_id)
        .single()

      if (resErr || !resData) {
        return { error: 'La reserva seleccionada no es válida para esta propiedad' }
      }
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        tenant_id: profile.tenant_id,
        property_id: input.property_id,
        reservation_id: input.reservation_id ?? null,
        expense_type: input.expense_type,
        category: input.category,
        description: input.description,
        provider_id: input.provider_id ?? null,
        provider_name_override: input.provider_name_override ?? null,
        amount: input.amount,
        vat_pct: input.vat_pct,
        vat_amount,
        total_amount,
        is_vat_deductible: input.is_vat_deductible ?? false,
        expense_date: input.expense_date,
        invoice_number: input.invoice_number ?? null,
        invoice_date: input.invoice_date ?? null,
        status: input.status ?? 'confirmed',
        payment_status: input.payment_status ?? 'paid',
        payment_date: input.payment_date ?? null,
        payment_method: input.payment_method ?? null,
        payment_account_id: input.payment_account_id ?? null,
        notes: input.notes ?? null,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses')
    return { expense: data as Expense }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── updateExpense ────────────────────────────────────────────────────────────

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<{ expense?: Expense; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    // Leer estado actual para detectar transición estimated → confirmed
    const { data: current } = await supabase
      .from('expenses')
      .select('amount, status')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!current) return { error: 'Gasto no encontrado' }

    // Security check: If reservation_id is changing or property_id is changing, verify link
    const newReservationId = input.reservation_id !== undefined ? input.reservation_id : (current as any).reservation_id
    const newPropertyId = input.property_id ?? (current as any).property_id

    if (newReservationId) {
      const { data: resData, error: resErr } = await supabase
        .from('reservations')
        .select('id')
        .eq('id', newReservationId)
        .eq('property_id', newPropertyId)
        .eq('tenant_id', profile.tenant_id)
        .single()

      if (resErr || !resData) {
        return { error: 'La reserva seleccionada no es válida para esta propiedad' }
      }
    }

    const updates: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() }

    // Si cambia amount o vat_pct, recalcular
    const newAmount = input.amount ?? (current as { amount: number }).amount
    const newVat = input.vat_pct ?? 0
    if (input.amount !== undefined || input.vat_pct !== undefined) {
      const { vat_amount, total_amount } = calcVat(newAmount, newVat)
      updates.vat_amount = vat_amount
      updates.total_amount = total_amount
    }

    // Si transiciona de estimated → confirmed, guardar el estimado original
    if (
      (current as { status: string }).status === 'estimated' &&
      input.status === 'confirmed' &&
      input.amount !== undefined
    ) {
      updates.estimated_amount = (current as { amount: number }).amount
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses')
    return { expense: data as Expense }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── confirmEstimatedExpense ──────────────────────────────────────────────────

export async function confirmEstimatedExpense(
  id: string,
  input: ConfirmEstimatedInput
): Promise<{ expense?: Expense; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    const { data: current } = await supabase
      .from('expenses')
      .select('amount, vat_pct')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!current) return { error: 'Gasto no encontrado' }

    const { vat_amount, total_amount } = calcVat(
      input.real_amount,
      (current as { vat_pct: number }).vat_pct
    )

    const { data, error } = await supabase
      .from('expenses')
      .update({
        estimated_amount: (current as { amount: number }).amount,
        amount: input.real_amount,
        vat_amount,
        total_amount,
        status: 'confirmed',
        invoice_number: input.invoice_number ?? null,
        invoice_date: input.invoice_date ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses')
    return { expense: data as Expense }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── deleteExpense ────────────────────────────────────────────────────────────

export async function deleteExpense(id: string): Promise<{
  error?: string
  was_paid?: boolean
  account_name?: string | null
  amount_restored?: number | null
}> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'delete')) {
      return { error: 'Sin permisos' }
    }

    const { data: current } = await supabase
      .from('expenses')
      .select('payment_status, total_amount, payment_account_id, description')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!current) return { error: 'Gasto no encontrado' }

    const row = current as {
      payment_status: string
      total_amount: number
      payment_account_id: string | null
      description: string
    }

    // Leer nombre de cuenta si está asociada (para el mensaje de la UI)
    let accountName: string | null = null
    if (row.payment_account_id) {
      const { data: acc } = await supabase
        .from('payment_accounts')
        .select('name')
        .eq('id', row.payment_account_id)
        .single()
      accountName = (acc as { name: string } | null)?.name ?? null
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard/treasury')
    return {
      was_paid: row.payment_status === 'paid',
      account_name: accountName,
      amount_restored: row.payment_status === 'paid' ? row.total_amount : null,
    }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── uploadExpenseDocument ────────────────────────────────────────────────────

export async function uploadExpenseDocument(
  expenseId: string,
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const file = formData.get('file') as File
    if (!file) return { error: 'No se proporcionó archivo' }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${profile.tenant_id}/${expenseId}/${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('expense-documents')
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) return { error: uploadError.message }

    const docType = file.type.startsWith('image/') ? 'image' : 'pdf'

    await supabase
      .from('expenses')
      .update({
        document_url: path,
        document_name: file.name,
        document_type: docType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .eq('tenant_id', profile.tenant_id)

    const { data: signedData } = await supabase.storage
      .from('expense-documents')
      .createSignedUrl(path, 3600)

    revalidatePath('/dashboard/expenses')
    return { url: signedData?.signedUrl }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── getExpenseDocumentUrl ────────────────────────────────────────────────────

export async function getExpenseDocumentUrl(
  expenseId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const { data: expense } = await supabase
      .from('expenses')
      .select('document_url')
      .eq('id', expenseId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!expense?.document_url) return { error: 'Sin documento adjunto' }

    const { data } = await supabase.storage
      .from('expense-documents')
      .createSignedUrl(expense.document_url as string, 3600)

    return { url: data?.signedUrl }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── generatePendingRecurringExpenses ─────────────────────────────────────────

export async function generatePendingRecurringExpenses(): Promise<{
  generated: number
  pendingConfirmation: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)
    const today = new Date()

    const { data: templates, error: tErr } = await supabase
      .from('recurring_expense_templates')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true)

    if (tErr) return { generated: 0, pendingConfirmation: 0, error: tErr.message }

    let generated = 0
    let pendingConfirmation = 0

    for (const tpl of templates ?? []) {
      const startDate = new Date(tpl.start_date as string)
      if (startDate > today) continue
      if (tpl.end_date && new Date(tpl.end_date as string) < today) continue

      const periods = getPendingPeriods(tpl as RecurringPeriodTemplate, today)
      if (periods.length === 0) continue

      const status = tpl.amount_type === 'fixed' ? 'confirmed' : 'estimated'
      const { vat_amount, total_amount } = calcVat(tpl.estimated_amount, tpl.vat_pct)
      let lastGeneratedDate: string | null = null

      // Auto-pago solo si es importe fijo, hay método de pago y el toggle está activo
      const isAutoPayable =
        tpl.auto_mark_paid === true &&
        tpl.amount_type === 'fixed' &&
        !!tpl.default_payment_method

      for (const periodDate of periods) {
        const dateStr = toDateStr(periodDate)

        // Evitar duplicados: verificar que no existe gasto de este template en ese mes
        const periodStart = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}-01`
        const periodEnd   = toDateStr(new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0))

        const { count } = await supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('recurring_template_id', tpl.id)
          .gte('expense_date', periodStart)
          .lte('expense_date', periodEnd)

        if ((count ?? 0) > 0) continue

        await supabase.from('expenses').insert({
          tenant_id:              profile.tenant_id,
          property_id:            tpl.property_id,
          expense_type:           'property',
          category:               tpl.category,
          description:            tpl.name,
          provider_id:            tpl.provider_id ?? null,
          provider_name_override: tpl.provider_name_override ?? null,
          amount:                 tpl.estimated_amount,
          vat_pct:                tpl.vat_pct,
          vat_amount,
          total_amount,
          is_vat_deductible:      tpl.is_vat_deductible,
          expense_date:           dateStr,
          status,
          payment_method:         tpl.default_payment_method ?? null,
          payment_account_id:     tpl.default_payment_account_id ?? null,
          payment_status:         isAutoPayable ? 'paid' : 'pending',
          payment_date:           isAutoPayable ? dateStr : null,
          recurring_template_id:  tpl.id,
          created_by:             profile.id,
        })

        lastGeneratedDate = dateStr
        generated++
        if (status === 'estimated') pendingConfirmation++
      }

      if (lastGeneratedDate) {
        await supabase
          .from('recurring_expense_templates')
          .update({ last_generated_at: lastGeneratedDate })
          .eq('id', tpl.id)
      }
    }

    return { generated, pendingConfirmation }
  } catch (e: unknown) {
    return { generated: 0, pendingConfirmation: 0, error: (e as Error).message }
  }
}

// Tipo mínimo para los helpers
interface RecurringPeriodTemplate {
  last_generated_at: string | null
  start_date: string
  frequency: string
  day_of_period: number
  month_of_year: number | null
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getNextPeriodDate(date: Date, frequency: string): Date {
  const next = new Date(date)
  if (frequency === 'monthly')   next.setMonth(next.getMonth() + 1)
  if (frequency === 'quarterly') next.setMonth(next.getMonth() + 3)
  if (frequency === 'annual')    next.setFullYear(next.getFullYear() + 1)
  return next
}

function getPendingPeriods(tpl: RecurringPeriodTemplate, today: Date): Date[] {
  const periods: Date[] = []

  // Punto de inicio: siguiente período tras last_generated_at, o start_date
  let cursor = tpl.last_generated_at
    ? getNextPeriodDate(new Date(tpl.last_generated_at), tpl.frequency)
    : new Date(tpl.start_date)

  // Iterar hasta que el período supere hoy
  while (true) {
    // La fecha real del gasto en este período (con el día configurado)
    const periodDate = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      tpl.day_of_period
    )

    // Si el día del período aún no ha llegado o el período es futuro, parar
    if (periodDate > today) break

    periods.push(periodDate)
    cursor = getNextPeriodDate(cursor, tpl.frequency)
  }

  return periods
}

// ─── Recurring templates CRUD ─────────────────────────────────────────────────

export async function getRecurringTemplates(): Promise<{
  templates: RecurringExpenseTemplate[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const { data, error } = await supabase
      .from('recurring_expense_templates')
      .select('*, properties(name), providers(name)')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    if (error) return { templates: [], error: error.message }

    const templates = (data ?? []).map((row: Record<string, unknown>) => ({
      ...(row as unknown as RecurringExpenseTemplate),
      property_name: (row.properties as { name: string } | null)?.name ?? '',
      provider_name: (row.providers as { name: string } | null)?.name ?? null,
    }))

    return { templates }
  } catch (e: unknown) {
    return { templates: [], error: (e as Error).message }
  }
}

export async function createRecurringTemplate(
  input: CreateRecurringTemplateInput
): Promise<{ template?: RecurringExpenseTemplate; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'create')) {
      return { error: 'Sin permisos' }
    }

    const { data, error } = await supabase
      .from('recurring_expense_templates')
      .insert({ ...input, tenant_id: profile.tenant_id })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses/recurring')
    return { template: data as RecurringExpenseTemplate }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function updateRecurringTemplate(
  id: string,
  input: UpdateRecurringTemplateInput
): Promise<{ template?: RecurringExpenseTemplate; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    const { data, error } = await supabase
      .from('recurring_expense_templates')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses/recurring')
    return { template: data as RecurringExpenseTemplate }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function toggleRecurringTemplate(
  id: string,
  is_active: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    const { error } = await supabase
      .from('recurring_expense_templates')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses/recurring')
    return {}
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

export async function deleteRecurringTemplate(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'delete')) {
      return { error: 'Sin permisos' }
    }

    const { error } = await supabase
      .from('recurring_expense_templates')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/expenses/recurring')
    return {}
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
