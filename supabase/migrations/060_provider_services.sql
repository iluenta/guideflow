-- =============================================================
-- 060_provider_services.sql
-- Un proveedor puede ofrecer múltiples servicios
-- =============================================================

-- 1. Tabla de servicios por proveedor
CREATE TABLE public.provider_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL
    REFERENCES public.providers(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
    'cleaning', 'laundry', 'checkin', 'maintenance',
    'utilities', 'wifi', 'streaming', 'community',
    'insurance', 'ibi', 'supplies', 'marketing',
    'management', 'other'
  )),
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE (provider_id, category)
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.provider_services
  USING (
    provider_id IN (
      SELECT id FROM public.providers
      WHERE tenant_id = public.get_user_tenant_id()
    )
  );

CREATE INDEX idx_provider_services_provider ON public.provider_services(provider_id);
CREATE INDEX idx_provider_services_category ON public.provider_services(category);

-- 2. Migrar datos existentes: provider_type → provider_services (is_primary = true)
INSERT INTO public.provider_services (provider_id, category, is_primary)
SELECT id, provider_type, true
FROM public.providers
WHERE provider_type IS NOT NULL;

-- 3. Eliminar columna antigua
ALTER TABLE public.providers
  DROP COLUMN IF EXISTS provider_type;
