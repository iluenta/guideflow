import { NextRequest, NextResponse } from 'next/server'

/**
 * Borra la cookie de acceso de invitado y lleva a la página de acceso denegado.
 *
 * Existe porque un Server Component NO puede modificar cookies durante el
 * renderizado: Next lanza "Cookies can only be modified in a Server Action or
 * Route Handler". app/[slug]/page.tsx lo intentaba al detectar un token
 * caducado, y en vez de mandar al huésped a la página de acceso denegado le
 * reventaba con un "Application error" — justo a quien llega con un enlace
 * viejo, que es el caso más corriente.
 *
 * Es el mismo patrón que /g/[token], que ya delega en un route handler para
 * poder ESCRIBIR la cookie. Este hace lo contrario.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? ''
  const reason = request.nextUrl.searchParams.get('reason') || 'invalid'

  const response = NextResponse.redirect(
    new URL(`/access-denied?reason=${encodeURIComponent(reason)}`, request.url)
  )

  // El slug viene de la URL, así que se valida antes de componer el nombre de
  // la cookie: solo se borra algo con la forma exacta de un slug de propiedad.
  if (/^[a-z0-9-]{1,64}$/i.test(slug)) {
    response.cookies.set(`gf_token_${slug}`, '', { path: '/', maxAge: 0 })
  }

  return response
}
