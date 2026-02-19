const CACHE_NAME = 'vtoolz-v36-optimized';

// Critical shell — these MUST cache successfully for offline to work
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

// Secondary assets — cached if available, but won't block SW install
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
// This prevents the SW install from being bloated by 50-100MB of game assets.

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Critical assets MUST succeed — fail install if any are missing
            await cache.addAll(CRITICAL_ASSETS);
            // Secondary assets are best-effort — don't block install
            for (const url of SECONDARY_ASSETS) {
                try { await cache.add(url); } catch (e) { console.warn('Optional cache miss:', url); }
            }
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
