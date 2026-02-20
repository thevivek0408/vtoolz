const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const outputArea = document.getElementById('output-area');
const statusText = document.getElementById('status-text');
const imageList = document.getElementById('image-list');

pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file) {
        processPdf(file);
    }
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
        processPdf(file);
    }
});

async function processPdf(file) {
    if (!file || file.type !== 'application/pdf') {
        statusText.textContent = 'Please upload a valid PDF file.';
        outputArea.style.display = 'block';
        return;
    }

    dropZone.style.display = 'none';
    outputArea.style.display = 'block';
    imageList.innerHTML = '';
    statusText.textContent = 'Reading PDF...';

    try {
        const fileBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
        const pdfDocument = await loadingTask.promise;
        const totalPages = pdfDocument.numPages;
        const baseName = (file.name || 'document').replace(/\.pdf$/i, '');

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            statusText.textContent = `Rendering page ${pageNum} of ${totalPages}...`;

            const page = await pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);

            const context = canvas.getContext('2d', { alpha: false });
            await page.render({ canvasContext: context, viewport }).promise;

            const imageUrl = canvas.toDataURL('image/jpeg', 0.9);

            const card = document.createElement('div');
            card.className = 'tool-card pdf2img-card';

            const image = document.createElement('img');
            image.src = imageUrl;
            image.alt = `Converted page ${pageNum}`;

            const downloadLink = document.createElement('a');
            downloadLink.className = 'btn btn-primary';
            downloadLink.textContent = `Download Page ${pageNum} (JPG)`;
            downloadLink.href = imageUrl;
            downloadLink.download = `${baseName}-page-${pageNum}.jpg`;

            card.appendChild(image);
            card.appendChild(downloadLink);
            imageList.appendChild(card);
        }

        statusText.textContent = `Conversion complete. ${totalPages} page(s) ready for download.`;
    } catch (error) {
        console.error(error);
        statusText.textContent = `Conversion failed: ${error.message || 'Unknown error'}`;
        dropZone.style.display = 'block';
    }
}
