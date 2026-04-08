// ─── lib/chat/security.ts ─────────────────────────────────────────────────────
// Valida la request entrante: token, halt, rate limit, injection.
// Extraído de app/api/chat/route.ts líneas 14–164.

import { logger } from '@/lib/logger';
import { validateAccessToken, generateDeviceFingerprint, logSuspiciousActivity } from '@/lib/security';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { NotificationService } from '@/lib/notifications';
import type { ValidatedRequest } from './types';

type SupabaseClient = ReturnType<typeof import('@/lib/supabase/edge').createEdgeAdminClient>;

// ─── Helper: comprueba halt de propiedad ─────────────────────────────────────

interface HaltCheckResult {
    response: Response | null;
    propertyTier: 'standard' | 'premium' | 'enterprise';
    tenantId: string | null;
}

async function checkHaltStatus(
    supabase: SupabaseClient,
    pidToCheck: string
): Promise<HaltCheckResult> {
    const { data: propertyStatus, error: propError } = await supabase
        .from('properties')
        .select('id, tier, is_halted, halt_expires_at, halt_reason, tenant_id')
        .eq('id', pidToCheck)
        .single();

    if (propError || !propertyStatus) {
        console.error('[CHAT-V2] Property status check failed:', propError?.message);
        return { response: null, propertyTier: 'standard', tenantId: null };
    }

    const propertyTier = ((propertyStatus.tier as any) || 'standard') as 'standard' | 'premium' | 'enterprise';
    const tenantId = propertyStatus.tenant_id ?? null;

    if (propertyStatus.is_halted) {
        const now = new Date();
        const expiresAt = propertyStatus.halt_expires_at ? new Date(propertyStatus.halt_expires_at) : null;
        if (!expiresAt || now < expiresAt) {
            logger.warn(`[SECURITY] Halted property access attempt blocked`);
            return {
                response: new Response(JSON.stringify({
                    error: 'Property suspended',
                    reason: 'property_halted',
                    haltReason: propertyStatus.halt_reason,
                    resetAt: expiresAt,
                }), { status: 403 }),
                propertyTier,
                tenantId,
            };
        } else {
            // Expirado: auto-unhalt
            supabase.from('properties').update({ is_halted: false }).eq('id', pidToCheck);
        }
    }

    return { response: null, propertyTier, tenantId };
}

// ─── Exportación principal ────────────────────────────────────────────────────

export type ValidateChatResult =
    | { validated: ValidatedRequest }
    | { error: Response };

export async function validateChatRequest(
    req: Request,
    supabase: SupabaseClient
): Promise<ValidateChatResult> {
    const body = await req.json();
    const {
        messages,
        propertyId: legacyPropertyId,
        accessToken,
        language = 'es',
        guestSessionId = '',
    } = body;

    const lastMessage: string = messages[messages.length - 1].content;
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const stressSecret = req.headers.get('x-stress-test-secret');
    const isStressTest = stressSecret && stressSecret === process.env.STRESS_TEST_SECRET;

    let propertyId: string = legacyPropertyId;
    let propertyTier: 'standard' | 'premium' | 'enterprise' = 'standard';
    let tenantId: string | null = null;

    // ── Path A: sin token (host o stress test) ───────────────────────────────
    if (!accessToken) {
        if (!isStressTest && legacyPropertyId) {
            const haltCheck = await checkHaltStatus(supabase, legacyPropertyId);
            propertyTier = haltCheck.propertyTier;
            tenantId = haltCheck.tenantId;
            if (haltCheck.response) return { error: haltCheck.response };
        }

        // Verificar sesión de anfitrión
        const { createClient } = await import('@/lib/supabase/server');
        const userSupabase = await createClient();
        const { data: { user } } = await userSupabase.auth.getUser();

        if (user && legacyPropertyId) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            const { data: property } = await supabase.from('properties').select('tenant_id').eq('id', legacyPropertyId).single();

            if (profile?.tenant_id === property?.tenant_id) {
                propertyId = legacyPropertyId;
                tenantId = property?.tenant_id ?? null;
                logger.debug(`[SECURITY] Host session authorized for property`);
            } else {
                console.warn(`[SECURITY] 🛡️ Host ${user.id} attempted to access unauthorized property: ${legacyPropertyId}`);
                return {
                    error: new Response(JSON.stringify({ error: 'No autorizado para esta propiedad' }), { status: 403 }),
                };
            }
        } else {
            console.warn(`[SECURITY] 🛡️ Unauthorized chat attempt from IP: ${ip} without accessToken or Host session.`);
            return {
                error: new Response(JSON.stringify({
                    error: 'Acceso no autorizado. Se requiere un token válido o sesión de anfitrión.',
                    reason: 'missing_token',
                }), { status: 401 }),
            };
        }

        return {
            validated: { propertyId, propertyTier, tenantId, messages, lastMessage, language, guestSessionId, accessToken, ip },
        };
    }

    // ── Path B: con guest accessToken ─────────────────────────────────────────
    const tokenValidation = await validateAccessToken(supabase, accessToken, legacyPropertyId);
    if (!tokenValidation.valid) {
        if (tokenValidation.reason === 'invalid_token' && legacyPropertyId) {
            await logSuspiciousActivity(supabase, accessToken, {
                type: 'property_mismatch_attempt',
                details: { providedPropertyId: legacyPropertyId, ip },
                ip,
            });
        }
        return {
            error: new Response(JSON.stringify({ error: 'Acceso denegado', reason: tokenValidation.reason }), { status: 403 }),
        };
    }

    propertyId = tokenValidation.access.property_id;

    const haltCheck = await checkHaltStatus(supabase, propertyId);
    propertyTier = haltCheck.propertyTier;
    tenantId = haltCheck.tenantId;
    if (haltCheck.response) return { error: haltCheck.response };

    if (!isStressTest) {
        const deviceFingerprint = await generateDeviceFingerprint(ip, userAgent);
        const rateLimit = await RateLimiter.checkChatRateLimit(accessToken, ip, deviceFingerprint, propertyId, propertyTier);

        if (!rateLimit.allowed) {
            await logSuspiciousActivity(supabase, accessToken, {
                type: 'rate_limit_exceeded',
                details: { reason: rateLimit.reason, ip },
                ip,
            });

            if (rateLimit.reason === 'property_limit_exceeded') {
                const haltReason = 'Consumo anómalo detectado (Posible abuso/bot)';
                await supabase.from('properties').update({
                    is_halted: true,
                    halt_reason: haltReason,
                    halt_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                }).eq('id', propertyId);

                await NotificationService.notifyEmergencyHalt({
                    propertyId, type: 'EMERGENCY_HALT', reason: haltReason,
                    details: { rateLimitReason: rateLimit.reason, ip },
                });
            }

            return {
                error: new Response(JSON.stringify({
                    error: rateLimit.message, resetAt: rateLimit.resetAt, reason: rateLimit.reason,
                }), { status: 429 }),
            };
        }

        if (lastMessage.length > 500) {
            return {
                error: new Response(JSON.stringify({ error: 'Mensaje demasiado largo (máximo 500 caracteres)' }), { status: 400 }),
            };
        }

        const suspiciousPatterns = [/ignore previous instructions/i, /system prompt/i, /<script>/i, /you are now/i];
        if (suspiciousPatterns.some(p => p.test(lastMessage))) {
            await logSuspiciousActivity(supabase, accessToken, {
                type: 'prompt_injection_attempt',
                details: { message: lastMessage },
                ip,
            });
            return {
                error: new Response(JSON.stringify({ error: 'Contenido no permitido' }), { status: 400 }),
            };
        }
    }

    return {
        validated: { propertyId, propertyTier, tenantId, messages, lastMessage, language, guestSessionId, accessToken, ip },
    };
}
