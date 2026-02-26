-- Migration: Final Fix for Storage RLS
-- Using IN (subquery) for cleaner and more reliable ID matching

DROP POLICY IF EXISTS "Tenant Scan Management" ON storage.objects;

-- We use (storage.foldername(name))[1] to get the property_id from the path
-- and check if it belongs to the authenticated user's tenant.
CREATE POLICY "Tenant Scan Management" ON storage.objects
    FOR ALL 
    TO authenticated
    USING (
        bucket_id = 'property_scans' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.properties 
            WHERE tenant_id = public.tenant_id()
        )
    )
    WITH CHECK (
        bucket_id = 'property_scans' AND 
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.properties 
            WHERE tenant_id = public.tenant_id()
        )
    );
