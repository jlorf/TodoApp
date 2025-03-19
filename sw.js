const CACHE_NAME = 'todo-app-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

const API_CACHE_NAME = 'todo-api-cache';
const API_URL = 'https://67d9377700348dd3e2aa2e6c.mockapi.io/api/v1/todos';

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache del App Shell abierto');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activando...');
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: eliminando cache antigua', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de cache para solicitudes fetch
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Si es una petición a la API
  if (request.url.includes(API_URL)) {
    event.respondWith(networkFirstForAPI(request));
    return;
  }

  // Para el resto de recursos (App Shell), usar Cache First
  event.respondWith(cacheFirstForStatic(request));
});

// Estrategia Cache First para recursos estáticos
async function cacheFirstForStatic(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('Error en cacheFirstForStatic:', error);
    // Podrías devolver una página de error offline aquí
  }
}

// Estrategia Network First para la API
async function networkFirstForAPI(request) {
  try {
    // Primero intentamos obtener los datos frescos de la red
    const networkResponse = await fetch(request);
    
    // Clonamos la respuesta antes de almacenarla en caché
    const clonedResponse = networkResponse.clone();
    
    // Actualiza la caché con la nueva respuesta
    caches.open(API_CACHE_NAME).then(cache => {
      cache.put(request, clonedResponse);
    });
    
    return networkResponse;
  } catch (error) {
    console.log('No se pudo conectar a la red, buscando en caché:', error);
    
    // Si hay un error de red, intentamos obtener de la caché
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay nada en caché para API, devolvemos una respuesta vacía pero válida
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Evento de sincronización en segundo plano (para enviar datos pendientes cuando vuelve la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncTodos());
  }
});

// Función para sincronizar todos pendientes
async function syncTodos() {
  // Aquí irá el código para sincronizar tareas cuando vuelva la conexión
  // Se implementaría con IndexedDB para guardar las tareas pendientes
  console.log('Sincronizando todos pendientes');
}
