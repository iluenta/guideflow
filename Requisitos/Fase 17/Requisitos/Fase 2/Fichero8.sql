-- Ejecutar en Supabase SQL Editor
CREATE OR REPLACE FUNCTION match_manual_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_property_id uuid
)
RETURNS TABLE (
  id uuid,
  manual_id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    me.id,
    me.manual_id,
    me.content,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM manual_embeddings me
  JOIN property_manuals pm ON me.manual_id = pm.id
  WHERE pm.property_id = filter_property_id
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
$$;