'use server'

import { createClient } from '@/lib/supabase/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { can, type TenantRole } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import type {
  PaymentAccount,
  PaymentAccountWithBalance,
  AccountBalance,
  AccountMovement,
  AccountMovementFilters,
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
} from '@/types/treasury'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const end = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  return { start, end }
}

// ─── getPaymentAccounts ───────────────────────────────────────────────────────

export async function getPaymentAccounts(): Promise<{
  accounts: PaymentAccount[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const { data, error } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return { accounts: [], error: error.message }
    return { accounts: (data ?? []) as PaymentAccount[] }
  } catch (e: unknown) {
    return { accounts: [], error: (e as Error).message }
  }
}

// ─── getAccountBalance ────────────────────────────────────────────────────────

export async function getAccountBalance(
  accountId: string,
  asOfDate?: Date
): Promise<{ balance: AccountBalance; error?: string }> {
  const empty: AccountBalance = {
    opening_balance: 0,
    total_income: 0,
    total_expenses: 0,
    estimated_balance: 0,
    month_income: 0,
    month_expenses: 0,
  }

  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    const { data: account } = await supabase
      .from('payment_accounts')
      .select('opening_balance, opening_balance_date')
      .eq('id', accountId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!account) return { balance: empty, error: 'Cuenta no encontrada' }

    const cutoff = asOfDate ? toDateStr(asOfDate) : toDateStr(new Date())
    const openDate = account.opening_balance_date as string
    const { start: monthStart, end: monthEnd } = currentMonthRange()

    // ── Entradas: cobros de reservas ──
    const { data: payments } = await supabase
      .from('reservation_payments')
      .select('amount, payment_date, payment_type')
      .eq('payment_account_id', accountId)
      .gte('payment_date', openDate)
      .lte('payment_date', cutoff)

    const rows = payments ?? []
    const totalIncome = rows
      .filter((p: { payment_type: string }) => p.payment_type !== 'refund')
      .reduce((s: number, p: { amount: number }) => s + p.amount, 0)
    const totalRefunds = rows
      .filter((p: { payment_type: string }) => p.payment_type === 'refund')
      .reduce((s: number, p: { amount: number }) => s + p.amount, 0)

    const monthIncome = rows
      .filter((p: { payment_type: string; payment_date: string }) =>
        p.payment_type !== 'refund' &&
        p.payment_date >= monthStart &&
        p.payment_date <= monthEnd
      )
      .reduce((s: number, p: { amount: number }) => s + p.amount, 0)

    // ── Salidas: gastos pagados ──
    const { data: expenses } = await supabase
      .from('expenses')
      .select('total_amount, payment_date')
      .eq('payment_account_id', accountId)
      .eq('payment_status', 'paid')
      .gte('payment_date', openDate)
      .lte('payment_date', cutoff)

    const expRows = expenses ?? []
    const totalExpenses = expRows.reduce(
      (s: number, e: { total_amount: number }) => s + e.total_amount, 0
    )
    const monthExpenses = expRows
      .filter((e: { payment_date: string | null }) =>
        e.payment_date && e.payment_date >= monthStart && e.payment_date <= monthEnd
      )
      .reduce((s: number, e: { total_amount: number }) => s + e.total_amount, 0)

    const openingBalance = account.opening_balance as number
    const netIncome = totalIncome - totalRefunds

    const balance: AccountBalance = {
      opening_balance: openingBalance,
      total_income: netIncome,
      total_expenses: totalExpenses,
      estimated_balance: openingBalance + netIncome - totalExpenses,
      month_income: monthIncome,
      month_expenses: monthExpenses,
    }

    return { balance }
  } catch (e: unknown) {
    return { balance: empty, error: (e as Error).message }
  }
}

// ─── getPaymentAccountsWithBalance ───────────────────────────────────────────

export async function getPaymentAccountsWithBalance(): Promise<{
  accounts: PaymentAccountWithBalance[]
  error?: string
}> {
  try {
    const { accounts, error } = await getPaymentAccounts()
    if (error) return { accounts: [], error }

    const withBalance = await Promise.all(
      accounts.map(async (acc) => {
        const { balance } = await getAccountBalance(acc.id)
        return { ...acc, balance }
      })
    )

    return { accounts: withBalance }
  } catch (e: unknown) {
    return { accounts: [], error: (e as Error).message }
  }
}

// ─── getAccountMovements ──────────────────────────────────────────────────────

export async function getAccountMovements(
  accountId: string,
  filters: AccountMovementFilters = {}
): Promise<{ movements: AccountMovement[]; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    // Verificar que la cuenta pertenece al tenant
    const { data: account } = await supabase
      .from('payment_accounts')
      .select('opening_balance, opening_balance_date')
      .eq('id', accountId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (!account) return { movements: [], error: 'Cuenta no encontrada' }

    const { date_from, date_to, type = 'all' } = filters

    // ── Cobros de reservas ──
    let paymentsQuery = supabase
      .from('reservation_payments')
      .select(`
        id, amount, payment_date, payment_type, reference,
        reservation_id,
        reservations!inner(guest_name)
      `)
      .eq('payment_account_id', accountId)

    if (date_from) paymentsQuery = paymentsQuery.gte('payment_date', date_from)
    if (date_to)   paymentsQuery = paymentsQuery.lte('payment_date', date_to)

    // ── Gastos pagados ──
    let expensesQuery = supabase
      .from('expenses')
      .select(`
        id, total_amount, payment_date, description, reservation_id,
        reservations(guest_name)
      `)
      .eq('payment_account_id', accountId)
      .eq('payment_status', 'paid')

    if (date_from) expensesQuery = expensesQuery.gte('payment_date', date_from)
    if (date_to)   expensesQuery = expensesQuery.lte('payment_date', date_to)

    const [{ data: payments }, { data: expenses }] = await Promise.all([
      paymentsQuery,
      expensesQuery,
    ])

    const movements: Omit<AccountMovement, 'running_balance'>[] = []

    if (type !== 'expense') {
      for (const p of payments ?? []) {
        const row = p as Record<string, unknown>
        const isRefund = row.payment_type === 'refund'
        const amount = Math.abs(row.amount as number)
        const guestName = (row.reservations as { guest_name: string } | null)?.guest_name ?? 'Cobro reserva'
        movements.push({
          id: row.id as string,
          date: row.payment_date as string,
          description: row.reference
            ? `${guestName} · ${row.reference}`
            : guestName,
          type: isRefund ? 'expense' : 'income',
          amount,
          signed_amount: isRefund ? -amount : amount,
          source: 'reservation_payment',
          source_id: row.id as string,
          source_detail: guestName,
          reservation_id: row.reservation_id as string | null,
        })
      }
    }

    if (type !== 'income') {
      for (const e of expenses ?? []) {
        const row = e as Record<string, unknown>
        const amount = row.total_amount as number
        // Si el gasto está vinculado a una reserva, mostrar el huésped
        const guestName = (row.reservations as { guest_name: string } | null)?.guest_name
        const detail = guestName ?? (row.description as string)
        movements.push({
          id: row.id as string,
          date: (row.payment_date ?? row.id) as string,
          description: row.description as string,
          type: 'expense',
          amount,
          signed_amount: -amount,
          source: 'expense',
          source_id: row.id as string,
          source_detail: detail,
          reservation_id: row.reservation_id as string | null,
        })
      }
    }

    // Ordenar por fecha DESC
    movements.sort((a, b) => {
      if (b.date > a.date) return 1
      if (b.date < a.date) return -1
      return 0
    })

    // Calcular saldo acumulado (de más antiguo a más reciente, luego invertir)
    const sorted = [...movements].reverse()
    let running = (account.opening_balance as number)
    const withRunning: AccountMovement[] = sorted.map(m => {
      running += m.signed_amount
      return { ...m, running_balance: running }
    })

    // Devolver ordenado más reciente primero
    return { movements: withRunning.reverse() }
  } catch (e: unknown) {
    return { movements: [], error: (e as Error).message }
  }
}

// ─── createPaymentAccount ─────────────────────────────────────────────────────

export async function createPaymentAccount(
  input: CreatePaymentAccountInput
): Promise<{ account?: PaymentAccount; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'create')) {
      return { error: 'Sin permisos' }
    }

    const { data, error } = await supabase
      .from('payment_accounts')
      .insert({ ...input, tenant_id: profile.tenant_id })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/treasury')
    revalidatePath('/dashboard/settings/accounts')
    return { account: data as PaymentAccount }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── updatePaymentAccount ─────────────────────────────────────────────────────

export async function updatePaymentAccount(
  id: string,
  input: UpdatePaymentAccountInput
): Promise<{ account?: PaymentAccount; error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    const { data, error } = await supabase
      .from('payment_accounts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/dashboard/treasury')
    revalidatePath('/dashboard/settings/accounts')
    return { account: data as PaymentAccount }
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── togglePaymentAccount ─────────────────────────────────────────────────────

export async function togglePaymentAccount(
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
      .from('payment_accounts')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings/accounts')
    return {}
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}

// ─── updateOpeningBalance ─────────────────────────────────────────────────────

export async function updateOpeningBalance(
  id: string,
  opening_balance: number,
  opening_balance_date: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const profile = await requireProfile(supabase)

    if (!can(profile.tenant_role as TenantRole, 'finances', 'edit')) {
      return { error: 'Sin permisos' }
    }

    const { error } = await supabase
      .from('payment_accounts')
      .update({ opening_balance, opening_balance_date, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/treasury')
    return {}
  } catch (e: unknown) {
    return { error: (e as Error).message }
  }
}
