-- =============================================================
-- 056_expenses_module.sql
-- Módulo de gastos: recurring_expense_templates + expenses
-- =============================================================

-- ---------------------------------------------------------------
-- 1. recurring_expense_templates (primero, expenses tiene FK a esta)
-- ---------------------------------------------------------------
CREATE TABLE public.recurring_expense_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL
    REFERENCES public.properties(id),

  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'other'
  )),

  provider_id              UUID NULL REFERENCES public.providers(id),
  provider_name_override   TEXT NULL,

  amount_type     TEXT NOT NULL DEFAULT 'fixed'
    CHECK (amount_type IN ('fixed', 'estimated')),
  estimated_amount NUMERIC(10,2) NOT NULL,
  vat_pct         NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (vat_pct IN (0, 4, 10, 21)),
  is_vat_deductible BOOLEAN NOT NULL DEFAULT false,

  frequency       TEXT NOT NULL
    CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  day_of_period   INTEGER NOT NULL DEFAULT 1
    CHECK (day_of_period BETWEEN 1 AND 28),
  month_of_year   INTEGER NULL
    CHECK (month_of_year BETWEEN 1 AND 12),

  start_date      DATE NOT NULL,
  end_date        DATE NULL,
  is_active       BOOLEAN DEFAULT true,
  last_generated_at DATE NULL,

  notes           TEXT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recurring_expense_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.recurring_expense_templates
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_recurring_templates_tenant
  ON public.recurring_expense_templates(tenant_id);
CREATE INDEX idx_recurring_templates_property
  ON public.recurring_expense_templates(property_id);
CREATE INDEX idx_recurring_templates_active
  ON public.recurring_expense_templates(tenant_id, is_active);

-- ---------------------------------------------------------------
-- 2. expenses (tabla principal)
-- ---------------------------------------------------------------
CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL
    REFERENCES public.properties(id),

  reservation_id  UUID NULL
    REFERENCES public.reservations(id) ON DELETE SET NULL,

  expense_type    TEXT NOT NULL DEFAULT 'property'
    CHECK (expense_type IN ('reservation', 'property')),

  category        TEXT NOT NULL CHECK (category IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'other'
  )),
  description     TEXT NOT NULL,

  provider_id              UUID NULL REFERENCES public.providers(id),
  provider_name_override   TEXT NULL,

  amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  vat_pct         NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (vat_pct IN (0, 4, 10, 21)),
  vat_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(10,2) NOT NULL,

  is_vat_deductible BOOLEAN NOT NULL DEFAULT false,

  expense_date    DATE NOT NULL,

  invoice_number  TEXT NULL,
  invoice_date    DATE NULL,

  document_url    TEXT NULL,
  document_name   TEXT NULL,
  document_type   TEXT NULL,

  status          TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('estimated', 'confirmed')),
  estimated_amount NUMERIC(10,2) NULL,

  payment_status  TEXT NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('pending', 'paid')),
  payment_date    DATE NULL,
  payment_method  TEXT NULL,

  recurring_template_id UUID NULL
    REFERENCES public.recurring_expense_templates(id)
    ON DELETE SET NULL,

  bank_account_id UUID NULL,

  notes           TEXT NULL,
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT expense_type_consistency CHECK (
    (reservation_id IS NULL     AND expense_type = 'property') OR
    (reservation_id IS NOT NULL AND expense_type = 'reservation')
  )
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.expenses
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_expenses_tenant        ON public.expenses(tenant_id);
CREATE INDEX idx_expenses_property      ON public.expenses(property_id);
CREATE INDEX idx_expenses_reservation   ON public.expenses(reservation_id);
CREATE INDEX idx_expenses_date          ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category      ON public.expenses(category);
CREATE INDEX idx_expenses_status        ON public.expenses(status);
CREATE INDEX idx_expenses_template      ON public.expenses(recurring_template_id);
CREATE INDEX idx_expenses_payment       ON public.expenses(payment_status);
