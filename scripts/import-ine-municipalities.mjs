#!/usr/bin/env node
/**
 * Importa el catálogo de municipios del INE en public.ine_municipalities.
 *
 * El "alta masiva" de SES Hospedajes exige codigoMunicipio (código INE de
 * 5 dígitos) cuando el país de residencia del huésped es España. Ese código
 * no se puede deducir del código postal (Adra = 04770/04778/04779), así que
 * el huésped elige el municipio contra este catálogo.
 *
 * Fuente: fichero oficial del INE "Relación de municipios y códigos por
 * comunidades autónomas y provincias", descargable de ine.es. Formato:
 *   línea 1  título con la fecha de referencia
 *   línea 2  cabecera: CODAUTO  CPRO  CMUN  DC  NOMBRE
 *   resto    una fila por municipio, separada por tabuladores
 * El fichero viene en UTF-8 (comprobado sobre los bytes: "í" = C3 AD).
 * NO lo conviertas desde Latin-1 o corromperás todos los nombres acentuados.
 *
 * Los municipios que desaparecen (fusiones) se marcan active = false, nunca
 * se borran: una ficha antigua pudo registrarse con ese código.
 *
 * Uso:
 *   node scripts/import-ine-municipalities.mjs
 *   node scripts/import-ine-municipalities.mjs --file "C:/ruta/otro.txt"
 *   node scripts/import-ine-municipalities.mjs --dry-run
 *
 * Para actualizarlo cuando el INE publique una revisión: descarga el fichero
 * nuevo, sustituye scripts/data/ine-municipios.txt y vuelve a ejecutarlo.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ── Argumentos ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fileArg = args.indexOf('--file')
const filePath = fileArg >= 0 && args[fileArg + 1]
  ? resolve(args[fileArg + 1])
  : resolve(root, 'scripts/data/ine-municipios.txt')

// ── Entorno ──────────────────────────────────────────────────────────────────
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    try {
      const env = {}
      for (const raw of readFileSync(resolve(root, name), 'utf8').split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.startsWith('#')) continue
        const i = line.indexOf('=')
        if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
      if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return env
    } catch {
      // siguiente candidato
    }
  }
  return null
}

/**
 * Nombres de provincia por código CPRO. El fichero del INE solo trae el
 * código, no el nombre, así que la tabla va aquí. Se usan las formas
 * naturales ("A Coruña", no "Coruña, A") porque esto lo lee un huésped en
 * un desplegable, no un funcionario. Las provincias bilingües mantienen la
 * doble denominación oficial.
 */
const PROVINCE_NAMES = {
  '01': 'Araba/Álava',
  '02': 'Albacete',
  '03': 'Alicante/Alacant',
  '04': 'Almería',
  '05': 'Ávila',
  '06': 'Badajoz',
  '07': 'Illes Balears',
  '08': 'Barcelona',
  '09': 'Burgos',
  '10': 'Cáceres',
  '11': 'Cádiz',
  '12': 'Castellón/Castelló',
  '13': 'Ciudad Real',
  '14': 'Córdoba',
  '15': 'A Coruña',
  '16': 'Cuenca',
  '17': 'Girona',
  '18': 'Granada',
  '19': 'Guadalajara',
  '20': 'Gipuzkoa',
  '21': 'Huelva',
  '22': 'Huesca',
  '23': 'Jaén',
  '24': 'León',
  '25': 'Lleida',
  '26': 'La Rioja',
  '27': 'Lugo',
  '28': 'Madrid',
  '29': 'Málaga',
  '30': 'Murcia',
  '31': 'Navarra',
  '32': 'Ourense',
  '33': 'Asturias',
  '34': 'Palencia',
  '35': 'Las Palmas',
  '36': 'Pontevedra',
  '37': 'Salamanca',
  '38': 'Santa Cruz de Tenerife',
  '39': 'Cantabria',
  '40': 'Segovia',
  '41': 'Sevilla',
  '42': 'Soria',
  '43': 'Tarragona',
  '44': 'Teruel',
  '45': 'Toledo',
  '46': 'Valencia/València',
  '47': 'Valladolid',
  '48': 'Bizkaia',
  '49': 'Zamora',
  '50': 'Zaragoza',
  '51': 'Ceuta',
  '52': 'Melilla',
}

/** Minúsculas sin acentos, para poder buscar "malaga" y encontrar "Málaga". */
export function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** "…a 1 de enero de 2026" → "2026-01-01" (informativo, para saber qué revisión hay cargada). */
function parseSourceVersion(titleLine) {
  const MONTHS = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  }
  const m = titleLine.match(/a\s+(\d{1,2})\s+de\s+([a-zá-ú]+)\s+de\s+(\d{4})/i)
  if (!m) return null
  const month = MONTHS[normalizeName(m[2])]
  if (!month) return null
  return `${m[3]}-${month}-${m[1].padStart(2, '0')}`
}

function parseFile(text) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\r$/, ''))
  const sourceVersion = parseSourceVersion(lines[0] ?? '')

  const headerIndex = lines.findIndex(l => /^CODAUTO\t/i.test(l))
  if (headerIndex < 0) {
    throw new Error('No se encontró la cabecera "CODAUTO\tCPRO\tCMUN\tDC\tNOMBRE": ¿es el fichero correcto?')
  }

  const municipalities = []
  const errors = []
  const seen = new Set()

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const cols = line.split('\t')
    if (cols.length < 5) {
      errors.push(`línea ${i + 1}: se esperaban 5 columnas, hay ${cols.length}`)
      continue
    }

    const [, cpro, cmun, , ...nameParts] = cols.map(c => c.trim())
    const name = nameParts.join(' ').trim()
    const code = `${cpro}${cmun}`

    if (!/^\d{2}$/.test(cpro) || !/^\d{3}$/.test(cmun)) {
      errors.push(`línea ${i + 1}: código malformado CPRO="${cpro}" CMUN="${cmun}"`)
      continue
    }
    if (!name) {
      errors.push(`línea ${i + 1}: municipio ${code} sin nombre`)
      continue
    }
    if (!PROVINCE_NAMES[cpro]) {
      errors.push(`línea ${i + 1}: provincia ${cpro} desconocida`)
      continue
    }
    if (seen.has(code)) {
      errors.push(`línea ${i + 1}: código duplicado ${code} (${name})`)
      continue
    }
    seen.add(code)

    municipalities.push({
      code,
      name,
      name_normalized: normalizeName(name),
      province_code: cpro,
      province_name: PROVINCE_NAMES[cpro],
      active: true,
      source_version: sourceVersion,
    })
  }

  return { municipalities, errors, sourceVersion }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const raw = readFileSync(filePath, 'utf8')

// Un fichero mal decodificado se delata por U+FFFD o por la secuencia "Ã" de la
// doble codificación. Mejor abortar que meter 8.000 nombres corruptos.
if (raw.includes('\uFFFD') || /Ã[\u0080-\u00bf]/.test(raw)) {
  console.error('El fichero no parece UTF-8 limpio (se ven caracteres de sustitución o doble codificación).')
  console.error('Vuelve a descargarlo del INE sin convertir la codificación.')
  process.exit(1)
}

const { municipalities, errors, sourceVersion } = parseFile(raw)

console.log(`Fichero:   ${filePath}`)
console.log(`Revisión:  ${sourceVersion ?? '(no detectada)'}`)
console.log(`Municipios: ${municipalities.length}`)
console.log(`Provincias: ${new Set(municipalities.map(m => m.province_code)).size}`)

if (errors.length) {
  console.error(`\n${errors.length} filas rechazadas:`)
  errors.slice(0, 20).forEach(e => console.error(`  - ${e}`))
  if (errors.length > 20) console.error(`  … y ${errors.length - 20} más`)
  process.exit(1)
}

// Sondas: si estas fallan, el parseo se ha desalineado de columna.
const CHECKS = [
  ['28073', 'Humanes de Madrid'],
  ['04100', 'Vera'],
  ['04003', 'Adra'],
  ['29067', 'Málaga'],
]
for (const [code, expected] of CHECKS) {
  const found = municipalities.find(m => m.code === code)
  if (!found || found.name !== expected) {
    console.error(`\nSonda fallida: ${code} debería ser "${expected}", es "${found?.name ?? 'no encontrado'}"`)
    process.exit(1)
  }
}
console.log('Sondas de control: OK')

if (dryRun) {
  console.log('\n--dry-run: no se escribe nada en la base de datos.')
  process.exit(0)
}

const env = loadEnv()
if (!env) {
  console.error('No se encontraron NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local ni .env')
  process.exit(1)
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const headers = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

// Upsert por lotes (PostgREST admite merge-duplicates sobre la PK).
const BATCH = 500
let written = 0
for (let i = 0; i < municipalities.length; i += BATCH) {
  const batch = municipalities.slice(i, i + BATCH).map(m => ({ ...m, updated_at: new Date().toISOString() }))
  const res = await fetch(`${url}/rest/v1/ine_municipalities`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(batch),
  })
  if (!res.ok) {
    console.error(`\nError al escribir el lote ${i / BATCH + 1}: ${res.status}`)
    console.error(await res.text())
    process.exit(1)
  }
  written += batch.length
  process.stdout.write(`\rEscritos ${written}/${municipalities.length}`)
}
console.log('')

// Los que ya no vienen en el fichero se desactivan, no se borran.
const existing = await (await fetch(
  `${url}/rest/v1/ine_municipalities?select=code,name,active&limit=20000`,
  { headers },
)).json()

const incoming = new Set(municipalities.map(m => m.code))
const gone = existing.filter(row => !incoming.has(row.code) && row.active)

if (gone.length) {
  const res = await fetch(
    `${url}/rest/v1/ine_municipalities?code=in.(${gone.map(g => g.code).join(',')})`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }),
    },
  )
  if (!res.ok) {
    console.error(`Error al desactivar municipios desaparecidos: ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  console.log(`Desactivados (ya no están en el fichero): ${gone.map(g => `${g.code} ${g.name}`).join(', ')}`)
}

console.log(`\nCatálogo actualizado: ${written} municipios activos, revisión ${sourceVersion ?? 'desconocida'}.`)
