import { createClient } from '@supabase/supabase-js';
import https from 'node:https';
import http from 'node:http';

function makeInsecureFetch(): typeof fetch {
  const agent = new https.Agent({ rejectUnauthorized: false });
  return function insecureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : (input as Request).url;
    const urlStr = typeof url === 'string' ? url : url.toString();
    const u = new URL(urlStr);
    const options = init || {};
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers;
    const headerObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : (headers as Record<string, string>) || {};
    const body = options.body;
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: headerObj,
        agent: u.protocol === 'https:' ? agent : undefined,
      };
      const mod = u.protocol === 'https:' ? https : http;
      const req = mod.request(opts, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          const status = res.statusCode || 0;
          resolve(new Response(Buffer.concat(chunks), {
            status: status === 204 ? 200 : status,
            statusText: res.statusMessage || '',
            headers: new Headers(res.headers as Record<string, string>),
          }));
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  };
}

export function createServerAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('[SERVER-ADMIN] Missing Supabase URL or SERVICE_ROLE_KEY');
  const opts: { global?: { fetch: typeof fetch } } = {};
  if (process.env.DEV_ALLOW_INSECURE_SSL === '1') opts.global = { fetch: makeInsecureFetch() };
  return createClient(url, key, opts);
}
