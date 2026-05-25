-- 071: Add host info, reviews, and landing-specific amenities to property_landings
ALTER TABLE public.property_landings
  ADD COLUMN IF NOT EXISTS host_name          TEXT,
  ADD COLUMN IF NOT EXISTS host_bio           TEXT,
  ADD COLUMN IF NOT EXISTS landing_amenities  TEXT[]          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS reviews_rating     NUMERIC(3,2)    DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count      INTEGER         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_list       JSONB           DEFAULT '[]';

-- reviews_list schema: [{ author, country, date, text }]
COMMENT ON COLUMN public.property_landings.reviews_list IS
  'Array of review objects: [{ author: string, country?: string, date: string, text: string }]';
