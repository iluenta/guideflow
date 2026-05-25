// ─── Blocked periods domain types ───────────────────────────────────────────

/**
 * Reason a host closes a property.
 * Stored as a CHECK constraint in Postgres.
 */
export type BlockReason = 'obras' | 'limpieza' | 'vacaciones' | 'mantenimiento' | 'otro';

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  obras:          '🏗️ Obras',
  limpieza:       '🧹 Limpieza',
  vacaciones:     '🏖️ Vacaciones',
  mantenimiento:  '🔧 Mantenimiento',
  otro:           '📌 Otro',
};

export const BLOCK_REASON_OPTIONS = Object.entries(BLOCK_REASON_LABELS) as [BlockReason, string][];

export interface BlockedPeriod {
  id: string;
  property_id: string;
  tenant_id: string;
  /** Inclusive start — "YYYY-MM-DD" */
  start_date: string;
  /** Inclusive end — "YYYY-MM-DD" */
  end_date: string;
  reason: BlockReason;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Result of getBlockedDatesForProperty.
 * Separates reservation dates from host-blocked dates so the calendar
 * can render them with distinct styles.
 */
export interface BlockedDateRange {
  /** Dates occupied by confirmed reservations — shown grey in calendar. */
  reserved: string[];
  /** Dates closed by the host (obras, limpieza…) — shown red in calendar. */
  blocked: string[];
  /** Union of reserved + blocked (convenient for validation). */
  unavailable: string[];
}

// ─── Server-action payload types ─────────────────────────────────────────────

export interface CreateBlockedPeriodPayload {
  start_date: string;
  end_date: string;
  reason: BlockReason;
  notes?: string;
}

export interface UpdateBlockedPeriodPayload extends Partial<CreateBlockedPeriodPayload> {}
