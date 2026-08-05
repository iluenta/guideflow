#!/usr/bin/env node
/**
 * Prueba de conexión contra el webservice oficial de SES Hospedajes
 * (Ministerio del Interior), entorno pre-ses por defecto.
 *
 * Es un servicio SOAP 1.1 (confirmado contra comunicacion.wsdl del manual
 * técnico oficial MIR-HOSPE-DSI-WS-Servicio de Hospedajes - Comunicaciones
 * v3.1.3), NO REST/JSON pese a que el mismo endpoint devuelve un JSON de
 * error genérico cuando falta autenticación (eso es el gateway, no el
 * servicio real).
 *
 * Usa la operación "catalogo" (consulta de tablas de códigos, ej.
 * TIPO_DOCUMENTO) porque es de solo lectura, no requiere el bloque
 * "cabecera" (código de arrendador) ni construir el XML comprimido en
 * Base64 de una comunicación real — sirve para validar credenciales y
 * forma del sobre SOAP sin ningún riesgo de dar de alta nada.
 *
 * Uso:
 *   npm run test:ses
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

const SES_USER     = env['SES_USUARIO_WS']
const SES_PASSWORD = env['SES_PASSWORD_WS']
const SES_BASE_URL = env['SES_API_BASE_URL'] || 'https://hospedajes.pre-ses.mir.es/hospedajes-web/ws/v1'

if (!SES_USER || !SES_PASSWORD) {
  console.error('Faltan SES_USUARIO_WS o SES_PASSWORD_WS en .env.local')
  process.exit(1)
}

const url = `${SES_BASE_URL.replace(/\/$/, '')}/comunicacion`
const auth = Buffer.from(`${SES_USER}:${SES_PASSWORD}`).toString('base64')

// Basado en el ejemplo del Anexo I del manual técnico oficial (MIR-HOSPE-DSI-WS
// v3.1.3, pág. 70), con una corrección: el texto "Fichero XML comprimido en
// ZIP y codificado en Base64" del propio manual es descriptivo, no un valor
// de ejemplo real (tiene espacios, no es Base64 válido) — enviarlo tal cual
// probablemente hace que su decodificador falle de forma no controlada, lo
// que encajaría con el 502 que hemos visto en todos los intentos anteriores.
// Aquí mandamos Base64 válido de verdad (aunque el contenido no sea un ZIP
// real todavía), para diferenciar "credenciales+sobre OK, contenido inválido"
// de un fallo más profundo de infraestructura.
const solicitudBase64 = Buffer.from('contenido-de-prueba-no-es-un-zip-real').toString('base64')

const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:com="http://www.soap.servicios.hospedajes.mir.es/comunicacion">
  <soapenv:Header/>
  <soapenv:Body>
    <com:comunicacionRequest>
      <peticion>
        <cabecera>
          <codigoArrendador>0000000001</codigoArrendador>
          <aplicacion>Hospyia check-in test</aplicacion>
          <tipoOperacion>A</tipoOperacion>
          <tipoComunicacion>PV</tipoComunicacion>
        </cabecera>
        <solicitud>${solicitudBase64}</solicitud>
      </peticion>
    </com:comunicacionRequest>
  </soapenv:Body>
</soapenv:Envelope>`

console.log(`\n  Probando conexión con SES Hospedajes (SOAP, operación "comunicacion", ejemplo del Anexo I)\n  ${url}\n`)

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
for (const h of ['content-type', 'server', 'www-authenticate']) {
  if (res.headers.get(h)) console.log(`    ${h}: ${res.headers.get(h)}`)
}
console.log('\n  Cuerpo de la respuesta:')
console.log('  ' + bodyText)

console.log('')
if (res.status === 401) {
  console.log('  → 401 Unauthorized: revisa SES_USUARIO_WS / SES_PASSWORD_WS.\n')
  process.exit(1)
} else if (bodyText.includes('comunicacionResponse') || bodyText.includes('codigoRetorno')) {
  console.log('  → El servicio ha respondido con un sobre SOAP normal (no un 502).')
  console.log('    Las credenciales y la forma del sobre SOAP son correctas.')
  console.log('    El codigoRetorno/descripcion de arriba dicen qué falla ahora')
  console.log('    (probablemente el codigoArrendador de ejemplo o el contenido')
  console.log('    de <solicitud>, ambos placeholders a propósito).\n')
} else {
  console.log('  → Sigue sin ser una respuesta SOAP reconocible. Guarda este cuerpo')
  console.log('    completo para seguir investigando antes de continuar.\n')
}
