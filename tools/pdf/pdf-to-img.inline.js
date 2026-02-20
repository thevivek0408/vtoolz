const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const convertBtn = document.getElementById('convert-btn');
const outputArea = document.getElementById('output-area');
const statusText = document.getElementById('status-text');
const imageList = document.getElementById('image-list');

let selectedPdfFile = null;

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
        handleSelectedFile(file);
    }
});

fileInput.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) {
        handleSelectedFile(file);
    }
});

convertBtn.addEventListener('click', async () => {
    if (!selectedPdfFile) {
        return;
    }
    await convertPdfToImages(selectedPdfFile);
});

function handleSelectedFile(file) {
    const fileName = file?.name || '';
    const isPdf = file?.type === 'application/pdf' || /\.pdf$/i.test(fileName);

    if (!isPdf) {
        selectedPdfFile = null;
        convertBtn.style.display = 'none';
        outputArea.style.display = 'block';
        statusText.textContent = 'Please upload a valid PDF file.';
        imageList.innerHTML = '';
        return;
    }

    selectedPdfFile = file;
    outputArea.style.display = 'block';
    imageList.innerHTML = '';
    statusText.textContent = `Selected: ${fileName}. Click "Convert to Images".`;
    convertBtn.style.display = 'inline-block';
}

async function convertPdfToImages(file) {
    convertBtn.disabled = true;
    imageList.innerHTML = '';
    statusText.textContent = 'Reading PDF...';

    try {
        const fileBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer, disableWorker: true });
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

            const pageBlob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error(`Failed to encode page ${pageNum}`));
                    }
                }, 'image/jpeg', 0.9);
            });

            const previewUrl = URL.createObjectURL(pageBlob);

            const card = document.createElement('div');
            card.className = 'tool-card pdf2img-card';

            const image = document.createElement('img');
            image.src = previewUrl;
            image.alt = `Converted page ${pageNum}`;

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary';
            downloadBtn.textContent = `Download Page ${pageNum} (JPG)`;
            downloadBtn.addEventListener('click', () => {
                downloadBlob(pageBlob, `${baseName}-page-${pageNum}.jpg`);
            });

            card.appendChild(image);
            card.appendChild(downloadBtn);
            imageList.appendChild(card);
        }

        statusText.textContent = `Conversion complete. ${totalPages} page(s) ready for download.`;
    } catch (error) {
        console.error(error);
        statusText.textContent = `Conversion failed: ${error.message || 'Unknown error'}`;
    } finally {
        convertBtn.disabled = false;
    }
}

function downloadBlob(blob, fileName) {
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
