import '../../js/image/image-main.js';

const fileInput = document.getElementById('file-input');
const qualitySlider = document.getElementById('quality');
const qualityVal = document.getElementById('quality-val');
const results = document.getElementById('results');
const controls = document.getElementById('controls');
const dropZone = document.getElementById('drop-zone');

let selectedFiles = [];

qualitySlider.addEventListener('input', (e) => {
    qualityVal.textContent = Math.round(e.target.value * 100) + '%';
});

window.Utils.initDragAndDrop('#drop-zone', (files) => handleFiles(files));
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (selectedFiles.length === 0) {
        window.Utils.showToast('No valid images found', 'error');
        return;
    }

    dropZone.style.display = 'none';
    controls.style.display = 'block';
    results.innerHTML = '';

    selectedFiles.forEach(file => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <p><strong>${file.name}</strong></p>
            <p class="stats">Original: ${window.Utils.formatBytes(file.size)}</p>
            <div class="status-indicator">Pending...</div>
        `;
        results.appendChild(card);

        // Keep reference for status update
        file.cardElement = card;
    });
}

document.getElementById('compress-btn').addEventListener('click', async () => {
    const quality = parseFloat(qualitySlider.value);

    for (const file of selectedFiles) {
        const card = file.cardElement;
        const status = card.querySelector('.status-indicator');
        status.textContent = 'Compressing...';

        try {
            const blob = await window.ImageTools.runImageTask('COMPRESS', {
                file,
                options: { quality }
            });

            const saved = file.size - blob.size;
            const savedPct = Math.round((saved / file.size) * 100);

            status.innerHTML = `
                <span style="color:var(--accent-color)">Done!</span><br>
                New Size: ${window.Utils.formatBytes(blob.size)} (-${savedPct}%)
            `;

            // Add preview and download
            const url = URL.createObjectURL(blob);
            const img = document.createElement('img');
            img.src = url;
            card.insertBefore(img, card.querySelector('.stats')); // Insert before stats

            const link = document.createElement('a');
            link.className = 'btn btn-primary btn-block';
            link.style.marginTop = '10px';
            link.textContent = 'Download';
            link.href = URL.createObjectURL(blob);
            link.download = `compressed-${file.name}`;
            card.appendChild(link);

        } catch (err) {
            console.error(err);
            status.textContent = 'Error: ' + err.message;
            status.style.color = 'var(--danger-color)';
        }
    }
    window.Utils.showToast('Batch compression complete!', 'success');
});
