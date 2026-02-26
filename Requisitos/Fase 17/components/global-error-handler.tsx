'use client'

import { useEffect } from 'react'

// Global error handler for unhandled promise rejections (like AbortError)
// This component should be included in a Client Component
export function GlobalErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ignore AbortError - these are expected when requests are cancelled
      const error = event.reason
      if (
        error?.name === 'AbortError' ||
        error?.message?.includes('abort') ||
        error?.message?.includes('AbortError') ||
        String(error).includes('abort') ||
        String(error).includes('signal is aborted')
      ) {
        event.preventDefault() // Prevent the error from being logged
        return
      }
      
      // Log other unhandled rejections for debugging
      console.error('Unhandled promise rejection:', error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
