-- ─────────────────────────────────────────────────────────────────────────────
-- 073 · Dynamic price periods (seasons + exceptions)
-- ─────────────────────────────────────────────────────────────────────────────
-- Each row is a named season (e.g. "Temporada Alta").
-- Exceptions (festivos, puentes, etc.) are stored inline in a JSONB array
-- so they can be queried atomically without a JOIN.
--
-- Lógica de precios:
--   1. Para cada noche: buscar excepción → si hay, usa su precio.
--   2. Si no hay excepción: usa el precio del período.
--   3. Si la noche no cae en ningún período: usa landing.price_per_night.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_price_periods (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID        NOT NULL REFERENCES properties(id)  ON DELETE CASCADE,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id)     ON DELETE CASCADE,

  period_name        TEXT           NOT NULL,
  start_date         DATE           NOT NULL,
  end_date           DATE           NOT NULL,
  price_per_night    NUMERIC(10,2)  NOT NULL,

  -- Array de PriceException: [{ id, name, start_date, end_date, price_per_night }]
  exceptions   JSONB  NOT NULL DEFAULT '[]'::jsonb,

  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT ppp_valid_date_range CHECK (end_date > start_date),
  CONSTRAINT ppp_valid_price      CHECK (price_per_night > 0)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ppp_property
  ON property_price_periods (property_id);

CREATE INDEX IF NOT EXISTS idx_ppp_dates
  ON property_price_periods (property_id, start_date, end_date);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_price_period_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ppp_updated_at
  BEFORE UPDATE ON property_price_periods
  FOR EACH ROW EXECUTE FUNCTION update_price_period_timestamp();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE property_price_periods ENABLE ROW LEVEL SECURITY;

-- Hosts can read and write their own property pricing
CREATE POLICY "ppp_host_all" ON property_price_periods
  FOR ALL TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties
      WHERE tenant_id = get_user_tenant_id()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties
      WHERE tenant_id = get_user_tenant_id()
    )
  );

-- Public can read pricing (needed for the public landing page calculator)
CREATE POLICY "ppp_public_select" ON property_price_periods
  FOR SELECT TO anon
  USING (
    property_id IN (
      SELECT id FROM properties
    )
  );
