-- Migration: Dynamic Guides and Modular Sections
-- This script updates the properties table and creates the guide_sections table

-- 1. Update properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;

-- Create index for slug to ensure fast lookups
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);

-- 2. Create guide_sections table
CREATE TABLE IF NOT EXISTS public.guide_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'map', 'ai_chat')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger for guide_sections
CREATE TRIGGER update_guide_sections_updated_at 
    BEFORE UPDATE ON public.guide_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.guide_sections ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for guide_sections
-- Admins can manage sections of their own tenant
CREATE POLICY "Admins can manage guide sections" ON public.guide_sections
    FOR ALL
    TO authenticated
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());

-- Public can VIEW sections (Guest access via slug)
-- Note: In a real app, we might add a 'is_published' flag or access code check
CREATE POLICY "Public can view guide sections" ON public.guide_sections
    FOR SELECT
    USING (true);

-- Also update properties RLS to allow public SELECT by slug
-- We modify the existing policy to allow public read if we want guides to be public
-- For now, let's keep the authenticated multi-tenant policy for management
-- and add a specific one for public viewing by slug.

CREATE POLICY "Public can view property landing by slug" ON public.properties
    FOR SELECT
    USING (true);
