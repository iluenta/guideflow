-- Fix: Update RLS policies to handle edge cases better
-- Run this if you're getting 500 errors when querying profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view same tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;

-- Recreate policies with better error handling
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view same tenant profiles" ON public.profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.tenant_id = profiles.tenant_id
    )
  );

CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = tenants.id
    )
  );
