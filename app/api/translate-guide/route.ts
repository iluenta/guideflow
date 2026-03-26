import { NextResponse } from 'next/server';
import { Translator } from '@/lib/gemini-i18n';
import { validateAccessToken, logSuspiciousActivity } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const translateSchema = z.object({
    text: z.string().min(1).max(10000).optional(),
    batch: z.array(z.string()).optional(), // FOTC Fix: allow array for prefetching
    targetLanguage: z.string(),
    sourceLanguage: z.string().optional().default('es'),
    contextType: z.string().optional().default('general'),
    accessToken: z.string().optional(),
    propertyId: z.string().optional()
});

export async function POST(req: Request) {
    // Declared outside try so they're accessible in catch for error logging
    let isAuthenticated = false;
    let propertyId: string | undefined;

    try {
        let body;
        try {
            body = await req.json();
            if (!body) throw new Error("Empty body");
        } catch (e) {
            console.warn('[API_TRANSLATE] ⚠️ Empty or invalid JSON body');
            return NextResponse.json({ error: 'Cuerpo de solicitud inválido o vacío' }, { status: 400 });
        }
        
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        console.log(`[API_TRANSLATE] 📥 Request for "${body.targetLanguage || '?'}" | Batch: ${!!body.batch} | HasToken: ${!!body.accessToken}`);

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


        }

        if (!isAuthenticated || !propertyId) {
            await logSuspiciousActivity(supabaseAdmin, accessToken || 'none', {
                type: 'UNAUTHORIZED_TRANSLATE_ATTEMPT',
                details: { hasAuthCookie, bodyPropertyId },
                ip
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
        const maxRequests = accessToken ? 1000 : 500; // Increased to 500/min per IP due to component-level translations (e.g. 60 reqs per AI recommendations page)

        const limit = await RateLimiter.checkLimit(rateLimitKey, {
            windowMs: 60 * 1000,
            maxRequests,
            message: 'Demasiadas solicitudes de traducción.'
        });

        if (!limit.allowed) {
            await logSuspiciousActivity(supabaseAdmin, accessToken || 'none', {
                type: 'RATE_LIMIT_EXCEEDED_TRANSLATE',
                details: { ip },
                ip
            });
            return NextResponse.json({ error: limit.message }, { status: 429 });
        }

        if (targetLanguage === sourceLanguage) {
            if (result.data.batch) {
                const echo: Record<string, string> = {};
                result.data.batch.forEach(t => echo[t] = t);
                return NextResponse.json({ translations: echo });
            }
            return NextResponse.json({ translatedText: text });
        }

        // 4. Perform Translation (FASE 17: Passing propertyId)
        if (result.data.batch) {
            const { translations: results } = await Translator.translateBatch(
                result.data.batch,
                targetLanguage,
                sourceLanguage,
                `This is part of UI labels for a vacation rental guest.`,
                propertyId
            );

            return NextResponse.json({ translations: results });
        }

        const translatedText = await Translator.translateText(
            text!,
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
