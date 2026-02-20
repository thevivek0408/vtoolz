(function () {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const convertBtn = document.getElementById('convert-btn');
    const outputArea = document.getElementById('output-area');
    const statusText = document.getElementById('status-text');
    const imageList = document.getElementById('image-list');

    if (!dropZone || !fileInput || !convertBtn || !outputArea || !statusText || !imageList) {
        return;
    }

    const pdfjs = window.pdfjsLib || globalThis.pdfjsLib;
    if (!pdfjs) {
        outputArea.style.display = 'block';
        statusText.textContent = 'PDF engine failed to load. Please refresh once and try again.';
        return;
    }

    pdfjs.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

    let selectedPdfFile = null;

    dropZone.addEventListener('click', function () {
        fileInput.click();
    });

    dropZone.addEventListener('dragover', function (event) {
        event.preventDefault();
        dropZone.classList.add('highlight');
    });

    dropZone.addEventListener('dragleave', function (event) {
        event.preventDefault();
        dropZone.classList.remove('highlight');
    });

    dropZone.addEventListener('drop', function (event) {
        event.preventDefault();
        dropZone.classList.remove('highlight');
        const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
        if (file) {
            handleSelectedFile(file, true);
        }
    });

    fileInput.addEventListener('change', function (event) {
        const file = event.target.files && event.target.files.length ? event.target.files[0] : null;
        if (file) {
            handleSelectedFile(file, true);
        }
    });

    convertBtn.addEventListener('click', function () {
        if (!selectedPdfFile) {
            return;
        }
        convertPdfToImages(selectedPdfFile);
    });

    function handleSelectedFile(file, autoStart) {
        const fileName = file && file.name ? file.name : '';
        const isPdf = (file && file.type === 'application/pdf') || /\.pdf$/i.test(fileName);

        outputArea.style.display = 'block';
        imageList.innerHTML = '';

        if (!isPdf) {
            selectedPdfFile = null;
            convertBtn.style.display = 'none';
            statusText.textContent = 'Please upload a valid PDF file.';
            return;
        }

        selectedPdfFile = file;
        convertBtn.style.display = 'inline-block';
        statusText.textContent = 'Selected: ' + fileName + '. Converting...';

        if (autoStart) {
            convertPdfToImages(file);
        }
    }

    async function convertPdfToImages(file) {
        convertBtn.disabled = true;
        imageList.innerHTML = '';
        statusText.textContent = 'Reading PDF...';

        try {
            const fileBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: fileBuffer, disableWorker: true });
            const pdfDocument = await loadingTask.promise;
            const totalPages = pdfDocument.numPages;
            const baseName = (file.name || 'document').replace(/\.pdf$/i, '');

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                statusText.textContent = 'Rendering page ' + pageNum + ' of ' + totalPages + '...';

                const page = await pdfDocument.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);

                const context = canvas.getContext('2d', { alpha: false });
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                const pageBlob = await canvasToJpegBlob(canvas);
                const previewUrl = URL.createObjectURL(pageBlob);

                const card = document.createElement('div');
                card.className = 'tool-card pdf2img-card';

                const image = document.createElement('img');
                image.src = previewUrl;
                image.alt = 'Converted page ' + pageNum;

                const button = document.createElement('button');
                button.className = 'btn btn-primary';
                button.textContent = 'Download Page ' + pageNum + ' (JPG)';
                button.addEventListener('click', function () {
                    downloadBlob(pageBlob, baseName + '-page-' + pageNum + '.jpg');
                });

                card.appendChild(image);
                card.appendChild(button);
                imageList.appendChild(card);
            }

            statusText.textContent = 'Conversion complete. ' + totalPages + ' page(s) ready for download.';
        } catch (error) {
            console.error(error);
            statusText.textContent = 'Conversion failed: ' + (error && error.message ? error.message : 'Unknown error');
        } finally {
            convertBtn.disabled = false;
        }
    }

    function canvasToJpegBlob(canvas) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (blob) {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to generate image blob.'));
                }
            }, 'image/jpeg', 0.9);
        });
    }

    function downloadBlob(blob, fileName) {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(function () {
            URL.revokeObjectURL(blobUrl);
        }, 1000);
    }
})();
