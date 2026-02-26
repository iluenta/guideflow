-- Migration: Properties and Storage Setup
-- This script creates the properties table and configures Supabase Storage with tenant-based RLS

-- 1. Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    beds INTEGER NOT NULL DEFAULT 1,
    baths INTEGER NOT NULL DEFAULT 1,
    guests INTEGER NOT NULL DEFAULT 2,
    description TEXT,
    main_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_properties_updated_at 
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for properties
-- Use the helper function public.tenant_id() defined in migration 001
CREATE POLICY "Users can only access their own tenant properties" ON public.properties
    FOR ALL
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

-- 3. Storage Configuration
-- Create the bucket if it doesn't exist (this might need to be done via UI or specific API calls if this fails in SQL editor)
-- Note: Some Supabase environments don't allow bucket creation via SQL depending on extensions.
-- We will assume the bucket 'property-images' exists or provide policies for it.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow public read access to all images
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property-images');

-- Allow users to upload/manage images only in their tenant folder
-- Folder structure: property-images/{tenant_id}/{image_name}
CREATE POLICY "Tenant Image Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    )
    WITH CHECK (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    );
