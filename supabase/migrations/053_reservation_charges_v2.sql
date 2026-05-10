-- =============================================================
-- 053_reservation_charges_v2.sql
-- Modelo revisado de cargos: included_in_gross, beneficiary,
-- control de cobro para extras del anfitrión.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Añadir nuevos campos a reservation_charges
-- ---------------------------------------------------------------
ALTER TABLE public.reservation_charges
  ADD COLUMN included_in_gross       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN beneficiary             TEXT    NOT NULL DEFAULT 'owner'
    CHECK (beneficiary IN ('owner', 'provider')),
  ADD COLUMN provider_name           TEXT    NULL,
  ADD COLUMN charge_payment_status   TEXT    DEFAULT 'pending'
    CHECK (charge_payment_status IN ('pending', 'collected', 'waived')),
  ADD COLUMN charge_payment_method_id UUID   REFERENCES public.payment_method_settings(id),
  ADD COLUMN charge_payment_date     DATE    NULL,
  ADD COLUMN charge_payment_reference TEXT   NULL;

-- Los cargos existentes son desglose del bruto del canal
UPDATE public.reservation_charges
  SET included_in_gross = true,
      beneficiary = 'owner';

-- ---------------------------------------------------------------
-- 2. Añadir included_in_gross a charge_templates
-- ---------------------------------------------------------------
ALTER TABLE public.charge_templates
  ADD COLUMN included_in_gross BOOLEAN NOT NULL DEFAULT true;

-- Actualizar templates existentes según el tipo de cargo
UPDATE public.charge_templates
  SET included_in_gross = CASE
    WHEN charge_type IN ('late_checkout', 'early_checkin', 'extra_guest', 'pet', 'deposit')
    THEN false
    ELSE true  -- accommodation, cleaning, tourist_tax, other → incluidos por defecto
  END;
