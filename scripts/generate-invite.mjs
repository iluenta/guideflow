#!/usr/bin/env node
/**
 * Genera un código de invitación de un solo uso para Recetario AI
 * y lo inserta en la tabla `invitations` de Hospyia.
 *
 * Uso:
 *   npm run invite
 *   npm run invite -- --notes "Pedro - prueba"
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Leer .env.local ──────────────────────────────────────────────────────────
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env  = {}
try {
  readFileSync(resolve(root, '.env.local'), 'utf8')
    .split('\n')
    .forEach(line => {
      const [k, ...v] = line.split('=')
      if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim()
    })
} catch {
  console.error('No se encontró .env.local')
  process.exit(1)
}

const SB_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SB_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
const DOMAIN = 'https://hospyia.com'

if (!SB_URL || !SB_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

// ── Notas desde args ─────────────────────────────────────────────────────────
const notesIdx = process.argv.indexOf('--notes')
const notes    = notesIdx !== -1 ? process.argv[notesIdx + 1] ?? '' : ''

// ── Generar código (sin caracteres ambiguos 0/O/1/I/L) ───────────────────────
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const code  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

// ── Insertar en Supabase ──────────────────────────────────────────────────────
const res = await fetch(`${SB_URL}/rest/v1/invitations`, {
  method: 'POST',
  headers: {
    'apikey':        SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
  },
  body: JSON.stringify({ code, notes: notes || null }),
})

if (!res.ok) {
  const err = await res.text()
  console.error('\n  Error al generar la invitación:', err)
  process.exit(1)
}

const link = `${DOMAIN}/i/${code}`
console.log(`
  Invitación generada correctamente
  -------------------------------------------------
  ${link}${notes ? `\n  Notas: ${notes}` : ''}
  -------------------------------------------------
  Copia el enlace y envíaselo al destinatario.
`)
