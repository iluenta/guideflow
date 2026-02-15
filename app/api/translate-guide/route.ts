import { NextResponse } from 'next/server';
import { Translator } from '@/lib/gemini-i18n';
import { validateAccessToken } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const translateSchema = z.object({
    text: z.string().min(1).max(10000),
    targetLanguage: z.string().length(2),
    sourceLanguage: z.string().length(2).optional().default('es'),
    contextType: z.string().optional().default('general'),
    accessToken: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // 1. Validation with Zod
        const result = translateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ 
                error: 'Parámetros inválidos', 
                details: result.error.format() 
            }, { status: 400 });
        }

        const { text, targetLanguage, sourceLanguage, contextType, accessToken } = result.data;
        const bodyPropertyId = (body as any).propertyId;

        let isAuthenticated = false;
        let propertyId: string | undefined;

        // Initialize Supabase Admin safely for Edge Runtime
        const { createEdgeAdminClient } = await import('@/lib/supabase/edge');
        const supabaseAdmin = createEdgeAdminClient();

        if (accessToken) {
            // FASE 22: Enforce property mismatch check if both are provided
            const authResult = await validateAccessToken(supabaseAdmin, accessToken, bodyPropertyId);
            if (authResult.valid) {
                isAuthenticated = true;
                propertyId = authResult.access?.property_id;
            } else if (authResult.reason === 'invalid_token' && bodyPropertyId) {
                console.warn('[API_TRANSLATE] 🛡️ Security: Token property mismatch or invalid');
            }
        }

        const cookieHeader = req.headers.get('cookie') || '';
        const hasAuthCookie = cookieHeader.includes('sb-') && cookieHeader.includes('-auth-token');

        // Check for host session if no guest token or propertyId (Admins translating from dashboard)
        if (!isAuthenticated || !propertyId) {
            if (hasAuthCookie) {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    isAuthenticated = true;
                    if (bodyPropertyId) propertyId = bodyPropertyId;
                }
            }

            // FASE 18: Public Fallback for landing pages
            // ONLY ALLOW if NO accessToken was provided. If an accessToken was provided and failed,
            // we do NOT fallback to public mode (Security: prevent bypassing token restrictions)
            if (!isAuthenticated && bodyPropertyId && !accessToken) {
                const { data: propertyExists } = await supabaseAdmin
                    .from('properties')
                    .select('id')
                    .eq('id', bodyPropertyId)
                    .single();
                
                if (propertyExists) {
                    isAuthenticated = true; // Authorized as public
                    propertyId = bodyPropertyId;
                }
            }
        }

        if (!isAuthenticated || !propertyId) {
            console.warn('[API_TRANSLATE] 🔐 401 Unauthorized: ', {
                hasAccessToken: !!accessToken,
                hasAuthCookie,
                hasBodyPropertyId: !!bodyPropertyId,
                isAuthenticated,
                resolvedPropertyId: propertyId
            });
            return NextResponse.json({ error: 'No autorizado o PropertyId faltante' }, { status: 401 });
        }

        // FASE 22: Check for Property Halt Status
        const { data: propStatus } = await supabaseAdmin
            .from('properties')
            .select('is_halted, halt_reason, halt_expires_at')
            .eq('id', propertyId)
            .single();

        if (propStatus?.is_halted) {
            const now = new Date();
            const expires = propStatus.halt_expires_at ? new Date(propStatus.halt_expires_at) : null;
            if (!expires || now < expires) {
                return NextResponse.json({ 
                    error: 'Servicio pausado temporalmente', 
                    reason: 'property_halted',
                    details: propStatus.halt_reason 
                }, { status: 403 });
            }
        }

        // 3. Rate Limiting
        const rateLimitKey = accessToken ? `trans:token:${accessToken}` : `trans:ip:${ip}`;
        const maxRequests = accessToken ? 500 : 100;

        const limit = await RateLimiter.checkLimit(rateLimitKey, {
            windowMs: 60 * 1000,
            maxRequests,
            message: 'Demasiadas solicitudes de traducción.'
        });

        if (!limit.allowed) {
            return NextResponse.json({ error: limit.message }, { status: 429 });
        }

        if (targetLanguage === sourceLanguage) {
            return NextResponse.json({ translatedText: text });
        }

        // 4. Perform Translation (FASE 17: Passing propertyId)
        const translatedText = await Translator.translateText(
            text,
            targetLanguage,
            sourceLanguage,
            `This is part of a ${contextType} for a vacation rental guest.`,
            propertyId
        );

        return NextResponse.json({ translatedText });

    } catch (error: any) {
        console.error('[API_TRANSLATE] Fatal Error:', {
            message: error.message,
            stack: error.stack,
            propertyId,
            isAuthenticated
        });
        return NextResponse.json({ 
            error: 'Error interno del servidor',
            details: error.message 
        }, { status: 500 });
    }
}
