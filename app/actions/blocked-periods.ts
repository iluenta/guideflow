'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { requireProfile } from '@/lib/supabase/get-tenant-id';
import type {
  BlockedPeriod,
  BlockedDateRange,
  CreateBlockedPeriodPayload,
  UpdateBlockedPeriodPayload,
} from '@/lib/types/blocked-periods';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Expand a date range [start, end) into an array of "YYYY-MM-DD" strings. */
function expandDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  let current = new Date(Date.UTC(sy, sm - 1, sd));
  const endDate = new Date(Date.UTC(ey, em - 1, ed));

  while (current < endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/** Expand a date range [start, end] inclusive (for host-blocked periods, end_date is inclusive). */
function expandDateRangeInclusive(start: string, end: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  let current = new Date(Date.UTC(sy, sm - 1, sd));
  const endDate = new Date(Date.UTC(ey, em - 1, ed));

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

async function assertOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  tenantId: string,
): Promise<void> {
  const { data } = await supabase
    .from('properties')
    .select('tenant_id')
    .eq('id', propertyId)
    .single();
  if (!data || data.tenant_id !== tenantId) {
    throw new Error('No tienes acceso a esta propiedad');
  }
}

// ─── Read (public) ────────────────────────────────────────────────────────────

/**
 * Returns ALL unavailable dates for a property, split into three categories.
 * Uses admin client to bypass RLS (public landing page — no user session).
 */
export async function getBlockedDatesForProperty(
  propertyId: string,
): Promise<BlockedDateRange> {
  const admin = createServerAdminClient();

  // 1. Reservation dates (all active statuses including pending pre-reservas)
  const { data: reservations } = await admin
    .from('reservations')
    .select('checkin_date, checkout_date')
    .eq('property_id', propertyId)
    .in('status', ['confirmed', 'checked_in', 'checked_out', 'pending']);

  const reservedSet = new Set<string>();
  reservations?.forEach(r => {
    // checkin inclusive, checkout exclusive (guest checks out that morning)
    expandDateRange(r.checkin_date, r.checkout_date).forEach(d => reservedSet.add(d));
  });

  // 2. Host-blocked periods (reason = obras, limpieza, etc.)
  const { data: blockedPeriods } = await admin
    .from('property_blocked_periods')
    .select('start_date, end_date')
    .eq('property_id', propertyId);

  const blockedSet = new Set<string>();
  blockedPeriods?.forEach(p => {
    // Both start_date and end_date are inclusive for host blocks
    expandDateRangeInclusive(p.start_date, p.end_date).forEach(d => blockedSet.add(d));
  });

  const reserved = Array.from(reservedSet);
  const blocked  = Array.from(blockedSet);
  const unavailable = Array.from(new Set([...reserved, ...blocked]));

  return { reserved, blocked, unavailable };
}

// ─── Read (authenticated) ─────────────────────────────────────────────────────

export async function getBlockedPeriodsForProperty(
  propertyId: string,
): Promise<BlockedPeriod[]> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);
  await assertOwnership(supabase, propertyId, profile.tenant_id);

  const { data, error } = await supabase
    .from('property_blocked_periods')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[blocked-periods] getBlockedPeriodsForProperty error:', error);
    throw new Error('Error al cargar los períodos cerrados');
  }

  return data ?? [];
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createBlockedPeriod(
  propertyId: string,
  payload: CreateBlockedPeriodPayload,
): Promise<BlockedPeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);
  await assertOwnership(supabase, propertyId, profile.tenant_id);

  if (payload.end_date <= payload.start_date) {
    throw new Error('La fecha de fin debe ser posterior a la de inicio');
  }

  const { data, error } = await supabase
    .from('property_blocked_periods')
    .insert({
      property_id: propertyId,
      tenant_id: profile.tenant_id,
      created_by: profile.id,
      ...payload,
    })
    .select()
    .single();

  if (error) {
    console.error('[blocked-periods] createBlockedPeriod error:', error);
    throw new Error('Error al crear el período cerrado');
  }

  revalidatePath(`/dashboard/properties/${propertyId}/landing`);
  return data;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateBlockedPeriod(
  periodId: string,
  payload: UpdateBlockedPeriodPayload,
): Promise<BlockedPeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  const { data: current } = await supabase
    .from('property_blocked_periods')
    .select('property_id, tenant_id, start_date, end_date')
    .eq('id', periodId)
    .single();

  if (!current) throw new Error('Período no encontrado');
  if (current.tenant_id !== profile.tenant_id) throw new Error('Sin acceso');

  // Validate merged dates if changing
  const newStart = payload.start_date ?? current.start_date;
  const newEnd   = payload.end_date   ?? current.end_date;
  if (newEnd <= newStart) throw new Error('La fecha de fin debe ser posterior a la de inicio');

  const { data, error } = await supabase
    .from('property_blocked_periods')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', periodId)
    .select()
    .single();

  if (error) {
    console.error('[blocked-periods] updateBlockedPeriod error:', error);
    throw new Error('Error al actualizar el período cerrado');
  }

  revalidatePath(`/dashboard/properties/${current.property_id}/landing`);
  return data;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBlockedPeriod(periodId: string): Promise<void> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  const { data: current } = await supabase
    .from('property_blocked_periods')
    .select('property_id, tenant_id')
    .eq('id', periodId)
    .single();

  if (!current) throw new Error('Período no encontrado');
  if (current.tenant_id !== profile.tenant_id) throw new Error('Sin acceso');

  const { error } = await supabase
    .from('property_blocked_periods')
    .delete()
    .eq('id', periodId);

  if (error) {
    console.error('[blocked-periods] deleteBlockedPeriod error:', error);
    throw new Error('Error al eliminar el período cerrado');
  }

  revalidatePath(`/dashboard/properties/${current.property_id}/landing`);
}

// ─── Dashboard: fetch for a date range ───────────────────────────────────────

/**
 * Fetch blocked periods that overlap with [monthFrom, monthTo] for the
 * authenticated user's tenant. Used by the dashboard calendar.
 */
export async function getBlockedPeriodsInRange(params: {
  month_from: string;   // "YYYY-MM-DD"
  month_to:   string;   // "YYYY-MM-DD"
  property_id?: string;
}): Promise<BlockedPeriod[]> {
  const supabase = await createClient();
  const profile  = await requireProfile(supabase);

  let query = supabase
    .from('property_blocked_periods')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    // Overlap: period starts before month ends AND period ends after month starts
    .lte('start_date', params.month_to)
    .gte('end_date',   params.month_from)
    .order('start_date', { ascending: true });

  if (params.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[blocked-periods] getBlockedPeriodsInRange error:', error);
    return [];
  }
  return data ?? [];
}
