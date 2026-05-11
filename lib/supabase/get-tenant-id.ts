import { SupabaseClient } from '@supabase/supabase-js'

// Obtener tenantId del profile autenticado — lanzar error si no hay sesión
export async function requireTenantId(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  
  // ALWAYS verify against DB for maximum security (prevents JWT metadata manipulation)
  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
    
  if (error || !data?.tenant_id) {
    throw new Error('No tenant_id found for user in database')
  }

  return data.tenant_id
}

export async function requireProfile(supabase: SupabaseClient): Promise<{ id: string; email: string; tenant_id: string; tenant_role: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  
  const userId = user.id
  const userEmail = user.email || ''

  // ALWAYS verify against DB for maximum security
  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id, tenant_role')
    .eq('id', userId)
    .single()

  if (error || !data?.tenant_id) {
    throw new Error('No profile found for user in database')
  }

  return { 
    id: userId, 
    email: userEmail, 
    tenant_id: data.tenant_id, 
    tenant_role: data.tenant_role || 'owner' 
  }
}
