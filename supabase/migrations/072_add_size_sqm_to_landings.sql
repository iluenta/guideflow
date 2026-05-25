-- 072: Add property size (m²) to property_landings
ALTER TABLE public.property_landings
  ADD COLUMN IF NOT EXISTS size_sqm NUMERIC(6,1);

COMMENT ON COLUMN public.property_landings.size_sqm IS
  'Property size in square metres, shown in the details summary card';
