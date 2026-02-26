import { createEdgeAdminClient } from '@/lib/supabase/edge'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl
    const token = searchParams.get('token')

    // 1. Skip for static assets, API, auth pages and favicon
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/auth') ||
        pathname === '/favicon.ico' ||
        pathname === '/access-denied'
    ) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // 2. Detección de sesión por cookie (sin llamar a Supabase = sin fetch = evita "fetch failed" con proxy/SSL)
    const hasAuthCookie = request.cookies
        .getAll()
        .some((c) => c.name.includes('auth-token') && (c.value?.length ?? 0) > 0)

    // 3. Rutas protegidas del Dashboard
    if (pathname.startsWith('/dashboard') && !hasAuthCookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 4. Redirigir usuarios autenticados fuera de auth
    if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && hasAuthCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 5. Guest Access Security (Fase 4)
    const reservedRoutes = [
        'dashboard', 'auth', 'api', 'access-denied',
        '_next', 'static', 'guide', 'p',
        'sw.js', 'manifest.json', 'robots.txt', 'favicon.ico'
    ]
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]

    if (firstSegment && !reservedRoutes.includes(firstSegment)) {
        try {
            const supabaseAdmin = createEdgeAdminClient()

            let { data: requestedProperty } = await supabaseAdmin
                .from('properties')
                .select('id, tenant_id')
                .eq('slug', firstSegment)
                .maybeSingle()

            if (!requestedProperty) {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstSegment)
                if (isUUID) {
                    const { data: byId } = await supabaseAdmin
                        .from('properties')
                        .select('id, tenant_id')
                        .eq('id', firstSegment)
                        .maybeSingle()
                    requestedProperty = byId
                }
            }

            if (!requestedProperty) {
                return response
            }

            // Sin usuario en Edge (evitamos fetch); el bypass de propietario se puede hacer en la página si hace falta
            if (!token) {
                return NextResponse.redirect(new URL('/access-denied?reason=token_required', request.url))
            }

            const cleanToken = token.trim()

            const { data: access, error: dbError } = await supabaseAdmin
                .from('guest_access_tokens')
                .select('*')
                .eq('access_token', cleanToken)
                .eq('property_id', requestedProperty.id)
                .single()

            if (dbError || !access) {
                return NextResponse.redirect(new URL('/access-denied?reason=invalid', request.url))
            }

            if (!access.is_active) {
                return NextResponse.redirect(new URL('/access-denied?reason=inactive', request.url))
            }

            const now = new Date()
            const validFrom = access.valid_from ? new Date(access.valid_from) : null
            const validUntil = access.valid_until ? new Date(access.valid_until) : null

            if (!validFrom || isNaN(validFrom.getTime()) || !validUntil || isNaN(validUntil.getTime())) {
                return NextResponse.redirect(new URL('/access-denied?reason=invalid', request.url))
            }

            if (now.getTime() < validFrom.getTime()) {
                return NextResponse.redirect(new URL(`/access-denied?reason=too_early&date=${validFrom.toISOString()}`, request.url))
            }

            if (now.getTime() > validUntil.getTime()) {
                return NextResponse.redirect(new URL('/access-denied?reason=expired', request.url))
            }
        } catch (_) {
            // Red/SSL falla en Edge (ej. proxy corporativo): dejar pasar; la página puede validar en servidor
            return response
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
