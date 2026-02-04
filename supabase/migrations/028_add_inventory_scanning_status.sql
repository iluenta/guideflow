-- Migration 028: Add inventory scanning status to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS inventory_status TEXT DEFAULT 'none' CHECK (inventory_status IN ('none', 'generating', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS inventory_last_scan_at TIMESTAMPTZ;

-- Comment for clarity
COMMENT ON COLUMN public.properties.inventory_status IS 'Status of the AI inventory scanning process for this property.';
