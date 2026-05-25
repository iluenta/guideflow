import { sendMail } from '@/lib/services/mailer';

export async function sendReservationConfirmation({
  reservation,
  property,
  landing,
  guests,
  checkin,
  checkout,
  total,
}: any) {
  
  const nights = Math.floor((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .detail { margin: 10px 0; }
          .label { font-weight: 600; color: #1e3a8a; }
          .amount { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Reserva confirmada!</h1>
            <p>Referencia: ${reservation.id.slice(0, 8).toUpperCase()}</p>
          </div>
          
          <div class="content">
            <p>Hola <strong>${input_name_placeholder(guests)}</strong>,</p>
            
            <p>Tu reserva en <strong>${property.name}</strong> ha sido confirmada.</p>
            
            <h3>Detalles de la reserva</h3>
            <div class="detail">
              <span class="label">Propiedad:</span> ${property.name}
            </div>
            <div class="detail">
              <span class="label">Entrada:</span> ${checkin.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="detail">
              <span class="label">Salida:</span> ${checkout.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="detail">
              <span class="label">Noches:</span> ${nights}
            </div>
            <div class="detail">
              <span class="label">Huéspedes:</span> ${guests.adults} adulto(s)${guests.children ? `, ${guests.children} niño(s)` : ''}${guests.infants ? `, ${guests.infants} bebé(s)` : ''}${guests.pets ? `, ${guests.pets} mascota(s)` : ''}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <h3>Desglose de costos</h3>
            <div class="detail">
              <span class="label">Total:</span> <span class="amount">${total}€</span>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <h3>Contacto del anfitrión</h3>
            <div class="detail">
              Email: <a href="mailto:${landing.contact_email}">${landing.contact_email}</a>
            </div>
            ${landing.contact_phone ? `<div class="detail">Teléfono: ${landing.contact_phone}</div>` : ''}
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Si tienes preguntas, por favor contacta con el anfitrión.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({
    to: reservation.guest_email,
    subject: `Reserva confirmada: ${property.name} - ${checkin.toLocaleDateString('es-ES')}`,
    html,
  });
}

function input_name_placeholder(guests: any) {
  return guests.adults > 0 ? 'huésped' : 'huéspedes';
}
