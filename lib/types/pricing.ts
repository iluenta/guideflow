// ─── Pricing domain types ────────────────────────────────────────────────────

/**
 * A date-range exception within a PricePeriod (e.g. festivos, puentes).
 * Overrides the base price of the parent period for its date range.
 * Dates are ISO strings: "YYYY-MM-DD".
 */
export interface PriceException {
  /** Client-generated UUID (crypto.randomUUID) */
  id: string;
  name: string;
  /** Inclusive start, format "YYYY-MM-DD" */
  start_date: string;
  /** Exclusive end, format "YYYY-MM-DD" */
  end_date: string;
  price_per_night: number;
}

/**
 * A named price period (season) for a property.
 * Stored in property_price_periods table; exceptions live in the JSONB column.
 */
export interface PricePeriod {
  id: string;
  property_id: string;
  tenant_id: string;
  period_name: string;
  /** Inclusive start, format "YYYY-MM-DD" */
  start_date: string;
  /** Exclusive end, format "YYYY-MM-DD" */
  end_date: string;
  price_per_night: number;
  exceptions: PriceException[];
  created_at: string;
  updated_at: string;
}

/** Per-night entry in a dynamic price breakdown. */
export interface PriceBreakdownItem {
  /** "YYYY-MM-DD" */
  date: string;
  price: number;
  /** Label shown in the UI ("Temporada Alta", "Festivo", "Tarifa base", etc.) */
  label: string;
}

/** Result of a day-by-day dynamic price breakdown (base price only, no fees). */
export interface DynamicBreakdownResult {
  breakdown: PriceBreakdownItem[];
  /** Sum of all nightly prices */
  baseTotal: number;
  nights: number;
}

// ─── Server-action payload types ─────────────────────────────────────────────

export interface CreatePricePeriodPayload {
  period_name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

export interface UpdatePricePeriodPayload extends Partial<CreatePricePeriodPayload> {}

export interface CreateExceptionPayload {
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
}

export interface UpdateExceptionPayload extends Partial<CreateExceptionPayload> {}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
