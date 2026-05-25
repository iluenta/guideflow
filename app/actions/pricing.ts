'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/supabase/get-tenant-id';
import { validatePeriods } from '@/lib/pricing/calculator';
import type {
  PricePeriod,
  PriceException,
  CreatePricePeriodPayload,
  UpdatePricePeriodPayload,
  CreateExceptionPayload,
  UpdateExceptionPayload,
} from '@/lib/types/pricing';
import { revalidatePath } from 'next/cache';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Verify the property belongs to the authenticated user's tenant. */
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

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all price periods for a property (authenticated).
 * Ordered by start_date ascending.
 */
export async function getPricingForProperty(
  propertyId: string,
): Promise<PricePeriod[]> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);
  await assertOwnership(supabase, propertyId, profile.tenant_id);

  const { data, error } = await supabase
    .from('property_price_periods')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[pricing] getPricingForProperty error:', error);
    throw new Error('Error al obtener los períodos de precio');
  }

  return (data ?? []).map(row => ({
    ...row,
    exceptions: (row.exceptions as PriceException[]) ?? [],
  }));
}

/**
 * Fetch price periods for a property (public — no auth required).
 * Used by the public landing page to compute dynamic pricing.
 */
export async function getPublicPricingForProperty(
  propertyId: string,
): Promise<PricePeriod[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('property_price_periods')
    .select('*')
    .eq('property_id', propertyId)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[pricing] getPublicPricingForProperty error:', error);
    return [];
  }

  return (data ?? []).map(row => ({
    ...row,
    exceptions: (row.exceptions as PriceException[]) ?? [],
  }));
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPricePeriod(
  propertyId: string,
  payload: CreatePricePeriodPayload,
): Promise<PricePeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);
  await assertOwnership(supabase, propertyId, profile.tenant_id);

  // Validate the new period doesn't overlap existing ones
  const existing = await getPricingForProperty(propertyId);
  const candidate: PricePeriod = {
    id: 'new',
    property_id: propertyId,
    tenant_id: profile.tenant_id,
    period_name: payload.period_name,
    start_date: payload.start_date,
    end_date: payload.end_date,
    price_per_night: payload.price_per_night,
    exceptions: [],
    created_at: '',
    updated_at: '',
  };

  const validation = validatePeriods([...existing, candidate]);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  const { data, error } = await supabase
    .from('property_price_periods')
    .insert({
      property_id: propertyId,
      tenant_id: profile.tenant_id,
      ...payload,
      exceptions: [],
    })
    .select()
    .single();

  if (error) {
    console.error('[pricing] createPricePeriod error:', error);
    throw new Error('Error al crear el período de precio');
  }

  revalidatePath(`/dashboard/properties/${propertyId}/landing`);
  return { ...data, exceptions: [] };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePricePeriod(
  periodId: string,
  payload: UpdatePricePeriodPayload,
): Promise<PricePeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  // Fetch current period to know its propertyId
  const { data: current } = await supabase
    .from('property_price_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (!current) throw new Error('Período no encontrado');
  await assertOwnership(supabase, current.property_id, profile.tenant_id);

  // Re-validate all periods with the proposed update applied
  const allPeriods = await getPricingForProperty(current.property_id);
  const merged = allPeriods.map(p =>
    p.id === periodId ? { ...p, ...payload } : p,
  );
  const validation = validatePeriods(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  const { data, error } = await supabase
    .from('property_price_periods')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', periodId)
    .select()
    .single();

  if (error) {
    console.error('[pricing] updatePricePeriod error:', error);
    throw new Error('Error al actualizar el período de precio');
  }

  revalidatePath(`/dashboard/properties/${current.property_id}/landing`);
  return { ...data, exceptions: (data.exceptions as PriceException[]) ?? [] };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePricePeriod(periodId: string): Promise<void> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  const { data: current } = await supabase
    .from('property_price_periods')
    .select('property_id, tenant_id')
    .eq('id', periodId)
    .single();

  if (!current) throw new Error('Período no encontrado');
  if (current.tenant_id !== profile.tenant_id) {
    throw new Error('No tienes acceso a este período');
  }

  const { error } = await supabase
    .from('property_price_periods')
    .delete()
    .eq('id', periodId);

  if (error) {
    console.error('[pricing] deletePricePeriod error:', error);
    throw new Error('Error al eliminar el período');
  }

  revalidatePath(`/dashboard/properties/${current.property_id}/landing`);
}

// ─── Exception CRUD ───────────────────────────────────────────────────────────

/** Helper: load, mutate, validate and save the exceptions JSONB array. */
async function mutateExceptions(
  periodId: string,
  tenantId: string,
  mutate: (excs: PriceException[]) => PriceException[],
): Promise<PricePeriod> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('property_price_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (!row) throw new Error('Período no encontrado');
  if (row.tenant_id !== tenantId) throw new Error('Sin acceso');

  const currentExcs: PriceException[] = (row.exceptions as PriceException[]) ?? [];
  const nextExcs = mutate(currentExcs);

  // Build a full PricePeriod for validation
  const period: PricePeriod = {
    ...row,
    exceptions: nextExcs,
  };

  // Get siblings to validate against
  const { data: allRows } = await supabase
    .from('property_price_periods')
    .select('*')
    .eq('property_id', row.property_id);

  const allPeriods: PricePeriod[] = (allRows ?? []).map(r => ({
    ...r,
    exceptions: r.id === periodId ? nextExcs : ((r.exceptions as PriceException[]) ?? []),
  }));

  const validation = validatePeriods(allPeriods);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));

  const { data: updated, error } = await supabase
    .from('property_price_periods')
    .update({ exceptions: nextExcs, updated_at: new Date().toISOString() })
    .eq('id', periodId)
    .select()
    .single();

  if (error) {
    console.error('[pricing] mutateExceptions error:', error);
    throw new Error('Error al actualizar excepciones');
  }

  revalidatePath(`/dashboard/properties/${row.property_id}/landing`);
  return { ...updated, exceptions: (updated.exceptions as PriceException[]) ?? [] };
}

export async function addException(
  periodId: string,
  payload: CreateExceptionPayload,
): Promise<PricePeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  const newExc: PriceException = {
    id: crypto.randomUUID(),
    ...payload,
  };

  return mutateExceptions(periodId, profile.tenant_id, excs => [...excs, newExc]);
}

export async function updateException(
  periodId: string,
  exceptionId: string,
  payload: UpdateExceptionPayload,
): Promise<PricePeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  return mutateExceptions(periodId, profile.tenant_id, excs =>
    excs.map(e => (e.id === exceptionId ? { ...e, ...payload } : e)),
  );
}

export async function deleteException(
  periodId: string,
  exceptionId: string,
): Promise<PricePeriod> {
  const supabase = await createClient();
  const profile = await requireProfile(supabase);

  return mutateExceptions(periodId, profile.tenant_id, excs =>
    excs.filter(e => e.id !== exceptionId),
  );
}
