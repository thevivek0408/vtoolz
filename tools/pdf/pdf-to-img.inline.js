import '../../js/pdf/pdf-main.js';

// Use main thread PDF.js for rendering to canvas
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../js/vendor/pdf.worker.min.js';

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) processPdf(files[0]);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) processPdf(e.target.files[0]);
});

async function processPdf(file) {
    if (file.type !== 'application/pdf') {
        window.Utils.showToast('Please upload a PDF file.', 'error');
        return;
    }

    document.getElementById('drop-zone').style.display = 'none';
    const output = document.getElementById('output-area');
    output.style.display = 'block';
    const list = document.getElementById('image-list');
    list.innerHTML = '';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const total = pdf.numPages;

        for (let i = 1; i <= total; i++) {
            const statusVal = document.getElementById('status-text');
            statusVal.textContent = `Rendering page ${i} of ${total}...`;

            const page = await pdf.getPage(i);
            const scale = 2.0; // High quality
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport }).promise;

            // Create Download Link
            const wrapper = document.createElement('div');
            wrapper.className = 'tool-card';
            wrapper.style.alignItems = 'center';

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/jpeg', 0.8);
            img.style.maxWidth = '100%';
            img.style.border = '1px solid #ddd';

            const btn = document.createElement('button');
            btn.className = 'btn btn-primary';
            btn.textContent = `Download Page ${i} (JPG)`;
            btn.style.marginTop = '10px';
            btn.onclick = () => {
                const a = document.createElement('a');
                a.href = img.src;
                a.download = `page-${i}.jpg`;
                a.click();
            };

            wrapper.appendChild(img);
            wrapper.appendChild(btn);
            list.appendChild(wrapper);
        }

        document.getElementById('status-text').textContent = "Conversion Complete!";
        window.Utils.showToast('All pages rendered.', 'success');

    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
}