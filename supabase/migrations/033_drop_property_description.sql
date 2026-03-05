-- Drop the description column from properties as it's replaced by the host welcome message
ALTER TABLE properties DROP COLUMN IF EXISTS description;
