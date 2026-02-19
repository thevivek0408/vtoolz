import { Utils } from '../utils/common.js';

let imglyRemoveBackground = null;

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const resultArea = document.getElementById('result-area');
    const imgOriginal = document.getElementById('img-original');
    const imgResult = document.getElementById('img-result');
    const loader = document.getElementById('loader');
    const btnDownload = document.getElementById('btn-download');
    const btnNew = document.getElementById('btn-new');

    // Manual Event Setup for Maximum Reliability
    // 1. Click to Open
    dropArea.addEventListener('click', () => fileInput.click());

    // 2. Drag & Drop Visuals
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.style.borderColor = 'var(--accent-color)';
            dropArea.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.style.borderColor = 'var(--primary-color)';
            dropArea.style.backgroundColor = '';
        }, false);
    });

    // 3. Handle Drop
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFile(files[0]);
    }, false);

    // 4. Handle File Select
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
        // Validating the input value reset
        fileInput.value = '';
    });

    async function loadLibrary() {
        if (imglyRemoveBackground) return true;

        try {
            Utils.showToast("Loading AI Module (Requires Internet)...", "info");
            // Dynamic import from CDN — pinned to specific version for safety.
            // Note: SRI is not available for dynamic imports. If self-hosting is
            // feasible, copy this module locally for full integrity control.
            const module = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.3.0/+esm");
            imglyRemoveBackground = module.default;
            return true;
        } catch (e) {
            console.error(e);
            Utils.showToast("Failed to load AI Library. Check Internet Connection.", "error");
            return false;
        }
    }

    async function handleFile(file) {
        if (!file.type.match('image.*')) {
            Utils.showToast('Please upload an image file', 'error');
            return;
        }

        // Show UI immediately
        dropArea.style.display = 'none';
        resultArea.style.display = 'block';
        imgOriginal.src = URL.createObjectURL(file);

        // Reset result
        imgResult.src = '';
        imgResult.style.display = 'none';
        btnDownload.disabled = true;

        loader.style.display = 'flex';

        try {
            const loaded = await loadLibrary();
            if (!loaded) throw new Error("AI Library failed to load");

            Utils.showToast('Starting AI background removal...', 'info');

            const blob = await imglyRemoveBackground(file, {
                progress: (key, current, total) => {
                    // Optional progress update
                }
            });

            const url = URL.createObjectURL(blob);
            imgResult.src = url;
            imgResult.style.display = 'block';

            btnDownload.disabled = false;
            btnDownload.onclick = () => {
                const name = file.name.split('.')[0] + '_nobg.png';
                Utils.downloadBlob(blob, name);
            };

            Utils.showToast('Background Removed Successfully!', 'success');

        } catch (error) {
            console.error(error);
            Utils.showToast('Error removing background. Check internet & console.', 'error');
            // Allow retry or just stay in error state
        } finally {
            loader.style.display = 'none';
        }
    }

    if (btnNew) {
        btnNew.addEventListener('click', () => {
            dropArea.style.display = 'block';
            resultArea.style.display = 'none';
            fileInput.value = '';
            imgOriginal.src = '';
            imgResult.src = '';
        });
    }
});
