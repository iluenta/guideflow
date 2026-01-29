-- Create table for appliance manuals metadata
CREATE TABLE IF NOT EXISTS public.appliance_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    file_path TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for manual sections (chunks for RAG)
CREATE TABLE IF NOT EXISTS public.manual_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID NOT NULL REFERENCES public.appliance_manuals(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    topic TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536), -- For text-embedding-3-small
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appliance_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appliance_manuals
CREATE POLICY "Users can view manuals of their tenant"
    ON public.appliance_manuals FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert manuals for their tenant"
    ON public.appliance_manuals FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update manuals of their tenant"
    ON public.appliance_manuals FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete manuals of their tenant"
    ON public.appliance_manuals FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for manual_sections
CREATE POLICY "Users can view manual sections of their tenant"
    ON public.manual_sections FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert manual sections for their tenant"
    ON public.manual_sections FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Create vector index for faster search
CREATE INDEX IF NOT EXISTS 10_manual_sections_embedding_idx ON public.manual_sections 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable public read for guests on a specific property
CREATE POLICY "Public guest read for property manuals"
    ON public.appliance_manuals FOR SELECT
    USING (true); -- Filtered by join in queries

CREATE POLICY "Public guest read for property manual sections"
    ON public.manual_sections FOR SELECT
    USING (true); -- Filtered by join in queries

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION public.match_manual_sections (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_property_id uuid
)
RETURNS TABLE (
  id uuid,
  manual_name text,
  content text,
  page_number int,
  topic text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.id,
    am.name as manual_name,
    ms.content,
    ms.page_number,
    ms.topic,
    1 - (ms.embedding <=> query_embedding) AS similarity
  FROM public.manual_sections ms
  JOIN public.appliance_manuals am ON am.id = ms.manual_id
  WHERE ms.property_id = p_property_id
    AND 1 - (ms.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
