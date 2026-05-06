-- ============================================================
-- 049_roles_and_packages.sql
-- Sistema de roles por tenant + mover package_level a tenants
-- ============================================================

-- 1. Añadir package_level en tenants
ALTER TABLE public.tenants
  ADD COLUMN package_level TEXT NOT NULL DEFAULT 'basic'
    CHECK (package_level IN ('basic', 'standard', 'premium'));

-- 2. Migrar datos: copiar package_level del user más antiguo de cada tenant
UPDATE public.tenants t
SET package_level = COALESCE(
  (SELECT p.package_level
   FROM public.profiles p
   WHERE p.tenant_id = t.id AND p.role = 'user'
   ORDER BY p.created_at ASC LIMIT 1),
  'basic'
);

-- 3. Forzar premium para el tenant del fundador
UPDATE public.tenants
SET package_level = 'premium'
WHERE id = 'eab1d4b5-da03-40f0-9468-4cabb92f37b9'::uuid;

-- 4. Añadir tenant_role en profiles
ALTER TABLE public.profiles
  ADD COLUMN tenant_role TEXT NOT NULL DEFAULT 'owner'
    CHECK (tenant_role IN ('owner', 'admin', 'support', 'viewer'));
-- Todos los profiles existentes quedan con 'owner' por defecto

-- 5. Eliminar package_level de profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS package_level_only_for_users,
  DROP CONSTRAINT IF EXISTS profiles_package_level_check;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS package_level;

-- 6. Actualizar función update_user_claims para incluir tenant_role
CREATE OR REPLACE FUNCTION public.update_user_claims()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'tenant_id',   NEW.tenant_id::TEXT,
      'role',        NEW.role,
      'tenant_role', NEW.tenant_role
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 7. Actualizar función handle_new_profile para incluir tenant_role
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'tenant_id',   NEW.tenant_id::TEXT,
      'role',        NEW.role,
      'tenant_role', NEW.tenant_role
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 8. Actualizar trigger para escuchar cambios en tenant_role también
DROP TRIGGER IF EXISTS update_auth_user_claims ON public.profiles;
CREATE TRIGGER update_auth_user_claims
  AFTER UPDATE OF tenant_id, role, tenant_role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_claims();

-- 9. Tabla tenant_invitations
CREATE TABLE public.tenant_invitations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  tenant_role    TEXT NOT NULL CHECK (tenant_role IN ('admin', 'support', 'viewer')),
  invited_by     UUID NOT NULL REFERENCES public.profiles(id),
  token          TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  accepted_at    TIMESTAMPTZ NULL,
  email_sent_at  TIMESTAMPTZ NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view invitations"
  ON public.tenant_invitations FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant members can insert invitations"
  ON public.tenant_invitations FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- La aceptación se hace con service role key desde Server Action, sin RLS
CREATE POLICY "Service role can update invitations"
  ON public.tenant_invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_tenant_invitations_token  ON public.tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_tenant ON public.tenant_invitations(tenant_id);
