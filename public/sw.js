// CACHE_NAME incluye la fecha de build para invalidar automáticamente
// en cada deploy de Vercel. El valor se inyecta en build time desde next.config.js
// a través de una variable de entorno NEXT_PUBLIC_BUILD_ID.
const BUILD_ID = self.__BUILD_ID || Date.now();
const CACHE_NAME = `guideflow-cache-${BUILD_ID}`;

const STATIC_ASSETS = [
    '/favicon.ico',
    '/icon.svg',
    '/manifest.json',
];

// ─── Install: cachear solo assets verdaderamente estáticos ────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activa inmediatamente sin esperar a que cierren las pestañas abiertas
    self.skipWaiting();
});

// ─── Activate: eliminar TODOS los caches anteriores ──────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Toma control de todas las pestañas abiertas inmediatamente
            return self.clients.claim();
        })
    );
});

// ─── Fetch: estrategia diferenciada por tipo de recurso ──────────────────────
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. Chunks de Next.js — NUNCA cachear, siempre red
    if (url.includes('/_next/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 2. API routes y traducciones — siempre red, sin caché
    if (url.includes('/api/') || url.includes('supabase.co')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // ✅ NUEVO: Imágenes de Next.js Image Optimization — Cache-First
    // Vercel ya optimiza y sirve desde CDN; el SW solo cachea localmente.
    // Las imágenes de propiedades no cambian, no necesitamos revalidar.
    if (url.includes('/_next/image') || url.match(/\.(avif|webp|jpg|jpeg|png)(\?|$)/)) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cached = await cache.match(event.request);
                if (cached) return cached; // ✅ Hit: devuelve y NO lanza red
                
                const response = await fetch(event.request);
                if (response && response.status === 200) {
                    cache.put(event.request, response.clone());
                }
                return response;
            })
        );
        return;
    }

    // 3. Documento HTML (la guía, el dashboard) — Network First
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 4. Assets estáticos — Stale While Revalidate (solo favicon, manifest, etc.)
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cached) => {
                const networkFetch = fetch(event.request).then((response) => {
                    if (response && response.status === 200 && event.request.method === 'GET') {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(() => cached);

                return cached || networkFetch;
            });
        })
    );
});
