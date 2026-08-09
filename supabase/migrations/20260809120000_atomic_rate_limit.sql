-- =============================================================
-- 20260809120000_atomic_rate_limit.sql
-- Rate limiting atómico y fail-closed.
--
-- Por qué: la comprobación anterior hacía COUNT y luego INSERT en dos viajes
-- separados desde la aplicación (TOCTOU): dos peticiones concurrentes leían el
-- mismo recuento por debajo del límite y ambas pasaban, así que una ráfaga
-- superaba el tope. Además, ante un error de BD la app dejaba pasar (fail-open),
-- justo lo contrario de lo que debe hacer un control anti-abuso sobre endpoints
-- de coste (chat IA, traducción, OCR con Gemini/Places).
--
-- Esta función cuenta e inserta dentro de la MISMA transacción, serializando las
-- peticiones de una misma clave con un advisory lock. Devuelve el número de
-- peticiones que ya había en la ventana (sin contar la actual); la app decide
-- allowed = recuento < máximo, igual que antes pero ahora de forma atómica.
-- =============================================================

-- La tabla se creó originalmente fuera de migraciones. La declaramos aquí de
-- forma idempotente para que cualquier entorno (incluida la prueba con datos
-- reales) tenga el mismo esquema e índice.
CREATE TABLE IF NOT EXISTS public.rate_limit_requests (
  id        BIGSERIAL PRIMARY KEY,
  key       TEXT        NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_key_ts
  ON public.rate_limit_requests (key, "timestamp");

-- Solo el service-role (cron/servidor) escribe aquí; ningún cliente la lee.
ALTER TABLE public.rate_limit_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key           TEXT,
  p_window_start  TIMESTAMPTZ,
  p_max_requests  INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Serializa las peticiones concurrentes de la misma clave dentro de la
  -- transacción: elimina la carrera entre contar e insertar.
  PERFORM pg_advisory_xact_lock(hashtext(p_key));

  SELECT count(*) INTO v_count
    FROM public.rate_limit_requests
   WHERE key = p_key
     AND "timestamp" >= p_window_start;

  -- Solo registramos la petición si está por debajo del límite: así una petición
  -- ya bloqueada no infla el recuento de la ventana siguiente.
  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limit_requests (key, "timestamp")
    VALUES (p_key, now());
  END IF;

  RETURN v_count;
END;
$$;

-- La función solo se invoca con el cliente service-role. Se retira el permiso de
-- ejecución por defecto (PUBLIC) para que anon/authenticated no puedan llamarla.
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, TIMESTAMPTZ, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, TIMESTAMPTZ, INTEGER) FROM anon, authenticated;
