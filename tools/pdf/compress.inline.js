import '../../js/pdf/pdf-main.js';

const controls = document.getElementById('controls');
const compressBtn = document.getElementById('compress-btn');
const downloadBtn = document.getElementById('download-btn');
const originalSizeEl = document.getElementById('original-size');
const compressedSizeEl = document.getElementById('compressed-size');
const savingEl = document.getElementById('saving');

const presetButtons = {
    low: document.getElementById('preset-low'),
    medium: document.getElementById('preset-medium'),
    high: document.getElementById('preset-high')
};

let currentFile = null;
let currentPreset = 'medium';
let compressedBlob = null;

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) loadFile(files[0]);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadFile(e.target.files[0]);
});

function setPreset(preset) {
    currentPreset = preset;
    Object.entries(presetButtons).forEach(([name, btn]) => {
        btn.classList.toggle('btn-primary', name === preset);
        btn.classList.toggle('btn-secondary', name !== preset);
    });
}

presetButtons.low.addEventListener('click', () => setPreset('low'));
presetButtons.medium.addEventListener('click', () => setPreset('medium'));
presetButtons.high.addEventListener('click', () => setPreset('high'));

function loadFile(file) {
    if (file.type !== 'application/pdf') {
        window.Utils.showToast('Please upload a valid PDF file.', 'error');
        return;
    }

    currentFile = file;
    compressedBlob = null;
    document.getElementById('drop-zone').style.display = 'none';
    controls.style.display = 'block';
    downloadBtn.style.display = 'none';

    originalSizeEl.textContent = `Original: ${window.Utils.formatBytes(file.size)}`;
    compressedSizeEl.textContent = 'Compressed: -';
    savingEl.textContent = 'Savings: -';

    window.Utils.showToast('PDF ready to compress.', 'success');
}

function getCompressionOptions(preset) {
    switch (preset) {
        case 'low':
            return { compact: false, removeMetadata: false };
        case 'high':
            return { compact: true, removeMetadata: true };
        case 'medium':
        default:
            return { compact: true, removeMetadata: false };
    }
}

compressBtn.addEventListener('click', async () => {
    if (!currentFile) {
        window.Utils.showToast('Please upload a PDF first.', 'error');
        return;
    }

    try {
        window.Utils.showToast('Compressing PDF...', 'info');

        const fileBuffer = await window.PdfTools.readFileAsBuffer(currentFile);
        const options = getCompressionOptions(currentPreset);

        compressedBlob = await window.PdfTools.runPdfTask('COMPRESS_PDF', {
            file: fileBuffer,
            options
        });

        const before = currentFile.size;
        const after = compressedBlob.size;
        const savedBytes = Math.max(0, before - after);
        const savedPct = before > 0 ? ((savedBytes / before) * 100).toFixed(1) : '0.0';

        compressedSizeEl.textContent = `Compressed: ${window.Utils.formatBytes(after)}`;
        savingEl.textContent = `Savings: ${window.Utils.formatBytes(savedBytes)} (${savedPct}%)`;

        downloadBtn.style.display = 'inline-block';
        window.Utils.showToast('Compression complete!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Compression failed: ' + err.message, 'error');
    }
});

downloadBtn.addEventListener('click', () => {
    if (!compressedBlob) {
        window.Utils.showToast('Please compress the file first.', 'error');
        return;
    }

    const originalName = currentFile?.name?.replace(/\.pdf$/i, '') || 'document';
    window.Utils.downloadBlob(compressedBlob, `${originalName}-compressed.pdf`);
});