const CACHE_SHELL = 'focusflow-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((clave) => clave !== CACHE_SHELL).map((clave) => caches.delete(clave))),
      )
      .then(() => self.clients.claim()),
  );
});

// Solo cachea peticiones GET al propio origen (assets/HTML del frontend), nunca a la API del
// backend (otro origen), para no servir datos de usuario obsoletos ni interferir con la sesión.
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  if (new URL(evento.request.url).origin !== self.location.origin) return;

  evento.respondWith(
    caches.open(CACHE_SHELL).then(async (cache) => {
      const enCache = await cache.match(evento.request);
      const enRed = fetch(evento.request)
        .then((respuesta) => {
          if (respuesta.ok) cache.put(evento.request, respuesta.clone());
          return respuesta;
        })
        .catch(() => enCache);
      return enCache ?? enRed;
    }),
  );
});
