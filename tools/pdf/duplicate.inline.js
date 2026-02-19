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
        pageItem.appendChild(check);

        pageItem.addEventListener('click', () => togglePageSelection(i, pageItem));
        grid.appendChild(pageItem);

        renderThumbnail(i, canvas);
    }
}

async function renderThumbnail(pageParams, canvas) {
    const page = await pdfDoc.getPage(pageParams);
    const viewport = page.getViewport({ scale: 0.3 }); // Low res for grid
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

document.getElementById('duplicate-btn').addEventListener('click', async () => {
    if (selectedPages.size === 0) {
        window.Utils.showToast('Please select at least one page.', 'error');
        return;
    }

    try {
        window.Utils.showToast('Duplicating pages...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);

        // Construct new page order
        const finalPages = [];
        for (let i = 0; i < totalPages; i++) {
            finalPages.push(i); // Add original
            if (selectedPages.has(i + 1)) {
                finalPages.push(i); // Add duplicate
            }
        }

        const blob = await window.PdfTools.runPdfTask('EXTRACT_PAGES', {
            file: buffer,
            pages: finalPages
        });

        window.Utils.downloadBlob(blob, 'duplicated-document.pdf');
        window.Utils.showToast('Download started!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});