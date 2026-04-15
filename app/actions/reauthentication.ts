'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/app/actions/auth'
import { requiresReauthentication } from '@/lib/services/security-policies'
import { randomInt } from 'node:crypto'
import { RateLimiter } from '@/lib/security/rate-limiter'

// Cryptographically secure 6-digit code (node:crypto randomInt is CSPRNG)
function generateReauthCode(): string {
  return randomInt(100000, 1000000).toString()
}

export async function sendReauthCode(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()

  if (!user || user.email !== email) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check if re-authentication is required
  const requiresReauth = await requiresReauthentication()
  if (!requiresReauth) {
    return { success: false, error: 'Re-authentication not required for this tenant' }
  }

  const code = generateReauthCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Lazy cleanup of expired codes for this user before inserting
  const adminClient = createServerAdminClient()
  await adminClient
    .from('reauth_sessions')
    .delete()
    .eq('user_id', user.id)
    .lt('expires_at', new Date().toISOString())

  // Store code in database (serverless-safe: any instance can verify it)
  await adminClient.from('reauth_sessions').insert({
    user_id: user.id,
    code,
    expires_at: expiresAt.toISOString(),
  })

  // Send email via Supabase Auth (using magic link infrastructure)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: undefined,
      data: {
        code,
        type: 'reauth',
      },
    },
  })

  if (error) {
    // Error al enviar código de re-autenticación - no exponer detalles
    if (process.env.NODE_ENV === 'development') {
      console.error('Error sending re-auth code')
    }
    return { success: false, error: 'Could not send re-authentication code' }
  }

  return { success: true }
}

export async function verifyReauthCode(
  email: string,
  code: string,
  action: string = 'sensitive_action'
): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await getUser()

  if (!user || user.email !== email) {
    return { success: false, error: 'Unauthorized' }
  }

  // Rate limit: max 5 attempts per user per 15 minutes
  const limit = await RateLimiter.checkLimit(`reauth:verify:${user.id}`, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Demasiados intentos de verificación. Espera unos minutos.'
  })
  if (!limit.allowed) {
    return { success: false, error: 'Too many attempts. Please wait.' }
  }

  const adminClient = createServerAdminClient()

  // user_id in the filter prevents collision ambiguity when .single() is used
  const { data: codeData } = await adminClient
    .from('reauth_sessions')
    .select('id, expires_at')
    .eq('code', code)
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!codeData) {
    return { success: false, error: 'Invalid code' }
  }

  // Generate temporary token for sensitive action
  const token = crypto.randomUUID()
  const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Remove used code and store the new token
  await adminClient.from('reauth_sessions').delete().eq('id', codeData.id)
  await adminClient.from('reauth_sessions').insert({
    user_id: user.id,
    token,
    action,
    expires_at: tokenExpiresAt.toISOString(),
  })

  return { success: true, token }
}

export async function performSensitiveAction(
  action: string,
  reauthToken: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServerAdminClient()

  // Verify token in the database; include action in select for scope validation
  const { data: tokenData } = await adminClient
    .from('reauth_sessions')
    .select('id, user_id, action, expires_at')
    .eq('token', reauthToken)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!tokenData) {
    return { success: false, error: 'Invalid re-authentication token' }
  }

  if (tokenData.user_id !== user.id) {
    return { success: false, error: 'Token does not match user' }
  }

  if (tokenData.action !== action) {
    return { success: false, error: 'Token not valid for this action' }
  }

  // Token is valid — remove it (one-time use) before the action proceeds
  await adminClient.from('reauth_sessions').delete().eq('id', tokenData.id)

  return { success: true }
}
