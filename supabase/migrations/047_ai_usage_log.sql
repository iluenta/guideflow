-- Migration 047: AI Usage Log — token tracking por operación
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  property_id     UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_id       UUID,
  operation       TEXT NOT NULL,
  model           TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  tokens_prompt   INTEGER,
  tokens_output   INTEGER,
  tokens_total    INTEGER,
  cost_usd        NUMERIC(10,6),
  duration_ms     INTEGER,
  is_error        BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS ai_usage_log_created_idx   ON public.ai_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_log_tenant_idx    ON public.ai_usage_log(tenant_id);
CREATE INDEX IF NOT EXISTS ai_usage_log_property_idx  ON public.ai_usage_log(property_id);
CREATE INDEX IF NOT EXISTS ai_usage_log_operation_idx ON public.ai_usage_log(operation);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede insertar (server-side only)
-- Los tenants pueden leer sus propios registros
CREATE POLICY "tenants can read own ai_usage_log"
  ON public.ai_usage_log FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

COMMENT ON TABLE  public.ai_usage_log IS 'Token usage y coste estimado por llamada a Gemini/OpenAI';
COMMENT ON COLUMN public.ai_usage_log.operation IS 'chat | intent | manual_vision | fill_context | arrival | geocoding_validation | manual_enrichment | ingestion';
COMMENT ON COLUMN public.ai_usage_log.cost_usd  IS 'Coste estimado en USD: prompt×$0.075/1M + output×$0.30/1M (Gemini 2.5 Flash sin thinking)';
