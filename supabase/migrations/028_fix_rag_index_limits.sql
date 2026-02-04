-- Remove problematic UNIQUE constraint that uses a B-tree index on large text content
-- This constraint exceeds the 2704 byte limit for large chunks
ALTER TABLE context_embeddings DROP CONSTRAINT IF EXISTS context_embeddings_source_content_idx;

COMMENT ON TABLE context_embeddings IS 'Unified table for RAG embeddings. Unique constraint on content removed to allow large chunks; use vector search instead.';
