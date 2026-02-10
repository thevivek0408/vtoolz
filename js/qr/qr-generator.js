import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const qrText = document.getElementById('qr-text');
    const colorDark = document.getElementById('color-dark');
    const colorLight = document.getElementById('color-light');
    const sizeRange = document.getElementById('size-range');
    const sizeVal = document.getElementById('size-val');
    const eccLevel = document.getElementById('ecc-level');
    const generateBtn = document.getElementById('generate-btn');
    const qrContainer = document.getElementById('qrcode');
    const downloadPngBtn = document.getElementById('download-png');

    let qrCodeObj = null;

    // Load URL params if any (e.g. ?text=...)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('text')) {
        qrText.value = urlParams.get('text');
    }

    function generateQR() {
        const text = qrText.value.trim();
        if (!text) {
            // Clear if empty
            qrContainer.innerHTML = '';
            // Show placeholder or empty state
            return;
        }

        const width = parseInt(sizeRange.value);
        const height = parseInt(sizeRange.value);
        const colorDarkVal = colorDark.value;
        const colorLightVal = colorLight.value;
        const correctLevel = QRCode.CorrectLevel[eccLevel.value];

        qrContainer.innerHTML = ''; // Clear previous

        try {
            qrCodeObj = new QRCode(qrContainer, {
                text: text,
                width: width,
                height: height,
                colorDark: colorDarkVal,
                colorLight: colorLightVal,
                correctLevel: correctLevel
            });

            // QRCode.js creates an img tag. 
            // We might need to wait for it to render or it renders synchronously usually.
        } catch (e) {
            console.error(e);
            Utils.showToast('Error generating QR code', 'error');
        }
    }

    // Event Listeners
    generateBtn.addEventListener('click', generateQR);

    // Auto-update on settings change
    [colorDark, colorLight, eccLevel].forEach(el => {
        el.addEventListener('change', generateQR);
    });

    sizeRange.addEventListener('input', (e) => {
        sizeVal.textContent = e.target.value;
    });
    sizeRange.addEventListener('change', generateQR);

    // Debounce text input
    let timeout;
    qrText.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(generateQR, 500);
    });

    // Download Logic
    downloadPngBtn.addEventListener('click', () => {
        const img = qrContainer.querySelector('img');
        if (!img) {
            Utils.showToast('Generate a QR code first!', 'warning');
            return;
        }

        // The img src from qrcode.js is a data URL
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = img.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Initial Generate if text exists
    if (qrText.value) {
        generateQR();
    }
});
