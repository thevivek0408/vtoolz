import '../../js/pdf/pdf-main.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

let currentFile = null;
let pdfDoc = null;
let selectedPages = new Set();
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

        const canvas = document.createElement('canvas');
        pageItem.appendChild(canvas);

        const num = document.createElement('span');
        num.className = 'page-number';
        num.textContent = i;
        pageItem.appendChild(num);

        const check = document.createElement('span');
        check.className = 'check-mark';
        // textContent set via css helper or valid char
        pageItem.appendChild(check);

        pageItem.addEventListener('click', () => togglePageSelection(i, pageItem));
        grid.appendChild(pageItem);

        // Lazy render or minimal
        renderThumbnail(i, canvas);
    }
}

async function renderThumbnail(pageParams, canvas) {
    const page = await pdfDoc.getPage(pageParams);
    const viewport = page.getViewport({ scale: 0.3 }); // Lower res for grid
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

document.getElementById('select-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.page-item').forEach(el => {
        const page = parseInt(el.dataset.pageNumber);
        selectedPages.add(page);
        el.classList.add('selected');
    });
});

document.getElementById('deselect-all-btn').addEventListener('click', () => {
    selectedPages.clear();
    document.querySelectorAll('.page-item').forEach(el => el.classList.remove('selected'));
});

document.getElementById('delete-btn').addEventListener('click', async () => {
    if (selectedPages.size === 0) {
        window.Utils.showToast('No pages selected to delete.', 'warning');
        return;
    }

    if (selectedPages.size === totalPages) {
        window.Utils.showToast('Cannot delete all pages!', 'error');
        return;
    }

    try {
        window.Utils.showToast('Removing pages...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);
        const pages = Array.from(selectedPages).map(p => p - 1); // 0-based

        const blob = await window.PdfTools.runPdfTask('DELETE_PAGES', {
            file: buffer,
            pages: pages
        });

        window.Utils.downloadBlob(blob, 'modified-document.pdf');
        window.Utils.showToast('Download started!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});