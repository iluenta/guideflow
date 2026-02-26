-- Migration 024: Add geolocation fields to properties
-- This script extends the properties table with precise location data and geocoding metadata

-- 1. Extend properties table with geographic data
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country_code VARCHAR(5);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- 2. Add geocoding metadata
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS geocoding_confidence DECIMAL(3, 2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS geocoding_source VARCHAR(20);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS geocoding_accuracy VARCHAR(20);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS geocoding_validated_at TIMESTAMP WITH TIME ZONE;

-- 3. Create index for geographic lookups
CREATE INDEX IF NOT EXISTS idx_properties_coords ON public.properties(latitude, longitude);

-- 4. Comment on columns for documentation
COMMENT ON COLUMN public.properties.latitude IS 'Exact latitude of the property';
COMMENT ON COLUMN public.properties.longitude IS 'Exact longitude of the property';
COMMENT ON COLUMN public.properties.geocoding_accuracy IS 'Level of precision: rooftop, street, city, region';
