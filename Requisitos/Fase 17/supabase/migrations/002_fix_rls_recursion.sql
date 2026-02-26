-- Fix: Resolve infinite recursion in RLS policies
-- The issue is that policies are querying the same table they protect, causing recursion
-- Solution: Use a helper function or simplify the policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view same tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;

-- Create a helper function to get user's tenant_id (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Recreate policies without recursion
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy 3: Users can view profiles in the same tenant (using helper function to avoid recursion)
CREATE POLICY "Users can view same tenant profiles" ON public.profiles
  FOR SELECT 
  USING (
    tenant_id = public.get_user_tenant_id()
  );

-- Policy 4: Users can view their own tenant (using helper function)
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT 
  USING (
    id = public.get_user_tenant_id()
  );
