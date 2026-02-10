import { Utils } from '../utils/common.js';
import { GovPresets } from './presets.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- CLEANER LOGIC ---
    const inputScan = document.getElementById('input-scan');
    const cleanerUpload = document.getElementById('cleaner-upload');
    const cleanerEditor = document.getElementById('cleaner-editor');
    const canvas = document.getElementById('scan-canvas');
    const ctx = canvas.getContext('2d');

    const rangeBright = document.getElementById('range-bright');
    const rangeContrast = document.getElementById('range-contrast');
    const valBright = document.getElementById('val-bright');
    const valContrast = document.getElementById('val-contrast');
    const btnReset = document.getElementById('btn-reset');
    const btnSaveClean = document.getElementById('btn-save-clean');

    let originalImage = null;

    cleanerUpload.addEventListener('click', (e) => {
        if (e.target === inputScan) return; // Prevent loop
        inputScan.click();
    });

    inputScan.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            loadImage(e.target.files[0]);
        }
    });

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                cleanerUpload.style.display = 'none';
                cleanerEditor.style.display = 'block';

                // Fit canvas
                const maxWidth = 800;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                applyFilters();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function applyFilters() {
        if (!originalImage) return;

        const brightness = parseInt(rangeBright.value);
        const contrast = parseInt(rangeContrast.value);

        valBright.textContent = brightness;
        valContrast.textContent = contrast;

        ctx.filter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }

    rangeBright.addEventListener('input', applyFilters);
    rangeContrast.addEventListener('input', applyFilters);

    btnReset.addEventListener('click', () => {
        rangeBright.value = 0;
        rangeContrast.value = 0;
        applyFilters();
    });

    btnSaveClean.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'cleaned-scan.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });


    // --- DOC COMPRESSOR LOGIC ---
    const dropDoc = document.getElementById('drop-doc');
    const inputDoc = document.getElementById('input-doc');

    Utils.setupDragAndDrop(dropDoc, inputDoc, handleDoc);

    function handleDoc(file) {
        const preset = GovPresets.AADHAAR.DOCUMENT;

        document.getElementById('result-doc').style.display = 'block';
        document.getElementById('doc-name').textContent = file.name;
        document.getElementById('doc-size').textContent = Utils.formatBytes(file.size);

        const sizeKB = file.size / 1024;
        const statusDiv = document.getElementById('status-container');

        if (sizeKB <= preset.maxSizeKB) {
            statusDiv.innerHTML = `<span class="status-badge status-success">Accepted (Under 2MB)</span>`;
        } else {
            statusDiv.innerHTML = `<span class="status-badge status-fail">Too Large (>2MB)</span>`;
        }
    }
});
