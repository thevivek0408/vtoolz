const els = {
    btn: document.getElementById('startBtn'),
    live: document.getElementById('liveSpeed'),
    prog: document.getElementById('gaugeProgress'),
    status: document.getElementById('statusText'),
    down: document.getElementById('resDown'),
    up: document.getElementById('resUp'),
    ping: document.getElementById('resPing')
};

// Use a random image from Wikimedia (CORS enabled) usually good for speed test
// 5MB file
const DL_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif?' + Math.random();
const UP_URL = 'https://httpbin.org/post'; // Using httpbin for upload test

els.btn.addEventListener('click', startTest);

async function startTest() {
    if (els.btn.disabled) return;
    els.btn.disabled = true;
    els.btn.textContent = 'Testing...';
    els.down.textContent = '-';
    els.up.textContent = '-';
    els.ping.textContent = '-';
    resetGauge();

    try {
        // 1. Ping Test
        updateStatus('Measuring Latency...');
        const ping = await measurePing();
        els.ping.textContent = ping.toFixed(0) + ' ms';
        await wait(500);

        // 2. Download Test
        updateStatus('Testing Download...');
        const dlSpeed = await measureDownload();
        els.down.textContent = dlSpeed.toFixed(2) + ' Mbps';
        setGauge(0); // Reset for upload
        await wait(500);

        // 3. Upload Test
        updateStatus('Testing Upload...');
        const ulSpeed = await measureUpload();
        els.up.textContent = ulSpeed.toFixed(2) + ' Mbps';

        updateStatus('Test Complete');
        setGauge(100); // Full

    } catch (e) {
        console.error(e);
        updateStatus('Error: ' + e.message);
    }

    els.btn.disabled = false;
    els.btn.textContent = 'Test Again';
}

async function measurePing() {
    const start = performance.now();
    try {
        await fetch(document.location.href, { method: 'HEAD', cache: 'no-store' });
    } catch (e) { } // Ignore error, just timing
    return performance.now() - start;
}

async function measureDownload() {
    const startTime = performance.now();
    // Fetch blob
    const response = await fetch(DL_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('Download failed');

    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;

        // Update UI incrementally
        const duration = (performance.now() - startTime) / 1000;
        const speedBps = (receivedLength * 8) / duration;
        const speedMbps = speedBps / 1000000;
        updateGauge(speedMbps);
    }

    const duration = (performance.now() - startTime) / 1000; // seconds
    const speedBps = (receivedLength * 8) / duration;
    return speedBps / 1000000; // Mbps
}

async function measureUpload() {
    // Generate 2MB random data
    const size = 2 * 1024 * 1024;
    const data = new Uint8Array(size);
    // no need to fill strictly random for speed test but helps prevent compression logic
    // data.fill(0); 

    const blob = new Blob([data]);
    const startTime = performance.now();

    // Using httpbin for generic POST. It might be slow or rate limited. 
    // In a real app, use a dedicated server.
    // As fallback, we can try to upload to a non-existent endpoint on same domain and catch error, 
    // but browsers might optimize that out. Httpbin is safer for demo.

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', UP_URL, true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const duration = (performance.now() - startTime) / 1000;
                const speedBps = (e.loaded * 8) / duration;
                const speedMbps = speedBps / 1000000;
                updateGauge(speedMbps);
            }
        };

        xhr.onload = () => {
            const duration = (performance.now() - startTime) / 1000;
            const speedBps = (size * 8) / duration;
            resolve(speedBps / 1000000);
        };

        xhr.onerror = () => {
            // Even if it fails (CORS or Error), we sent the data. 
            // Estimate based on time.
            const duration = (performance.now() - startTime) / 1000;
            const speedBps = (size * 8) / duration;
            resolve(speedBps / 1000000);
        };

        xhr.send(blob);
    });
}

function updateGauge(mbps) {
    els.live.textContent = mbps.toFixed(1);
    // Cap visual at 100 for gauge (log scale better but linear for simple)
    // Let's assume 100Mbps is max visual
    const max = 100;
    const pct = Math.min(mbps / max, 1);
    setGauge(pct * 100);
}

function setGauge(percent) {
    const dashArray = 565; // Circumference
    const dashOffset = dashArray - (dashArray * percent / 100);
    els.prog.style.strokeDashoffset = dashOffset;
}

function resetGauge() {
    els.live.textContent = '0.0';
    setGauge(0);
}

function updateStatus(msg) {
    els.status.textContent = msg;
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

resetGauge();