-- Migration: Add Property Branding table and bucket
-- This table stores theme selection, custom colors and logo URLs

-- 1. Create the table or update it if it exists
CREATE TABLE IF NOT EXISTS public.property_branding (
    property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
    theme_id TEXT NOT NULL DEFAULT 'elegant-navy',
    custom_primary_color TEXT,
    custom_logo_url TEXT,
    computed_theme JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure tenant_id exists (for RLS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_branding' AND column_name='tenant_id') THEN
        ALTER TABLE public.property_branding ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.property_branding ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Use the robust get_user_tenant_id() function from migration 027
DROP POLICY IF EXISTS "Owners can manage branding" ON public.property_branding;
CREATE POLICY "Owners can manage branding" ON public.property_branding
    FOR ALL
    TO authenticated
    USING (
        property_id IN (
            SELECT id FROM public.properties WHERE tenant_id = public.get_user_tenant_id()
        )
    )
    WITH CHECK (
        property_id IN (
            SELECT id FROM public.properties WHERE tenant_id = public.get_user_tenant_id()
        )
    );

DROP POLICY IF EXISTS "Public can view branding" ON public.property_branding;
CREATE POLICY "Public can view branding" ON public.property_branding
    FOR SELECT
    TO public
    USING (true);

-- 4. Create the branding bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Bucket RLS Policies
DROP POLICY IF EXISTS "Branding Public Access" ON storage.objects;
CREATE POLICY "Branding Public Access" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Owners can manage branding files" ON storage.objects;
CREATE POLICY "Owners can manage branding files" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'branding' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    )
    WITH CHECK (
        bucket_id = 'branding' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    );
