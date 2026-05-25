/**
 * Dynamic pricing calculator.
 *
 * Key rules:
 *  1. For each night (checkin ≤ night < checkout):
 *     a. Find the base period that contains the night (start_date ≤ night < end_date).
 *     b. Within that period, check for an exception that contains the night.
 *     c. Exception price wins over period price; if no period → use defaultPrice.
 *  2. Date comparisons are done via ISO string to avoid UTC-offset bugs.
 */

import type {
  PricePeriod,
  PriceBreakdownItem,
  DynamicBreakdownResult,
  ValidationResult,
} from '@/lib/types/pricing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the local date string "YYYY-MM-DD" from a Date (no UTC shift). */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns true if dateStr is in [startStr, endStr) */
function inRange(dateStr: string, startStr: string, endStr: string): boolean {
  return dateStr >= startStr && dateStr < endStr;
}

/** Adds n days to a Date, returning a new Date. */
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ─── Core: price for a single night ──────────────────────────────────────────

/**
 * Returns the nightly price for a given date.
 *
 * @param date         The night to price (local date).
 * @param periods      Active price periods for the property.
 * @param defaultPrice Fallback price when no period covers the date. Defaults to 100.
 */
export function getPriceForDate(
  date: Date,
  periods: PricePeriod[],
  defaultPrice = 100,
): { price: number; label: string } {
  const dateStr = toDateStr(date);

  // 1. Find the base period
  const period = periods.find(p => inRange(dateStr, p.start_date, p.end_date));

  if (!period) {
    return { price: defaultPrice, label: 'Tarifa base' };
  }

  // 2. Check for an exception that overrides the period price
  const exception = period.exceptions?.find(e =>
    inRange(dateStr, e.start_date, e.end_date),
  );

  if (exception) {
    return { price: exception.price_per_night, label: exception.name };
  }

  return { price: period.price_per_night, label: period.period_name };
}

// ─── Breakdown ────────────────────────────────────────────────────────────────

/**
 * Calculates a night-by-night dynamic price breakdown.
 *
 * @param checkin      First night (inclusive).
 * @param checkout     Checkout date (exclusive — not priced).
 * @param periods      Active price periods.
 * @param defaultPrice Fallback price. Defaults to 100.
 */
export function calculateDynamicBreakdown(
  checkin: Date,
  checkout: Date,
  periods: PricePeriod[],
  defaultPrice = 100,
): DynamicBreakdownResult {
  const breakdown: PriceBreakdownItem[] = [];
  let current = new Date(checkin);
  let baseTotal = 0;

  while (current < checkout) {
    const { price, label } = getPriceForDate(current, periods, defaultPrice);
    breakdown.push({ date: toDateStr(current), price, label });
    baseTotal = Math.round((baseTotal + price) * 100) / 100;
    current = addDays(current, 1);
  }

  return { breakdown, baseTotal, nights: breakdown.length };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a set of price periods:
 *  - No overlapping base periods.
 *  - No overlapping exceptions within a period.
 *  - Each exception is fully contained within its parent period.
 *  - All prices > 0.
 *  - All end_date > start_date.
 */
export function validatePeriods(periods: PricePeriod[]): ValidationResult {
  const errors: string[] = [];

  // ── Basic per-period checks ───────────────────────────────────────────────
  for (const period of periods) {
    if (period.end_date <= period.start_date) {
      errors.push(`El período "${period.period_name}" tiene fecha de fin anterior o igual a la de inicio`);
    }
    if (period.price_per_night <= 0) {
      errors.push(`El período "${period.period_name}" debe tener precio > 0`);
    }

    // Exception checks
    const sortedExcs = [...(period.exceptions ?? [])].sort((a, b) =>
      a.start_date.localeCompare(b.start_date),
    );
    for (const exc of sortedExcs) {
      if (exc.end_date <= exc.start_date) {
        errors.push(`La excepción "${exc.name}" en "${period.period_name}" tiene fechas inválidas`);
      }
      if (exc.price_per_night <= 0) {
        errors.push(`La excepción "${exc.name}" en "${period.period_name}" debe tener precio > 0`);
      }
      if (exc.start_date < period.start_date) {
        errors.push(
          `La excepción "${exc.name}" comienza antes del período "${period.period_name}"`,
        );
      }
      if (exc.end_date > period.end_date) {
        errors.push(
          `La excepción "${exc.name}" termina después del período "${period.period_name}"`,
        );
      }
    }

    // Overlapping exceptions within this period
    for (let i = 0; i < sortedExcs.length - 1; i++) {
      if (sortedExcs[i].end_date > sortedExcs[i + 1].start_date) {
        errors.push(
          `Las excepciones "${sortedExcs[i].name}" y "${sortedExcs[i + 1].name}" se solapan en "${period.period_name}"`,
        );
      }
    }
  }

  // ── Overlapping base periods ──────────────────────────────────────────────
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end_date > sorted[i + 1].start_date) {
      errors.push(
        `El período "${sorted[i].period_name}" se solapa con "${sorted[i + 1].period_name}"`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
