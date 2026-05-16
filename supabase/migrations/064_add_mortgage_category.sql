-- Add 'mortgage' (hipoteca) to expense categories in both tables

-- 1. recurring_expense_templates
ALTER TABLE public.recurring_expense_templates
  DROP CONSTRAINT IF EXISTS recurring_expense_templates_category_check;

ALTER TABLE public.recurring_expense_templates
  ADD CONSTRAINT recurring_expense_templates_category_check
  CHECK (category IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'mortgage', 'other'
  ));

-- 2. expenses
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_category_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'mortgage', 'other'
  ));
