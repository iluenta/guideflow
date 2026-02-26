'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/app/actions/auth'
import { requiresReauthentication } from '@/lib/services/security-policies'

// Store for temporary re-authentication tokens (in production, use Redis or database)
// Format: { token: string, userId: string, expiresAt: Date, action: string }
const reauthTokens = new Map<string, { userId: string; expiresAt: Date; action: string }>()

// Generate a 6-digit code
function generateReauthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store for re-authentication codes (in production, use Redis or database)
// Format: { code: string, userId: string, expiresAt: Date }
const reauthCodes = new Map<string, { userId: string; expiresAt: Date }>()

// Cleanup expired codes and tokens every 5 minutes
setInterval(() => {
  const now = new Date()
  
  // Clean expired codes
  for (const [code, data] of reauthCodes.entries()) {
    if (data.expiresAt < now) {
      reauthCodes.delete(code)
    }
  }
  
  // Clean expired tokens
  for (const [token, data] of reauthTokens.entries()) {
    if (data.expiresAt < now) {
      reauthTokens.delete(token)
    }
  }
}, 5 * 60 * 1000)

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

  // Store code
  reauthCodes.set(code, { userId: user.id, expiresAt })

  // Send email via Supabase Auth (using magic link infrastructure)
  const supabase = await createClient()
  
  // Use Supabase's email sending capability
  // In production, you might want to use a dedicated email service
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
  code: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await getUser()
  
  if (!user || user.email !== email) {
    return { success: false, error: 'Unauthorized' }
  }

  // Find code
  const codeData = reauthCodes.get(code)
  
  if (!codeData) {
    return { success: false, error: 'Invalid code' }
  }

  if (codeData.userId !== user.id) {
    return { success: false, error: 'Code does not match user' }
  }

  if (codeData.expiresAt < new Date()) {
    reauthCodes.delete(code)
    return { success: false, error: 'Code expired' }
  }

  // Generate temporary token for sensitive action
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  // Store token
  reauthTokens.set(token, { userId: user.id, expiresAt, action: 'sensitive_action' })

  // Remove used code
  reauthCodes.delete(code)

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

  // Verify token
  const tokenData = reauthTokens.get(reauthToken)
  
  if (!tokenData) {
    return { success: false, error: 'Invalid re-authentication token' }
  }

  if (tokenData.userId !== user.id) {
    return { success: false, error: 'Token does not match user' }
  }

  if (tokenData.expiresAt < new Date()) {
    reauthTokens.delete(reauthToken)
    return { success: false, error: 'Re-authentication token expired' }
  }

  // Token is valid, action can proceed
  // The actual action logic should be implemented in the specific action handler
  // This function just validates the re-authentication

  // Remove used token (one-time use)
  reauthTokens.delete(reauthToken)

  return { success: true }
}
