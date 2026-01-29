-- Migration: Update guide_sections content_type constraint
-- This allows the 'recommendation' type in the modular guide architecture

ALTER TABLE public.guide_sections 
DROP CONSTRAINT IF EXISTS guide_sections_content_type_check;

ALTER TABLE public.guide_sections
ADD CONSTRAINT guide_sections_content_type_check 
CHECK (content_type IN ('text', 'image', 'video', 'map', 'ai_chat', 'recommendation'));
