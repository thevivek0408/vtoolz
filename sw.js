const CACHE_NAME = 'vtoolz-v22-phase3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './css/highlight.min.css', // Phase 2
    './js/utils/common.js',
    './js/utils/seo.js',
    './js/utils/tilt.js',
    './js/utils/cube.js',

    // Core Vendors
    './js/vendor/pdf-lib.min.js',
    './js/vendor/pdf.min.js',
    './js/vendor/pdf.worker.min.js',
    './js/vendor/cropper.min.js', // Ensure this was downloaded

    // Phase 2 Vendors
    './js/vendor/qrcode.min.js',
    './js/vendor/html5-qrcode.min.js',
    './js/vendor/JsBarcode.all.min.js',
    './js/vendor/marked.min.js',
    './js/vendor/purify.min.js',
    './js/vendor/highlight.min.js',
    './js/vendor/jszip.min.js',

    // Tool Scripts (Just main ones, others cached at runtime)
    './js/pdf/pdf-main.js',
    './js/image/image-main.js',
    './js/qr/qr-generator.js',
    './js/barcode/barcode-generator.js',
    './js/markdown/editor.js',
    './js/archive/zip-creator.js',

    // Government Tools
    './js/government/presets.js',
    './js/government/gov-utils.js',
    './js/government/pan.js',
    './js/government/aadhaar.js',
    './js/government/passport.js',
    './js/government/exam.js',
    './js/government/kyc.js',

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
