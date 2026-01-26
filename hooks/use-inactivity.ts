import { useEffect, useRef, useCallback } from 'react'
import { signOut } from '@/app/actions/auth'

interface UseInactivityOptions {
  timeoutMinutes?: number
  onLogout?: () => void
}

export function useInactivity({
  timeoutMinutes = 1440, // 24 horas por defecto
  onLogout
}: UseInactivityOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimerRef = useRef<(() => void) | null>(null)

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timer
    const timeoutMs = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(async () => {
      // Call custom logout handler if provided
      if (onLogout) {
        onLogout()
      } else {
        // Default: call signOut Server Action
        await signOut()
      }
    }, timeoutMs)
  }, [timeoutMinutes, onLogout])

  // Store resetTimer in ref so it can be accessed from outside
  resetTimerRef.current = resetTimer

  useEffect(() => {
    // Initialize timer
    resetTimer()

    // Event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetTimer()
    }

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer])

  return {
    resetTimer: resetTimerRef.current || resetTimer,
  }
}
