-- =============================================================
-- 061_drop_branding_bucket.sql
-- Unifica el bucket "branding" en "property-images".
--
-- ANTES de ejecutar esta migración:
--   1. Ir a Supabase Dashboard → Storage → branding
--   2. Seleccionar todos los archivos y eliminarlos
--   3. Eliminar el bucket desde el Dashboard
--
-- Esta migración solo limpia las referencias en base de datos.
-- =============================================================

-- 1. Limpiar custom_logo_url que apunten al bucket "branding" (URLs rotas)
UPDATE public.property_branding
SET custom_logo_url = NULL
WHERE custom_logo_url LIKE '%/storage/v1/object/public/branding/%';

-- 2. Eliminar políticas RLS del bucket branding
DROP POLICY IF EXISTS "Branding Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Owners can manage branding files" ON storage.objects;
