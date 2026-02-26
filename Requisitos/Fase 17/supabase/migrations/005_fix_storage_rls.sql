-- Migration: Robust Storage RLS Policies
-- Replaces JWT metadata dependency with public.tenant_id() helper

-- 1. Remove old policy
DROP POLICY IF EXISTS "Tenant Image Management" ON storage.objects;

-- 2. Create new robust policy
-- Folder structure: property-images/{tenant_id}/{image_name}
CREATE POLICY "Tenant Image Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = public.tenant_id()::text
    )
    WITH CHECK (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = public.tenant_id()::text
    );

-- Note: public.tenant_id() was defined in migration 001 and is SECURE DEFINER,
-- making it ideal for RLS policies as it reliably fetches from the profiles table.
