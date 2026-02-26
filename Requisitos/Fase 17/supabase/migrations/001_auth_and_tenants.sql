-- Migration: Auth and Multi-Tenant Setup
-- Creates tenants table, profiles table, and all necessary functions/triggers
-- IMPORTANT: Execute this migration from Supabase SQL Editor with proper permissions

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  package_level TEXT DEFAULT 'basic' CHECK (package_level IN ('basic', 'standard', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: package_level only applies to users (role = 'user')
  CONSTRAINT package_level_only_for_users CHECK (
    (role = 'user' AND package_level IS NOT NULL) OR
    (role = 'admin' AND package_level IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can view other profiles in the same tenant
-- Use helper function to avoid recursion
CREATE POLICY "Users can view same tenant profiles" ON public.profiles
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Policy: Users can view their own tenant (must be after profiles table is created)
-- Use subquery with LIMIT to avoid recursion
CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- 3. Function to automatically create tenant when new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_tenant_id UUID;
  user_email TEXT;
  tenant_slug TEXT;
  user_full_name TEXT;
  user_role TEXT;
  user_package_level TEXT;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Get metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_package_level := COALESCE(NEW.raw_user_meta_data->>'package_level', 'basic');
  
  -- Generate unique slug based on email or UUID
  tenant_slug := LOWER(REGEXP_REPLACE(user_email, '[^a-z0-9]', '', 'g')) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);
  
  -- Ensure slug is unique (handle collisions)
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
    tenant_slug := tenant_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 4);
  END LOOP;
  
  -- Create tenant automatically
  INSERT INTO public.tenants (name, slug)
  VALUES (
    COALESCE(NULLIF(user_full_name, ''), 'Mi Organización'),
    tenant_slug
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create profile with tenant_id
  INSERT INTO public.profiles (id, email, full_name, tenant_id, role, package_level)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    new_tenant_id,
    user_role,
    CASE 
      WHEN user_role = 'user' THEN user_package_level
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: Execute after inserting in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Helper function to get tenant_id of current user
CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Helper function to get role of current user
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 6. Function to update JWT claims when profile is updated
CREATE OR REPLACE FUNCTION public.update_user_claims()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_tenant_id UUID;
  user_role TEXT;
BEGIN
  -- Get tenant_id and role from profile
  SELECT tenant_id, role INTO user_tenant_id, user_role
  FROM public.profiles
  WHERE id = NEW.id;
  
  -- Update user metadata with tenant_id and role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', user_tenant_id::TEXT,
      'role', user_role
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger: Update claims when profile tenant_id or role changes
DROP TRIGGER IF EXISTS update_auth_user_claims ON public.profiles;
CREATE TRIGGER update_auth_user_claims
  AFTER UPDATE OF tenant_id, role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_claims();

-- 7. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Also update claims on initial profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_tenant_id UUID;
  user_role TEXT;
BEGIN
  -- Get tenant_id and role from the new profile
  user_tenant_id := NEW.tenant_id;
  user_role := NEW.role;
  
  -- Update user metadata with tenant_id and role
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', user_tenant_id::TEXT,
      'role', user_role
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();
