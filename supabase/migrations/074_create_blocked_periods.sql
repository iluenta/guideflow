-- ─────────────────────────────────────────────────────────────────────────────
-- 074 · Property blocked periods (host closes dates voluntarily)
-- ─────────────────────────────────────────────────────────────────────────────
-- Allows hosts to close date ranges for maintenance, cleaning, holidays, etc.
-- Distinct from reservations: no guest, no payment, just an availability block.
-- Both types are merged on the public calendar as "unavailable" dates.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.property_blocked_periods (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID  NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id    UUID  NOT NULL REFERENCES public.tenants(id)    ON DELETE CASCADE,

  start_date  DATE  NOT NULL,
  end_date    DATE  NOT NULL,

  reason  TEXT  NOT NULL,
  notes   TEXT,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by  UUID  REFERENCES public.profiles(id),

  CONSTRAINT pbp_valid_date_range CHECK (end_date > start_date),
  CONSTRAINT pbp_valid_reason     CHECK (reason IN (
    'obras', 'limpieza', 'vacaciones', 'mantenimiento', 'otro'
  ))
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pbp_property
  ON public.property_blocked_periods (property_id);

CREATE INDEX IF NOT EXISTS idx_pbp_dates
  ON public.property_blocked_periods (property_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_pbp_tenant
  ON public.property_blocked_periods (tenant_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_blocked_period_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pbp_updated_at
  BEFORE UPDATE ON public.property_blocked_periods
  FOR EACH ROW EXECUTE FUNCTION update_blocked_period_timestamp();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.property_blocked_periods ENABLE ROW LEVEL SECURITY;

-- Authenticated hosts can manage their own property blocked periods
CREATE POLICY "pbp_host_all" ON public.property_blocked_periods
  FOR ALL TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties
      WHERE tenant_id = get_user_tenant_id()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties
      WHERE tenant_id = get_user_tenant_id()
    )
  );
