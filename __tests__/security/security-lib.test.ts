/**
 * Tests de lib/security.ts:
 *  - generateSecureToken: entropía, charset y unicidad.
 *  - generateDeviceFingerprint: hash determinista.
 *  - validateAccessToken: ventanas temporales y control de propiedad.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/edge', () => ({
  createEdgeAdminClient: vi.fn(),
}))

import {
  generateSecureToken,
  generateDeviceFingerprint,
  validateAccessToken,
  validateCheckinToken,
} from '@/lib/security'

describe('generateSecureToken', () => {
  it('usa longitud 24 por defecto', () => {
    expect(generateSecureToken()).toHaveLength(24)
  })

  it('respeta la longitud solicitada', () => {
    expect(generateSecureToken(12)).toHaveLength(12)
    expect(generateSecureToken(48)).toHaveLength(48)
  })

  it('solo contiene caracteres del alfabeto [a-z0-9]', () => {
    const token = generateSecureToken(200)
    expect(token).toMatch(/^[a-z0-9]+$/)
  })

  it('genera tokens únicos (sin colisiones en 1000 llamadas)', () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateSecureToken()))
    expect(set.size).toBe(1000)
  })

  it('reparte razonablemente los caracteres (sin sesgo de módulo evidente)', () => {
    // Muestra grande: cada uno de los 36 símbolos debería aparecer al menos una vez.
    const big = generateSecureToken(5000)
    const distintos = new Set(big.split(''))
    expect(distintos.size).toBe(36)
  })
})

describe('generateDeviceFingerprint', () => {
  it('es determinista: misma entrada → mismo hash', async () => {
    const a = await generateDeviceFingerprint('1.2.3.4', 'UA/1.0')
    const b = await generateDeviceFingerprint('1.2.3.4', 'UA/1.0')
    expect(a).toBe(b)
  })

  it('cambia con distinta IP o user-agent', async () => {
    const base = await generateDeviceFingerprint('1.2.3.4', 'UA/1.0')
    expect(await generateDeviceFingerprint('9.9.9.9', 'UA/1.0')).not.toBe(base)
    expect(await generateDeviceFingerprint('1.2.3.4', 'Otro/2.0')).not.toBe(base)
  })

  it('produce un hash hex de 16 caracteres', async () => {
    const fp = await generateDeviceFingerprint('1.2.3.4', 'UA')
    expect(fp).toMatch(/^[0-9a-f]{16}$/)
  })

  it('tolera IP/UA ausentes sin lanzar', async () => {
    const fp = await generateDeviceFingerprint(undefined, null)
    expect(fp).toMatch(/^[0-9a-f]{16}$/)
  })
})

describe('validateAccessToken', () => {
  beforeEach(() => vi.clearAllMocks())

  async function setToken(row: any, error: any = null) {
    const single = vi.fn().mockResolvedValue({ data: row, error })
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single })),
        })),
      })),
    }
    const { createEdgeAdminClient } = await import('@/lib/supabase/edge')
    vi.mocked(createEdgeAdminClient).mockReturnValue(client as any)
  }

  const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()
  const past = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

  const activeRow = () => ({
    access_token: 'tok',
    property_id: 'prop-1',
    is_active: true,
    valid_from: past(24),
    valid_until: future(24),
  })

  it('rechaza un token inexistente', async () => {
    await setToken(null, { message: 'not found' })
    const res = await validateAccessToken({}, 'tok')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('invalid_token')
  })

  it('rechaza si la propiedad no coincide con la esperada', async () => {
    await setToken(activeRow())
    const res = await validateAccessToken({}, 'tok', 'otra-prop')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('invalid_token')
  })

  it('rechaza un token desactivado', async () => {
    await setToken({ ...activeRow(), is_active: false })
    const res = await validateAccessToken({}, 'tok')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('token_deactivated')
  })

  it('rechaza si aún no ha empezado la ventana (too_early)', async () => {
    await setToken({ ...activeRow(), valid_from: future(2), valid_until: future(48) })
    const res = await validateAccessToken({}, 'tok')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('too_early')
  })

  it('rechaza un token caducado (expired)', async () => {
    await setToken({ ...activeRow(), valid_from: past(48), valid_until: past(2) })
    const res = await validateAccessToken({}, 'tok')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('expired')
  })

  it('acepta un token activo dentro de la ventana', async () => {
    await setToken(activeRow())
    const res = await validateAccessToken({}, 'tok', 'prop-1')
    expect(res.valid).toBe(true)
    expect(res.access?.property_id).toBe('prop-1')
  })
})

describe('validateCheckinToken', () => {
  beforeEach(() => vi.clearAllMocks())

  async function setLink(row: any, error: any = null) {
    const single = vi.fn().mockResolvedValue({ data: row, error })
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ single })),
        })),
      })),
    }
    const { createEdgeAdminClient } = await import('@/lib/supabase/edge')
    vi.mocked(createEdgeAdminClient).mockReturnValue(client as any)
  }

  const future = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()
  const past = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()

  const activeLink = () => ({
    access_token: 'chk',
    property_id: 'prop-1',
    is_active: true,
    valid_from: past(24),
    valid_until: future(24),
    reservation: { id: 'res-1', status: 'confirmed', guests_count: 2, checkin_date: past(24), checkout_date: future(24) },
  })

  it('rechaza un token de check-in inexistente', async () => {
    await setLink(null, { message: 'not found' })
    const res = await validateCheckinToken('chk')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('invalid_token')
  })

  it('rechaza si la propiedad no coincide', async () => {
    await setLink(activeLink())
    const res = await validateCheckinToken('chk', 'otra-prop')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('invalid_token')
  })

  it('rechaza un enlace desactivado', async () => {
    await setLink({ ...activeLink(), is_active: false })
    const res = await validateCheckinToken('chk')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('token_deactivated')
  })

  it('rechaza si la reserva está cancelada o es no_show', async () => {
    await setLink({ ...activeLink(), reservation: { ...activeLink().reservation, status: 'cancelled' } })
    const res = await validateCheckinToken('chk')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('invalid_token')
  })

  it('rechaza si aún no ha empezado la ventana (too_early)', async () => {
    await setLink({ ...activeLink(), valid_from: future(2), valid_until: future(48) })
    const res = await validateCheckinToken('chk')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('too_early')
  })

  it('rechaza un token caducado (expired)', async () => {
    await setLink({ ...activeLink(), valid_from: past(48), valid_until: past(2) })
    const res = await validateCheckinToken('chk')
    expect(res.valid).toBe(false)
    expect(res.reason).toBe('expired')
  })

  it('acepta un enlace activo con reserva válida dentro de la ventana', async () => {
    await setLink(activeLink())
    const res = await validateCheckinToken('chk', 'prop-1')
    expect(res.valid).toBe(true)
    if (res.valid) expect(res.link.property_id).toBe('prop-1')
  })
})
