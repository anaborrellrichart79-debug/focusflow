const CACHE_SHELL = 'focusflow-shell-v1';

// En desarrollo (main.tsx lo registra con ?modo=desarrollo) solo se usa para
// Web Push: cachear los módulos que sirve Vite rompería la recarga en caliente.
const EN_DESARROLLO = new URL(self.location.href).searchParams.get('modo') === 'desarrollo';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.filter((clave) => EN_DESARROLLO || clave !== CACHE_SHELL).map((clave) => caches.delete(clave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Solo cachea peticiones GET al propio origen (assets/HTML del frontend), nunca a la API del
// backend (otro origen), para no servir datos de usuario obsoletos ni interferir con la sesión.
self.addEventListener('fetch', (evento) => {
  if (EN_DESARROLLO) return;
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

// Web Push: el backend (PushService) manda { titulo, cuerpo, url, etiqueta,
// emergencia } al crearse un aviso, también con la app cerrada.
self.addEventListener('push', (evento) => {
  let carga = {};
  try {
    carga = evento.data ? evento.data.json() : {};
  } catch {
    /* mensaje sin JSON: se enseña el aviso genérico */
  }
  evento.waitUntil(
    self.registration.showNotification(carga.titulo || 'FocusFlow', {
      body: carga.cuerpo || 'Tienes un aviso nuevo',
      icon: '/icons/icono-192.png',
      badge: '/icons/icono-192.png',
      tag: carga.etiqueta,
      requireInteraction: Boolean(carga.emergencia),
      data: { url: carga.url || '/recordatorios' },
    }),
  );
});

// Al pulsarla: si FocusFlow ya está abierto se trae al frente en esa página;
// si no, se abre.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.url || '/', self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((ventana) => new URL(ventana.url).origin === self.location.origin);
      if (abierta) return abierta.focus().then((ventana) => ventana.navigate(destino));
      return self.clients.openWindow(destino);
    }),
  );
});
