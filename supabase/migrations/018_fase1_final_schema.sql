-- Migration 018: Fase 1 Schema - Manuales, Embeddings y Chat
-- Basado en Requisitos/Fase 1/fichero1.sql

-- 1. Tabla de manuales generados
CREATE TABLE IF NOT EXISTS public.property_manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  appliance_name VARCHAR(255),
  brand VARCHAR(100),
  model VARCHAR(100),
  manual_content TEXT, -- Manual completo en markdown
  metadata JSONB DEFAULT '{}'::jsonb, -- {source: 'image'|'search', confidence: 0-1}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de chunks vectorizados para RAG (OpenAI 1536 dims)
CREATE TABLE IF NOT EXISTS public.manual_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_id UUID REFERENCES public.property_manuals(id) ON DELETE CASCADE,
  content TEXT, -- Chunk del manual
  embedding vector(1536), -- Embeddings de OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de imágenes subidas
CREATE TABLE IF NOT EXISTS public.appliance_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  manual_id UUID REFERENCES public.property_manuals(id) ON DELETE SET NULL,
  image_url TEXT,
  analysis_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de conversaciones del chat
CREATE TABLE IF NOT EXISTS public.guest_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  guest_session_id VARCHAR(255), -- Cookie/fingerprint del huésped
  messages JSONB[] DEFAULT '{}', -- Array de {role, content, timestamp}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Índices y RLS
CREATE INDEX IF NOT EXISTS manual_embeddings_idx ON public.manual_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.property_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_chats ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Permitir lectura a dueños y anónimos si es necesario para el chat)
CREATE POLICY "Enable read/write for owners" ON public.property_manuals USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for owners" ON public.manual_embeddings USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for owners" ON public.appliance_images USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for owners" ON public.guest_chats USING (true) WITH CHECK (true);

-- Función RPC para búsqueda semántica (Vector 1536)
CREATE OR REPLACE FUNCTION public.match_property_manuals (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_property_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  appliance_name varchar,
  brand varchar,
  model varchar,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.id,
    me.content,
    pm.appliance_name,
    pm.brand,
    pm.model,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM public.manual_embeddings me
  JOIN public.property_manuals pm ON me.manual_id = pm.id
  WHERE pm.property_id = p_property_id
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
