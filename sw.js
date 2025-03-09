const CACHE_NAME = 'minao-predictor-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/img/Aviator-game.webp',
    '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - retornar resposta
                if (response) {
                    return response;
                }

                // Clonar a requisição
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then(response => {
                        // Verificar se recebemos uma resposta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonar a resposta
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Se falhar, tentar servir uma página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
}); 