import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const tabCamera = document.getElementById('tab-camera');
    const tabFile = document.getElementById('tab-file');
    const cameraArea = document.getElementById('camera-area');
    const fileInputArea = document.getElementById('file-input-area');
    const qrInputFile = document.getElementById('qr-input-file');
    const resultContainer = document.getElementById('result-container');
    const noResult = document.getElementById('no-result');
    const resultText = document.getElementById('result-text');
    const copyBtn = document.getElementById('copy-btn');
    const openLinkBtn = document.getElementById('open-link-btn');

    let html5QrCode;
    let isCameraRunning = false;

    // Tabs
    tabCamera.addEventListener('click', () => {
        tabCamera.classList.add('active');
        tabFile.classList.remove('active');
        cameraArea.style.display = 'block';
        fileInputArea.style.display = 'none';
        startCamera();
    });

    tabFile.addEventListener('click', () => {
        tabFile.classList.add('active');
        tabCamera.classList.remove('active');
        cameraArea.style.display = 'none';
        fileInputArea.style.display = 'block';
        stopCamera();
    });

    // Camera Logic
    function onScanSuccess(decodedText, decodedResult) {
        showResult(decodedText);
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    async function startCamera() {
        if (isCameraRunning) return;

        // html5-qrcode.min.js handles the UI creation in the div with id 'reader'
        // If we want a custom UI we use Html5Qrcode class instead of Html5QrcodeScanner

        try {
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("reader");
            }

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            // Prefer back camera
            await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
            isCameraRunning = true;
        } catch (err) {
            console.error(err);
            Utils.showToast("Error starting camera: " + err, "error");
        }
    }

    async function stopCamera() {
        if (html5QrCode && isCameraRunning) {
            try {
                await html5QrCode.stop();
                isCameraRunning = false;
            } catch (err) {
                console.error("Failed to stop camera", err);
            }
        }
    }

    // File Logic
    fileInputArea.addEventListener('click', (e) => {
        if (e.target === qrInputFile) return;
        qrInputFile.click();
    });

    fileInputArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileInputArea.style.borderColor = 'var(--primary-color)';
    });

    fileInputArea.addEventListener('dragleave', () => {
        fileInputArea.style.borderColor = 'var(--border-color)';
    });

    fileInputArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileInputArea.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            scanFile(e.dataTransfer.files[0]);
        }
    });

    qrInputFile.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            scanFile(e.target.files[0]);
        }
    });

    function scanFile(file) {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                showResult(decodedText);
            })
            .catch(err => {
                Utils.showToast("No QR code found in image.", "error");
                console.error(err);
            });
    }

    // Result Handling
    function showResult(text) {
        resultContainer.classList.add('active');
        noResult.style.display = 'none';
        resultText.value = text;

        if (isValidURL(text)) {
            openLinkBtn.style.display = 'inline-block';
            openLinkBtn.href = text;
        } else {
            openLinkBtn.style.display = 'none';
        }

        // Optional: stop camera on success to save battery/avoid multi-scan
        // stopCamera(); 
        // But users might want to scan multiple things. 
        // Let's pause or just show toast?
        Utils.showToast("QR Code Scanned!", "success");
    }

    function isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(resultText.value);
        Utils.showToast("Copied to clipboard", "success");
    });

    // Cleanup
    window.addEventListener('beforeunload', () => {
        stopCamera();
    });

    // Auto-start camera on load if on camera tab (default)
    startCamera();

});
