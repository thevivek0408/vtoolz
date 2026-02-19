import '../../js/pdf/pdf-main.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

let currentFile = null;
let pdfDoc = null;
let selectedPages = new Set();
let pageRotations = {}; // pageIndex (0-based) -> rotation (0, 90, 180, 270)
let totalPages = 0;

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) loadFile(files[0]);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadFile(e.target.files[0]);
});

async function loadFile(file) {
    if (file.type !== 'application/pdf') {
        window.Utils.showToast('Please upload a PDF file.', 'error');
        return;
    }

    window.Utils.showToast('Loading PDF...', 'info');
    currentFile = file;

    try {
        const arrayBuffer = await file.arrayBuffer();
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        totalPages = pdfDoc.numPages;

        // Init rotations
        for (let i = 0; i < totalPages; i++) pageRotations[i] = 0;

        renderPageGrid();
        document.getElementById('drop-zone').style.display = 'none';
        document.getElementById('controls').style.display = 'block';
        window.Utils.showToast(`Loaded ${totalPages} pages.`, 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error loading PDF: ' + err.message, 'error');
    }
}

async function renderPageGrid() {
    const grid = document.getElementById('page-grid');
    grid.innerHTML = '';
    selectedPages.clear();

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.pageNumber = i;

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';

        const canvas = document.createElement('canvas');
        canvasContainer.appendChild(canvas);
        pageItem.appendChild(canvasContainer);

        const num = document.createElement('span');
        num.className = 'page-number';
        num.textContent = i;
        pageItem.appendChild(num);

        const indicator = document.createElement('span');
        indicator.className = 'rotate-indicator';
        indicator.textContent = '🔄';
        pageItem.appendChild(indicator);

        pageItem.addEventListener('click', () => togglePageSelection(i, pageItem));
        grid.appendChild(pageItem);

        renderThumbnail(i, canvas);
    }
}

async function renderThumbnail(pageParams, canvas) {
    const page = await pdfDoc.getPage(pageParams);
    const viewport = page.getViewport({ scale: 0.3 });
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
}

function togglePageSelection(pageNum, element) {
    if (selectedPages.has(pageNum)) {
        selectedPages.delete(pageNum);
        element.classList.remove('selected');
    } else {
        selectedPages.add(pageNum);
        element.classList.add('selected');
    }
}

function applyRotation(degrees) {
    const items = document.querySelectorAll('.page-item');
    items.forEach(el => {
        const pageNum = parseInt(el.dataset.pageNumber);
        if (selectedPages.has(pageNum)) {
            // Update visual rotation
            const container = el.querySelector('.canvas-container');
            const currentVisualRot = parseInt(container.dataset.rot || '0');
            const newVisualRot = (currentVisualRot + degrees) % 360;
            container.style.transform = `rotate(${newVisualRot}deg)`;
            container.dataset.rot = newVisualRot;

            // Update logical rotation
            const idx = pageNum - 1;
            pageRotations[idx] = (pageRotations[idx] + degrees) % 360;
            if (pageRotations[idx] < 0) pageRotations[idx] += 360;
        }
    });
}

document.getElementById('rotate-left-btn').addEventListener('click', () => applyRotation(-90));
document.getElementById('rotate-right-btn').addEventListener('click', () => applyRotation(90));

document.getElementById('select-all-btn').addEventListener('click', () => {
    const items = document.querySelectorAll('.page-item');
    items.forEach(el => {
        const pageNum = parseInt(el.dataset.pageNumber);
        selectedPages.add(pageNum);
        el.classList.add('selected');
    });
});

document.getElementById('save-btn').addEventListener('click', async () => {
    try {
        window.Utils.showToast('Saving rotated PDF...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);

        // In worker, we can only rotate specific pages by X degrees.
        // But here each page might have different rotation.
        // Does worker support batch rotate with per-page degrees?
        // No, worker code: `rotatePdf(file, degrees, pageIndices)`.
        // It applies SAME degrees to all indices.
        // So we need to group pages by rotation angle.

        let resultBuffer = buffer;

        // Group: 90, 180, 270 (0 does nothing)
        const groups = { 90: [], 180: [], 270: [] };

        for (let i = 0; i < totalPages; i++) {
            const rot = pageRotations[i];
            if (rot !== 0) groups[rot].push(i);
        }

        // Chain transformations?
        // This is tricky because `rotatePdf` returns a NEW Blob.
        // So for subsequent rotations we need to read that Blob back to Buffer or modify worker to accept Blob?
        // Worker accepts buffer/blob logic is handled by wrapper? 
        // Wrapper `readFileAsBuffer` handles File/Blob.
        // So we can chain: Blob -> ArrayBuffer -> Blob.

        let currentBlob = new Blob([buffer], { type: 'application/pdf' });

        for (const [degStr, pages] of Object.entries(groups)) {
            if (pages.length === 0) continue;

            const degrees = parseInt(degStr);
            const fileData = await currentBlob.arrayBuffer(); // Read blob back so we can pass it

            currentBlob = await window.PdfTools.runPdfTask('ROTATE_PDF', {
                file: fileData,
                degrees: degrees,
                pages: pages
            });
        }

        window.Utils.downloadBlob(currentBlob, 'rotated-document.pdf');
        window.Utils.showToast('Download started!', 'success');

    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});