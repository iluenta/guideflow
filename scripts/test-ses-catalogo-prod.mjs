#!/usr/bin/env node
/**
 * Diagnóstico puntual: confirma si las credenciales SES funcionan en
 * PRODUCCIÓN (hospedajes.ses.mir.es) aunque fallen en pre-ses.
 *
 * Usa SOLO la operación "catalogo" (consulta de tablas de códigos,
 * de solo lectura) — no da de alta ninguna comunicación, no toca datos
 * de huéspedes ni de reservas. Es seguro ejecutarlo contra producción.
 *
 * Uso:
 *   npm run test:ses:prod
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const SES_USER     = env['SES_USUARIO_WS']
const SES_PASSWORD = env['SES_PASSWORD_WS']

if (!SES_USER || !SES_PASSWORD) {
  console.error('Faltan SES_USUARIO_WS o SES_PASSWORD_WS en .env.local')
  process.exit(1)
}

const url = 'https://hospedajes.ses.mir.es/hospedajes-web/ws/v1/comunicacion'
const auth = Buffer.from(`${SES_USER}:${SES_PASSWORD}`).toString('base64')

const catalogo = process.argv[2] || 'TIPO_DOCUMENTO'

const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="http://www.soap.servicios.hospedajes.mir.es/comunicacion">
  <soapenv:Header/>
  <soapenv:Body>
    <com:catalogoRequest>
      <peticion>
        <catalogo>${catalogo}</catalogo>
      </peticion>
    </com:catalogoRequest>
  </soapenv:Body>
</soapenv:Envelope>`

console.log(`\n  [PRODUCCIÓN — solo lectura] Catálogo "${catalogo}"\n  ${url}\n`)

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'text/xml; charset=utf-8',
    SOAPAction: '""',
  },
  body: soapEnvelope,
})

const bodyText = await res.text()

console.log(`  HTTP ${res.status} ${res.statusText}`)
console.log('  Cabeceras relevantes:')
for (const h of ['content-type', 'server']) {
  if (res.headers.get(h)) console.log(`    ${h}: ${res.headers.get(h)}`)
}
console.log('\n  Cuerpo de la respuesta:')
console.log('  ' + bodyText)

console.log('')
if (res.status === 401) {
  console.log('  → 401 en producción también: revisa SES_USUARIO_WS / SES_PASSWORD_WS.\n')
} else if (bodyText.includes('<tupla>') || bodyText.includes('catalogoResponse')) {
  console.log('  → ÉXITO: producción responde con datos reales del catálogo.')
  console.log('    Confirma que las credenciales están activadas para producción.')
  console.log('    El problema de pre-ses es un entorno de pruebas separado sin activar.\n')
} else if (res.status === 502) {
  console.log('  → Mismo 502 también en producción: descarta la hipótesis de que era')
  console.log('    solo un problema del entorno de pruebas.\n')
} else {
  console.log('  → Respuesta distinta a las anteriores. Guarda este cuerpo completo.\n')
}
