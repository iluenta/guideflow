-- =============================================================
-- 20260803090000_checkin_ses_manual_upload.sql
-- Pivote: en vez de automatizar el envío a SES Hospedajes vía SOAP,
-- la app genera un XML de "alta masiva" que el propietario sube
-- manualmente al portal. Ajusta los valores válidos de status en
-- ses_communications acorde a ese flujo (la tabla está vacía, sin
-- filas reales todavía — cambio seguro).
-- =============================================================

ALTER TABLE public.ses_communications
  DROP CONSTRAINT IF EXISTS ses_communications_status_check;

ALTER TABLE public.ses_communications
  ADD CONSTRAINT ses_communications_status_check
  CHECK (status IN ('pending', 'generated', 'uploaded_manually', 'failed'));

ALTER TABLE public.ses_communications
  ALTER COLUMN status SET DEFAULT 'pending';
