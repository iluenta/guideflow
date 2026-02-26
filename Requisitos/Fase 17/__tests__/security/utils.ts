/**
 * Utilidades para tests de seguridad
 */

import { vi } from 'vitest';
import type { Request, Response } from 'next/server';

/**
 * Crea un mock de Request de Next.js
 */
export function createMockRequest(
  body?: any,
  headers?: Record<string, string>,
  method: string = 'POST'
): Partial<Request> {
  return {
    method,
    headers: new Headers(headers || {}),
    json: async () => body || {},
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body || {})),
    url: 'http://localhost:3000/api/test',
  } as Partial<Request>;
}

/**
 * Crea un mock de Response de Next.js
 */
export function createMockResponse(): Partial<Response> {
  const headers = new Headers();
  let statusCode = 200;
  let responseBody: any = null;

  const statusMethod = (code: number) => {
    statusCode = code;
    return {
      json: (data: any) => {
        responseBody = data;
        return Promise.resolve(new Response(JSON.stringify(data), { status: code, headers }));
      },
      text: (data: string) => {
        responseBody = data;
        return Promise.resolve(new Response(data, { status: code, headers }));
      },
    };
  };

  const mockResponse: any = {
    status: statusMethod,
    json: (data: any) => {
      responseBody = data;
      return Promise.resolve(new Response(JSON.stringify(data), { status: statusCode, headers }));
    },
    headers,
    get body() {
      return responseBody;
    },
  };

  Object.defineProperty(mockResponse, 'statusCode', {
    get: () => statusCode,
    configurable: true,
  });

  return mockResponse as Partial<Response>;
}

/**
 * Simula múltiples requests concurrentes
 */
export async function simulateConcurrentRequests(
  count: number,
  requestFn: () => Promise<any>
): Promise<Array<{ success: boolean; response: any; error?: any }>> {
  const promises = Array.from({ length: count }, () =>
    requestFn().then(
      (response) => ({ success: true, response }),
      (error) => ({ success: false, response: null, error })
    )
  );

  return Promise.all(promises);
}

/**
 * Extrae datos sensibles de un texto
 */
export function extractSensitiveData(text: string): {
  emails: string[];
  tokens: string[];
  uuids: string[];
  passwords: string[];
} {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const tokenRegex = /[A-Za-z0-9_-]{20,}/g;
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const passwordRegex = /(?:password|pass|pwd)[\s:=]+['"]?([^'"\s]+)['"]?/gi;

  return {
    emails: [...(text.match(emailRegex) || [])],
    tokens: [...(text.match(tokenRegex) || [])],
    uuids: [...(text.match(uuidRegex) || [])],
    passwords: [...(text.match(passwordRegex) || [])],
  };
}

/**
 * Verifica si una respuesta contiene datos sensibles
 */
export function containsSensitiveData(response: any): boolean {
  const responseText = typeof response === 'string' ? response : JSON.stringify(response);
  const sensitive = extractSensitiveData(responseText);

  return (
    sensitive.emails.length > 0 ||
    sensitive.tokens.length > 0 ||
    sensitive.uuids.length > 0 ||
    sensitive.passwords.length > 0
  );
}

/**
 * Crea un mock de Supabase client
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      setSession: vi.fn(),
      verifyOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    },
    from: vi.fn(() => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return queryBuilder;
    }),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: vi.fn(),
        remove: vi.fn(),
      })),
    },
  };
}

/**
 * Crea un mock de usuario autenticado
 */
export function createMockUser(overrides?: any) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      tenant_id: 'test-tenant-id',
      full_name: 'Test User',
    },
    app_metadata: {},
    ...overrides,
  };
}

/**
 * Crea un mock de sesión
 */
export function createMockSession(overrides?: any) {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    user: createMockUser(overrides?.user),
    ...overrides,
  };
}

/**
 * Espera un tiempo específico (útil para tests de rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifica si un string contiene código JavaScript
 */
export function containsJavaScriptCode(text: string): boolean {
  const jsPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /document\./i,
    /window\./i,
    /\.innerHTML/i,
    /\.outerHTML/i,
  ];

  return jsPatterns.some((pattern) => pattern.test(text));
}

/**
 * Verifica si un string contiene SQL injection patterns
 */
export function containsSQLInjection(text: string): boolean {
  const sqlPatterns = [
    /('|(\\')|(;)|(\\;)|(\|)|(\\\|)|(&)|(\\&))(\s)*(OR|AND)(\s)*/i,
    /UNION(\s)+SELECT/i,
    /SELECT(\s)+.*(\s)+FROM/i,
    /INSERT(\s)+INTO/i,
    /UPDATE(\s)+.*(\s)+SET/i,
    /DELETE(\s)+FROM/i,
    /DROP(\s)+TABLE/i,
    /EXEC(\s*\(|(\s)+)/i,
    /xp_cmdshell/i,
    /--/,
    /\/\*/,
    /\/\*.*\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(text));
}

/**
 * Genera un token de acceso de prueba
 */
export function generateTestToken(length: number = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Crea un FormData mock
 */
export function createMockFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}
