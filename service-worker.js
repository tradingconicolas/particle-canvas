const CACHE_NAME = 'mi-nutricion-v5';
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

  // Red primero, caché como respaldo offline. GitHub Pages manda estos
  // archivos con "Cache-Control: max-age=600" (10 min) — un fetch() normal
  // respeta eso y puede devolver una versión vieja del disco de Safari sin
  // ni siquiera tocar la red. cache:'no-store' fuerza a ignorar esa caché
  // del navegador y siempre pedir la última versión de verdad.
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
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
