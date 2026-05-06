import { SupabaseClient } from '@supabase/supabase-js'

// Obtener tenantId del profile autenticado — lanzar error si no hay sesión
export async function requireTenantId(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  
  // 1. Intentar desde metadata (rápido, inyectado por trigger)
  const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
  if (tenantId) return tenantId

  // 2. Fallback a base de datos (por si el JWT aún no se actualiza)
  const { data } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
  if (data?.tenant_id) return data.tenant_id

  throw new Error('No tenant_id found for user')
}

export async function requireProfile(supabase: SupabaseClient): Promise<{ id: string; email: string; tenant_id: string; tenant_role: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  
  const userId = user.id
  const userEmail = user.email || ''

  // 1. Intentar desde metadata
  const tenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
  const tenantRole = user.app_metadata?.tenant_role || user.user_metadata?.tenant_role

  if (tenantId && tenantRole) {
    return { id: userId, email: userEmail, tenant_id: tenantId, tenant_role: tenantRole }
  }

  // 2. Fallback
  const { data } = await supabase.from('profiles').select('tenant_id, tenant_role').eq('id', userId).single()
  if (data?.tenant_id) {
    return { id: userId, email: userEmail, tenant_id: data.tenant_id, tenant_role: data.tenant_role || 'owner' }
  }

  throw new Error('No profile found for user')
}
