#!/usr/bin/env node
/**
 * SOLO DESARROLLO: crea un checkin_link de prueba para la primera reserva
 * activa que encuentre, para poder probar la página pública /check-in/[slug]/[token]
 * sin necesidad de iniciar sesión en el dashboard.
 *
 * Uso:
 *   node scripts/dev-create-test-checkin-link.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env  = {}
for (const file of ['.env', '.env.local']) {
  try {
    readFileSync(resolve(root, file), 'utf8')
      .split('\n')
      .forEach(line => {
        const [k, ...v] = line.split('=')
        if (k && !k.startsWith('#') && k.trim()) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
      })
  } catch { /* archivo opcional */ }
}

const SB_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SB_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}

// 1. Buscar una reserva no cancelada con propiedad con slug
const resResv = await fetch(
  `${SB_URL}/rest/v1/reservations?select=id,tenant_id,property_id,checkin_date,checkout_date,status,properties(slug)&status=not.in.(cancelled,no_show)&limit=5`,
  { headers }
)
const reservations = await resResv.json()
const reservation = reservations.find(r => r.properties?.slug)

if (!reservation) {
  console.error('No se encontró ninguna reserva con propiedad con slug configurado.')
  process.exit(1)
}

// 2. Generar token simple (solo para prueba local)
const token = crypto.randomBytes(16).toString('hex').slice(0, 24)
const now = new Date()
const validUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

const insertBody = {
  tenant_id: reservation.tenant_id,
  property_id: reservation.property_id,
  reservation_id: reservation.id,
  access_token: token,
  is_active: true,
  valid_from: now.toISOString(),
  valid_until: validUntil.toISOString(),
}

const insertRes = await fetch(`${SB_URL}/rest/v1/checkin_links`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'return=representation' },
  body: JSON.stringify(insertBody),
})

if (!insertRes.ok) {
  console.error('Error al crear checkin_link:', await insertRes.text())
  process.exit(1)
}

console.log(`\n  Reserva: ${reservation.id} (${reservation.checkin_date} -> ${reservation.checkout_date})`)
console.log(`  URL de prueba:\n  http://localhost:3000/check-in/${reservation.properties.slug}/${token}\n`)
