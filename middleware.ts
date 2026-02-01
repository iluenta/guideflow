import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createEdgeAdminClient } from '@/lib/supabase/edge'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl
    const token = searchParams.get('token')

    // 1. Skip middleware for static assets and favicon
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname === '/favicon.ico' ||
        pathname === '/access-denied'
    ) {
        return NextResponse.next()
    }

    // 2. Initialize Supabase Client
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({ request: { headers: request.headers } })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Protected Dashboard Routes
    if (pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 4. Redirect Authenticated Users away from Auth Pages
    if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 5. Guest Access Security (Fase 4)
    // Identify guide routes (slug routes)
    const reservedRoutes = [
        'dashboard', 'auth', 'api', 'access-denied',
        '_next', 'static', 'guide', 'p',
        'sw.js', 'manifest.json', 'robots.txt', 'favicon.ico'
    ]
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]

    // 5. Guest Access Security (Fase 4)
    // Identify guide routes (non-reserved routes)
    if (firstSegment && !reservedRoutes.includes(firstSegment)) {

        const supabaseAdmin = createEdgeAdminClient()

        // 5.1 Identify requested property
        const { data: requestedProperty, error: propError } = await supabaseAdmin
            .from('properties')
            .select('id, tenant_id')
            .eq('slug', firstSegment)
            .single()

        // 5.2 Smart Host Bypass: Only owners can bypass token check
        if (user && requestedProperty) {
            const userTenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
            if (requestedProperty.tenant_id === userTenantId) {
                console.log(`[SECURITY] HOST BYPASS: Owner access granted for ${firstSegment}`);
                return response
            }
        }

        // Guests (and users accessing other communities) MUST have a token
        if (!token) {
            console.log(`[SECURITY] REJECTED: No token provided for path ${pathname}`);
            return NextResponse.redirect(new URL('/access-denied?reason=token_required', request.url))
        }

        const cleanToken = token.trim();
        console.log(`[SECURITY] Validating token for path: ${pathname}`);

        // 5.3 Validate Token with Strict Property Binding
        const { data: access, error: dbError } = await supabaseAdmin
            .from('guest_access_tokens')
            .select('*')
            .eq('access_token', cleanToken)
            .eq('property_id', requestedProperty?.id) // BINDING: Must match propertyId
            .single()

        if (dbError || !access) {
            console.error(`[SECURITY] INVALID: Token "${cleanToken}" for property "${firstSegment}"`);
            return NextResponse.redirect(new URL(`/access-denied?reason=invalid`, request.url))
        }

        if (!access.is_active) {
            return NextResponse.redirect(new URL('/access-denied?reason=inactive', request.url))
        }

        const now = new Date()
        const validFrom = access.valid_from ? new Date(access.valid_from) : null
        const validUntil = access.valid_until ? new Date(access.valid_until) : null

        if (!validFrom || isNaN(validFrom.getTime()) || !validUntil || isNaN(validUntil.getTime())) {
            console.error('[SECURITY] Error: Invalid dates in DB')
            return NextResponse.redirect(new URL('/access-denied?reason=invalid', request.url))
        }

        // Compare using UTC timestamps
        if (now.getTime() < validFrom.getTime()) {
            console.warn('[SECURITY] Access denied: Too early')
            return NextResponse.redirect(new URL(`/access-denied?reason=too_early&date=${validFrom.toISOString()}`, request.url))
        }

        if (now.getTime() > validUntil.getTime()) {
            console.warn(`[SECURITY] Access denied: Expired. Until: ${validUntil.toISOString()}, Now: ${now.toISOString()}`);
            return NextResponse.redirect(new URL('/access-denied?reason=expired', request.url))
        }

        console.log(`[SECURITY] ACCESS GRANTED: Guest ${access.guest_name}`);
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
