import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const workspace = document.getElementById('workspace');
    const imgOriginal = document.getElementById('img-original');
    const imgResult = document.getElementById('img-result');
    const orgSize = document.getElementById('org-size');
    const newSize = document.getElementById('new-size');
    const targetKbInput = document.getElementById('target-kb');
    const btnProcess = document.getElementById('btn-process');
    const btnDownload = document.getElementById('btn-download');
    const btnNew = document.getElementById('btn-new');
    const loader = document.getElementById('loader');
    const presets = document.querySelectorAll('.preset-chip');

    let currentFile = null;

    // Manual Event Setup (Robust)
    dropArea.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.style.borderColor = 'var(--accent-color)';
            dropArea.classList.add('highlight');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.style.borderColor = 'var(--primary-color)';
            dropArea.classList.remove('highlight');
        }, false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFile(files[0]);
    }, false);

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
        fileInput.value = '';
    });

    // Preset Clicks
    presets.forEach(chip => {
        chip.addEventListener('click', () => {
            presets.forEach(p => p.classList.remove('active'));
            chip.classList.add('active');
            targetKbInput.value = chip.dataset.kb;
            if (currentFile) processImage(); // Auto-process on preset click
        });
    });

    btnProcess.addEventListener('click', () => {
        if (currentFile) processImage();
    });

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            Utils.showToast('Please upload an image file (JPG, PNG)', 'error');
            return;
        }

        currentFile = file;
        dropArea.style.display = 'none';
        workspace.style.display = 'block';

        imgOriginal.src = URL.createObjectURL(file);
        orgSize.textContent = Utils.formatBytes(file.size);

        // Auto process with default 50KB
        processImage();
    }

    async function processImage() {
        if (!currentFile) return;

        loader.style.display = 'block';
        imgResult.style.opacity = '0.5';
        btnDownload.disabled = true;

        const targetKB = parseInt(targetKbInput.value) || 50;
        const targetBytes = targetKB * 1024;

        try {
            // Create a canvas to do the work
            const blob = await compressToTarget(currentFile, targetBytes);

            const url = URL.createObjectURL(blob);
            imgResult.src = url;
            imgResult.style.opacity = '1';
            newSize.textContent = Utils.formatBytes(blob.size);

            if (blob.size > targetBytes) {
                newSize.style.color = 'orange'; // Warning if couldn't hit target
                Utils.showToast(`Could only reduce to ${Math.round(blob.size / 1024)}KB`, 'warning');
            } else {
                newSize.style.color = 'var(--accent-color)';
                Utils.showToast('Compression Successful!', 'success');
            }

            btnDownload.disabled = false;
            btnDownload.onclick = () => {
                const ext = currentFile.name.split('.').pop();
                const name = currentFile.name.replace(`.${ext}`, `_${targetKB}kb.${ext}`);
                Utils.downloadBlob(blob, name);
            };

        } catch (e) {
            console.error(e);
            Utils.showToast('Error compressing image', 'error');
        } finally {
            loader.style.display = 'none';
        }
    }

    // Smart Iterative Compression
    function compressToTarget(file, maxBytes) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Keep shrinking/lowering quality until we hit target
                let min = 0;
                let max = 1;
                let quality = 0.9;
                let iteration = 0;

                // Start with resizing if it's huge (>2000px)
                if (width > 2000 || height > 2000) {
                    const ratio = width / height;
                    if (width > height) { width = 2000; height = 2000 / ratio; }
                    else { height = 2000; width = 2000 * ratio; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const attempt = (q, scale = 1) => {
                    // Scale first if needed
                    if (scale < 1) {
                        const sCanvas = document.createElement('canvas');
                        sCanvas.width = width * scale;
                        sCanvas.height = height * scale;
                        sCanvas.getContext('2d').drawImage(canvas, 0, 0, sCanvas.width, sCanvas.height);
                        return new Promise(r => sCanvas.toBlob(b => r(b), 'image/jpeg', q)); // JPG gives best compression
                    }
                    return new Promise(r => canvas.toBlob(b => r(b), 'image/jpeg', q));
                };

                // Binary search for quality
                const run = async () => {
                    let blob = await attempt(quality);

                    // If even at 1.0 quality it's small enough, return it (unlikely for big images)
                    if (blob.size <= maxBytes && quality === 1) {
                        resolve(blob);
                        return;
                    }

                    // Binary search loop
                    let minQ = 0.01;
                    let maxQ = 1.0;
                    let bestBlob = blob;

                    for (let i = 0; i < 6; i++) { // 6 iterations is usually enough
                        quality = (minQ + maxQ) / 2;
                        blob = await attempt(quality);

                        if (blob.size <= maxBytes) {
                            bestBlob = blob; // This works, try for higher quality
                            minQ = quality;
                        } else {
                            maxQ = quality; // Too big, go lower
                        }
                    }

                    // If still too big, start scaling down dimensions
                    if (bestBlob.size > maxBytes) {
                        let scale = 0.9;
                        while (bestBlob.size > maxBytes && scale > 0.1) {
                            bestBlob = await attempt(0.5, scale); // Medium quality, reduce scale
                            scale -= 0.1;
                        }
                    }

                    resolve(bestBlob);
                };

                run();
            };
            img.onerror = reject;
        });
    }

    btnNew.addEventListener('click', () => {
        dropArea.style.display = 'block';
        workspace.style.display = 'none';
        fileInput.value = '';
    });
});
