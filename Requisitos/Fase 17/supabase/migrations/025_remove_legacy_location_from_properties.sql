-- Migration: Remove legacy location column from properties
-- This column is now redundant due to the granular geolocation fields added in migration 024.

ALTER TABLE public.properties DROP COLUMN IF EXISTS location;
