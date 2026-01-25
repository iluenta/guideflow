'use server'

import { createClient } from '@/lib/supabase/server'

export interface TenantSecurityPolicy {
  tenant_id: string
  session_inactive_timeout_minutes: number
  require_reauthentication_for_sensitive_actions: boolean
  max_concurrent_sessions: number
  refresh_token_expiry_days: number
  created_at: string
  updated_at: string
}

export async function getTenantSecurityPolicy(): Promise<TenantSecurityPolicy | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('get_tenant_security_policy')

  if (error) {
    // Error al obtener política de seguridad - no exponer detalles
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting tenant security policy')
    }
    return null
  }

  return data as TenantSecurityPolicy | null
}

export async function validateInactivityTimeout(): Promise<boolean> {
  const policy = await getTenantSecurityPolicy()
  
  if (!policy) {
    // Default to 24h if no policy found
    return true
  }

  // This would be checked against last activity timestamp
  // For now, we return true (validation passed)
  // Implementation would check against user's last activity
  return true
}

export async function requiresReauthentication(): Promise<boolean> {
  const policy = await getTenantSecurityPolicy()
  
  if (!policy) {
    // Default to requiring re-authentication
    return true
  }

  return policy.require_reauthentication_for_sensitive_actions
}

export async function getInactivityTimeoutMinutes(): Promise<number> {
  const policy = await getTenantSecurityPolicy()
  
  if (!policy) {
    // Default to 24h (1440 minutes)
    return 1440
  }

  return policy.session_inactive_timeout_minutes
}
