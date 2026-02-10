import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const dropText = document.getElementById('drop-text');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');

    let currentZip = null;

    // Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
        fileInput.value = '';
    });

    async function handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
            Utils.showToast("Please select a valid .zip file.", "error");
            return;
        }

        dropText.textContent = file.name;
        fileList.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 80px;">Loading archive...</p>';

        try {
            const zip = new JSZip();
            currentZip = await zip.loadAsync(file);

            displayContents(currentZip);
            Utils.showToast("Archive loaded successfully!", "success");
        } catch (err) {
            console.error(err);
            Utils.showToast("Error reading zip: " + err.message, "error");
            fileList.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 80px;">Error loading archive.</p>';
        }
    }

    function displayContents(zip) {
        fileList.innerHTML = '';

        let count = 0;
        zip.forEach((relativePath, zipEntry) => {
            count++;
            const item = document.createElement('div');
            item.className = 'file-item';

            const isDir = zipEntry.dir;
            const icon = isDir ? 'fa-folder' : 'fa-file';

            item.innerHTML = `
                <div class="file-info">
                    <i class="fas ${icon}"></i>
                    <span>${relativePath}</span>
                </div>
                ${!isDir ? `<button class="extract-btn" data-filename="${relativePath}">Extract</button>` : ''}
            `;
            fileList.appendChild(item);
        });

        if (count === 0) {
            fileList.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 80px;">Empty archive.</p>';
        }

        // Attach listeners
        document.querySelectorAll('.extract-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const filename = e.currentTarget.dataset.filename;
                await extractFile(filename);
            });
        });
    }

    async function extractFile(filename) {
        if (!currentZip) return;

        try {
            const file = currentZip.file(filename);
            if (!file) return;

            const blob = await file.async("blob");

            // Trigger download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename.split('/').pop(); // just the filename, simplified
            link.click();
            URL.revokeObjectURL(link.href);

            Utils.showToast(`Extracted ${filename}`, "success");
        } catch (err) {
            console.error(err);
            Utils.showToast("Error extracting file", "error");
        }
    }
});
