const CACHE_NAME = 'mi-nutricion-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './images/hero-bowl.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Peticiones a otros orígenes (ej. la búsqueda en línea de Open Food
  // Facts) van directo a la red, sin cachear: son datos en vivo, no
  // parte de la app, y no deben quedar "pegados" en caché.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Red primero, caché como respaldo offline. Antes era "caché primero" y
  // eso dejaba la app pegada en versiones viejas después de cada
  // actualización (había que recargar varias veces para verla). Como la
  // app es chica, pedirla siempre a la red cuando hay internet no cuesta
  // nada y garantiza que siempre se vea la última versión; offline sigue
  // funcionando igual, sirviendo lo último que se guardó en caché.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
