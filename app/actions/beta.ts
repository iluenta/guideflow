'use server'

import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { sendMail } from '@/lib/services/mailer'

interface BetaResult {
    success?: boolean
    error?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitBetaSignup(formData: FormData): Promise<BetaResult> {
    const email = formData.get('email')?.toString().trim() ?? ''
    const properties = formData.get('properties')?.toString().trim() ?? ''
    const city = formData.get('city')?.toString().trim() ?? ''

    if (!email || !EMAIL_REGEX.test(email)) {
        return { error: 'Por favor, introduce un email válido.' }
    }

    const supabase = createServerAdminClient()

    const { error: dbError } = await supabase
        .from('beta_signups')
        .insert({ email, properties, city })

    if (dbError) {
        if (dbError.code === '23505') {
            return { error: 'Este email ya está en la lista de espera. ¡Pronto tendrás noticias!' }
        }
        console.error('[BETA] DB insert error:', dbError.message)
        return { error: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.' }
    }

    const notifyEmail = process.env.BETA_NOTIFY_EMAIL ?? 'hola@hospyia.com'
    const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

    // Email al administrador
    try {
        await sendMail({
            to: notifyEmail,
            subject: `🎉 Nueva solicitud beta — ${email}`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px;background:#f1f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(15,23,42,0.08);">
    <tr><td style="background:#1e3a8a;padding:28px 32px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;">Hospyia <span style="color:#2dd4bf;">●</span></p>
      <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.15em;text-transform:uppercase;font-family:'Courier New',monospace;">Nueva solicitud beta</p>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="margin:0 0 20px;font-size:18px;color:#0f172a;">Nueva plaza solicitada</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#94a3b8;width:120px;font-family:'Courier New',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;">${email}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#94a3b8;font-family:'Courier New',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Propiedades</td>
            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">${properties || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#94a3b8;font-family:'Courier New',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Ciudad</td>
            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">${city || '—'}</td></tr>
        <tr><td style="padding:10px 0;color:#94a3b8;font-family:'Courier New',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Fecha</td>
            <td style="padding:10px 0;color:#0f172a;">${timestamp}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Hospyia · Gestión inteligente de alojamientos vacacionales</p>
    </td></tr>
  </table>
</body>
</html>`,
        })
    } catch (err) {
        console.error('[BETA] Admin email failed:', err)
    }

    // Email de confirmación al usuario
    try {
        await sendMail({
            to: email,
            subject: 'Tu plaza en Hospyia está reservada ✓',
            html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:48px 16px;background:#f1f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Tu plaza en la beta privada de Hospyia está confirmada.</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 16px rgba(15,23,42,0.08);">

        <tr><td style="background-color:#1e3a8a;padding:36px 40px 32px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
            <tr>
              <td style="width:64px;height:64px;border-radius:50%;background-color:rgba(255,255,255,0.15);text-align:center;vertical-align:middle;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;font-weight:800;color:#ffffff;line-height:64px;">H</td>
              <td style="width:0;padding:0;vertical-align:top;"><div style="width:12px;height:12px;border-radius:50%;background-color:#2dd4bf;margin-left:-10px;margin-top:8px;border:2px solid #1e3a8a;"></div></td>
            </tr>
          </table>
          <p style="margin:0;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Hospyia</p>
          <p style="margin:6px 0 0;font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,0.55);letter-spacing:0.18em;text-transform:uppercase;">Beta privada · 100 plazas</p>
        </td></tr>

        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 20px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">Acceso anticipado confirmado</p>
          <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;line-height:1.1;">
            ¡Estás dentro, ${email.split('@')[0]}!
          </h1>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#475569;">
            Tu plaza en la beta privada de Hospyia está reservada. En las próximas <strong>48 horas</strong> nos ponemos en contacto contigo para configurar tu primera propiedad.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#f0fdf9;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;">
                <p style="margin:0;font-size:14px;color:#065f46;line-height:1.6;">
                  ✓ &nbsp;Acceso gratuito durante toda la beta<br/>
                  ✓ &nbsp;50% de descuento de por vida al lanzar<br/>
                  ✓ &nbsp;Línea directa con el equipo de Hospyia
                </p>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"/></td></tr>

        <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;border-radius:0 0 20px 20px;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#1e3a8a;">Hospyia <span style="color:#2dd4bf;">&#9679;</span></p>
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
            Gestión inteligente de alojamientos vacacionales<br/>
            <a href="mailto:hola@hospyia.com" style="color:#1e3a8a;text-decoration:none;">hola@hospyia.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
        })
    } catch (err) {
        console.error('[BETA] Confirmation email failed:', err)
    }

    return { success: true }
}
