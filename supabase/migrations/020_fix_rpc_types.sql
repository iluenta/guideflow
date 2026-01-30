-- Migración 020: Corrección de tipos en match_all_context
-- Se cambia el tipo de priority_boost a FLOAT para coincidir con la definición del retorno.

CREATE OR REPLACE FUNCTION public.match_all_context (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_property_id uuid
)
RETURNS TABLE (
  id uuid,
  source_type varchar,
  source_id uuid,
  content text,
  similarity float,
  priority_boost float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.source_type,
    ce.source_id,
    ce.content,
    (1 - (ce.embedding <=> query_embedding))::float AS similarity,
    (CASE
      WHEN ce.source_type = 'faq' THEN 1.2
      WHEN ce.source_type = 'recommendation' THEN 1.1
      WHEN ce.source_type = 'context' THEN 1.0
      WHEN ce.source_type = 'manual' THEN 0.9
      ELSE 0.8
    END)::float AS priority_boost,
    ce.metadata
  FROM public.context_embeddings ce
  WHERE ce.property_id = p_property_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY (similarity * priority_boost) DESC
  LIMIT match_count;
END;
$$;
