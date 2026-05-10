'use server'

import { createClient } from '@/lib/supabase/server'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { revalidatePath } from 'next/cache'
import type {
  Provider,
  ProviderType,
  CreateProviderInput,
  UpdateProviderInput,
} from '@/types/reservations'

const PROVIDER_SELECT = `
  *,
  provider_services (
    id, category, is_primary, created_at
  )
`

function rowToProvider(row: Record<string, unknown>): Provider {
  return {
    ...(row as unknown as Provider),
    provider_services: (row.provider_services as Provider['provider_services']) ?? [],
  }
}

export async function getProviders(
  includeInactive = false
): Promise<{ providers: Provider[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { providers: [], error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  let query = supabase
    .from('providers')
    .select(PROVIDER_SELECT)
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) return { providers: [], error: error.message }
  return { providers: (data ?? []).map(r => rowToProvider(r as Record<string, unknown>)) }
}

async function upsertServices(
  supabase: Awaited<ReturnType<typeof createClient>>,
  providerId: string,
  categories: ProviderType[],
  primaryCategory: ProviderType | null
) {
  // Eliminar servicios existentes
  await supabase
    .from('provider_services')
    .delete()
    .eq('provider_id', providerId)

  if (categories.length === 0) return

  // Insertar nuevos
  await supabase.from('provider_services').insert(
    categories.map(cat => ({
      provider_id: providerId,
      category: cat,
      is_primary: cat === primaryCategory,
    }))
  )
}

export async function createProvider(
  input: CreateProviderInput
): Promise<{ provider?: Provider; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'Sin permisos para crear proveedores' }
  }

  const { data, error } = await supabase
    .from('providers')
    .insert({
      tenant_id: profile.tenant_id,
      name: input.name.trim(),
      phone: input.phone?.trim() ?? null,
      email: input.email?.trim() ?? null,
      notes: input.notes?.trim() ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const providerId = (data as { id: string }).id
  await upsertServices(supabase, providerId, input.categories, input.primary_category)

  // Leer con servicios incluidos
  const { data: full, error: e2 } = await supabase
    .from('providers')
    .select(PROVIDER_SELECT)
    .eq('id', providerId)
    .single()

  if (e2) return { error: e2.message }
  revalidatePath('/dashboard/settings/providers')
  return { provider: rowToProvider(full as Record<string, unknown>) }
}

export async function updateProvider(
  id: string,
  input: UpdateProviderInput
): Promise<{ provider?: Provider; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'Sin permisos para editar proveedores' }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name !== undefined)  updates.name  = input.name.trim()
  if (input.phone !== undefined) updates.phone = input.phone?.trim() ?? null
  if (input.email !== undefined) updates.email = input.email?.trim() ?? null
  if (input.notes !== undefined) updates.notes = input.notes?.trim() ?? null
  if (input.is_active !== undefined) updates.is_active = input.is_active

  const { error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  if (input.categories !== undefined) {
    await upsertServices(supabase, id, input.categories, input.primary_category ?? null)
  }

  const { data: full, error: e2 } = await supabase
    .from('providers')
    .select(PROVIDER_SELECT)
    .eq('id', id)
    .single()

  if (e2) return { error: e2.message }
  revalidatePath('/dashboard/settings/providers')
  return { provider: rowToProvider(full as Record<string, unknown>) }
}

export async function toggleProvider(
  id: string,
  is_active: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'reservations', 'edit')) {
    return { error: 'Sin permisos' }
  }

  const { error } = await supabase
    .from('providers')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings/providers')
  return {}
}
