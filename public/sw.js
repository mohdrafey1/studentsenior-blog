/* global self, caches */
const CACHE = 'studentsenior-public-static-v1';
const PUBLIC_FILES = new Set([
    '/manifest.json', '/favicon.png', '/app_icon.png',
    '/image192edge.png', '/image512edge.png',
    '/icons/favicon.webp', '/icons/image192.png', '/icons/image512.png',
    '/icons/image192edge.png', '/icons/image512edge.png',
]);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Retire legacy caches that may contain sessions, API data or HTML.
        await Promise.all((await caches.keys()).filter(name => name !== CACHE).map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || request.mode === 'navigate' || url.origin !== self.location.origin ||
        request.headers.has('authorization') || url.search ||
        !(PUBLIC_FILES.has(url.pathname) || url.pathname.startsWith('/_next/static/'))) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === 'basic' &&
            !/private|no-store/i.test(response.headers.get('cache-control') || '') &&
            !/cookie|authorization/i.test(response.headers.get('vary') || '')) {
            await cache.put(request, response.clone());
            const keys = await cache.keys();
            if (keys.length > 100) await cache.delete(keys[0]);
        }
        return response;
    })());
});
