-- Migration: Add unique constraint to guide_sections for title and property
-- This allows us to use .upsert() based on property_id and title

-- 1. Remove duplicates before adding constraint (if any exist)
-- We'll keep the most recent one for each title/property combination
DELETE FROM public.guide_sections a
USING public.guide_sections b
WHERE a.id < b.id 
  AND a.property_id = b.property_id 
  AND a.title = b.title;

-- 2. Add the unique constraint
ALTER TABLE public.guide_sections
ADD CONSTRAINT unique_property_section_title UNIQUE (property_id, title);
