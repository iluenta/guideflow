-- Migration: 036_secure_db_objects.sql
-- Created: 2026-03-23
-- Description: Re-creates properties_with_completion with security_invoker = true and secures translation_metrics with RLS.

-- 1. Recrear la vista de propiedades con security_invoker
DROP VIEW IF EXISTS public.properties_with_completion;

CREATE VIEW public.properties_with_completion 
WITH (security_invoker = true)
AS
 SELECT p.id,
    p.tenant_id,
    p.name,
    p.beds,
    p.baths,
    p.guests,
    p.main_image_url,
    p.created_at,
    p.updated_at,
    p.slug,
    p.theme_config,
    p.latitude,
    p.longitude,
    p.city,
    p.country,
    p.country_code,
    p.postal_code,
    p.neighborhood,
    p.timezone,
    p.geocoding_confidence,
    p.geocoding_source,
    p.geocoding_accuracy,
    p.geocoding_validated_at,
    p.full_address,
    p.inventory_status,
    p.inventory_last_scan_at,
    p.tier,
    p.is_halted,
    p.halt_reason,
    p.halt_expires_at,
    p.status,
    p.has_parking,
    p.parking_number,
    round((1 + 
        CASE WHEN (EXISTS (SELECT 1 FROM property_branding WHERE property_branding.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN (EXISTS (SELECT 1 FROM property_faqs WHERE property_faqs.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN (EXISTS (SELECT 1 FROM property_recommendations WHERE property_recommendations.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN p.inventory_status IN ('completed', 'generating') THEN 2 ELSE 0 END + 
        (SELECT count(DISTINCT category) FROM property_context WHERE property_context.property_id = p.id)
    )::numeric / 13::numeric * 100::numeric) AS guide_completion
   FROM properties p;

-- 2. Asegurar la tabla de métricas de traducción
ALTER TABLE public.translation_metrics ENABLE ROW LEVEL SECURITY;

-- Política de inserción (para el servidor/app)
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.translation_metrics;
CREATE POLICY "Allow authenticated inserts" 
ON public.translation_metrics 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política de lectura (solo dueños de la propiedad)
DROP POLICY IF EXISTS "Users can view metrics of their properties" ON public.translation_metrics;
CREATE POLICY "Users can view metrics of their properties" 
ON public.translation_metrics 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.properties
        WHERE properties.id = translation_metrics.property_id
        AND properties.tenant_id = public.get_user_tenant_id()
    )
);
