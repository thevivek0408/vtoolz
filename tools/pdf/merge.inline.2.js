import '../../js/pdf/pdf-main.js';

const fileList = document.getElementById('file-list');
const mergeBtn = document.getElementById('merge-btn');
let filesToMerge = [];

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    handleFiles(files);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (const file of files) {
        if (file.type !== 'application/pdf') {
            window.Utils.showToast(`Skipped non-PDF: ${file.name}`, 'error');
            continue;
        }
        filesToMerge.push(file);
        addFileToList(file);
    }
    updateUI();
}

async function addFileToList(file) {
    const item = document.createElement('div');
    item.className = 'file-item';

    // Thumbnail Container
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'file-thumb';
    thumbContainer.innerHTML = '<div class="spinner"></div>'; // Loading state

    const info = document.createElement('div');
    info.className = 'file-info';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = file.name + ' ';
    const sizeSmall = document.createElement('small');
    sizeSmall.className = 'text-muted';
    sizeSmall.textContent = `(${window.Utils.formatBytes(file.size)})`;
    nameSpan.appendChild(sizeSmall);
    info.appendChild(nameSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.title = 'Remove file';
    removeBtn.onclick = () => {
        filesToMerge = filesToMerge.filter(f => f !== file);
        item.remove();
        updateUI();
    };

    item.appendChild(thumbContainer);
    item.appendChild(info);
    item.appendChild(removeBtn);
    fileList.appendChild(item);

    // Generate Thumbnail
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);

        const scale = 0.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        thumbContainer.innerHTML = '';
        canvas.style.maxWidth = '60px';
        canvas.style.maxHeight = '80px';
        canvas.style.border = '1px solid #ddd';
        thumbContainer.appendChild(canvas);
    } catch (err) {
        console.error('Thumbnail error:', err);
        thumbContainer.innerHTML = '<span style="font-size: 2rem;">📄</span>';
    }
}

function updateUI() {
    if (filesToMerge.length > 1) {
        mergeBtn.style.display = 'inline-block';
    }
}

mergeBtn.addEventListener('click', async () => {
    try {
        window.Utils.showToast('Merging...', 'info');

        // Read all files
        const buffers = await Promise.all(filesToMerge.map(f => window.PdfTools.readFileAsBuffer(f)));

        // Send to worker
        const blob = await window.PdfTools.runPdfTask('MERGE_PDFS', { files: buffers });

        // Download
        window.Utils.downloadBlob(blob, 'merged-document.pdf');

        // Track Usage Stats
        if (window.Utils && window.Utils.trackStat) {
            window.Utils.trackStat('files_processed', filesToMerge.length);
            window.Utils.trackStat('bytes_saved', blob.size);
        }

        window.Utils.showToast('Merge complete!', 'success');

        // Reset?
        // filesToMerge = [];
        // fileList.innerHTML = '';
        // updateUI();
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Merge failed: ' + err.message, 'error');
    }
});