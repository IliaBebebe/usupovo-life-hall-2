const CACHE_NAME = 'usupovo-v4';

// Кэшируем только критически важные ресурсы
const urlsToCache = [
  '/',
  '/style.css',
  '/script.js'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened:', CACHE_NAME);
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Some resources failed to cache:', err);
          // Игнорируем ошибки кэширования
          return Promise.resolve();
        });
      })
  );
  // Активируем новый Service Worker сразу
  self.skipWaiting();
});

// Активация - удаляем старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Берем управление на себя сразу
  self.clients.claim();
});

// Обработка запросов - сначала сеть, потом кэш
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Игнорируем запросы не от нашего домена
  if (url.origin !== location.origin) {
    return;
  }
  
  // Игнорируем POST запросы (их нельзя кэшировать)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если запрос успешный, кэшируем ответ
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Если сеть не доступна, пробуем вернуть из кэша
        return caches.match(event.request);
      })
  );
});
