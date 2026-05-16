-- Add 'biannual' (semestral) to recurring_expense_templates frequency constraint

ALTER TABLE public.recurring_expense_templates
  DROP CONSTRAINT IF EXISTS recurring_expense_templates_frequency_check;

ALTER TABLE public.recurring_expense_templates
  ADD CONSTRAINT recurring_expense_templates_frequency_check
  CHECK (frequency IN ('monthly', 'quarterly', 'biannual', 'annual'));
