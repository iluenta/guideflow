-- Migration 045: Drop unused tables that have no references in application code.
-- These tables were created for features that were never implemented or are
-- now superseded by other tables.
--
-- Order matters: drop tables with FK dependencies first.

-- translation_metrics: metrics never queried anywhere in the codebase
DROP TABLE IF EXISTS public.translation_metrics;

-- unified_manuals: alternative manual storage never used (property_manuals is used instead)
DROP TABLE IF EXISTS public.unified_manuals;

-- manual_generation_jobs: async job queue never implemented
DROP TABLE IF EXISTS public.manual_generation_jobs;

-- guest_sessions: duplicates reauth_sessions functionality, zero references
DROP TABLE IF EXISTS public.guest_sessions;

-- guest_devices: device tracking feature never implemented
DROP TABLE IF EXISTS public.guest_devices;

-- geocoding_cache: geocoding results cache never read or written in code
DROP TABLE IF EXISTS public.geocoding_cache;
