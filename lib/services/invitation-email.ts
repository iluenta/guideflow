import { sendMail } from '@/lib/services/mailer'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin:   'Puede gestionar propiedades, reservas y configuración, pero no invitar miembros ni ver facturación',
  support: 'Puede gestionar comunicación con huéspedes y reservas, sin acceso a finanzas ni ajustes',
  viewer:  'Solo puede ver propiedades, reservas e informes sin hacer cambios',
}

const ROLE_LABELS: Record<string, string> = {
  admin:   'Administrador',
  support: 'Soporte',
  viewer:  'Visualizador',
}

interface SendInvitationEmailParams {
  to: string
  inviterName: string
  tenantName: string
  tenantRole: string
  token: string
}

export async function sendInvitationEmail({
  to,
  inviterName,
  tenantName,
  tenantRole,
  token,
}: SendInvitationEmailParams): Promise<void> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const acceptUrl = `${siteUrl}/accept-invitation?token=${token}`
  const roleLabel = ROLE_LABELS[tenantRole] ?? tenantRole
  const roleDesc = ROLE_DESCRIPTIONS[tenantRole] ?? ''

  const subject = `[Hospyia] ${inviterName} te ha invitado a colaborar en ${tenantName}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1593D2;padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Hospyia</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Hola, ${to}</p>
              <h1 style="margin:0 0 20px;color:#0f172a;font-size:20px;font-weight:700;line-height:1.3;">
                ${inviterName} te ha invitado a colaborar en <span style="color:#1593D2;">${tenantName}</span>
              </h1>
              <div style="background:#f0f9ff;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#0369a1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Tu rol</p>
                <p style="margin:0 0 6px;color:#0f172a;font-size:16px;font-weight:700;">${roleLabel}</p>
                <p style="margin:0;color:#4b5563;font-size:13px;">${roleDesc}</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}"
                       style="display:inline-block;background:#1593D2;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-align:center;">
                Si el botón no funciona, copia este enlace en tu navegador:
              </p>
              <p style="margin:0;color:#1593D2;font-size:12px;word-break:break-all;text-align:center;">
                <a href="${acceptUrl}" style="color:#1593D2;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                Este enlace caduca en 7 días. Si no esperabas esta invitación, puedes ignorar este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await sendMail({ to, subject, html })
}
