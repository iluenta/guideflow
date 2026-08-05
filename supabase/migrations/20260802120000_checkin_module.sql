-- =============================================================
-- 20260802120000_checkin_module.sql
-- Check-in online del huésped + comunicación a SES Hospedajes
-- =============================================================

-- ---------------------------------------------------------------
-- 1. properties: código de establecimiento SES + interruptor de envío
-- ---------------------------------------------------------------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS ses_establishment_code TEXT,
  ADD COLUMN IF NOT EXISTS ses_communication_enabled BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------
-- 2. checkin_links — un enlace/token por reserva
-- ---------------------------------------------------------------
CREATE TABLE public.checkin_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,

  access_token    TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,

  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until     TIMESTAMPTZ NOT NULL,
  completed_at    TIMESTAMPTZ,

  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.checkin_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.checkin_links
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Índice único en el token (gap conocido en guest_access_tokens, corregido aquí)
CREATE UNIQUE INDEX checkin_links_access_token_key ON public.checkin_links(access_token);

-- Un único enlace activo por reserva: regenerar = desactivar el viejo + insertar uno nuevo
CREATE UNIQUE INDEX checkin_links_one_active_per_reservation
  ON public.checkin_links(reservation_id) WHERE is_active;

CREATE INDEX idx_checkin_links_tenant      ON public.checkin_links(tenant_id);
CREATE INDEX idx_checkin_links_property    ON public.checkin_links(property_id);
CREATE INDEX idx_checkin_links_reservation ON public.checkin_links(reservation_id);

-- ---------------------------------------------------------------
-- 3. checkin_guests — datos del huésped + firma (almacenamiento
--    TEMPORAL de tránsito; se purga tras confirmar el envío del PDF
--    de custodia al propietario, no se retiene 3 años en Supabase)
-- ---------------------------------------------------------------
CREATE TABLE public.checkin_guests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id               UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reservation_id            UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  checkin_link_id           UUID NOT NULL REFERENCES public.checkin_links(id) ON DELETE CASCADE,

  guest_order               SMALLINT NOT NULL CHECK (guest_order BETWEEN 1 AND 20),

  -- Catálogo real TIPO_DOCUMENTO de SES Hospedajes (confirmado vía operación "catalogo" en producción)
  document_type             TEXT NOT NULL CHECK (document_type IN ('NIF', 'NIE', 'PAS', 'CIF', 'CIF_E', 'OTRO')),
  document_number           TEXT NOT NULL,
  document_support_number   TEXT,

  first_name                TEXT NOT NULL,
  first_surname              TEXT NOT NULL,
  second_surname             TEXT,
  birth_date                DATE NOT NULL,
  nationality                TEXT NOT NULL,
  -- Catálogo real SEXO de SES Hospedajes: H (Hombre), M (Mujer), O (Otro)
  sex                        TEXT NOT NULL CHECK (sex IN ('H', 'M', 'O')),

  phone                      TEXT,
  email                      TEXT,
  address_street             TEXT,
  address_number             TEXT,
  address_postal_code        TEXT,
  address_city               TEXT,
  address_country            TEXT,

  -- Catálogo real TIPO_PARENTESCO de SES Hospedajes. Obligatorio en al menos un
  -- huésped mayor de edad cuando otro huésped de la reserva es menor (RD 933/2021).
  relationship_code          TEXT CHECK (relationship_code IN
    ('AB', 'BA', 'BN', 'CD', 'CY', 'HJ', 'HR', 'NI', 'OT', 'PM', 'SB', 'SG', 'TI', 'TU', 'YN')),

  -- Calculado server-side desde birth_date frente a la fecha de check-in (RD 933/2021 Art. 4.2)
  -- NUNCA debe confiarse en un valor enviado por el cliente para este campo
  signature_required         BOOLEAN NOT NULL,
  signature_url              TEXT,
  signed_at                  TIMESTAMPTZ,

  ocr_confidence              TEXT CHECK (ocr_confidence IN ('high', 'medium', 'low')),

  created_at                 TIMESTAMPTZ DEFAULT now(),
  updated_at                 TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT checkin_guests_link_order_key UNIQUE (checkin_link_id, guest_order)
);

ALTER TABLE public.checkin_guests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.checkin_guests
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_checkin_guests_tenant      ON public.checkin_guests(tenant_id);
CREATE INDEX idx_checkin_guests_reservation ON public.checkin_guests(reservation_id);
CREATE INDEX idx_checkin_guests_link        ON public.checkin_guests(checkin_link_id);

-- ---------------------------------------------------------------
-- 4. ses_communications — log de envíos a SES, SIN PII sensible.
--    No se purga: es el registro indefinido de cumplimiento del
--    plazo legal de 24h (RD 933/2021 Art. 6.3).
-- ---------------------------------------------------------------
CREATE TABLE public.ses_communications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id           UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reservation_id        UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  checkin_link_id       UUID REFERENCES public.checkin_links(id) ON DELETE SET NULL,

  communication_type    TEXT NOT NULL DEFAULT 'parte_entrada'
    CHECK (communication_type IN ('parte_entrada', 'comunicacion_reserva')),

  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'acknowledged')),
  attempt_count         INTEGER NOT NULL DEFAULT 0,
  last_attempt_at       TIMESTAMPTZ,

  ses_localizador       TEXT,
  http_status_code      INTEGER,
  -- Resumen corto y saneado (ej. "3 viajeros comunicados", "Error 400: código de
  -- establecimiento inválido"). NUNCA el payload crudo con nombres/nº de documento:
  -- es justo lo que permite conservar esta fila indefinidamente sin infringir
  -- la retención de datos personales.
  response_summary      TEXT,

  guests_count          INTEGER NOT NULL DEFAULT 0,
  checkin_date          DATE NOT NULL,

  -- Se rellena solo cuando Resend confirma el envío del PDF de custodia al
  -- propietario; es el disparador de la purga de checkin_guests.
  pdf_sent_at           TIMESTAMPTZ,

  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ses_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant read" ON public.ses_communications
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- INSERT/UPDATE solo vía service-role (cron); no hay policy de escritura para
-- 'authenticated' a propósito.

CREATE INDEX idx_ses_communications_tenant      ON public.ses_communications(tenant_id);
CREATE INDEX idx_ses_communications_reservation ON public.ses_communications(reservation_id);
CREATE INDEX idx_ses_communications_status      ON public.ses_communications(status);
CREATE INDEX idx_ses_communications_pdf_sent_at ON public.ses_communications(pdf_sent_at);

-- ---------------------------------------------------------------
-- 5. Storage bucket privado para firmas (vida corta — se purga junto
--    con checkin_guests una vez entregado el PDF de custodia)
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin_signatures', 'checkin_signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Misma convención que "Tenant Scan Management" (property_scans, migración 013):
-- el primer segmento de la ruta del objeto es el property_id.
CREATE POLICY "Tenant Signature Management" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'checkin_signatures' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.properties
      WHERE tenant_id = public.get_user_tenant_id()
    )
  )
  WITH CHECK (
    bucket_id = 'checkin_signatures' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.properties
      WHERE tenant_id = public.get_user_tenant_id()
    )
  );

-- No hay policy de INSERT para 'anon': la subida de la firma la hace siempre
-- el server action del check-in público con el cliente service-role
-- (createServerAdminClient), que bypasa RLS, porque el huésped nunca tiene
-- sesión de Supabase.
