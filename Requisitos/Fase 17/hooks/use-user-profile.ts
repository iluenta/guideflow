import { useEffect, useState } from 'react'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  tenant_id: string
  role: 'admin' | 'user'
  package_level: 'basic' | 'standard' | 'premium' | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    
    // FETCH GUARD: Prevent multiple redundant calls on rapid remounts
    const lastFetch = window.sessionStorage.getItem('last_profile_fetch')
    const now = Date.now()
    if (lastFetch && now - parseInt(lastFetch) < 2000) {
      console.log('[DEBUG-USER] Skipping fetch, too soon (throttle)')
      return
    }

    async function loadProfile() {
      if (loading === false && profile) return // Don't reload if already have profile
      window.sessionStorage.setItem('last_profile_fetch', Date.now().toString())
      try {
        // Get profile from server API route (uses cookies HTTP-only)
        const response = await fetch('/api/auth/profile', {
          credentials: 'include', // Important: include cookies
        })

        if (!isMounted) return

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            // User not authenticated or profile not found
            if (isMounted) {
              setProfile(null)
              setError(null)
              setLoading(false)
            }
            return
          }
          
          const { error: errorMessage } = await response.json()
          if (isMounted) {
            setError(new Error(errorMessage || 'Failed to load profile'))
            setLoading(false)
          }
          return
        }

        const { profile: profileData, error: profileError } = await response.json()

        if (!isMounted) return

        if (profileError) {
          if (isMounted) {
            setError(new Error(profileError))
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setProfile(profileData)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (!isMounted) return
        
        // Ignore AbortError - it's expected when component unmounts or request is cancelled
        if (err instanceof Error) {
          if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            return
          }
        }
        
        // Check if it's an AbortError by checking the error message/name
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('abort') || errorMessage.includes('AbortError')) {
          return
        }
        
        // Error inesperado - no exponer detalles sensibles
        if (process.env.NODE_ENV === 'development') {
          console.error('Unexpected error loading profile')
        }
        if (isMounted) {
          setError(new Error('Error al cargar perfil'))
          setLoading(false)
        }
      }
    }

    loadProfile()

    // Temporarily disabled polling to identify loop source
    /*
    const interval = setInterval(() => {
      if (isMounted) {
        loadProfile()
      }
    }, 30000)
    */

    return () => {
      isMounted = false
      // clearInterval(interval)
    }
  }, [])

  return { profile, loading, error }
}
