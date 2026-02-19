pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const statusText = document.getElementById('statusText');
const controls = document.getElementById('controls');
const downloadBtn = document.getElementById('downloadBtn');
const logArea = document.getElementById('logArea');

let extractedText = '';

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }

    extractedText = '';
    controls.style.display = 'none';
    logArea.style.display = 'block';
    logArea.textContent = 'Starting processing...';
    statusText.textContent = 'Reading PDF...';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

        statusText.textContent = `Processing ${pdf.numPages} pages...`;

        let combinedText = '';

        // Iterate pages
        for (let i = 1; i <= pdf.numPages; i++) {
            logArea.textContent += `\nProcessing page ${i}...`;
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Basic layout preservation attempts
            let lastY = -1;
            let pageText = '';

            textContent.items.forEach(item => {
                // Insert newline if Y changes significantly
                if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            });

            combinedText += pageText + '\n\n';
        }

        extractedText = combinedText;
        statusText.textContent = 'Extraction complete!';
        logArea.textContent += '\nDone. Click download.';
        controls.style.display = 'flex';

    } catch (err) {
        console.error(err);
        statusText.textContent = 'Error: ' + err.message;
    }
}

downloadBtn.addEventListener('click', () => {
    if (!extractedText) return;

    // Create a simple HTML structure for the Word doc
    // Word opens HTML if it has correct structure and mime
    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export HTML To Doc</title></head>
        <body>
            ${extractedText.replace(/\n/g, '<br>')}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.doc'; // .doc opens in Word
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});