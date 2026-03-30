-- Migration 037: Add missing fields for premium recommendations
-- This migration adds the 'rating' column and ensures metadata is ready for photo_url

ALTER TABLE public.property_recommendations 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_property_id ON public.property_recommendations(property_id);

-- Update existing records metadata if null
UPDATE public.property_recommendations 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

COMMENT ON COLUMN public.property_recommendations.rating IS 'Calificación de Google Places (0.00 - 5.00)';
