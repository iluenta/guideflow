-- =============================================================
-- 20260808120000_ses_documents_storage.sql
-- El XML de alta masiva y el PDF del parte de entrada dejan de
-- viajar como adjuntos de correo y pasan a un bucket privado, con
-- descarga desde el panel mediante enlace firmado.
--
-- Por qué: el email era el eslabón más débil de toda la cadena.
-- Toda la protección montada en la base de datos (bucket privado,
-- RLS, purga a los dos días) se evaporaba al mandar identidades
-- completas y firmas a una bandeja de Gmail, donde se quedaban
-- indefinidamente y de donde ya no se pueden retirar.
--
-- El correo se mantiene, pero reducido a aviso: referencia de la
-- reserva y plazo, sin un solo dato de huésped.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Bucket privado para los documentos de comunicación a SES
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ses_documents', 'ses_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Misma convención que checkin_signatures: el primer segmento de la ruta
-- es el property_id, y el acceso se limita al tenant propietario.
DROP POLICY IF EXISTS "Tenant SES Documents" ON storage.objects;
CREATE POLICY "Tenant SES Documents" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'ses_documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.properties
      WHERE tenant_id = public.get_user_tenant_id()
    )
  )
  WITH CHECK (
    bucket_id = 'ses_documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.properties
      WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- Sin policy para 'anon': estos ficheros no los ve nunca un visitante.
-- Los escribe el cron con el cliente service-role y se sirven al propietario
-- con URL firmada de caducidad corta, nunca haciendo público el bucket.

-- ---------------------------------------------------------------
-- 2. Dónde está cada fichero y cuándo se subió a SES
-- ---------------------------------------------------------------
ALTER TABLE public.ses_communications
  ADD COLUMN IF NOT EXISTS xml_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_path TEXT,
  -- Momento en que el propietario confirma que subió el XML al portal.
  -- Es lo que dispara el borrado de los ficheros, en vez de un temporizador:
  -- así nada desaparece antes de que él haya actuado.
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.ses_communications.pdf_sent_at IS
  'Momento en que los ficheros quedaron disponibles para el propietario. '
  'Conserva el nombre por compatibilidad: antes marcaba el envío del email '
  'con adjuntos, ahora la generación en el bucket ses_documents.';
