-- Create the property_scans bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property_scans', 'property_scans', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all scans (for display in guide)
CREATE POLICY "Public Scan Access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'property_scans');

-- Allow users to manage scans only in their tenant folder
-- Folder structure: property_scans/{tenant_id}/{image_name}
CREATE POLICY "Tenant Scan Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property_scans' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    )
    WITH CHECK (
        bucket_id = 'property_scans' AND 
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')
    );
