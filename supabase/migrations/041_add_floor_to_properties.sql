-- Migration 041: Add floor field to properties
-- This field is required to provide context to the AI about the level/floor of the unit.

ALTER TABLE IF EXISTS public.properties 
ADD COLUMN IF NOT EXISTS floor TEXT;

-- Update existing properties to 'N/A' or NULL
UPDATE public.properties SET floor = 'N/A' WHERE floor IS NULL;

-- Ensure RLS includes the new column (no changes usually needed if using SELECT *)
COMMENT ON COLUMN public.properties.floor IS 'The floor or level of the property (e.g., "1st", "Penthouse", "B1")';
