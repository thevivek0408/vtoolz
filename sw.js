const CACHE_VERSION = 'vtoolz-v37';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const CDN_CACHE = `${CACHE_VERSION}-cdn`;

// Max dynamic cache entries (prevents unbounded growth)
const MAX_DYNAMIC_ENTRIES = 150;

// Critical shell — MUST cache for offline
const CRITICAL_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/home.js',
    './js/utils/common.js',
    './js/utils/tools.js',
    './manifest.json',
    './favicon.png',
    './assets/icon.png'
];

// Secondary assets — best-effort precache
const SECONDARY_ASSETS = [
    './js/loader.js',
    './js/category.js',
    './js/utils/seo.js',
    './js/utils/command-palette.js',
    './js/utils/cube.js',
    './js/utils/tilt.js',
    './tools/index.html',

    // Tool landing pages
    './tools/pdf/index.html',
    './tools/image/index.html',
    './tools/text/index.html',
    './tools/dev/index.html',
    './tools/media/index.html',
    './tools/fun/index.html',
    './tools/government/index.html',
    './tools/hardware/index.html',
    './tools/network/index.html',
    './tools/office/index.html',
    './tools/qr/index.html',
    './tools/barcode/index.html',
    './tools/markdown/index.html',
    './tools/archive/index.html',
    './tools/productivity/index.html',
    './tools/math/index.html',
    './tools/time/index.html',
    './tools/utility/index.html',

    // Core Vendor libraries
    './js/vendor/pdf-lib.min.js',
    './js/vendor/pdf.min.js',
    './js/vendor/pdf.worker.min.js',
    './js/vendor/cropper.min.js',
    './js/vendor/html5-qrcode.min.js',
    './js/vendor/JsBarcode.all.min.js',
    './js/vendor/marked.min.js',
    './js/vendor/purify.min.js',
    './js/vendor/highlight.min.js',
    './js/vendor/jszip.min.js',
    './js/vendor/qrcode.min.js',
    './js/vendor/quill.min.js',
    './js/vendor/quill.snow.css',
    './js/vendor/jspreadsheet.js',
    './js/vendor/jspreadsheet.css',
    './js/vendor/jsuites.js',
    './js/vendor/jsuites.css',
    './js/vendor/pptxgen.bundle.min.js',

    // Core tool scripts
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

    // Innovative Tools
    './js/productivity/kanban.js',
    './js/image/meme-generator.js',
    './js/text/tts.js',
    './js/dev/diff-checker.js',
    './js/media/voice-recorder.js',
    './js/media/audio-trimmer.js',
];

// NOTE: Games are NOT precached — they are large (especially Unity WebGL builds)
// and will be cached on-demand when the user first plays them.

// Trim dynamic cache to prevent storage bloat
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        return trimCache(cacheName, maxItems);
    }
}

// Install: Precache critical + secondary
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(async (cache) => {
            await cache.addAll(CRITICAL_ASSETS);
            for (const url of SECONDARY_ASSETS) {
                try { await cache.add(url); } catch (e) { console.warn('Optional cache miss:', url); }
            }
        })
    );
    self.skipWaiting();
});

// Activate: Clean ALL old version caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (!key.startsWith(CACHE_VERSION)) return caches.delete(key);
            }));
        })
    );
    self.clients.claim();
});

// Fetch: Smart strategy based on request type
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET, chrome-extension, etc.
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // Strategy 1: CDN resources (Font Awesome, Google Fonts, cdnjs)
    // → Cache-First (these rarely change)
    if (url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('fonts.gstatic.com') ||
        url.hostname.includes('ajax.googleapis.com')) {
        event.respondWith(
            caches.open(CDN_CACHE).then(cache =>
                cache.match(request).then(cached => {
                    if (cached) return cached;
                    return fetch(request).then(response => {
                        if (response.ok) cache.put(request, response.clone());
                        return response;
                    });
                })
            )
        );
        return;
    }

    // Strategy 2: Navigation requests (HTML pages)
    // → Stale-While-Revalidate: serve cache instantly, update in background
    if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            caches.open(STATIC_CACHE).then(cache =>
                cache.match(request).then(cached => {
                    const networkFetch = fetch(request).then(response => {
                        if (response.ok) cache.put(request, response.clone());
                        return response;
                    }).catch(() => cached || caches.match('./index.html'));

                    // Return cached immediately if available, else wait for network
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    // Strategy 3: Same-origin static assets (JS, CSS, images)
    // → Cache-First, strip ?v= for consistent matching
    if (url.origin === self.location.origin) {
        const cleanUrl = new URL(url.pathname, url.origin);
        const cacheKey = new Request(cleanUrl.href);

        event.respondWith(
            caches.open(STATIC_CACHE).then(cache =>
                cache.match(cacheKey).then(cached => {
                    if (cached) return cached;
                    return fetch(request).then(response => {
                        if (response.ok) cache.put(cacheKey, response.clone());
                        return response;
                    });
                })
            ).catch(() => caches.match(request))
        );
        return;
    }

    // Strategy 4: External resources → Network-First with dynamic cache
    event.respondWith(
        fetch(request).then(response => {
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                    cache.put(request, responseClone);
                    trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
                });
            }
            return response;
        }).catch(() => caches.match(request))
    );
});
