const CACHE_NAME = 'vtoolz-v20-image-suite-ui';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/utils/common.js',
    './js/utils/seo.js',
    './js/utils/tilt.js',
    './js/utils/cube.js',
    // Dependencies need full paths relative to SW location (root)
    './js/pdf/pdf-main.js',
    './js/pdf/pdf-worker.js',
    './js/image/image-main.js',
    './js/image/image-worker.js',
    './js/text/text-utils.js',
    './js/dev/dev-utils.js',
    './manifest.json',
    './assets/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We use addAll but catch errors so one missing file doesn't break everything
            // In production you want to be stricter, but for this dynamic list:
            return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache incomplete:', err));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('./index.html'))
        );
        return;
    }
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request).then(response => {
                return caches.open(CACHE_NAME).then(cache => {
                    // Only cache valid http responses
                    if (event.request.url.startsWith('http') && response.status === 200) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                });
            });
        })
    );
});
