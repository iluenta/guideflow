-- =============================================================
-- 070_create_property_landings.sql
-- Tabla para landing pública y reserva directa
-- =============================================================

-- Tabla para landing pública
CREATE TABLE IF NOT EXISTS public.property_landings (
    property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    
    -- Personalizaciones de contenido
    hero_title TEXT,
    hero_subtitle TEXT,
    custom_description TEXT,
    
    -- Contacto directo (host)
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    
    -- Precios y tarifas
    price_per_night NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    cleaning_fee NUMERIC(10,2) DEFAULT 0.00,
    service_fee_pct NUMERIC(5,2) DEFAULT 8.00,
    tourist_tax_per_night NUMERIC(5,2) DEFAULT 0.00,
    pet_fee_flat NUMERIC(10,2) DEFAULT 0.00,
    
    -- Estilo y branding
    palette TEXT DEFAULT 'warm' CHECK (palette IN ('modern', 'urban', 'coastal', 'warm', 'luxury', 'warmsand', 'forest', 'ink', 'navy')),
    typography TEXT DEFAULT 'modern' CHECK (typography IN ('modern', 'editorial')),
    border_radius TEXT DEFAULT 'soft' CHECK (border_radius IN ('soft', 'sharp')),
    
    -- Sections visibility
    show_calendar BOOLEAN DEFAULT true,
    show_pricing BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    show_reviews BOOLEAN DEFAULT true,
    
    -- Información práctica
    policies JSONB DEFAULT '{
        "checkIn": "15:00",
        "checkOut": "11:00",
        "cancellation": "Cancelación gratuita hasta 48h antes",
        "minStay": 1
    }'::jsonb,
    
    -- FAQs
    faqs JSONB DEFAULT '[]'::jsonb,
    
    -- Galería ordenada
    gallery TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_property_landings_tenant ON public.property_landings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_landings_enabled ON public.property_landings(enabled);

-- RLS
ALTER TABLE public.property_landings ENABLE ROW LEVEL SECURITY;

-- Política 1: Público puede ver landings habilitadas
DROP POLICY IF EXISTS "Public can view enabled landings" ON public.property_landings;
CREATE POLICY "Public can view enabled landings" ON public.property_landings
    FOR SELECT USING (enabled = true);

-- Política 2: Hosts editan solo sus propias landings
DROP POLICY IF EXISTS "Hosts can manage their landings" ON public.property_landings;
CREATE POLICY "Hosts can manage their landings" ON public.property_landings
    FOR ALL TO authenticated
    USING (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE tenant_id = (SELECT id FROM tenants WHERE id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
        )
    )
    WITH CHECK (
        property_id IN (
            SELECT id FROM public.properties 
            WHERE tenant_id = (SELECT id FROM tenants WHERE id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
        )
    );

-- Insertar canal DIRECT para todos los tenants que no lo tengan
INSERT INTO public.channel_settings (tenant_id, code, name, is_active)
SELECT id, 'DIRECT', 'Hospyia Landing', true
FROM public.tenants
ON CONFLICT (tenant_id, code) DO NOTHING;
