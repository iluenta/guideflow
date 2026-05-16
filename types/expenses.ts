// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'cleaning' | 'laundry' | 'checkin' | 'maintenance'
  | 'utilities' | 'wifi' | 'streaming' | 'community'
  | 'insurance' | 'ibi' | 'supplies' | 'marketing'
  | 'management' | 'mortgage' | 'other'

export type ExpenseStatus = 'estimated' | 'confirmed'
export type ExpensePaymentStatus = 'pending' | 'paid'
export type ExpenseType = 'reservation' | 'property'
export type RecurringFrequency = 'monthly' | 'quarterly' | 'biannual' | 'annual'
export type RecurringAmountType = 'fixed' | 'estimated'
export type VatPct = 0 | 4 | 10 | 21

// ─── Labels ───────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cleaning:   'Limpieza',
  laundry:    'Lavandería',
  checkin:    'Check-in/out',
  maintenance:'Mantenimiento',
  utilities:  'Suministros',
  wifi:       'Internet/WiFi',
  streaming:  'Streaming',
  community:  'Comunidad',
  insurance:  'Seguros',
  ibi:        'IBI y tasas',
  supplies:   'Materiales',
  marketing:  'Marketing',
  management: 'Gestión',
  mortgage:   'Hipoteca',
  other:      'Otros',
}

export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] =
  (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(k => ({
    value: k,
    label: EXPENSE_CATEGORY_LABELS[k],
  }))

// ─── DB Row types ──────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  tenant_id: string
  property_id: string
  reservation_id: string | null
  expense_type: ExpenseType
  category: ExpenseCategory
  description: string
  provider_id: string | null
  provider_name_override: string | null
  amount: number
  vat_pct: VatPct
  vat_amount: number
  total_amount: number
  is_vat_deductible: boolean
  expense_date: string
  invoice_number: string | null
  invoice_date: string | null
  document_url: string | null
  document_name: string | null
  document_type: string | null
  status: ExpenseStatus
  estimated_amount: number | null
  payment_status: ExpensePaymentStatus
  payment_date: string | null
  payment_method: string | null
  recurring_template_id: string | null
  payment_account_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseWithDetails extends Expense {
  property_name: string
  provider_name: string | null
  reservation_guest: string | null
  reservation_checkin: string | null
}

export interface RecurringExpenseTemplate {
  id: string
  tenant_id: string
  property_id: string
  name: string
  category: ExpenseCategory
  provider_id: string | null
  provider_name_override: string | null
  amount_type: RecurringAmountType
  estimated_amount: number
  vat_pct: VatPct
  is_vat_deductible: boolean
  frequency: RecurringFrequency
  day_of_period: number
  month_of_year: number | null
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_at: string | null
  default_payment_method: string | null
  auto_mark_paid: boolean
  default_payment_account_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  property_name?: string
  provider_name?: string | null
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface ExpenseFilters {
  year?: number | 'all'
  property_id?: string
  expense_type?: ExpenseType
  category?: ExpenseCategory[]
  status?: ExpenseStatus
  payment_status?: ExpensePaymentStatus
  reservation_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface ExpensesSummary {
  total_expenses: number
  total_by_category: Partial<Record<ExpenseCategory, number>>
  total_reservation_expenses: number
  total_property_expenses: number
  pending_confirmation: number
  pending_payment: number
}

// ─── OCR ──────────────────────────────────────────────────────────────────────

export interface ExtractedExpenseData {
  total_amount: number | null
  amount_without_vat: number | null
  vat_amount: number | null
  vat_pct: VatPct | null
  expense_date: string | null
  provider_name: string | null
  invoice_number: string | null
  description: string | null
  confidence: 'high' | 'medium' | 'low'
}

// ─── Inputs ───────────────────────────────────────────────────────────────────

export interface CreateExpenseInput {
  property_id: string
  reservation_id?: string | null
  expense_type: ExpenseType
  category: ExpenseCategory
  description: string
  provider_id?: string | null
  provider_name_override?: string | null
  amount: number
  vat_pct: VatPct
  is_vat_deductible?: boolean
  expense_date: string
  invoice_number?: string | null
  invoice_date?: string | null
  status?: ExpenseStatus
  payment_status?: ExpensePaymentStatus
  payment_date?: string | null
  payment_method?: string | null
  payment_account_id?: string | null
  notes?: string | null
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {}

export interface ConfirmEstimatedInput {
  real_amount: number
  invoice_number?: string | null
  invoice_date?: string | null
}

export interface CreateRecurringTemplateInput {
  property_id: string
  name: string
  category: ExpenseCategory
  provider_id?: string | null
  provider_name_override?: string | null
  amount_type: RecurringAmountType
  estimated_amount: number
  vat_pct: VatPct
  is_vat_deductible?: boolean
  frequency: RecurringFrequency
  day_of_period: number
  month_of_year?: number | null
  start_date: string
  end_date?: string | null
  default_payment_method?: string | null
  auto_mark_paid?: boolean
  default_payment_account_id?: string | null
  notes?: string | null
}

export interface UpdateRecurringTemplateInput extends Partial<CreateRecurringTemplateInput> {}
