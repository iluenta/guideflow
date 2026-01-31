import { createEdgeClient } from '@/lib/supabase/edge'

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
}

const RATE_LIMITS = {
    // Per IP (1 minute)
    ip: {
        windowMs: 60 * 1000,
        maxRequests: 10,
        message: 'Demasiadas solicitudes desde esta conexión. Espera un minuto.'
    },
    // Per Access Token (1 minute - burst protection)
    token_minute: {
        windowMs: 60 * 1000,
        maxRequests: 5,
        message: 'Vas muy rápido. Espera un poco entre mensajes.'
    },
    // Per Access Token (Daily limit - cost protection)
    token_daily: {
        windowMs: 24 * 60 * 60 * 1000,
        maxRequests: 50,
        message: 'Has alcanzado el límite diario de mensajes.'
    },
    // Per Device Fingerprint (1 minute)
    device: {
        windowMs: 60 * 1000,
        maxRequests: 8,
        message: 'Límite de mensajes por dispositivo alcanzado.'
    }
};

export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    message?: string;
    remaining?: number;
    resetAt?: Date;
}

export class RateLimiter {
    private static async checkLimit(
        key: string,
        config: RateLimitConfig
    ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
        const supabase = createEdgeClient()
        const now = Date.now()
        const windowStart = new Date(now - config.windowMs).toISOString()

        // 1. Count requests in window
        const { count, error } = await supabase
            .from('rate_limit_requests')
            .select('*', { count: 'exact', head: true })
            .eq('key', key)
            .gte('timestamp', windowStart)

        if (error) {
            console.error('[RATE-LIMIT] Select error:', error.message)
            return { allowed: true, remaining: 1, resetAt: new Date() }
        }

        const requestCount = count || 0
        const allowed = requestCount < config.maxRequests
        const remaining = Math.max(0, config.maxRequests - requestCount)
        const resetAt = new Date(now + config.windowMs)

        if (allowed) {
            // 2. Register this request
            await supabase
                .from('rate_limit_requests')
                .insert({ key, timestamp: new Date().toISOString() })
        }

        return { allowed, remaining, resetAt }
    }

    /**
     * Checks all rate limit levels for a chat request.
     */
    static async checkChatRateLimit(
        accessToken: string,
        ip: string,
        deviceFingerprint: string
    ): Promise<RateLimitResult> {
        // Level 1: IP Rate Limit
        const ipLimit = await this.checkLimit(`ip:${ip}`, RATE_LIMITS.ip)
        if (!ipLimit.allowed) {
            return { allowed: false, reason: 'ip_rate_limit', message: RATE_LIMITS.ip.message, resetAt: ipLimit.resetAt }
        }

        // Level 2: Token Minute Limit
        const tokenMinLimit = await this.checkLimit(`token:min:${accessToken}`, RATE_LIMITS.token_minute)
        if (!tokenMinLimit.allowed) {
            return { allowed: false, reason: 'token_minute_limit', message: RATE_LIMITS.token_minute.message, resetAt: tokenMinLimit.resetAt }
        }

        // Level 3: Token Daily Limit
        // Note: For MVP we use the same mechanism, but in production we'd use a dedicated counter in guest_access_tokens
        const tokenDailyLimit = await this.checkLimit(`token:daily:${accessToken}`, RATE_LIMITS.token_daily)
        if (!tokenDailyLimit.allowed) {
            return { allowed: false, reason: 'daily_limit_exceeded', message: RATE_LIMITS.token_daily.message, resetAt: tokenDailyLimit.resetAt }
        }

        // Level 4: Device Limit
        const deviceLimit = await this.checkLimit(`device:${deviceFingerprint}`, RATE_LIMITS.device)
        if (!deviceLimit.allowed) {
            return { allowed: false, reason: 'device_rate_limit', message: RATE_LIMITS.device.message, resetAt: deviceLimit.resetAt }
        }

        return {
            allowed: true,
            remaining: Math.min(ipLimit.remaining, tokenMinLimit.remaining, tokenDailyLimit.remaining, deviceLimit.remaining)
        }
    }
}
