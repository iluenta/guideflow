'use server'

import { createClient } from '@/lib/supabase/server'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { revalidatePath } from 'next/cache'

export interface CheckinPropertySettings {
  id: string
  name: string
  ses_establishment_code: string | null
  ses_communication_enabled: boolean
}

export async function getCheckinSettings(): Promise<{ data?: CheckinPropertySettings[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para ver esta configuración' }
  }

  const { data, error } = await supabase
    .from('properties')
    .select('id, name, ses_establishment_code, ses_communication_enabled')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  if (error) return { error: 'No se pudo cargar la configuración' }

  return { data: data as CheckinPropertySettings[] }
}

export async function updatePropertySesSettings(
  propertyId: string,
  input: { ses_establishment_code: string; ses_communication_enabled: boolean }
): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para editar esta configuración' }
  }

  const { error } = await supabase
    .from('properties')
    .update({
      ses_establishment_code: input.ses_establishment_code || null,
      ses_communication_enabled: input.ses_communication_enabled,
    })
    .eq('id', propertyId)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: 'No se pudo guardar la configuración' }

  revalidatePath('/dashboard/settings/checkin')
  return { success: true }
}

export interface SesCommunicationLogEntry {
  id: string
  status: string
  guests_count: number
  checkin_date: string
  created_at: string
  response_summary: string | null
  property: { name: string } | null
}

export async function getSesCommunicationsLog(): Promise<{ data?: SesCommunicationLogEntry[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'view')) {
    return { error: 'No tienes permisos para ver esta información' }
  }

  const { data, error } = await supabase
    .from('ses_communications')
    .select('id, status, guests_count, checkin_date, created_at, response_summary, property:properties(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { error: 'No se pudo cargar el historial' }

  return { data: data as unknown as SesCommunicationLogEntry[] }
}

export async function markCommunicationUploaded(id: string): Promise<{ success?: true; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'checkin', 'manage_settings')) {
    return { error: 'No tienes permisos para esta acción' }
  }

  const { error } = await supabase
    .from('ses_communications')
    .update({ status: 'uploaded_manually', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: 'No se pudo actualizar el estado' }

  revalidatePath('/dashboard/settings/checkin')
  return { success: true }
}
