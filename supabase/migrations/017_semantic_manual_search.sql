-- Add columns for structured content and embeddings to appliance_manuals
ALTER TABLE public.appliance_manuals 
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS appliance_name TEXT,
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD CONSTRAINT unique_brand_model UNIQUE (brand, model);

-- Backfill appliance_name from name if name exists
UPDATE public.appliance_manuals SET appliance_name = name WHERE appliance_name IS NULL;

-- Function for semantic search on appliance_manuals
CREATE OR REPLACE FUNCTION public.match_manuals (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_property_id uuid
)
returns table (
  id uuid,
  appliance_name text,
  content jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    am.id,
    am.appliance_name,
    am.content,
    1 - (am.embedding <=> query_embedding) as similarity
  from public.appliance_manuals am
  where am.property_id = p_property_id
    and 1 - (am.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- Create vector index for appliance_manuals
CREATE INDEX IF NOT EXISTS 10_appliance_manuals_embedding_idx ON public.appliance_manuals 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
