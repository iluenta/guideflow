-- ============================================================
-- 048: Guest link analytics
-- Vincula guide_section_views con el token del huésped y
-- añade métricas de apertura a guest_access_tokens.
-- ============================================================

-- 1. Enriquecer guide_section_views con datos del enlace y dispositivo
ALTER TABLE guide_section_views
  ADD COLUMN IF NOT EXISTS access_token      TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS user_agent        TEXT,
  ADD COLUMN IF NOT EXISTS ip_address        TEXT;

CREATE INDEX IF NOT EXISTS gsv_token_idx     ON guide_section_views(access_token);
CREATE INDEX IF NOT EXISTS gsv_viewed_at_idx ON guide_section_views(viewed_at DESC);

-- 2. Añadir métricas de apertura a guest_access_tokens
ALTER TABLE guest_access_tokens
  ADD COLUMN IF NOT EXISTS first_opened_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS ip_first_access   TEXT,
  ADD COLUMN IF NOT EXISTS user_agent_first  TEXT;
