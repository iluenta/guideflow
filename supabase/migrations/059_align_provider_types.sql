-- =============================================================
-- 059_align_provider_types.sql
-- Alinear provider_type con expense categories
-- =============================================================

-- Migrar tipos obsoletos
UPDATE public.providers SET provider_type = 'checkin' WHERE provider_type = 'checkout';
UPDATE public.providers SET provider_type = 'other'   WHERE provider_type = 'transport';

-- Reemplazar el constraint
ALTER TABLE public.providers
  DROP CONSTRAINT IF EXISTS providers_provider_type_check;

ALTER TABLE public.providers
  ADD CONSTRAINT providers_provider_type_check
  CHECK (provider_type IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'other'
  ));
