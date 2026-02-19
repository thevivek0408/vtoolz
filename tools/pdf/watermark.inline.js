import '../../js/pdf/pdf-main.js';

let currentFile = null;

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) loadFile(files[0]);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadFile(e.target.files[0]);
});

function loadFile(file) {
    if (file.type !== 'application/pdf') {
        window.Utils.showToast('Please upload a PDF file.', 'error');
        return;
    }
    currentFile = file;

    document.getElementById('drop-zone').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
}

document.getElementById('apply-btn').addEventListener('click', async () => {
    const text = document.getElementById('watermark-text').value;
    if (!text.trim()) {
        window.Utils.showToast('Please enter watermark text.', 'error');
        return;
    }

    try {
        window.Utils.showToast('Applying watermark...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);
        const opacity = parseFloat(document.getElementById('opacity-range').value);

        const blob = await window.PdfTools.runPdfTask('WATERMARK_PDF', {
            file: buffer,
            text: text,
            options: { opacity }
        });

        window.Utils.downloadBlob(blob, 'watermarked-document.pdf');
        window.Utils.showToast('Download started!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});