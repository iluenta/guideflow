-- 076: Add 'pending' to reservations_status_check constraint
-- The original constraint may have been created without 'pending'.
-- Drop and recreate to include all valid statuses.

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN (
    'pending', 'confirmed', 'checked_in',
    'checked_out', 'cancelled', 'no_show'
  ));
