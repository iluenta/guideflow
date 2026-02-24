-- Migration 031: Add layout_theme_id to property_branding
-- This replaces the old 4 color presets with 6 visual style themes

ALTER TABLE public.property_branding
  ADD COLUMN IF NOT EXISTS layout_theme_id TEXT NOT NULL DEFAULT 'modern';

-- Validate theme IDs
ALTER TABLE public.property_branding
  DROP CONSTRAINT IF EXISTS chk_layout_theme_id;

ALTER TABLE public.property_branding
  ADD CONSTRAINT chk_layout_theme_id
    CHECK (layout_theme_id IN ('modern', 'urban', 'coastal', 'warm', 'luxury', 'airbnb'));

COMMENT ON COLUMN public.property_branding.layout_theme_id IS
  'Visual style theme: modern | urban | coastal | warm | luxury | airbnb.
   Determines CSS variable palette + fonts injected in the guest guide.';
