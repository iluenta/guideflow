import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { CheckinGuestRecord } from '@/types/checkin'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666', marginBottom: 16 },
  stayBox: { flexDirection: 'row', gap: 16, marginBottom: 20, padding: 10, backgroundColor: '#f4f4f5', borderRadius: 4 },
  guestCard: { marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #e5e7eb' },
  guestTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, color: '#666' },
  value: { flex: 1 },
  signatureBox: { marginTop: 8 },
  signatureImg: { width: 160, height: 60, objectFit: 'contain', border: '1px solid #ddd' },
  noSignature: { fontStyle: 'italic', color: '#888', marginTop: 8 },
  pageHeader: { fontSize: 8, color: '#999', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #eee' },
  footer: { position: 'absolute', bottom: 24, left: 32, right: 32, fontSize: 7, color: '#999', textAlign: 'center', lineHeight: 1.4 },
})

export interface PdfGuestInput extends CheckinGuestRecord {
  signatureDataUri: string | null // data:image/png;base64,... o null si no requiere firma
}

interface GeneratePdfInput {
  propertyName: string
  establishmentCode: string | null
  reservationId: string
  checkinDate: string
  checkoutDate: string
  guests: PdfGuestInput[]
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

function PartedeEntradaDocument({ propertyName, establishmentCode, reservationId, checkinDate, checkoutDate, guests }: GeneratePdfInput) {
  const ref = reservationId.slice(0, 8).toUpperCase()
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageHeader} fixed>
          {propertyName}{establishmentCode ? ` · Código de establecimiento: ${establishmentCode}` : ''} · Ref: {ref} · {checkinDate} — {checkoutDate}
        </Text>
        <Text style={styles.title}>Parte de entrada de viajeros</Text>
        <Text style={styles.subtitle}>{propertyName}{establishmentCode ? ` — Código de establecimiento: ${establishmentCode}` : ''}</Text>

        <View style={styles.stayBox}>
          <Text>Ref: {ref}</Text>
          <Text>Entrada: {checkinDate}</Text>
          <Text>Salida: {checkoutDate}</Text>
          <Text>Huéspedes: {guests.length}</Text>
        </View>

        {guests.map((guest) => (
          <View key={guest.guest_order} style={styles.guestCard} wrap={false}>
            <Text style={styles.guestTitle}>
              Huésped {guest.guest_order}: {guest.first_name} {guest.first_surname} {guest.second_surname ?? ''}
            </Text>
            {/* Sin documento es un caso legítimo (menor sin documentación),
                no un dato que falte: se dice así en vez de imprimir vacíos. */}
            <Row
              label="Documento"
              value={
                guest.document_type && guest.document_number
                  ? `${guest.document_type} ${guest.document_number}`
                  : 'Menor sin documentación'
              }
            />
            <Row label="Fecha de nacimiento" value={guest.birth_date} />
            <Row label="Nacionalidad" value={guest.nationality} />
            <Row label="Sexo" value={guest.sex} />
            <Row label="Dirección" value={guest.address_street} />
            <Row label="C.P. / Localidad" value={[guest.address_postal_code, guest.address_city].filter(Boolean).join(' — ')} />
            <Row label="País" value={guest.address_country} />
            <Row label="Contacto" value={guest.phone ?? guest.email} />
            <Row label="Parentesco" value={guest.relationship_code} />

            {guest.signatureDataUri ? (
              <View style={styles.signatureBox}>
                <Text style={styles.label}>Firma:</Text>
                <Image src={guest.signatureDataUri} style={styles.signatureImg} />
              </View>
            ) : (
              <Text style={styles.noSignature}>Firma no requerida (menor de 14 años el día de entrada).</Text>
            )}
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Documento generado automáticamente por Hospyia a efectos de custodia (RD 933/2021, Art. 4.2 y 5.3) — conservar 3 años desde la salida.{'\n'}
          El tratamiento de estos datos se realiza de acuerdo con la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos
          digitales. El interesado puede ejercer sus derechos de acceso, rectificación, oposición y cancelación dirigiéndose al establecimiento.
        </Text>
      </Page>
    </Document>
  )
}

export async function generatePartedeEntradaPdf(input: GeneratePdfInput): Promise<Buffer> {
  return renderToBuffer(<PartedeEntradaDocument {...input} />)
}
