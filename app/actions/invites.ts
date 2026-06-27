'use server'

import { sendApkInviteEmail } from '@/lib/email/resend'

export async function sendInviteEmailAction(params: {
  to: string
  recipientName?: string | null
  code: string
  url: string
}): Promise<{ success: true } | { error: string }> {
  if (!params.to?.trim()) {
    return { error: 'Falta el email del destinatario.' }
  }

  try {
    await sendApkInviteEmail(params)
    return { success: true }
  } catch (error) {
    console.error('[invites] sendInviteEmailAction failed:', error)
    return { error: 'No se pudo enviar el email.' }
  }
}
