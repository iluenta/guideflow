/**
 * Tests unitarios del RateLimiter (M-3).
 *
 * Verifican el contrato con la función atómica de Postgres
 * `check_and_increment_rate_limit`, que devuelve el nº de peticiones que YA había
 * en la ventana (sin contar la actual). El código decide allowed = previo < max.
 *
 * A diferencia de los tests a nivel de ruta, estos controlan el mock de la RPC de
 * forma determinista, así que comprueban comportamiento real, no solo que "no pete".
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/edge', () => ({
  createEdgeAdminClient: vi.fn(),
}))

/** Crea un cliente falso cuyo rpc devuelve el recuento previo según la clave. */
function mockAdminWithCounts(countsByKey: Record<string, number> | number) {
  const rpc = vi.fn(async (_fn: string, params: any) => {
    const prior = typeof countsByKey === 'number'
      ? countsByKey
      : (countsByKey[params.p_key] ?? 0)
    return { data: prior, error: null }
  })
  return { client: { rpc }, rpc }
}

async function setAdmin(client: any) {
  const { createEdgeAdminClient } = await import('@/lib/supabase/edge')
  vi.mocked(createEdgeAdminClient).mockReturnValue(client as any)
}

describe('RateLimiter.checkLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  const config = { windowMs: 60_000, maxRequests: 5, message: 'Demasiadas' }

  it('permite cuando el recuento previo es menor que el tope', async () => {
    const { client } = mockAdminWithCounts(2)
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkLimit('k', config)
    expect(res.allowed).toBe(true)
    // 5 max, 2 previos, +1 la actual → quedan 2
    expect(res.remaining).toBe(2)
    expect(res.message).toBeUndefined()
  })

  it('bloquea cuando el recuento previo alcanza el tope', async () => {
    const { client } = mockAdminWithCounts(5)
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkLimit('k', config)
    expect(res.allowed).toBe(false)
    expect(res.remaining).toBe(0)
    expect(res.message).toBe('Demasiadas')
  })

  it('bloquea también justo por encima del tope', async () => {
    const { client } = mockAdminWithCounts(9)
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')
    expect((await RateLimiter.checkLimit('k', config)).allowed).toBe(false)
  })

  it('FAIL-CLOSED: deniega si la RPC devuelve error (antes dejaba pasar)', async () => {
    const client = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }) }
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkLimit('k', config)
    expect(res.allowed).toBe(false)
    expect(res.remaining).toBe(0)
  })

  it('invoca la función atómica con clave, ventana y tope correctos', async () => {
    const { client, rpc } = mockAdminWithCounts(0)
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    await RateLimiter.checkLimit('mi-clave', config)
    expect(rpc).toHaveBeenCalledTimes(1)
    const [fnName, params] = rpc.mock.calls[0]
    expect(fnName).toBe('check_and_increment_rate_limit')
    expect(params.p_key).toBe('mi-clave')
    expect(params.p_max_requests).toBe(5)
    // La ventana es un ISO string ~60s en el pasado
    const windowMs = Date.now() - new Date(params.p_window_start).getTime()
    expect(windowMs).toBeGreaterThanOrEqual(59_000)
    expect(windowMs).toBeLessThanOrEqual(61_000)
  })
})

describe('RateLimiter.checkChatRateLimit (multi-nivel)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('permite cuando todos los niveles están por debajo del tope', async () => {
    const { client, rpc } = mockAdminWithCounts(0)
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkChatRateLimit('tok', '1.2.3.4', 'fp', 'prop-1', 'standard')
    expect(res.allowed).toBe(true)
    // 5 niveles: ip, token:min, token:daily, device, prop:daily
    expect(rpc).toHaveBeenCalledTimes(5)
    const keys = rpc.mock.calls.map((c: any) => c[1].p_key)
    expect(keys).toEqual([
      'ip:1.2.3.4',
      'token:min:tok',
      'token:daily:tok',
      'device:fp',
      'prop:daily:prop-1',
    ])
  })

  it('bloquea en el primer nivel excedido (IP) y no evalúa los siguientes', async () => {
    // La IP ya supera su tope (60/min) → corta ahí
    const { client, rpc } = mockAdminWithCounts({ 'ip:9.9.9.9': 60 })
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkChatRateLimit('tok', '9.9.9.9', 'fp', 'prop-1', 'standard')
    expect(res.allowed).toBe(false)
    expect(res.reason).toBe('ip_rate_limit')
    expect(rpc).toHaveBeenCalledTimes(1) // short-circuit
  })

  it('bloquea por límite de minuto del token', async () => {
    const { client } = mockAdminWithCounts({ 'token:min:tok': 5 })
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkChatRateLimit('tok', '1.2.3.4', 'fp', 'prop-1', 'standard')
    expect(res.allowed).toBe(false)
    expect(res.reason).toBe('token_minute_limit')
  })

  it('bloquea por límite diario del token', async () => {
    const { client } = mockAdminWithCounts({ 'token:daily:tok': 50 })
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const res = await RateLimiter.checkChatRateLimit('tok', '1.2.3.4', 'fp', 'prop-1', 'standard')
    expect(res.allowed).toBe(false)
    expect(res.reason).toBe('daily_limit_exceeded')
  })

  it('aplica el tope por tier de la propiedad (enterprise = 10000)', async () => {
    // 3000 supera el tope de standard/premium pero NO el de enterprise
    const { client } = mockAdminWithCounts({ 'prop:daily:prop-ent': 3000 })
    await setAdmin(client)
    const { RateLimiter } = await import('@/lib/security/rate-limiter')

    const std = await RateLimiter.checkChatRateLimit('t', '1.1.1.1', 'fp', 'prop-ent', 'standard')
    expect(std.allowed).toBe(false)
    expect(std.reason).toBe('property_limit_exceeded')

    vi.clearAllMocks()
    await setAdmin(mockAdminWithCounts({ 'prop:daily:prop-ent': 3000 }).client)
    const ent = await RateLimiter.checkChatRateLimit('t', '1.1.1.1', 'fp', 'prop-ent', 'enterprise')
    expect(ent.allowed).toBe(true)
  })
})
