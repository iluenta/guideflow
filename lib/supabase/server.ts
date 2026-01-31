import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // En algunos contextos (errores de RSC, etc.) cookies() puede no exponer .get()
          // pero sí .getAll(). Hacemos el acceso defensivo para evitar TypeError.
          const anyStore = cookieStore as any

          if (typeof anyStore.get === 'function') {
            const cookie = anyStore.get(name)
            return typeof cookie === 'string' ? cookie : cookie?.value
          }

          if (typeof anyStore.getAll === 'function') {
            const all = anyStore.getAll() as Array<{ name: string; value: string }>
            const found = all.find((c) => c.name === name)
            return found?.value
          }

          return undefined
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            ; (cookieStore as any).set({
              name,
              value,
              ...options,
              // Flags de seguridad críticas
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: options.maxAge || 60 * 60 * 24 * 7, // 7 días
            })
          } catch (error) {
            // Puede fallar en algunos contextos de Server Components / RSC
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            ; (cookieStore as any).set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          } catch (error) {
            // Manejo de error
          }
        },
      },
    }
  )
}
