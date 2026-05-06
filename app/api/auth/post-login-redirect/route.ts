import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const redirect = cookieStore.get('post_login_redirect')?.value ?? null

  // Limpiar la cookie inmediatamente tras leerla
  if (redirect) {
    cookieStore.delete('post_login_redirect')
  }

  return NextResponse.json({ redirect })
}
