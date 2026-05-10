'use server'

import { createClient } from '@/lib/supabase/server'
import { can, type TenantRole } from '@/lib/permissions'
import { requireProfile } from '@/lib/supabase/get-tenant-id'
import { revalidatePath } from 'next/cache'
import type {
  ChannelSetting,
  PaymentMethodSetting,
  ChargeTemplate,
  CreateChannelInput,
  UpdateChannelInput,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
  CreateChargeTemplateInput,
  UpdateChargeTemplateInput,
} from '@/types/reservations'

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function getChannels(): Promise<{
  channels: ChannelSetting[]
  error?: string
}> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { channels: [], error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  const { data, error } = await supabase
    .from('channel_settings')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order')

  if (error) return { channels: [], error: error.message }
  return { channels: (data ?? []) as ChannelSetting[] }
}

export async function createChannel(
  input: CreateChannelInput
): Promise<{ channel?: ChannelSetting; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para crear canales' }
  }

  const { data, error } = await supabase
    .from('channel_settings')
    .insert({ ...input, tenant_id: profile.tenant_id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/channels')
  return { channel: data as ChannelSetting }
}

export async function updateChannel(
  id: string,
  input: UpdateChannelInput
): Promise<{ channel?: ChannelSetting; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para editar canales' }
  }

  const { data, error } = await supabase
    .from('channel_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/channels')
  return { channel: data as ChannelSetting }
}

export async function toggleChannel(
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

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para modificar canales' }
  }

  const { error } = await supabase
    .from('channel_settings')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/channels')
  return {}
}

// ─── Payment Methods ───────────────────────────────────────────────────────────

export async function getPaymentMethods(): Promise<{
  methods: PaymentMethodSetting[]
  error?: string
}> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { methods: [], error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  const { data, error } = await supabase
    .from('payment_method_settings')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order')

  if (error) return { methods: [], error: error.message }
  return { methods: (data ?? []) as PaymentMethodSetting[] }
}

export async function createPaymentMethod(
  input: CreatePaymentMethodInput
): Promise<{ method?: PaymentMethodSetting; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para crear métodos de pago' }
  }

  const { data, error } = await supabase
    .from('payment_method_settings')
    .insert({ ...input, tenant_id: profile.tenant_id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/payment-methods')
  return { method: data as PaymentMethodSetting }
}

export async function updatePaymentMethod(
  id: string,
  input: UpdatePaymentMethodInput
): Promise<{ method?: PaymentMethodSetting; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para editar métodos de pago' }
  }

  const { data, error } = await supabase
    .from('payment_method_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/payment-methods')
  return { method: data as PaymentMethodSetting }
}

export async function togglePaymentMethod(
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

  if (!can(profile.tenant_role as TenantRole, 'settings', 'edit')) {
    return { error: 'No tienes permisos para modificar métodos de pago' }
  }

  const { error } = await supabase
    .from('payment_method_settings')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/payment-methods')
  return {}
}

// ─── Charge Templates ──────────────────────────────────────────────────────────

export async function getChargeTemplates(
  propertyId: string
): Promise<{ templates: ChargeTemplate[]; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { templates: [], error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  const { data, error } = await supabase
    .from('charge_templates')
    .select('*')
    .eq('property_id', propertyId)
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order')

  if (error) return { templates: [], error: error.message }
  return { templates: (data ?? []) as ChargeTemplate[] }
}

export async function createChargeTemplate(
  input: CreateChargeTemplateInput
): Promise<{ template?: ChargeTemplate; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'properties', 'edit')) {
    return { error: 'No tienes permisos para crear plantillas de cargos' }
  }

  const { data, error } = await supabase
    .from('charge_templates')
    .insert({ ...input, tenant_id: profile.tenant_id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { template: data as ChargeTemplate }
}

export async function updateChargeTemplate(
  id: string,
  input: UpdateChargeTemplateInput
): Promise<{ template?: ChargeTemplate; error?: string }> {
  const supabase = await createClient()

  let profile
  try {
    profile = await requireProfile(supabase)
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Authentication failed' }
  }

  if (!can(profile.tenant_role as TenantRole, 'properties', 'edit')) {
    return { error: 'No tienes permisos para editar plantillas de cargos' }
  }

  const { data, error } = await supabase
    .from('charge_templates')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single()

  if (error) return { error: error.message }
  return { template: data as ChargeTemplate }
}

export async function toggleChargeTemplate(
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

  if (!can(profile.tenant_role as TenantRole, 'properties', 'edit')) {
    return { error: 'No tienes permisos para modificar plantillas de cargos' }
  }

  const { error } = await supabase
    .from('charge_templates')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) return { error: error.message }
  return {}
}
