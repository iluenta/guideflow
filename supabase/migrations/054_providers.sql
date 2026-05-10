-- =============================================================
-- 054_providers.sql
-- Tabla de proveedores reutilizables + ajuste reservation_charges
-- + default_provider_id en charge_templates
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Tabla providers
-- ---------------------------------------------------------------
CREATE TABLE public.providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  provider_type TEXT CHECK (provider_type IN (
    'checkin', 'checkout', 'cleaning', 'maintenance',
    'transport', 'other'
  )),
  phone         TEXT,
  email         TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.providers
  USING (tenant_id = public.get_user_tenant_id());
CREATE INDEX idx_providers_tenant ON public.providers(tenant_id);

-- ---------------------------------------------------------------
-- 2. Ajustar reservation_charges:
--    Migrar provider_name → provider_name_override
--    Añadir provider_id FK a providers
-- ---------------------------------------------------------------
ALTER TABLE public.reservation_charges
  RENAME COLUMN provider_name TO provider_name_override;

ALTER TABLE public.reservation_charges
  ADD COLUMN provider_id UUID REFERENCES public.providers(id);

-- ---------------------------------------------------------------
-- 3. Añadir default_provider_id a charge_templates
-- ---------------------------------------------------------------
ALTER TABLE public.charge_templates
  ADD COLUMN default_provider_id UUID REFERENCES public.providers(id);
