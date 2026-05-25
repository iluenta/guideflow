import type { PropertyLanding } from '@/lib/types/property';
import type { Guests, PriceBreakdown } from '@/lib/types/booking';

// ─── Date utilities ───────────────────────────────────────────────────────────

/** Returns "2025-01-15" — uses local date components to avoid UTC offset bugs. */
export function dateToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** @deprecated use dateToString */
export const toDateStr = dateToString;

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

export function sameDay(a: Date, b: Date): boolean {
  return dateToString(a) === dateToString(b);
}

/** Returns number of nights between two dates (always >= 0). */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.max(0, Math.floor((checkOut.getTime() - checkIn.getTime()) / 86_400_000));
}

/** @deprecated use calculateNights */
export const nightsBetween = calculateNights;

/** Returns true if date is in the blocked set. */
export function isDateBlocked(date: Date, blocked: Set<string>): boolean {
  return blocked.has(dateToString(date));
}

/** Returns true if any date strictly between start and end is in the blocked set. */
export function hasBlockedInRange(start: Date, end: Date, blocked: Set<string>): boolean {
  let cursor = addDays(start, 1);
  while (isBefore(cursor, end)) {
    if (blocked.has(dateToString(cursor))) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

/** Returns "12 jun" */
export function formatDate(d: Date, locale = 'es-ES'): string {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

/** Returns "lunes, 12 de enero de 2025" */
export function formatLongDate(d: Date, locale = 'es-ES'): string {
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Price utilities ──────────────────────────────────────────────────────────

/** Returns "125,50€" */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

/**
 * Calculates price breakdown from landing config, number of nights and guest counts.
 * All monetary values are rounded to 2 decimal places.
 *
 * @param basePriceOverride - When provided, replaces the static `price_per_night × nights`
 *   calculation with a pre-computed dynamic base (e.g. from calculateDynamicBreakdown).
 */
export function calculatePriceBreakdown(
  landing: Pick<PropertyLanding, 'price_per_night' | 'cleaning_fee' | 'service_fee_pct' | 'tourist_tax_per_night' | 'pet_fee_flat'>,
  nights: number,
  guests: Guests,
  basePriceOverride?: number,
): PriceBreakdown {
  const basePrice = basePriceOverride !== undefined
    ? Math.round(basePriceOverride * 100) / 100
    : Number(landing.price_per_night) * nights;
  const cleaningFee = Number(landing.cleaning_fee ?? 0);
  const serviceFee = Math.round(basePrice * (Number(landing.service_fee_pct ?? 8) / 100) * 100) / 100;
  const touristTax =
    Math.round(nights * (guests.adults + guests.children) * Number(landing.tourist_tax_per_night ?? 0) * 100) / 100;
  const petFee = Math.round(guests.pets * Number(landing.pet_fee_flat ?? 0) * 100) / 100;
  const total = Math.round((basePrice + cleaningFee + serviceFee + touristTax + petFee) * 100) / 100;

  return { nights, basePrice, cleaningFee, serviceFee, touristTax, petFee, total };
}

// ─── Guest label ──────────────────────────────────────────────────────────────

export function formatGuestLabel(guests: Guests): string {
  const total = guests.adults + guests.children;
  let s = `${total} huésped${total !== 1 ? 'es' : ''}`;
  if (guests.infants) s += `, ${guests.infants} bebé${guests.infants !== 1 ? 's' : ''}`;
  if (guests.pets) s += `, ${guests.pets} mascota${guests.pets !== 1 ? 's' : ''}`;
  return s;
}
