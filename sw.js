const CACHE_NAME = 'vtoolz-v33-fun-icons';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/home.js', // Replaced app.js
    './js/utils/common.js',
    './js/utils/tools.js',
    './manifest.json',
    './favicon.png',
    './games/index.html',
    './tools/fun/music.html',
    './tools/hardware/index.html',
    './tools/hardware/keyboard.html',
    './tools/hardware/gamepad.html',
    './tools/hardware/screen.html',
    './tools/hardware/audio.html',
    './tools/network/index.html',
    './tools/network/ip-calc.html',
    './tools/network/speed-test.html',
    './tools/network/wifi-qr.html',
    './tools/text/transcoding.html',
    './tools/pdf/index.html',
    './tools/pdf/word-to-pdf.html',
    './tools/pdf/pdf-to-word.html',
    './tools/pdf/html-to-pdf.html',
    './tools/pdf/excel-to-pdf.html',
    './tools/office/index.html',
    './tools/office/word.html',
    './tools/office/excel.html',
    './tools/office/powerpoint.html',

    // Core Vendors
    './js/vendor/pdf-lib.min.js',
    './js/vendor/pdf.min.js',
    './js/vendor/pdf.worker.min.js',
    './js/vendor/cropper.min.js', // Ensure this was downloaded

    // Phase 2 Vendors
    './js/vendor/html5-qrcode.min.js',
    './js/vendor/JsBarcode.all.min.js',
    './js/vendor/marked.min.js',
    './js/vendor/purify.min.js',
    './js/vendor/highlight.min.js',
    './js/vendor/jszip.min.js',
    './js/vendor/qrcode.min.js',
    // Missing vendors removed to prevent SW install failure:
    // mammoth.browser.min.js, html2pdf.bundle.min.js, xlsx.full.min.js
    './js/vendor/quill.min.js',
    './js/vendor/quill.snow.css',
    './js/vendor/jspreadsheet.js',
    './js/vendor/jspreadsheet.css',
    './js/vendor/jsuites.js',
    './js/vendor/jsuites.css',
    './js/vendor/pptxgen.bundle.min.js',

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

    // New Innovative Tools
    './js/productivity/kanban.js',
    './js/image/meme-generator.js',
    './js/text/tts.js',
    './js/dev/diff-checker.js',
    './js/media/voice-recorder.js',
    './js/media/audio-trimmer.js',
    './tools/fun/music.html', // Caching new tool explicitly

    './manifest.json',
    './assets/icon.png'
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
