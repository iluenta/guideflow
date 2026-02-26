-- Migration: Add section_slug to guide_sections for standardization
-- This column will be used for upserting based on predefined categories.

-- 1. Add the column
ALTER TABLE public.guide_sections
ADD COLUMN IF NOT EXISTS section_slug TEXT;

-- 2. Populate slug for existing records (a simple fallback)
UPDATE public.guide_sections
SET section_slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]', '-', 'g'))
WHERE section_slug IS NULL;

-- 3. Add the unique constraint on (property_id, section_slug)
ALTER TABLE public.guide_sections
ADD CONSTRAINT unique_property_section_slug UNIQUE (property_id, section_slug);
