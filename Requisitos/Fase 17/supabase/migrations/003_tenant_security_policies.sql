-- Migration: Tenant Security Policies
-- Creates table for tenant-specific security policies

-- 1. Create tenant_security_policies table
CREATE TABLE IF NOT EXISTS public.tenant_security_policies (
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE PRIMARY KEY,
  session_inactive_timeout_minutes INT DEFAULT 1440, -- 24h
  require_reauthentication_for_sensitive_actions BOOLEAN DEFAULT true,
  max_concurrent_sessions INT DEFAULT 5,
  refresh_token_expiry_days INT DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_security_policies_tenant_id ON public.tenant_security_policies(tenant_id);

ALTER TABLE public.tenant_security_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their tenant's security policies
CREATE POLICY "Users can view own tenant security policies" ON public.tenant_security_policies
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- 2. Function to get tenant security policy
CREATE OR REPLACE FUNCTION public.get_tenant_security_policy()
RETURNS public.tenant_security_policies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.tenant_security_policies 
  WHERE tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  LIMIT 1;
$$;

-- 3. Function to automatically create default security policy for new tenants
CREATE OR REPLACE FUNCTION public.handle_new_tenant_security_policy()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create default security policy for new tenant
  INSERT INTO public.tenant_security_policies (
    tenant_id,
    session_inactive_timeout_minutes,
    require_reauthentication_for_sensitive_actions,
    max_concurrent_sessions,
    refresh_token_expiry_days
  )
  VALUES (
    NEW.id,
    1440, -- 24 hours
    true,
    5,
    7
  )
  ON CONFLICT (tenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger: Create security policy when tenant is created
DROP TRIGGER IF EXISTS on_tenant_created_security_policy ON public.tenants;
CREATE TRIGGER on_tenant_created_security_policy
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_tenant_security_policy();

-- 4. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tenant_security_policy_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tenant_security_policies_updated_at ON public.tenant_security_policies;
CREATE TRIGGER update_tenant_security_policies_updated_at 
  BEFORE UPDATE ON public.tenant_security_policies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_tenant_security_policy_updated_at();

-- 5. Create default policies for existing tenants (if any)
INSERT INTO public.tenant_security_policies (
  tenant_id,
  session_inactive_timeout_minutes,
  require_reauthentication_for_sensitive_actions,
  max_concurrent_sessions,
  refresh_token_expiry_days
)
SELECT 
  id,
  1440, -- 24 hours
  true,
  5,
  7
FROM public.tenants
ON CONFLICT (tenant_id) DO NOTHING;
