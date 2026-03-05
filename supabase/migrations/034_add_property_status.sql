-- Add status column to properties table
-- Defaults to 'active' for existing properties to maintain backward compatibility
-- Enum types in Postgres aren't supported directly by Supabase UI well, so using a text column with a check constraint

ALTER TABLE properties ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE properties ADD CONSTRAINT properties_status_check CHECK (status IN ('draft', 'active', 'archived'));

-- Update existing rows explicitly just in case
UPDATE properties SET status = 'active' WHERE status IS NULL;
