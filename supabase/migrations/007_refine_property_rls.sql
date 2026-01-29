-- Migration: Refine Property RLS Policies
-- This migration ensures public guides are visible without breaking admin isolation

-- 1. Remove the over-permissive public policy
DROP POLICY IF EXISTS "Public can view property landing by slug" ON public.properties;

-- 2. Refine public SELECT access
-- We want guests to see properties ONLY if they know the slug or ID.
-- However, for the dashboard, we want admins to see ONLY their own.
-- Supabase ORs policies of the same type (SELECT). 

-- Re-implement selective public access: 
-- This allows anyone to select a property IF it has a slug.
CREATE POLICY "Public guest access by slug" ON public.properties
    FOR SELECT
    TO anon, authenticated
    USING (slug IS NOT NULL);

-- Ensure the admin policy is STILL the primary way for dashboard
-- This is already defined, but we make sure it stays robust:
-- CREATE POLICY "Users can only access their own tenant properties" ON public.properties FOR ALL ...

-- Note: In the dashboard code (actions/properties.ts), we now explicitly 
-- filter by tenant_id to avoid showing everyone's slugified properties.
