-- Migration: Make property_scans bucket private and update RLS
-- This prevents anonymous access to property scans via public URLs.

-- 1. Set bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'property_scans';

-- 2. Remove public access policy
DROP POLICY IF EXISTS "Public Scan Access" ON storage.objects;

-- 3. The existing "Tenant Scan Management" policy (from migration 013) 
-- already restricts access to authenticated users within their own tenant.
-- No further changes needed to RLS for basic security.
