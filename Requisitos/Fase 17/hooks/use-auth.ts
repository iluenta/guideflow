import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Get current user from server API route
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include', // Important: include cookies
        })
        
        if (!isMounted) return

        if (response.ok) {
          const { user } = await response.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (err) {
        if (!isMounted) return
        
        // Ignore abort errors
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('abort'))) {
          return
        }
        // Error al obtener usuario - no exponer detalles
        if (process.env.NODE_ENV === 'development') {
          console.error('Error getting user')
        }
        setUser(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    // Poll for session changes every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        fetchUser()
      }
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return { user, loading }
}
