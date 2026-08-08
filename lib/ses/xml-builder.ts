import type { CheckinGuestRecord } from '@/types/checkin'

// XML del "alta masiva de comunicaciones" (partes de viajeros) — manual oficial
// MIR-HOSPE-DSI-WS Instrucciones v1.2.0. Formato plano, sin sobre SOAP, sin
// ZIP/Base64: es literalmente el fichero que se sube en el portal de SES
// Hospedajes. Construido a mano porque es un puñado de bloques fijos, no
// merece una dependencia XML.
//
// AVISO: el manual describe los campos en tablas, pero no incluye la
// plantilla .xml descargable real del portal. El namespace del elemento raíz
// (xmlns) se ha tomado prestado del XSD del webservice SOAP equivalente
// (altaParteHospedaje.xsd), que comparte los mismos campos — es la mejor
// base disponible, pero antes de la primera subida real conviene descargar
// la plantilla oficial desde el propio portal (alta masiva > partes de
// viajeros > descargar plantilla) y contrastarla con este generador.

interface BuildXmlInput {
  establishmentCode: string
  reservationId: string
  reservationCreatedAt: string // ISO date
  checkinDate: string // YYYY-MM-DD
  checkoutDate: string // YYYY-MM-DD
  collectionParty: 'platform' | 'host'
  guests: CheckinGuestRecord[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function tag(name: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  return `<${name}>${escapeXml(value)}</${name}>`
}

// tipoPago: PLATF si el canal cobra la plataforma, TRANS si cobra el propietario
// (regla confirmada con el propietario — no se registra el medio de pago real).
function tipoPagoFromCollectionParty(collectionParty: 'platform' | 'host'): string {
  return collectionParty === 'platform' ? 'PLATF' : 'TRANS'
}

// España y extranjero se informan distinto, tal cual exige el manual: "si el
// país es España (ESP), el código de municipio ha de ir informado". El código
// es el del INE (CPRO+CMUN, 5 dígitos), que el huésped elige en el formulario
// contra el catálogo cargado en ine_municipalities — no se deduce del código
// postal, porque la relación es 1:N (Adra = 04770/04778/04779).
// Para el resto de países no hay catálogo posible: va el nombre en texto libre.
function buildDireccion(guest: CheckinGuestRecord): string {
  const isSpain = guest.address_country.toUpperCase() === 'ESP'
  const municipio = isSpain
    ? tag('codigoMunicipio', guest.address_municipality_code)
    : tag('nombreMunicipio', guest.address_city)

  // El esquema real solo tiene un campo "direccion" de texto libre (calle,
  // número, escalera, piso, puerta...) — no un campo "número" separado, que es
  // por lo que el formulario tampoco lo pide por separado.
  return `<direccion>
${tag('direccion', guest.address_street)}
${municipio}
${tag('codigoPostal', guest.address_postal_code)}
${tag('pais', guest.address_country)}
</direccion>`
}

function buildPersona(guest: CheckinGuestRecord): string {
  return `<persona>
${tag('rol', 'VI')}
${tag('nombre', guest.first_name)}
${tag('apellido1', guest.first_surname)}
${tag('apellido2', guest.second_surname)}
${/* Un menor sin documentación no lleva estos campos: tag() los omite al ser
     null, en vez de mandar etiquetas vacías que el portal rechazaría. */ ''}
${tag('tipoDocumento', guest.document_type)}
${tag('numeroDocumento', guest.document_number)}
${tag('soporteDocumento', guest.document_support_number)}
${tag('fechaNacimiento', guest.birth_date)}
${tag('nacionalidad', guest.nationality)}
${tag('sexo', guest.sex)}
${buildDireccion(guest)}
${tag('telefono', guest.phone)}
${tag('correo', guest.email)}
${tag('parentesco', guest.relationship_code)}
</persona>`
}

export function buildPartesViajerosXml({
  establishmentCode,
  reservationId,
  reservationCreatedAt,
  checkinDate,
  checkoutDate,
  collectionParty,
  guests,
}: BuildXmlInput): string {
  const referencia = reservationId.slice(0, 8).toUpperCase()
  const fechaContrato = reservationCreatedAt.slice(0, 10)

  const contrato = `<contrato>
${tag('referencia', referencia)}
${tag('fechaContrato', fechaContrato)}
${tag('fechaEntrada', `${checkinDate}T00:00:00`)}
${tag('fechaSalida', `${checkoutDate}T00:00:00`)}
${tag('numPersonas', String(guests.length))}
<pago>
${tag('tipoPago', tipoPagoFromCollectionParty(collectionParty))}
</pago>
</contrato>`

  const personas = guests.map(buildPersona).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<peticion xmlns="http://www.neg.hospedajes.mir.es/altaParteHospedaje">
<solicitud>
${tag('codigoEstablecimiento', establishmentCode)}
<comunicacion>
${contrato}
${personas}
</comunicacion>
</solicitud>
</peticion>`

  // Los campos opcionales ausentes dejan líneas en blanco (tag() devuelve '') —
  // se limpian aquí para que el fichero sea legible si el propietario necesita
  // revisarlo o corregirlo a mano antes de subirlo.
  return xml.replace(/\n\s*\n/g, '\n')
}
