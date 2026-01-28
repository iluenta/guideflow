-- Migration: Robust Fix for Storage RLS (v2)
-- Corrected table name from 'users' to 'profiles'

DROP POLICY IF EXISTS "Tenant Scan Management" ON storage.objects;

-- We'll use the public.tenant_id() helper function which is already defined and reliable.
CREATE POLICY "Tenant Scan Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property_scans' AND 
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[1]
            AND p.tenant_id = public.tenant_id()
        )
    )
    WITH CHECK (
        bucket_id = 'property_scans' AND 
        EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[1]
            AND p.tenant_id = public.tenant_id()
        )
    );
