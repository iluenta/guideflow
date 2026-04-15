import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Definir rutas públicas que NO requieren autenticación
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/api/auth/') ||
        pathname === '/api/chat' ||           // Auth delegada al handler (validateChatRequest)
        pathname === '/api/tracking' ||       // Auth delegada al handler (validateAccessToken)
        pathname === '/api/translate-guide' || // Auth delegada al handler (validateAccessToken)
        pathname.startsWith('/access-denied') ||
        pathname.startsWith('/g/') || // Rutas de tokens de invitado
        // Excluir archivos estáticos y de sistema (Next.js suele manejarlos, pero por seguridad)
        pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|txt)$/) ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/public/');

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
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Al refrescar el usuario, Supabase maneja los tokens de sesión automáticamente
    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()
        if (!error && data) {
            user = data.user
        }
    } catch (e) {
        // En caso de error (e.g. Refresh Token Not Found), user queda null
        // y el middleware redirigirá si es una ruta protegida.
    }

    // 2. Proteger rutas sin sesión
    if (!user && !isPublicRoute) {
        // Las rutas /api/ no pueden recibir un redirect HTML — devolver 401 JSON.
        // El cliente detecta el 401 y redirige a login por su cuenta.
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Las rutas de dashboard redirigen a login con la URL original para volver
        if (pathname.startsWith('/dashboard')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('next', pathname)
            return NextResponse.redirect(url)
        }
    }

    // 3. Si tienes usuario e intentas ir a login/signup, mándalo al dashboard
    if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}
