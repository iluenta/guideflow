-- Migration: Add pgvector and embeddings support
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding and metadata columns to guide_sections
ALTER TABLE public.guide_sections 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Create index for vector similarity search (optional but recommended for scale)
-- Using HNSW for performance on larger datasets
CREATE INDEX IF NOT EXISTS idx_guide_sections_embedding ON public.guide_sections 
USING hnsw (embedding vector_cosine_ops);
