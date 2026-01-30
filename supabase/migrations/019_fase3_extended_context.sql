-- Migración 019: Contexto Ampliado (Fase 3)
-- Esta migración unifica manuales, FAQs, normas y recomendaciones.

-- 1. Tabla principal de contexto estructurado
CREATE TABLE IF NOT EXISTS public.property_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  category VARCHAR(50) NOT NULL, -- 'access', 'rules', 'tech', 'amenities', 'dining', 'services', 'experiences', 'problems'
  subcategory VARCHAR(50),
  content JSONB NOT NULL, -- Estructura normalizada
  language VARCHAR(5) DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para FAQs específicas
CREATE TABLE IF NOT EXISTS public.property_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla para Recomendaciones Locales
CREATE TABLE IF NOT EXISTS public.property_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  type VARCHAR(50) NOT NULL, -- 'restaurant', 'activity', 'service', 'shop'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  distance VARCHAR(50),
  price_range VARCHAR(20),
  metadata JSONB DEFAULT '{}'::jsonb, -- {address, phone, website, hours, apps}
  personal_note TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla UNIFICADA de embeddings para RAG
CREATE TABLE IF NOT EXISTS public.context_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID,
  source_type VARCHAR(50) NOT NULL, -- 'manual', 'faq', 'context', 'recommendation'
  source_id UUID NOT NULL, -- ID del registro original en su tabla correspondiente
  content TEXT NOT NULL, -- Texto plano para búsqueda y contexto
  embedding vector(1536), -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices vectoriales
CREATE INDEX IF NOT EXISTS ctx_embeddings_vector_idx ON public.context_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Migración de Datos Existentes (Manuals -> Context Embeddings)
-- Nota: Dejamos property_manuals por ahora para no romper el código actual mientras migramos,
-- pero insertamos sus embeddings en la nueva tabla unificada.

INSERT INTO public.context_embeddings (property_id, tenant_id, source_type, source_id, content, embedding, metadata)
SELECT 
    pm.property_id, 
    pm.tenant_id, 
    'manual', 
    me.manual_id, 
    me.content, 
    me.embedding, 
    me.metadata
FROM public.manual_embeddings me
JOIN public.property_manuals pm ON me.manual_id = pm.id
ON CONFLICT DO NOTHING;

-- 6. RPC: match_all_context
-- Función de búsqueda unificada con BOOST de prioridad
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
    1 - (ce.embedding <=> query_embedding) AS similarity,
    CASE
      WHEN ce.source_type = 'faq' THEN 1.2
      WHEN ce.source_type = 'recommendation' THEN 1.1
      WHEN ce.source_type = 'context' THEN 1.0
      WHEN ce.source_type = 'manual' THEN 0.9
      ELSE 0.8
    END AS priority_boost,
    ce.metadata
  FROM public.context_embeddings ce
  WHERE ce.property_id = p_property_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY (similarity * priority_boost) DESC
  LIMIT match_count;
END;
$$;

-- RLS Policies (Simplificadas para desarrollo, ajustar en producción)
ALTER TABLE public.property_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.context_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for property owners" ON public.property_context USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for property owners" ON public.property_faqs USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for property owners" ON public.property_recommendations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for property owners" ON public.context_embeddings USING (true) WITH CHECK (true);
