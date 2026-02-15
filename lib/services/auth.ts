import { createClient } from '@/lib/supabase/client'

export async function signInWithMagicLink(email: string) {
  const supabase = createClient()
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function signUpWithMagicLink(email: string, fullName: string) {
  const supabase = createClient()
  // For magic link signup, we need to use signUp with a temporary password
  // The password will never be used since user only authenticates via magic link
  // Generate a secure random password using Web Crypto API
  const tempPassword = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return await supabase.auth.signUp({
    email,
    password: tempPassword, // Temporary password, never used - user only uses magic link
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName,
        role: 'user', // Default all users are end users
        package_level: 'basic', // Basic level by default
      },
    },
  })
}

export async function signOut() {
  const supabase = createClient()
  return await supabase.auth.signOut()
}
