import '../../js/pdf/pdf-main.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

let currentFile = null;
let pdfDoc = null;
let totalPages = 0;
let pageOrder = []; // Array of original page indices (0-based)

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

        // Init original order
        pageOrder = Array.from({ length: totalPages }, (_, i) => i);

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

    for (let i = 0; i < pageOrder.length; i++) {
        const originalIndex = pageOrder[i];
        const pageNum = originalIndex + 1; // 1-based for display

        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.originalIndex = originalIndex;
        pageItem.draggable = true;

        const canvas = document.createElement('canvas'); // Placeholder
        pageItem.appendChild(canvas);

        const num = document.createElement('span');
        num.className = 'page-number';
        num.textContent = pageNum;
        pageItem.appendChild(num);

        // Drag Events
        pageItem.addEventListener('dragstart', handleDragStart);
        pageItem.addEventListener('dragover', handleDragOver);
        pageItem.addEventListener('drop', handleDrop);
        pageItem.addEventListener('dragend', handleDragEnd);

        grid.appendChild(pageItem);

        // Render content
        renderThumbnail(pageNum, canvas);
    }
}

async function renderThumbnail(pageNumber, canvas) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.3 });
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;
}

// Drag & Drop Logic
let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    if (dragSrcEl !== this) {
        // Swap DOM
        // Simple swap logic for grid? 
        // Or insert before/after?
        // Let's swap the array indices and re-render or just swap DOM?
        // Swapping DOM is faster but need to update data model carefully.
        // Let's use INSERT logic for better UX (reorder).

        // Get all items
        const grid = document.getElementById('page-grid');
        const items = [...grid.children];
        const srcIndex = items.indexOf(dragSrcEl);
        const targetIndex = items.indexOf(this);

        if (srcIndex < targetIndex) {
            this.parentNode.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            this.parentNode.insertBefore(dragSrcEl, this);
        }

        // Update data model
        const movedItem = pageOrder.splice(srcIndex, 1)[0];
        pageOrder.splice(targetIndex, 0, movedItem);
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

document.getElementById('reset-btn').addEventListener('click', () => {
    pageOrder = Array.from({ length: totalPages }, (_, i) => i);
    const grid = document.getElementById('page-grid');
    // Re-sort DOM to match original
    grid.innerHTML = '';
    renderPageGrid(); // Re-render everything
});

document.getElementById('save-btn').addEventListener('click', async () => {
    try {
        window.Utils.showToast('Saving reordered PDF...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);

        // Use EXTRACT_PAGES with the new order
        const blob = await window.PdfTools.runPdfTask('EXTRACT_PAGES', {
            file: buffer,
            pages: pageOrder
        });

        window.Utils.downloadBlob(blob, 'reordered-document.pdf');
        window.Utils.showToast('Download started!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});