-- Migration: Fix RLS Robustness and Infinite Recursion
-- This script replaces problematic tenant_id helper functions with JWT-first robust versions

-- 1. Create/Update a truly robust tenant_id function
-- This function priorities JWT metadata (fast, no recursion)
-- It only hits the database as a last resort, using SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- A. Try to get it from JWT claims (fastest, most reliable in SSR/Client sessions)
  _tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID;
  
  IF _tenant_id IS NOT NULL THEN
    RETURN _tenant_id;
  END IF;

  -- B. Fallback to profiles table (last resort, bypassing RLS via SECURITY DEFINER)
  SELECT tenant_id INTO _tenant_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
  
  RETURN _tenant_id;
END;
$$;

-- 2. Update the common tenant_id() alias
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_tenant_id();
$$;

-- 3. Update properties RLS policy
-- Note: Policy needs to be dropped and recreated to ensure it uses the new function correctly
DROP POLICY IF EXISTS "Users can only access their own tenant properties" ON public.properties;

CREATE POLICY "Users can only access their own tenant properties" ON public.properties
    FOR ALL
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id())
    WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 4. Update profiles RLS to avoid recursion
DROP POLICY IF EXISTS "Users can view same tenant profiles" ON public.profiles;

CREATE POLICY "Users can view same tenant profiles" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      id = auth.uid() OR 
      tenant_id = public.get_user_tenant_id()
    );

-- 5. Update tenants RLS
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;

CREATE POLICY "Users can view own tenant" ON public.tenants
    FOR SELECT
    TO authenticated
    USING (
      id = public.get_user_tenant_id()
    );
