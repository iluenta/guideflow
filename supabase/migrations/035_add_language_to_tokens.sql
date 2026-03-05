-- Add language column to guest_access_tokens
ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS language TEXT;

COMMENT ON COLUMN guest_access_tokens.language IS 'The locked language for the guest guide, chosen during link generation.';
