/**
 * Generates a random, secure token for guest access.
 * Uses Web Crypto API for compatibility with Edge Runtime.
 */
export function generateSecureToken(length: number = 24): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars[array[i] % chars.length];
    }
    return token;
}

/**
 * Generates a SHA-256 fingerprint for a device based on IP and User Agent.
 * Uses SubtleCrypto which is available in Edge Runtime.
 */
export async function generateDeviceFingerprint(ip: string | undefined, userAgent: string | null): Promise<string> {
    const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
    const msgUint8 = new TextEncoder().encode(data);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Validates a guest access token and checks temporal windows.
 */
export async function validateAccessToken(supabase: any, token: string) {
    // We use a dedicated admin client to ensure we can read metadata even with RLS
    const { createEdgeAdminClient } = await import('./supabase/edge');
    const supabaseAdmin = createEdgeAdminClient();

    const { data: access, error } = await supabaseAdmin
        .from('guest_access_tokens')
        .select('*')
        .eq('access_token', token)
        .single();

    if (error || !access) {
        console.error('[SECURITY_LIB] Token lookup failed:', error?.message || 'Not found');
        return { valid: false, reason: 'invalid_token' };
    }

    if (!access.is_active) {
        return { valid: false, reason: 'token_deactivated' };
    }

    const now = new Date();
    const from = access.valid_from ? new Date(access.valid_from) : null;
    const until = access.valid_until ? new Date(access.valid_until) : null;

    if (!from || !until) return { valid: false, reason: 'invalid_token' };

    if (now < from) return { valid: false, reason: 'too_early', availableFrom: from };
    if (now > until) return { valid: false, reason: 'expired', expiredAt: until };

    return { valid: true, access };
}

/**
 * Logs suspicious activity to the database.
 */
export async function logSuspiciousActivity(supabase: any, accessToken: string, activity: {
    type: string;
    details: any;
    ip?: string;
}) {
    await supabase.from('suspicious_activities').insert({
        access_token: accessToken,
        activity_type: activity.type,
        details: activity.details,
        ip_address: activity.ip
    });
}
