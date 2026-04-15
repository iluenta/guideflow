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
    
    async function loadProfile() {
      if (loading === false && profile) return
      
      try {
        const response = await fetch('/api/auth/profile', {
          credentials: 'include',
        })

        if (!isMounted) return

        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            setProfile(null)
            setError(null)
            return
          }
          
          const { error: errorMessage } = await response.json()
          setError(new Error(errorMessage || 'Failed to load profile'))
          return
        }

        const { profile: profileData, error: profileError } = await response.json()

        if (!isMounted) return

        if (profileError) {
          setError(new Error(profileError))
          return
        }

        setProfile(profileData)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        
        if (err instanceof Error) {
          if (err.name === 'AbortError' || err.message?.includes('aborted')) {
            return
          }
        }
        
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('abort') || errorMessage.includes('AbortError')) {
          return
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Unexpected error loading profile:', err)
        }
        setError(new Error('Error al cargar perfil'))
      } finally {
        if (isMounted) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { profile, loading, error }
}
