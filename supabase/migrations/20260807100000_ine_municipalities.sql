-- =============================================================
-- 20260807100000_ine_municipalities.sql
-- Catálogo de municipios del INE + código de municipio en la ficha
-- de huésped.
--
-- Por qué: el "alta masiva" de SES Hospedajes exige codigoMunicipio
-- (código INE de 5 dígitos) cuando el país de residencia es España —
-- nombreMunicipio en texto libre solo vale para el extranjero. Hasta
-- ahora el XML omitía el campo (limitación documentada en
-- lib/ses/xml-builder.ts), lo que hacía que el fichero fuese
-- rechazable en el portal.
--
-- El código no se puede deducir del código postal: la relación es 1:N
-- (Adra = 04770 / 04778 / 04779), así que el municipio lo elige el
-- huésped en el formulario contra este catálogo.
--
-- Fuente: fichero oficial del INE "Relación de municipios y códigos
-- por comunidades autónomas y provincias". El catálogo se puebla y se
-- refresca con scripts/import-ine-municipalities.mjs, no con INSERTs
-- en esta migración (8.132 filas no pintan nada en el historial de
-- migraciones, y hay que poder actualizarlo sin migrar).
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Catálogo de municipios (dato público de referencia, no PII,
--    no tiene tenant: es el mismo para toda la instalación)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ine_municipalities (
  -- CPRO (2) + CMUN (3). Es el mismo valor que devuelve CartoCiudad
  -- como muniCode, verificado contra varios municipios.
  code            TEXT PRIMARY KEY CHECK (code ~ '^[0-9]{5}$'),
  name            TEXT NOT NULL,
  -- Minúsculas y sin acentos: permite buscar "malaga" y encontrar "Málaga".
  name_normalized TEXT NOT NULL,
  province_code   TEXT NOT NULL CHECK (province_code ~ '^[0-9]{2}$'),
  province_name   TEXT NOT NULL,
  -- Los municipios que desaparecen (fusiones) se marcan inactivos, nunca
  -- se borran: una ficha antigua pudo registrarse con ese código.
  active          BOOLEAN NOT NULL DEFAULT true,
  -- Fecha de referencia del fichero del INE (ej. '2026-01-01').
  source_version  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ine_municipalities_name_norm
  ON public.ine_municipalities (name_normalized text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_ine_municipalities_province
  ON public.ine_municipalities (province_code, name);

ALTER TABLE public.ine_municipalities ENABLE ROW LEVEL SECURITY;

-- Lectura abierta: es un catálogo público del INE y lo consulta el
-- huésped en el formulario de check-in, que es anónimo. La escritura no
-- tiene policy — solo entra por el script de importación (service role).
DROP POLICY IF EXISTS "Public read" ON public.ine_municipalities;
CREATE POLICY "Public read" ON public.ine_municipalities
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Provincias derivadas del propio catálogo (52 filas) — así el nombre de
-- provincia tiene una única fuente de verdad y no hay que mantener una lista
-- paralela en el código. security_invoker: la vista respeta la RLS de la
-- tabla base en vez de saltársela con los permisos del propietario.
DROP VIEW IF EXISTS public.ine_provinces;
CREATE VIEW public.ine_provinces
  WITH (security_invoker = true) AS
  SELECT DISTINCT province_code AS code, province_name AS name
  FROM public.ine_municipalities
  WHERE active;

GRANT SELECT ON public.ine_provinces TO anon, authenticated;

-- ---------------------------------------------------------------
-- 2. checkin_guests: código de municipio de residencia
-- ---------------------------------------------------------------
-- Sin FK a ine_municipalities a propósito: si el catálogo no estuviera
-- cargado, una FK haría fallar el check-in con un error opaco de
-- integridad. La validación de que el código existe se hace en el
-- servidor (submitCheckinGuest), que puede dar un mensaje claro.
-- Solo se rellena cuando address_country = 'ESP'; para el extranjero el
-- municipio va como texto libre en address_city.
ALTER TABLE public.checkin_guests
  ADD COLUMN IF NOT EXISTS address_municipality_code TEXT;

ALTER TABLE public.checkin_guests
  DROP CONSTRAINT IF EXISTS checkin_guests_municipality_code_check;

ALTER TABLE public.checkin_guests
  ADD CONSTRAINT checkin_guests_municipality_code_check
  CHECK (address_municipality_code IS NULL OR address_municipality_code ~ '^[0-9]{5}$');
