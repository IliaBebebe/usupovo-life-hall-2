const CACHE_NAME = 'usupovo-v3';
const urlsToCache = [
  '/',
  '/verify.html',
  '/verify.js',
  '/style.css',
  '/script.js',
  '/admin.js',
  '/manifest.json',
  '/images/logo-small.png',
  '/lib/html5-qrcode.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Обработка push-уведомлений (для будущих расширений)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/images/logo-small.png',
      badge: '/images/logo-small.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/admin.html')
  );
});

// Обработка сообщений от main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    const options = {
      body: body,
      icon: '/images/logo-small.png',
      badge: '/images/logo-small.png',
      vibrate: [200, 100, 200],
      data: data || {}
    };
    self.registration.showNotification(title, options);
  }
});
