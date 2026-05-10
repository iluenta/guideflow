ALTER TABLE public.recurring_expense_templates
  ADD COLUMN default_payment_method TEXT NULL,
  ADD COLUMN auto_mark_paid BOOLEAN NOT NULL DEFAULT false;
