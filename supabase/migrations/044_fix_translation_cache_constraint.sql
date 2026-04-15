-- Fix translation_cache: add hash + property_id columns and unique index
-- so that TranslationService.saveToDBBulk upsert (onConflict: 'hash,property_id') works.
-- Without this index every upsert fails silently and translations are never persisted to DB,
-- meaning every page load re-translates from Gemini instead of hitting the L2 cache.

ALTER TABLE translation_cache
  ADD COLUMN IF NOT EXISTS hash        VARCHAR(64),
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_lang VARCHAR(5),
  ADD COLUMN IF NOT EXISTS target_lang VARCHAR(5);

-- Unique index required by onConflict: 'hash,property_id'
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_hash_property
  ON translation_cache(hash, property_id);
