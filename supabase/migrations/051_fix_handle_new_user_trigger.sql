-- Fix 1: eliminar package_level (columna eliminada en 049)
-- Fix 2: no crear tenant/profile si el email tiene una invitación pendiente
--        en ese caso, acceptInvitation() se encarga de crear el profile correctamente
-- Fix 3: handle_new_profile debe incluir tenant_role en el JWT

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_tenant_id  UUID;
  tenant_slug    TEXT;
  user_full_name TEXT;
  user_role      TEXT;
BEGIN
  -- Si hay una invitación pendiente para este email, no crear tenant ni profile.
  -- acceptInvitation() lo hará con el tenant_id y tenant_role correctos.
  IF EXISTS (
    SELECT 1 FROM public.tenant_invitations
    WHERE email = LOWER(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > NOW()
  ) THEN
    RETURN NEW;
  END IF;

  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  user_role      := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  tenant_slug := LOWER(REGEXP_REPLACE(NEW.email, '[^a-z0-9]', '', 'g'))
                 || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
    tenant_slug := tenant_slug || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 4);
  END LOOP;

  INSERT INTO public.tenants (name, slug)
  VALUES (COALESCE(NULLIF(user_full_name, ''), 'Mi Organización'), tenant_slug)
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (id, email, full_name, tenant_id, role)
  VALUES (NEW.id, NEW.email, user_full_name, new_tenant_id, user_role);

  RETURN NEW;
END;
$$;

-- Fix 3: handle_new_profile incluye tenant_role en el JWT
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
