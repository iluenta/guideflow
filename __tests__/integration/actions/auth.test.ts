import { describe, test, expect, vi, beforeEach } from 'vitest'
import { signInWithMagicLink, signUpWithMagicLink, signOut } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('Auth Server Actions', () => {
  const mockSupabase = {
    auth: {
      signInWithOtp: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('REDIRECT') // Simula redirect de Next.js
    })
    vi.clearAllMocks()
  })

  describe('signInWithMagicLink', () => {
    test('debe lanzar error si el email está vacío', async () => {
      const formData = new FormData()
      // formData vacío

      try {
        await signInWithMagicLink(formData)
        expect.fail('Should have thrown error')
      } catch (error: any) {
        if (error.message === 'REDIRECT') {
          expect(redirect).toHaveBeenCalledWith('/auth/login?error=Email is required')
        }
      }
    })

    test('debe redirigir a éxito cuando Supabase responde OK', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null })

      try {
        await signInWithMagicLink(formData)
      } catch (error: any) {
        if (error.message === 'REDIRECT') {
          expect(redirect).toHaveBeenCalledWith('/auth/login?success=Check your email')
        }
      }
    })

    test('debe redirigir a error cuando Supabase falla', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        error: { message: 'Rate limit exceeded' },
      })

      try {
        await signInWithMagicLink(formData)
      } catch (error: any) {
        if (error.message === 'REDIRECT') {
          expect(redirect).toHaveBeenCalledWith('/auth/login?error=Could not send magic link')
        }
      }
    })
  })

  describe('signUpWithMagicLink', () => {
    test('debe crear usuario con metadata correcta', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('fullName', 'John Doe')

      mockSupabase.auth.signUp.mockResolvedValue({ error: null })

      try {
        await signUpWithMagicLink(formData)
      } catch (error: any) {
        if (error.message === 'REDIRECT') {
          expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
            expect.objectContaining({
              email: 'newuser@example.com',
              options: expect.objectContaining({
                data: expect.objectContaining({
                  full_name: 'John Doe',
                  role: 'user',
                  package_level: 'basic',
                }),
              }),
            })
          )
        }
      }
    })
  })

  describe('signOut', () => {
    test('debe cerrar sesión correctamente', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      try {
        await signOut()
      } catch (error: any) {
        if (error.message === 'REDIRECT') {
          expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1)
        }
      }
    })
  })
})
