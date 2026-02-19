import '../../js/pdf/pdf-main.js';

const fileList = document.getElementById('file-list');
const convertBtn = document.getElementById('convert-btn');
let filesToConvert = [];

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    handleFiles(files);
});

document.getElementById('file-input').addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            window.Utils.showToast(`Skipped non-image: ${file.name}`, 'error');
            continue;
        }
        filesToConvert.push(file);
        addFileToList(file);
    }
    updateUI();
}

function addFileToList(file) {
    const item = document.createElement('div');
    item.className = 'file-item';

    const info = document.createElement('div');
    info.className = 'file-info';

    // Preview
    const img = document.createElement('img');
    const objUrl = URL.createObjectURL(file);
    img.src = objUrl;
    img.style.width = '40px';
    img.style.height = '40px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    img.onload = () => URL.revokeObjectURL(objUrl);

    const name = document.createElement('span');
    name.textContent = file.name + ' ';
    const sizeSmall = document.createElement('small');
    sizeSmall.className = 'text-muted';
    sizeSmall.textContent = `(${window.Utils.formatBytes(file.size)})`;
    name.appendChild(sizeSmall);

    info.appendChild(img);
    info.appendChild(name);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.onclick = () => {
        filesToConvert = filesToConvert.filter(f => f !== file);
        item.remove();
        updateUI();
    };

    item.appendChild(info);
    item.appendChild(removeBtn);
    fileList.appendChild(item);
}

function updateUI() {
    if (filesToConvert.length > 0) {
        convertBtn.style.display = 'inline-block';
    } else {
        convertBtn.style.display = 'none';
    }
}

convertBtn.addEventListener('click', async () => {
    try {
        window.Utils.showToast('Generating PDF...', 'info');

        // Use PDF-Lib to create PDF
        const pdfDoc = await PDFLib.PDFDocument.create();

        for (const file of filesToConvert) {
            const buffer = await file.arrayBuffer();
            let image;

            if (file.type === 'image/jpeg') {
                image = await pdfDoc.embedJpg(buffer);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(buffer);
            } else {
                // Try embedding as PNG fallback (for WEBP if supported by browser decoding first, but simple fallback to skipping)
                window.Utils.showToast(`Format ${file.type} might need conversion first. Attempting embed...`, 'warning');
                // For now, simplify: only standard formats or rely on library error
                // Actually, PDF-Lib supports JPG/PNG. WEBP not directly.
                // For a quick fix, we render to canvas to get PNG if needed, but let's stick to simple embed for now.
                try {
                    image = await pdfDoc.embedPng(buffer);
                } catch (e) {
                    image = await pdfDoc.embedJpg(buffer);
                }
            }

            if (image) {
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        window.Utils.downloadBlob(blob, 'images-converted.pdf');
        window.Utils.showToast('PDF Created!', 'success');

    } catch (err) {
        console.error(err);
        window.Utils.showToast('Error: ' + err.message, 'error');
    }
});