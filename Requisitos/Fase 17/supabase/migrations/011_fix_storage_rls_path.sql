-- Migration: Fix Storage RLS for property_scans
-- The previous policy expected folder structure: property_scans/{tenant_id}/{image}
-- The new requirement is: property_scans/{property_id}/{timestamp}/{image}

-- 1. Drop the old policy
DROP POLICY IF EXISTS "Tenant Scan Management" ON storage.objects;

-- 2. Create a new policy that verifies property ownership
-- We check if the first folder (property_id) exists in the properties table
-- and belongs to the user's tenant.
CREATE POLICY "Tenant Scan Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property_scans' AND 
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[1]
            AND p.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        )
    )
    WITH CHECK (
        bucket_id = 'property_scans' AND 
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[1]
            AND p.tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
        )
    );
