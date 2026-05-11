import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  let redirect = cookieStore.get('post_login_redirect')?.value ?? null
  
  // Prevent Open Redirect: only allow same-origin or root-relative paths
  if (redirect) {
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const resolved = new URL(redirect, base)
      if (resolved.origin !== new URL(base).origin) {
        redirect = '/dashboard'
      }
    } catch {
      redirect = '/dashboard'
    }
  }

  // Limpiar la cookie inmediatamente tras leerla
  if (redirect) {
    cookieStore.delete('post_login_redirect')
  }

  return NextResponse.json({ redirect })
}
