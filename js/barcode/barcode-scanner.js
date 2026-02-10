import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const tabCamera = document.getElementById('tab-camera');
    const tabFile = document.getElementById('tab-file');
    const cameraArea = document.getElementById('camera-area');
    const fileInputArea = document.getElementById('file-input-area');
    const barcodeInputFile = document.getElementById('barcode-input-file');

    const resultContainer = document.getElementById('result-container');
    const noResult = document.getElementById('no-result');
    const resultText = document.getElementById('result-text');
    const resultFormat = document.getElementById('result-format');
    const copyBtn = document.getElementById('copy-btn');
    const searchBtn = document.getElementById('search-btn');

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
        showResult(decodedText, decodedResult.result.format.formatName);
    }

    function onScanFailure(error) {
        // console.warn(`Code scan error = ${error}`);
    }

    async function startCamera() {
        if (isCameraRunning) return;

        try {
            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode("reader");
            }
            // Increase fps for barcodes, can be trickier
            const config = {
                fps: 10,
                qrbox: { width: 300, height: 150 }, // Wider box for barcodes
                aspectRatio: 1.0
            };

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
        if (e.target === barcodeInputFile) return;
        barcodeInputFile.click();
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

    barcodeInputFile.addEventListener('change', (e) => {
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
                // Unsure if scanFile returns format info easily in the promise resolve
                // Usually valid text is enough
                showResult(decodedText, "Unknown/File");
            })
            .catch(err => {
                Utils.showToast("No barcode found in image.", "error");
                console.error(err);
            });
    }

    // Result Handling
    function showResult(text, format) {
        resultContainer.classList.add('active');
        noResult.style.display = 'none';

        resultText.value = text;
        resultFormat.value = format || "Detected";

        searchBtn.href = `https://www.google.com/search?q=${text}`;

        Utils.showToast("Barcode Scanned!", "success");
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
