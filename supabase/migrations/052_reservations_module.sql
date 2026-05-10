-- =============================================================
-- 052_reservations_module.sql
-- Módulo completo de gestión de reservas para Hospyia
-- =============================================================

-- ---------------------------------------------------------------
-- 1. channel_settings
-- ---------------------------------------------------------------
CREATE TABLE public.channel_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT true,

  sale_commission_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  sale_commission_vat_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_treatment            TEXT NOT NULL DEFAULT 'none'
    CHECK (vat_treatment IN ('none', 'standard', 'reverse_charge')),
  collection_party         TEXT NOT NULL DEFAULT 'host'
    CHECK (collection_party IN ('platform', 'host')),

  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT channel_settings_tenant_code_key UNIQUE (tenant_id, code)
);

ALTER TABLE public.channel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.channel_settings
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_channel_settings_tenant ON public.channel_settings(tenant_id);

-- ---------------------------------------------------------------
-- 2. payment_method_settings
-- ---------------------------------------------------------------
CREATE TABLE public.payment_method_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT true,

  payment_commission_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  payment_commission_vat_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,

  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT payment_method_tenant_code_key UNIQUE (tenant_id, code)
);

ALTER TABLE public.payment_method_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.payment_method_settings
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_payment_method_settings_tenant
  ON public.payment_method_settings(tenant_id);

-- ---------------------------------------------------------------
-- 3. charge_templates
-- ---------------------------------------------------------------
CREATE TABLE public.charge_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  charge_type     TEXT NOT NULL
    CHECK (charge_type IN (
      'accommodation', 'cleaning', 'deposit', 'tourist_tax',
      'late_checkout', 'early_checkin', 'extra_guest', 'pet', 'other'
    )),
  default_amount  NUMERIC(10,2),
  is_refundable   BOOLEAN DEFAULT false,
  vat_pct         NUMERIC(5,2) DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT charge_templates_property_code_key UNIQUE (property_id, code)
);

ALTER TABLE public.charge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.charge_templates
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_charge_templates_property ON public.charge_templates(property_id);
CREATE INDEX idx_charge_templates_tenant ON public.charge_templates(tenant_id);

-- ---------------------------------------------------------------
-- 4. reservations
-- ---------------------------------------------------------------
CREATE TABLE public.reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES public.properties(id),
  channel_id      UUID REFERENCES public.channel_settings(id),

  -- Datos del huésped
  guest_name      TEXT NOT NULL,
  guest_email     TEXT,
  guest_phone     TEXT,
  guest_country   TEXT,
  guests_count    INTEGER NOT NULL DEFAULT 1,

  -- Fechas
  checkin_date    DATE NOT NULL,
  checkout_date   DATE NOT NULL,

  -- Importes brutos
  gross_amount    NUMERIC(10,2) NOT NULL CHECK (gross_amount > 0),
  currency        TEXT NOT NULL DEFAULT 'EUR',

  -- Totales de comisiones desnormalizados para consultas rápidas
  total_sale_commission      NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_sale_commission_vat  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pay_commission       NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_pay_commission_vat   NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Estado
  status          TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN (
      'pending', 'confirmed', 'checked_in',
      'checked_out', 'cancelled', 'no_show'
    )),

  -- Referencia externa (ID en Airbnb/Booking)
  external_id     TEXT,
  notes           TEXT,

  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_dates CHECK (checkout_date > checkin_date)
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.reservations
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_reservations_tenant   ON public.reservations(tenant_id);
CREATE INDEX idx_reservations_property ON public.reservations(property_id);
CREATE INDEX idx_reservations_channel  ON public.reservations(channel_id);
CREATE INDEX idx_reservations_dates    ON public.reservations(checkin_date, checkout_date);
CREATE INDEX idx_reservations_status   ON public.reservations(status);

-- ---------------------------------------------------------------
-- 5. reservation_charges
-- ---------------------------------------------------------------
CREATE TABLE public.reservation_charges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES public.charge_templates(id),

  name            TEXT NOT NULL,
  charge_type     TEXT NOT NULL
    CHECK (charge_type IN (
      'accommodation', 'cleaning', 'deposit', 'tourist_tax',
      'late_checkout', 'early_checkin', 'extra_guest', 'pet', 'other'
    )),
  amount          NUMERIC(10,2) NOT NULL,
  vat_pct         NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_refundable   BOOLEAN DEFAULT false,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reservation_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.reservation_charges
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_reservation_charges_reservation
  ON public.reservation_charges(reservation_id);

-- ---------------------------------------------------------------
-- 6. reservation_commissions
-- ---------------------------------------------------------------
CREATE TABLE public.reservation_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,

  commission_type TEXT NOT NULL
    CHECK (commission_type IN ('sale', 'payment')),

  -- Snapshot histórico del % aplicado en el momento de crear la reserva
  base_amount     NUMERIC(10,2) NOT NULL,
  pct_applied     NUMERIC(5,2) NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  vat_pct         NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_treatment   TEXT NOT NULL DEFAULT 'none'
    CHECK (vat_treatment IN ('none', 'standard', 'reverse_charge')),

  channel_id          UUID REFERENCES public.channel_settings(id),
  payment_method_id   UUID REFERENCES public.payment_method_settings(id),
  description         TEXT,

  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reservation_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.reservation_commissions
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_reservation_commissions_reservation
  ON public.reservation_commissions(reservation_id);

-- ---------------------------------------------------------------
-- 7. reservation_payments
-- ---------------------------------------------------------------
CREATE TABLE public.reservation_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_method_settings(id),

  amount          NUMERIC(10,2) NOT NULL CHECK (amount != 0),
  payment_date    DATE NOT NULL,
  payment_type    TEXT NOT NULL DEFAULT 'payment'
    CHECK (payment_type IN ('deposit', 'payment', 'refund')),

  reference       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reservation_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.reservation_payments
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_reservation_payments_reservation
  ON public.reservation_payments(reservation_id);

-- ---------------------------------------------------------------
-- 8. Datos iniciales para tenant del fundador
-- ---------------------------------------------------------------

-- Canales predefinidos
INSERT INTO public.channel_settings
  (tenant_id, name, code, sale_commission_pct, sale_commission_vat_pct,
   vat_treatment, collection_party, sort_order)
VALUES
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Airbnb',      'airbnb',  15.00, 21.00, 'standard', 'platform', 1),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Booking.com', 'booking', 18.00, 21.00, 'standard', 'host',     2),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Manual',      'manual',   0.00,  0.00, 'none',     'host',     3),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Directo',     'direct',   0.00,  0.00, 'none',     'host',     4);

-- Métodos de pago predefinidos
INSERT INTO public.payment_method_settings
  (tenant_id, name, code, payment_commission_pct, payment_commission_vat_pct,
   sort_order)
VALUES
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Transferencia bancaria', 'transfer',       0.00,  0.00, 1),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Efectivo',               'cash',           0.00,  0.00, 2),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Cobro Airbnb',           'airbnb_collect', 0.00,  0.00, 3),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Cobro Booking',          'booking_collect',1.30, 21.00, 4),
  ('eab1d4b5-da03-40f0-9468-4cabb92f37b9', 'Stripe',                 'stripe',         1.40, 21.00, 5);
