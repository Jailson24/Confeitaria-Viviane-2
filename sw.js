const CACHE_NAME = 'confeitaria-v4';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './logo-192.png',
    './logo-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS.map(asset => cache.add(asset).catch(err => console.warn('Erro ao cachear:', asset)))
            );
        })
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interceptação de requisições (Fetch)
self.addEventListener('fetch', (e) => {
    if (!e.request.url.startsWith('http')) return;
    if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('vscode-livepreview')) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(e.request).catch((err) => {
                console.warn('Modo offline ativo para:', e.request.url);
                // Se a navegação falhar offline, força a abertura do index.html do cache
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});