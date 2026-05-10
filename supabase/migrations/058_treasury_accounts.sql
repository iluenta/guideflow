-- =============================================================
-- 058_treasury_accounts.sql
-- Módulo de tesorería: payment_accounts + FKs en tablas existentes
-- =============================================================

-- ---------------------------------------------------------------
-- 1. payment_accounts
-- ---------------------------------------------------------------
CREATE TABLE public.payment_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  account_type         TEXT NOT NULL DEFAULT 'bank_account'
    CHECK (account_type IN ('bank_account', 'cash', 'payment_gateway')),
  opening_balance      NUMERIC(10,2) NOT NULL DEFAULT 0,
  opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency             TEXT NOT NULL DEFAULT 'EUR',
  notes                TEXT NULL,
  is_active            BOOLEAN DEFAULT true,
  sort_order           INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.payment_accounts
  USING (tenant_id = public.get_user_tenant_id());
CREATE INDEX idx_payment_accounts_tenant
  ON public.payment_accounts(tenant_id);

-- ---------------------------------------------------------------
-- 2. payment_method_settings → FK a payment_accounts
-- ---------------------------------------------------------------
ALTER TABLE public.payment_method_settings
  ADD COLUMN payment_account_id UUID NULL
    REFERENCES public.payment_accounts(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- 3. reservation_payments → FK a payment_accounts
-- ---------------------------------------------------------------
ALTER TABLE public.reservation_payments
  ADD COLUMN payment_account_id UUID NULL
    REFERENCES public.payment_accounts(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------
-- 4. expenses → añadir payment_account_id, eliminar bank_account_id
-- ---------------------------------------------------------------
ALTER TABLE public.expenses
  ADD COLUMN payment_account_id UUID NULL
    REFERENCES public.payment_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS bank_account_id;

-- ---------------------------------------------------------------
-- 5. recurring_expense_templates → añadir FK (mantener texto)
-- ---------------------------------------------------------------
ALTER TABLE public.recurring_expense_templates
  ADD COLUMN default_payment_account_id UUID NULL
    REFERENCES public.payment_accounts(id) ON DELETE SET NULL;
