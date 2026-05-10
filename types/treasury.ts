// ─── Enums ────────────────────────────────────────────────────────────────────

export type AccountType = 'bank_account' | 'cash' | 'payment_gateway'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank_account:     'Cuenta bancaria',
  cash:             'Efectivo',
  payment_gateway:  'Pasarela de pago',
}

// ─── DB Row ───────────────────────────────────────────────────────────────────

export interface PaymentAccount {
  id: string
  tenant_id: string
  name: string
  account_type: AccountType
  opening_balance: number
  opening_balance_date: string
  currency: string
  notes: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── Calculated ───────────────────────────────────────────────────────────────

export interface AccountBalance {
  opening_balance: number
  total_income: number
  total_expenses: number
  estimated_balance: number
  month_income: number
  month_expenses: number
}

export interface AccountMovement {
  id: string
  date: string
  description: string
  type: 'income' | 'expense'
  amount: number
  signed_amount: number
  running_balance: number
  source: 'reservation_payment' | 'expense'
  source_id: string
  // Para reservation_payment: nombre del huésped
  // Para expense con reservation_id: nombre del huésped (JOIN)
  // Para expense sin reservation_id: descripción del gasto
  source_detail: string
  reservation_id: string | null
}

export interface PaymentAccountWithBalance extends PaymentAccount {
  balance: AccountBalance
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface AccountMovementFilters {
  date_from?: string
  date_to?: string
  type?: 'income' | 'expense' | 'all'
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreatePaymentAccountInput {
  name: string
  account_type: AccountType
  opening_balance: number
  opening_balance_date: string
  currency?: string
  notes?: string | null
  sort_order?: number
}

export interface UpdatePaymentAccountInput extends Partial<CreatePaymentAccountInput> {}
