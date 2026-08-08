-- =============================================================
-- 20260807170000_checkin_document_kind.sql
-- Separa "qué documento presenta el huésped" (lo que elige en el
-- formulario) de "qué código espera SES Hospedajes".
--
-- Por qué: el catálogo TIPO_DOCUMENTO de SES, consultado en producción,
-- solo tiene 6 códigos — NIF, NIE, PAS, OTRO ("Otro documento
-- extranjero"), CIF y CIF_E. Pero al huésped hay que ofrecerle las
-- opciones que reconoce en su cartera: tarjeta de identificación y
-- permiso de residencia son documentos distintos entre sí aunque los
-- dos viajen a SES como OTRO, y "menor sin documentación" no tiene
-- código porque no hay documento que declarar.
--
-- Sin esta columna, reabrir una ficha guardada no podría distinguir si
-- el huésped eligió tarjeta o permiso: ambas se leerían como OTRO.
-- =============================================================

ALTER TABLE public.checkin_guests
  ADD COLUMN IF NOT EXISTS document_kind TEXT;

ALTER TABLE public.checkin_guests
  DROP CONSTRAINT IF EXISTS checkin_guests_document_kind_check;

ALTER TABLE public.checkin_guests
  ADD CONSTRAINT checkin_guests_document_kind_check
  CHECK (document_kind IS NULL OR document_kind IN (
    'DNI',                  -- → NIF
    'NIE',                  -- → NIE
    'PASAPORTE',            -- → PAS
    'TARJETA_IDENTIDAD',    -- → OTRO
    'PERMISO_RESIDENCIA',   -- → OTRO
    'MENOR_SIN_DOCUMENTO'   -- → sin documento: no se informa a SES
  ));

-- Un menor sin documentación no tiene ni tipo ni número que declarar.
-- Hasta ahora ambos eran NOT NULL, lo que hacía imposible registrarlo.
ALTER TABLE public.checkin_guests
  ALTER COLUMN document_type DROP NOT NULL;

ALTER TABLE public.checkin_guests
  ALTER COLUMN document_number DROP NOT NULL;

-- Coherencia: o hay documento completo, o es un menor sin documentación.
-- Evita que una ficha quede a medias (tipo sin número o al revés).
ALTER TABLE public.checkin_guests
  DROP CONSTRAINT IF EXISTS checkin_guests_document_presence_check;

ALTER TABLE public.checkin_guests
  ADD CONSTRAINT checkin_guests_document_presence_check
  CHECK (
    (document_kind = 'MENOR_SIN_DOCUMENTO' AND document_type IS NULL AND document_number IS NULL)
    OR (document_kind IS DISTINCT FROM 'MENOR_SIN_DOCUMENTO' AND document_type IS NOT NULL AND document_number IS NOT NULL)
  );

-- Fichas anteriores a esta migración: se deduce la elección desde el
-- código de SES que ya tenían. OTRO cae en tarjeta de identificación
-- porque es el caso corriente; no hay forma de recuperar el dato
-- original, y en el XML da igual (ambos salen como OTRO).
UPDATE public.checkin_guests
SET document_kind = CASE document_type
  WHEN 'NIF'  THEN 'DNI'
  WHEN 'NIE'  THEN 'NIE'
  WHEN 'PAS'  THEN 'PASAPORTE'
  ELSE 'TARJETA_IDENTIDAD'
END
WHERE document_kind IS NULL;
