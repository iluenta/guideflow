-- Buscar en TODOS los tipos de contexto
CREATE OR REPLACE FUNCTION match_all_context(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_property_id uuid
)
RETURNS TABLE (
  id uuid,
  source_type varchar,
  source_id uuid,
  content text,
  similarity float,
  question text,
  answer text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_results AS (
    SELECT
      ce.id,
      ce.source_type,
      ce.source_id,
      ce.content,
      1 - (ce.embedding <=> query_embedding) AS similarity,
      CASE
        WHEN ce.source_type = 'faq' THEN pf.question
        ELSE NULL
      END AS question,
      CASE
        WHEN ce.source_type = 'faq' THEN pf.answer
        ELSE NULL
      END AS answer,
      -- Priorizar FAQs y contexto específico
      CASE
        WHEN ce.source_type = 'faq' THEN 1.1
        WHEN ce.source_type = 'context' THEN 1.0
        WHEN ce.source_type = 'manual' THEN 0.9
        ELSE 0.8
      END AS priority_boost
    FROM context_embeddings ce
    LEFT JOIN property_faqs pf ON ce.source_type = 'faq' AND ce.source_id = pf.id
    WHERE ce.property_id = filter_property_id
      AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  )
  SELECT
    rr.id,
    rr.source_type,
    rr.source_id,
    rr.content,
    rr.similarity,
    rr.question,
    rr.answer
  FROM ranked_results rr
  ORDER BY (rr.similarity * rr.priority_boost) DESC
  LIMIT match_count;
END;
$$;