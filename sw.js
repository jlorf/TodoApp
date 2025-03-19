const CACHE_NAME = 'todo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  'https://654a774c1f197d51e4920358.mockapi.io/todos'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la respuesta en caché si está disponible
        if (response) {
          return response;
        }
        
        // Clonamos la solicitud porque solo se puede usar una vez
        const fetchRequest = event.request.clone();
        
        // Para las APIs no cacheamos, obtenemos datos frescos
        if (fetchRequest.url.includes('mockapi.io')) {
          return fetch(fetchRequest);
        }
        
        return fetch(fetchRequest).then(
          response => {
            // Verificamos si la respuesta es válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonamos la respuesta porque el cuerpo solo se puede usar una vez
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
});

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
