import { Utils } from '../utils/common.js';
import '../../js/pdf/pdf-main.js'; // Imports PdfTools global

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const fileListArea = document.getElementById('file-list');
    const btnCreate = document.getElementById('btn-create-pdf');

    let selectedFiles = []; // Array of File objects

    // Handle File Selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
        }
        fileInput.value = ''; // Reset
    });

    function addFiles(files) {
        // Filter images
        const images = files.filter(f => f.type.startsWith('image/'));
        if (images.length === 0) return;

        selectedFiles = [...selectedFiles, ...images];
        renderList();
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderList();
    }

    // Drag and Drop Reordering (Basic implementation)
    let draggedItem = null;

    function renderList() {
        fileListArea.innerHTML = '';
        if (selectedFiles.length === 0) {
            fileListArea.innerHTML = `
                <p class="text-center text-muted" style="margin-top: 70px;">
                    No pages yet. Click 'Add Photos' to start.<br>
                    Drag items to reorder pages.
                </p>`;
            btnCreate.disabled = true;
            return;
        }

        btnCreate.disabled = false;

        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;

            item.innerHTML = `
                <span style="margin-right:10px; color:var(--text-muted); cursor:grab;">☰</span>
                <img src="${URL.createObjectURL(file)}" alt="Page ${index + 1}">
                <div class="file-info">
                    <strong>Page ${index + 1}</strong>
                    <br><small>${file.name}</small>
                </div>
                <button class="btn-remove" data-idx="${index}">✖</button>
            `;

            // Drag Events
            item.addEventListener('dragstart', () => {
                draggedItem = index;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragover', (e) => e.preventDefault());
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIdx = index;
                if (draggedItem === null || draggedItem === targetIdx) return;

                // Reorder array
                const movedItem = selectedFiles.splice(draggedItem, 1)[0];
                selectedFiles.splice(targetIdx, 0, movedItem);

                draggedItem = null;
                renderList();
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                draggedItem = null;
            });

            // Remove Event
            item.querySelector('.btn-remove').addEventListener('click', () => removeFile(index));

            fileListArea.appendChild(item);
        });
    }

    // Create PDF
    btnCreate.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        try {
            Utils.showToast("Compiling PDF...", "info");

            // 1. Convert files to ArrayBuffers
            const imageBuffers = await Promise.all(
                selectedFiles.map(f => window.PdfTools.readFileAsBuffer(f))
            );

            // 2. Send to Worker
            // We use 'IMAGES_TO_PDF' which we should check if implemented in pdf-worker.
            // Assuming it is based on task.md list.
            const pdfBlob = await window.PdfTools.runPdfTask('IMAGES_TO_PDF', {
                images: imageBuffers,
                options: {
                    pageSize: 'A4',
                    margin: 20 // Standard document margin
                }
            });

            // 3. Download
            Utils.downloadBlob(pdfBlob, 'Compiled_Document.pdf');
            Utils.showToast("PDF Created Successfully!", "success");

        } catch (err) {
            console.error(err);
            Utils.showToast("Error creating PDF: " + err.message, "error");
        }
    });

});
