import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const SENDER_DOMAIN = 'hospyia.com'
const SYSTEM_FROM   = `Hospyia Reservas <reservas@${SENDER_DOMAIN}>`

function buildFromAddress(propertyName: string): string {
  return `"${propertyName}" <reservas@${SENDER_DOMAIN}>`
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ReservationEmailParams = {
  reservation: { id: string; guest_name: string; guest_email: string; guest_phone?: string }
  property: { name: string; full_address?: string; city?: string }
  landing: { contact_email: string; contact_phone?: string }
  guests: { adults: number; children: number; infants: number; pets: number }
  checkin: Date
  checkout: Date
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function guestList(guests: ReservationEmailParams['guests']): string {
  return [
    guests.adults   > 0 ? `${guests.adults} adulto${guests.adults !== 1 ? 's' : ''}`     : null,
    guests.children > 0 ? `${guests.children} niño${guests.children !== 1 ? 's' : ''}`   : null,
    guests.infants  > 0 ? `${guests.infants} bebé${guests.infants !== 1 ? 's' : ''}`     : null,
    guests.pets     > 0 ? `${guests.pets} mascota${guests.pets !== 1 ? 's' : ''}`        : null,
  ].filter(Boolean).join(', ')
}

function stayBox(
  property: ReservationEmailParams['property'],
  checkin: Date,
  checkout: Date,
  nights: number,
  guests: ReservationEmailParams['guests'],
  total: number,
): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #e8dfd4;border-radius:10px;margin-bottom:28px;">
  <tr>
    <td style="padding:20px 24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8B6F47;margin-bottom:16px;">Detalles de la estancia</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">ENTRADA</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${formatDate(checkin)}</div>
          </td>
          <td width="50%" style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">SALIDA</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${formatDate(checkout)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">NOCHES</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${nights}</div>
          </td>
          <td style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">HUÉSPEDES</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${guestList(guests)}</div>
          </td>
        </tr>
        ${property.full_address || property.city ? `
        <tr>
          <td colspan="2">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">ALOJAMIENTO</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${property.full_address || property.city}</div>
          </td>
        </tr>` : ''}
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#8B6F47;border-radius:0 0 10px 10px;padding:14px 24px;">
      <table width="100%"><tr>
        <td style="font-size:13px;font-weight:600;color:#fff;">Total estimado</td>
        <td align="right" style="font-size:20px;font-weight:700;color:#fff;">${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
      </tr></table>
    </td>
  </tr>
</table>`
}

function hostContact(landing: ReservationEmailParams['landing']): string {
  const cleanPhone = (p: string) => p.replace(/[\s\-().+]/g, '')
  return `
<div style="margin-bottom:28px;">
  <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8B6F47;margin-bottom:12px;">Contacto del anfitrión</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#374151;">
        📧 <a href="mailto:${landing.contact_email}" style="color:#8B6F47;text-decoration:none;">${landing.contact_email}</a>
      </td>
    </tr>
    ${landing.contact_phone ? `
    <tr><td style="padding:8px 0;font-size:14px;color:#374151;">
      📞 <a href="tel:${landing.contact_phone}" style="color:#8B6F47;text-decoration:none;">${landing.contact_phone}</a>
    </td></tr>
    <tr><td style="padding:8px 0;font-size:14px;color:#374151;">
      💬 <a href="https://wa.me/${cleanPhone(landing.contact_phone)}" style="color:#25d366;text-decoration:none;">WhatsApp</a>
    </td></tr>` : ''}
  </table>
</div>`
}

function emailShell(headerBg: string, headerLabel: string, propertyName: string, ref: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${headerBg};border-radius:12px 12px 0 0;padding:32px 36px;text-align:center;">
            <div style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:8px;">${headerLabel}</div>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#fff;letter-spacing:-.02em;">${propertyName}</h1>
            <div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:20px;padding:6px 16px;font-size:13px;color:#fff;letter-spacing:.05em;">REF: ${ref}</div>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:36px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Ref. <strong>${ref}</strong> · Powered by <strong>Hospyia</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Email al anfitrión (pre-reserva) ────────────────────────────────────────

async function sendHostNotification({
  reservation,
  property,
  landing,
  guests,
  checkin,
  checkout,
  total,
}: ReservationEmailParams): Promise<void> {
  const ref    = reservation.id.slice(0, 8).toUpperCase()
  const nights = Math.floor((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
  const cleanPhone = (p: string) => p.replace(/[\s\-().+]/g, '')
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.hospyia.com'}/dashboard/bookings`

  const body = `
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">
  Hola, tienes una <strong>nueva pre-reserva</strong> en <strong>${property.name}</strong>.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #e8dfd4;border-radius:10px;margin-bottom:28px;">
  <tr>
    <td style="padding:20px 24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8B6F47;margin-bottom:16px;">Datos del huésped</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:10px;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">NOMBRE</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${reservation.guest_name}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:10px;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">EMAIL</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">
              <a href="mailto:${reservation.guest_email}" style="color:#8B6F47;text-decoration:none;">${reservation.guest_email}</a>
            </div>
          </td>
        </tr>
        ${reservation.guest_phone ? `
        <tr>
          <td style="padding-bottom:10px;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">TELÉFONO</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">
              <a href="tel:${reservation.guest_phone}" style="color:#8B6F47;text-decoration:none;">${reservation.guest_phone}</a>
              &nbsp;·&nbsp;
              <a href="https://wa.me/${cleanPhone(reservation.guest_phone)}" style="color:#25d366;text-decoration:none;">WhatsApp</a>
            </div>
          </td>
        </tr>` : ''}
      </table>
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #e8dfd4;border-radius:10px;margin-bottom:28px;">
  <tr>
    <td style="padding:20px 24px;">
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8B6F47;margin-bottom:16px;">Detalles de la estancia</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">ENTRADA</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${formatDate(checkin)}</div>
          </td>
          <td width="50%" style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">SALIDA</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${formatDate(checkout)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">NOCHES</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${nights}</div>
          </td>
          <td style="padding-bottom:12px;vertical-align:top;">
            <div style="font-size:11px;color:#9ca3af;margin-bottom:3px;">HUÉSPEDES</div>
            <div style="font-size:14px;font-weight:600;color:#1f2937;">${guestList(guests)}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#8B6F47;border-radius:0 0 10px 10px;padding:14px 24px;">
      <table width="100%"><tr>
        <td style="font-size:13px;font-weight:600;color:#fff;">Total</td>
        <td align="right" style="font-size:20px;font-weight:700;color:#fff;">${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
      </tr></table>
    </td>
  </tr>
</table>

<div style="text-align:center;margin-bottom:28px;">
  <a href="${dashboardUrl}" style="display:inline-block;background:#8B6F47;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
    Ver y gestionar la reserva →
  </a>
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;margin-bottom:24px;">
  <tr>
    <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
      ⏳ La reserva está <strong>pendiente de tu confirmación</strong>. Puedes confirmarla o rechazarla desde el panel de control.
    </td>
  </tr>
</table>

<p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
  Este aviso ha sido enviado a <strong>${landing.contact_email}</strong>.
</p>`

  await resend.emails.send({
    from:    SYSTEM_FROM,
    to:      landing.contact_email,
    replyTo: reservation.guest_email,
    subject: `Nueva pre-reserva en ${property.name}: ${checkin.toLocaleDateString('es-ES')} — ${reservation.guest_name}`,
    html:    emailShell('#8B6F47', 'Nueva pre-reserva recibida', property.name, ref, body),
  })
}

// ─── Emails al huésped ────────────────────────────────────────────────────────

export async function sendReservationConfirmation({
  reservation,
  property,
  landing,
  guests,
  checkin,
  checkout,
  total,
}: ReservationEmailParams): Promise<void> {
  const ref    = reservation.id.slice(0, 8).toUpperCase()
  const nights = Math.floor((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
  const guestName = reservation.guest_name.split(' ')[0]

  const body = `
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">
  Hola <strong>${guestName}</strong>,
</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">
  Hemos recibido tu solicitud de estancia en <strong style="color:#374151;">${property.name}</strong>.
  El anfitrión revisará la disponibilidad y te confirmará la reserva en breve.
</p>
${stayBox(property, checkin, checkout, nights, guests, total)}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;margin-bottom:28px;">
  <tr>
    <td style="padding:16px 20px;font-size:13px;color:#92400e;line-height:1.6;">
      <strong>⏳ Pre-reserva pendiente de confirmación</strong><br>
      Recibirás otro correo cuando el anfitrión la confirme. El pago se coordinará directamente con él.
    </td>
  </tr>
</table>
${hostContact(landing)}
<p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">Si no has realizado esta solicitud, puedes ignorar este mensaje.</p>`

  const [guestResult, hostResult] = await Promise.allSettled([
    resend.emails.send({
      from:    buildFromAddress(property.name),
      to:      reservation.guest_email,
      replyTo: landing.contact_email,
      subject: `Pre-reserva recibida: ${property.name} · ${checkin.toLocaleDateString('es-ES')} — ${checkout.toLocaleDateString('es-ES')}`,
      html:    emailShell('#8B6F47', 'Pre-reserva recibida', property.name, ref, body),
    }),
    sendHostNotification({ reservation, property, landing, guests, checkin, checkout, total }),
  ])

  if (guestResult.status === 'rejected') console.error('[resend] pre-reserva guest email failed:', guestResult.reason)
  if (hostResult.status  === 'rejected') console.error('[resend] pre-reserva host notification failed:', hostResult.reason)
}

export async function sendReservationConfirmed({
  reservation,
  property,
  landing,
  guests,
  checkin,
  checkout,
  total,
}: ReservationEmailParams): Promise<void> {
  const ref    = reservation.id.slice(0, 8).toUpperCase()
  const nights = Math.floor((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
  const guestName = reservation.guest_name.split(' ')[0]

  const body = `
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">
  Hola <strong>${guestName}</strong>,
</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">
  ¡Tu reserva en <strong style="color:#374151;">${property.name}</strong> ha sido <strong style="color:#166534;">confirmada</strong>!
  Te esperamos con todo listo para hacer tu estancia perfecta.
</p>
${stayBox(property, checkin, checkout, nights, guests, total)}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;margin-bottom:28px;">
  <tr>
    <td style="padding:16px 20px;font-size:13px;color:#166534;line-height:1.6;">
      <strong>✅ Reserva confirmada</strong><br>
      El anfitrión te espera. Si tienes dudas sobre la llegada, no dudes en contactarle.
    </td>
  </tr>
</table>
${hostContact(landing)}
<p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">Ref. ${ref}</p>`

  const { error } = await resend.emails.send({
    from:    buildFromAddress(property.name),
    to:      reservation.guest_email,
    replyTo: landing.contact_email,
    subject: `Reserva confirmada: ${property.name} · ${checkin.toLocaleDateString('es-ES')} — ${checkout.toLocaleDateString('es-ES')}`,
    html:    emailShell('#166534', 'Reserva confirmada ✓', property.name, ref, body),
  })

  if (error) console.error('[resend] confirmed email failed:', error)
}

// ─── Email de invitación APK (Recetario AI) ──────────────────────────────────

type ApkInviteEmailParams = {
  to: string
  recipientName?: string | null
  code: string
  url: string
}

export async function sendApkInviteEmail({ to, recipientName, code, url }: ApkInviteEmailParams): Promise<void> {
  const greetingName = recipientName?.trim() || 'amigo/a'

  const body = `
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">
  Hola <strong>${greetingName}</strong>,
</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">
  Aquí tienes tu enlace de descarga exclusivo para <strong style="color:#374151;">Recetario AI</strong>.
  Ábrelo desde tu móvil para descargar el APK automáticamente.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border:1px solid #e8dfd4;border-radius:10px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px 24px;text-align:center;">
      <div style="font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8B6F47;margin-bottom:8px;">Tu código</div>
      <div style="font-size:22px;font-weight:700;color:#1f2937;letter-spacing:.15em;font-family:monospace;">${code}</div>
    </td>
  </tr>
</table>
<div style="text-align:center;margin-bottom:28px;">
  <a href="${url}" style="display:inline-block;background:#8B6F47;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
    Descargar Recetario AI →
  </a>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;margin-bottom:8px;">
  <tr>
    <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.6;">
      ⚠️ Este enlace es de un solo uso. Una vez abierto, se descargará el APK automáticamente.
    </td>
  </tr>
</table>`

  const { error } = await resend.emails.send({
    from:    SYSTEM_FROM,
    to,
    subject: 'Tu invitación para Recetario AI',
    html:    emailShell('#8B6F47', 'Invitación', 'Recetario AI', code, body),
  })

  if (error) throw error
}

export async function sendReservationCancelled({
  reservation,
  property,
  landing,
  guests,
  checkin,
  checkout,
  total,
}: ReservationEmailParams): Promise<void> {
  const ref       = reservation.id.slice(0, 8).toUpperCase()
  const guestName = reservation.guest_name.split(' ')[0]

  const body = `
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#374151;">
  Hola <strong>${guestName}</strong>,
</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6b7280;">
  Te informamos de que tu reserva en <strong style="color:#374151;">${property.name}</strong> para el período del
  <strong>${formatDate(checkin)}</strong> al <strong>${formatDate(checkout)}</strong> ha sido <strong style="color:#dc2626;">cancelada</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;margin-bottom:28px;">
  <tr>
    <td style="padding:16px 20px;font-size:13px;color:#991b1b;line-height:1.6;">
      <strong>❌ Reserva cancelada</strong><br>
      Si tienes dudas sobre la cancelación, contacta con el anfitrión.
    </td>
  </tr>
</table>
${hostContact(landing)}
<p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">Ref. ${ref}</p>`

  const { error } = await resend.emails.send({
    from:    buildFromAddress(property.name),
    to:      reservation.guest_email,
    replyTo: landing.contact_email,
    subject: `Reserva cancelada: ${property.name} · ${checkin.toLocaleDateString('es-ES')} — ${checkout.toLocaleDateString('es-ES')}`,
    html:    emailShell('#6b7280', 'Reserva cancelada', property.name, ref, body),
  })

  if (error) console.error('[resend] cancelled email failed:', error)
}
