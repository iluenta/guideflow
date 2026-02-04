-- Migration 029: Add time and expand recommendation categories
-- Adds specific fields for usability according to prototype (km and min)
-- and expands categories for a richer Local Guide experience.

ALTER TABLE public.property_recommendations 
ADD COLUMN IF NOT EXISTS time VARCHAR(50);

-- Expand the type constraint if it exists (it was a VARCHAR(50) in 019 without explicit check)
-- But we'll use a standardized set of categories in the UI:
-- Restaurantes, Compras, Cultura, Naturaleza, Ocio, Relax

COMMENT ON COLUMN public.property_recommendations.type IS 'Categoría de la recomendación: restaurant, shopping, culture, nature, leisure, relax';
COMMENT ON COLUMN public.property_recommendations.distance IS 'Distancia (ej: 500m, 2.5km)';
COMMENT ON COLUMN public.property_recommendations.time IS 'Tiempo estimado (ej: 10 min, 1.5h)';
