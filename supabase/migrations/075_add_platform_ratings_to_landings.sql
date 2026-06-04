-- 075: Add platform_ratings and tourist_registration to property_landings
--
-- platform_ratings stores per-platform scores (Booking, Airbnb, Google…).
-- Schema: [{ platform: string, rating: number, count: number }]
--
-- tourist_registration stores the official tourism license number shown in the footer.

ALTER TABLE public.property_landings
  ADD COLUMN IF NOT EXISTS platform_ratings     JSONB  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tourist_registration TEXT;

COMMENT ON COLUMN public.property_landings.platform_ratings IS
  'Per-platform rating cards: [{ platform: string, rating: number, count: number }]';

COMMENT ON COLUMN public.property_landings.tourist_registration IS
  'Tourist license / registro turístico number shown in the landing footer.';
