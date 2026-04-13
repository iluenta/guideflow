'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Global error handler for unhandled promise rejections (like AbortError)
// This component should be included in a Client Component
export function GlobalErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason

      // Ignore AbortError - these are expected when requests are cancelled
      if (
        error?.name === 'AbortError' ||
        error?.message?.includes('abort') ||
        error?.message?.includes('AbortError') ||
        String(error).includes('abort') ||
        String(error).includes('signal is aborted')
      ) {
        event.preventDefault()
        return
      }

      // SyntaxError al parsear JSON normalmente significa sesión expirada:
      // el servidor devolvió HTML (login page) en lugar de JSON.
      // Redirigir a login para que el usuario se autentique de nuevo.
      if (
        error?.name === 'SyntaxError' ||
        error?.message?.includes('Unexpected token') ||
        error?.message?.includes('Invalid or unexpected token') ||
        error?.message?.includes('is not valid JSON')
      ) {
        event.preventDefault()
        router.push('/auth/login')
        return
      }

      // ChunkLoadError: el bundle no se pudo cargar (deploy nuevo, caché obsoleta).
      // Recargar la página fuerza al navegador a descargar los nuevos chunks.
      if (
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('ChunkLoadError')
      ) {
        event.preventDefault()
        window.location.reload()
        return
      }

      console.error('Unhandled promise rejection:', error)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [router])

  return null
}
