-- Migration: 043_fix_property_completion_percentage.sql
-- Description: Unifica el cálculo de completitud de la guía y lo limita al 100% (evita errores de 108%)

CREATE OR REPLACE VIEW public.properties_with_completion 
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
    -- Cap completion at 100% using LEAST
    LEAST(100, round((1 + 
        CASE WHEN (EXISTS (SELECT 1 FROM property_branding WHERE property_branding.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN (EXISTS (SELECT 1 FROM property_faqs WHERE property_faqs.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN (EXISTS (SELECT 1 FROM property_recommendations WHERE property_recommendations.property_id = p.id)) THEN 1 ELSE 0 END +
        CASE WHEN p.inventory_status IN ('completed', 'generating') THEN 2 ELSE 0 END + 
        (SELECT count(DISTINCT category) FROM property_context WHERE property_context.property_id = p.id)
    )::numeric / 13::numeric * 100::numeric)) AS guide_completion
   FROM properties p;
