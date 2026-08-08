-- =============================================================
-- 20260808090000_checkin_tighten_guest_schema.sql
-- Limpieza estructural de checkin_guests, aprovechando que la tabla
-- está vacía: se eliminan restos del diseño anterior y se sube al
-- nivel de la base de datos la regla que hacía inválido el XML.
--
-- Las migraciones anteriores tuvieron que ser permisivas para no
-- romper las fichas que ya existían (document_kind nullable con
-- backfill, address_number conservado). Ya no hay ninguna fila, así
-- que esas concesiones solo servirían para dejar pasar errores.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Fuera address_number
-- ---------------------------------------------------------------
-- El formulario pasó a tener un único campo de dirección de texto
-- libre (calle, número, piso, puerta), que es exactamente lo que
-- espera SES: su esquema tiene un "direccion" libre y nunca tuvo un
-- campo de número aparte. La columna ya no la escribe nadie.
ALTER TABLE public.checkin_guests
  DROP COLUMN IF EXISTS address_number;

-- ---------------------------------------------------------------
-- 2. document_kind pasa a obligatorio
-- ---------------------------------------------------------------
-- Nació nullable solo para poder rellenar a posteriori las fichas
-- anteriores a su existencia. Toda ficha nueva la trae siempre: es el
-- documento que eligió el huésped, y de él se deriva el código que va
-- a SES. Dejarla nullable solo escondería un fallo del formulario.
ALTER TABLE public.checkin_guests
  ALTER COLUMN document_kind SET NOT NULL;

ALTER TABLE public.checkin_guests
  DROP CONSTRAINT IF EXISTS checkin_guests_document_kind_check;

ALTER TABLE public.checkin_guests
  ADD CONSTRAINT checkin_guests_document_kind_check
  CHECK (document_kind IN (
    'DNI',                  -- → NIF
    'NIE',                  -- → NIE
    'PASAPORTE',            -- → PAS
    'TARJETA_IDENTIDAD',    -- → OTRO
    'PERMISO_RESIDENCIA',   -- → OTRO
    'MENOR_SIN_DOCUMENTO'   -- → sin documento: no se informa a SES
  ));

-- ---------------------------------------------------------------
-- 3. Residencia en España obliga a código de municipio
-- ---------------------------------------------------------------
-- Es la regla que hacía rechazable el fichero de alta masiva: "si el
-- país es España (ESP), el código de municipio ha de ir informado".
-- Estaba solo en la validación de la aplicación; aquí queda también en
-- la base de datos, para que ninguna vía de escritura futura (un
-- script, una corrección a mano) pueda dejar una ficha española sin
-- municipio y romper la comunicación al Ministerio.
ALTER TABLE public.checkin_guests
  DROP CONSTRAINT IF EXISTS checkin_guests_spain_needs_municipality_check;

ALTER TABLE public.checkin_guests
  ADD CONSTRAINT checkin_guests_spain_needs_municipality_check
  CHECK (
    upper(address_country) <> 'ESP'
    OR address_municipality_code IS NOT NULL
  );
