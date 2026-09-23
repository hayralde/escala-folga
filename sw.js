// Service worker do Portal de Escala de Folga.
// Estratégia "rede primeiro": online sempre busca a versão nova; sem conexão usa a cópia em cache.
// Os dados do Supabase nunca são cacheados aqui (o app já guarda a última cópia no localStorage).
const CACHE = 'escala-folga-v1.5.0';
const CACHEABLE_HOSTS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin && !CACHEABLE_HOSTS.includes(url.hostname)) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (cached) return cached;
      throw e;
    }
  })());
});
