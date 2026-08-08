#!/usr/bin/env node
/**
 * Genera lib/checkin/countries.ts a partir de los datos ISO 3166-1.
 *
 * SES Hospedajes identifica el país (nacionalidad y país de residencia) con el
 * código ISO 3166-1 alfa-3 — el mismo "ESP" que ya usaba el formulario cuando
 * era un campo de texto libre.
 *
 * Se genera un fichero estático y se commitea, en vez de leer la librería en
 * runtime: la lista de países cambia una vez por década, el fichero queda
 * auditable en el repo (importante, porque estos códigos acaban en una
 * comunicación al Ministerio del Interior) y no añade peso al bundle del móvil
 * del huésped más allá de lo que realmente se usa.
 *
 * i18n-iso-countries es devDependency: solo hace falta para regenerar.
 *
 * Uso:
 *   node scripts/generate-countries.mjs
 */

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import countries from 'i18n-iso-countries'
import es from 'i18n-iso-countries/langs/es.json' with { type: 'json' }

countries.registerLocale(es)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(root, 'lib/checkin/countries.ts')

// alpha3 → nombre en español. i18n-iso-countries devuelve a veces varios
// alias por país (["Alemania", "República Federal de Alemania"]); se coge el
// primero, que es el nombre de uso corriente.
const names = countries.getNames('es', { select: 'alias' })
// Ojo: getAlpha3Codes() está indexado POR alfa-3 y devuelve el alfa-2,
// no al revés.
const alpha2ByAlpha3 = countries.getAlpha3Codes()

const rows = []
for (const [alpha3, alpha2] of Object.entries(alpha2ByAlpha3)) {
  const name = names[alpha2]
  if (!name) continue
  rows.push({ code: alpha3, name: Array.isArray(name) ? name[0] : name })
}

// Orden alfabético en español: "Ñ" y los acentos deben quedar donde los espera
// un lector hispanohablante, no donde los deja un sort() de code points.
const collator = new Intl.Collator('es')
rows.sort((a, b) => collator.compare(a.name, b.name))

const duplicates = rows.filter((r, i) => rows.findIndex(x => x.code === r.code) !== i)
if (duplicates.length) {
  console.error('Códigos alfa-3 duplicados:', duplicates)
  process.exit(1)
}

const malformed = rows.filter(r => !/^[A-Z]{3}$/.test(r.code))
if (malformed.length) {
  console.error('Códigos con formato inesperado:', malformed)
  process.exit(1)
}

for (const [code, expected] of [['ESP', 'España'], ['DEU', 'Alemania'], ['GBR', 'Reino Unido'], ['FRA', 'Francia']]) {
  const found = rows.find(r => r.code === code)
  if (!found || found.name !== expected) {
    console.error(`Sonda fallida: ${code} debería ser "${expected}", es "${found?.name ?? 'no encontrado'}"`)
    process.exit(1)
  }
}

const file = `// GENERADO POR scripts/generate-countries.mjs — no editar a mano.
// Fuente: ISO 3166-1 (paquete i18n-iso-countries, devDependency).
// Regenerar con: node scripts/generate-countries.mjs
//
// SES Hospedajes identifica nacionalidad y país de residencia con el código
// ISO 3166-1 alfa-3. Ordenado alfabéticamente en español.

export interface Country {
  code: string
  name: string
}

export const COUNTRIES: readonly Country[] = [
${rows.map(r => `  { code: '${r.code}', name: ${JSON.stringify(r.name)} },`).join('\n')}
] as const

const BY_CODE = new Map(COUNTRIES.map(c => [c.code, c]))

/** Nombre en español de un alfa-3, o el propio código si no se reconoce. */
export function countryName(code: string): string {
  return BY_CODE.get(code.toUpperCase())?.name ?? code
}

export function isKnownCountry(code: string): boolean {
  return BY_CODE.has(code.toUpperCase())
}
`

writeFileSync(outPath, file, 'utf8')
console.log(`Escritos ${rows.length} países en lib/checkin/countries.ts`)
console.log('Sondas de control: OK')
