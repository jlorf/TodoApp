const CACHE_NAME = 'todo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// Instalación del Service Worker y caché de recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Estrategia de caché: Network first, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona la respuesta
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            // Guarda la respuesta en la caché
            cache.put(event.request, responseClone);
          });
        return response;
      })
      .catch(() => {
        // Si falla la red, busca en la caché
        return caches.match(event.request);
      })
  );
});

// Actualiza el caché cuando hay una nueva versión del SW
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
