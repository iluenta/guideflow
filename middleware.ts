import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    // 1. Skip middleware for static assets, favicon, etc.
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname === '/favicon.ico' ||
        pathname === '/access-denied' ||
        pathname.startsWith('/api/') // Skip API routes to avoid redundant checks
    ) {
        return NextResponse.next()
    }

    // 2. Initialize response
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 3. Initialize Supabase Client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // 4. Refresh session and get user
    let user = null
    try {
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch (e) {
        console.error('[MIDDLEWARE] Auth error:', e)
    }

    // 5. Protected Dashboard Routes
    if (pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // 6. Redirect Authenticated Users away from Auth Pages
    if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 7. Guest Access Security (Fase 4 logic from proxy.ts)
    const reservedRoutes = [
        'dashboard', 'auth', 'api', 'access-denied',
        '_next', 'static', 'guide', 'p',
        'sw.js', 'manifest.json', 'robots.txt', 'favicon.ico'
    ]
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]

    // Identify guide routes (non-reserved routes)
    if (firstSegment && !reservedRoutes.includes(firstSegment)) {
        // We use a separate admin client to verify property and tokens
        // This avoids issues with RLS in the middleware
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Identify requested property
        let { data: requestedProperty } = await supabaseAdmin
            .from('properties')
            .select('id, tenant_id')
            .eq('slug', firstSegment)
            .maybeSingle()

        if (!requestedProperty) {
            // Fallback to ID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(firstSegment);
            if (isUUID) {
                const { data: byId } = await supabaseAdmin
                    .from('properties')
                    .select('id, tenant_id')
                    .eq('id', firstSegment)
                    .maybeSingle()
                requestedProperty = byId
            }
        }

        // If no property found, it's NOT a guide route. Return the response.
        if (!requestedProperty) {
            return response
        }

        // Host Bypass: Owners can bypass token check
        if (user) {
            let userTenantId = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
            if (!userTenantId) {
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('tenant_id')
                    .eq('id', user.id)
                    .single()
                userTenantId = profile?.tenant_id
            }

            if (userTenantId && requestedProperty.tenant_id === userTenantId) {
                return response
            }
        }

        // Guests MUST have a token
        if (!token) {
            return NextResponse.redirect(new URL('/access-denied?reason=token_required', request.url))
        }

        const cleanToken = token.trim();
        const { data: access, error: dbError } = await supabaseAdmin
            .from('guest_access_tokens')
            .select('*')
            .eq('access_token', cleanToken)
            .eq('property_id', requestedProperty.id)
            .single()

        if (dbError || !access || !access.is_active) {
            return NextResponse.redirect(new URL('/access-denied?reason=invalid', request.url))
        }

        const now = new Date()
        const validFrom = access.valid_from ? new Date(access.valid_from) : null
        const validUntil = access.valid_until ? new Date(access.valid_until) : null

        if (!validFrom || !validUntil || now < validFrom || now > validUntil) {
            const reason = now < (validFrom || now) ? 'too_early' : 'expired'
            return NextResponse.redirect(new URL(`/access-denied?reason=${reason}`, request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
