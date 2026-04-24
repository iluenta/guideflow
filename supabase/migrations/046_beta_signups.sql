-- Migration: Beta signups waitlist
CREATE TABLE IF NOT EXISTS public.beta_signups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  properties  TEXT,
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS beta_signups_email_idx ON public.beta_signups(email);
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Public insert (landing form), no reads without auth
CREATE POLICY "public can insert beta_signups"
  ON public.beta_signups FOR INSERT TO anon, authenticated
  WITH CHECK (true);
