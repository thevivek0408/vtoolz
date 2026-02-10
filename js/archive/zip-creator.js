import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const fileCountSpan = document.getElementById('file-count');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const createZipBtn = document.getElementById('create-zip-btn');
    const filenameInput = document.getElementById('zip-filename');
    const compressionLevel = document.getElementById('compression-level');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');

    let filesToZip = [];

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
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
        // Reset input to allow re-selecting same files
        fileInput.value = '';
    });

    function handleFiles(files) {
        for (const file of files) {
            // Avoid duplicates? Or allow same name? 
            // JSZip handles same name by overwriting or folders, but simple flat list for now.
            // Let's just append.
            filesToZip.push(file);
        }
        updateFileList();
    }

    function updateFileList() {
        fileList.innerHTML = '';
        fileCountSpan.textContent = filesToZip.length;
        createZipBtn.disabled = filesToZip.length === 0;

        if (filesToZip.length === 0) {
            fileList.innerHTML = '<p class="text-muted" style="text-align: center; margin-top: 80px;">No files added yet.</p>';
            return;
        }

        filesToZip.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file"></i>
                    <span>${file.name}</span>
                    <span class="text-muted" style="font-size: 0.8rem;">(${Utils.formatBytes(file.size)})</span>
                </div>
                <button class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            fileList.appendChild(item);
        });

        // Attach listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                filesToZip.splice(index, 1);
                updateFileList();
            });
        });
    }

    clearAllBtn.addEventListener('click', () => {
        filesToZip = [];
        updateFileList();
    });

    // Create Zip
    createZipBtn.addEventListener('click', async () => {
        if (filesToZip.length === 0) return;

        createZipBtn.disabled = true;
        progressContainer.style.display = 'block';
        statusText.textContent = "Packing files...";

        try {
            const zip = new JSZip();

            // Add files
            filesToZip.forEach(file => {
                zip.file(file.name, file);
            });

            const compression = compressionLevel.value;

            // Generate
            const content = await zip.generateAsync({
                type: "blob",
                compression: compression,
                compressionOptions: {
                    level: compression === 'DEFLATE' ? 6 : null
                }
            }, (metadata) => {
                progressBar.value = metadata.percent;
                statusText.textContent = `Progress: ${metadata.percent.toFixed(0)}%`;
            });

            // Download
            const filename = (filenameInput.value || 'archive') + '.zip';
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);

            Utils.showToast("Zip created successfully!", "success");

        } catch (err) {
            console.error(err);
            Utils.showToast("Error creating zip: " + err.message, "error");
        } finally {
            createZipBtn.disabled = false;
            progressContainer.style.display = 'none';
            progressBar.value = 0;
        }
    });
});
