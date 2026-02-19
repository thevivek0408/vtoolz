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
    document.getElementById('file-info').style.display = 'block';
    document.getElementById('file-name').textContent = `${file.name} (${window.Utils.formatBytes(file.size)})`;
    document.getElementById('reverse-btn').style.display = 'inline-block';
}

document.getElementById('reverse-btn').addEventListener('click', async () => {
    try {
        window.Utils.showToast('Reversing pages...', 'info');

        const buffer = await window.PdfTools.readFileAsBuffer(currentFile);

        const blob = await window.PdfTools.runPdfTask('REVERSE_PDF', {
            file: buffer
        });

        window.Utils.downloadBlob(blob, 'reversed-document.pdf');
        window.Utils.showToast('Download started!', 'success');
    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});