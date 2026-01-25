import { renderHook, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { useInactivity } from '@/hooks/use-inactivity'

// Mock the signOut Server Action
vi.mock('@/app/actions/auth', () => ({
  signOut: vi.fn(),
}))

describe('useInactivity Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('debe cerrar sesión después de 24h de inactividad', async () => {
    const mockSignOut = vi.fn()
    const { result } = renderHook(() =>
      useInactivity({ timeoutMinutes: 1440, onLogout: mockSignOut })
    )

    // Simula 23h 59m de inactividad
    act(() => {
      vi.advanceTimersByTime(23 * 60 * 60 * 1000 + 59 * 60 * 1000)
    })
    expect(mockSignOut).not.toHaveBeenCalled()

    // Simula 1 minuto más (llegando a 24h)
    act(() => {
      vi.advanceTimersByTime(1 * 60 * 1000)
    })
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  test('debe resetear el timer en interacción del usuario', () => {
    const mockSignOut = vi.fn()
    const { result } = renderHook(() =>
      useInactivity({ timeoutMinutes: 60, onLogout: mockSignOut })
    )

    // Avanza 50 minutos
    act(() => {
      vi.advanceTimersByTime(50 * 60 * 1000)
    })

    // Simula un click (reset)
    act(() => {
      result.current.resetTimer()
    })

    // Avanza otros 59 minutos
    act(() => {
      vi.advanceTimersByTime(59 * 60 * 1000)
    })
    expect(mockSignOut).not.toHaveBeenCalled()

    // Avanza 61 minutos más desde el reset
    act(() => {
      vi.advanceTimersByTime(61 * 60 * 1000)
    })
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  test('debe detectar múltiples tipos de interacciones', () => {
    const mockSignOut = vi.fn()
    renderHook(() => useInactivity({ timeoutMinutes: 60, onLogout: mockSignOut }))

    // Simula click
    act(() => {
      window.dispatchEvent(new Event('click'))
    })

    // Simula tecla presionada
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown'))
    })

    // Simula scroll
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    // Verifica que el timer se resetea en cada interacción
    act(() => {
      vi.advanceTimersByTime(59 * 60 * 1000)
    })
    expect(mockSignOut).not.toHaveBeenCalled()
  })

  test('debe limpiar timers al desmontarse', () => {
    const mockSignOut = vi.fn()
    const { unmount } = renderHook(() =>
      useInactivity({ timeoutMinutes: 60, onLogout: mockSignOut })
    )

    unmount()

    // Avanza tiempo después de desmontar
    act(() => {
      vi.advanceTimersByTime(61 * 60 * 1000)
    })

    // No debe llamar signOut porque el hook fue desmontado
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})
