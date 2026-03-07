import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function proxy(request: NextRequest) {
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

    // Identify guide routes    // Identify requested property
    let requestedProperty = null
    // pathSegments and firstSegment are already defined above
    // const pathSegments = pathname.split('/').filter(Boolean)
    // const firstSegment = pathSegments[0]

    if (firstSegment && !reservedRoutes.includes(firstSegment)) {
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: prop } = await supabaseAdmin
            .from('properties')
            .select('id, tenant_id, status')
            .eq('slug', firstSegment)
            .maybeSingle()

        requestedProperty = prop
    }

    // 7. Token -> Cookie Redirect (NEW FLOW)
    if (requestedProperty && token) {
        // We found a guide route and a token in the URL
        const cookieName = `gf_token_${firstSegment}`

        // 1. Create response that sets the cookie
        const redirectResponse = NextResponse.redirect(new URL(pathname, request.url))

        redirectResponse.cookies.set({
            name: cookieName,
            value: token.trim(),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return redirectResponse
    }

    // 8. Normal Auth/Host handling (Existing logic, slightly simplified as page.tsx will do hard validation)
    if (requestedProperty) {
        // If it's a guide route, we let it through to page.tsx
        // page.tsx will handle:
        // - Host bypass
        // - Token/Cookie validation
        // - Redirection to access-denied
        return response
    }

    return response
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
