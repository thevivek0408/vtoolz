import '../../js/image/image-main.js';

const fileInput = document.getElementById('file-input');
const results = document.getElementById('results');
const controls = document.getElementById('controls');
const dropZone = document.getElementById('drop-zone');
let selectedFiles = [];

window.Utils.initDragAndDrop('#drop-zone', (files) => handleFiles(files));
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    selectedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (selectedFiles.length === 0) return;

    dropZone.style.display = 'none';
    controls.style.display = 'block';
    results.innerHTML = '';

    selectedFiles.forEach(file => {
        const div = document.createElement('div');
        div.className = 'convert-row';
        div.innerHTML = `
        <div style="flex:1">
            <strong>${file.name}</strong><br>
            <span style="font-size:0.8rem; color:var(--text-muted)">${file.type}</span>
        </div>
        <div class="status" style="font-weight:500; min-width:80px; text-align:right;">Pending</div>
        <div class="action-area" style="min-width:100px; text-align:right;"></div>
    `;
        results.appendChild(div);
        file.uiElement = div;
    });
}

document.getElementById('convert-btn').addEventListener('click', async () => {
    const format = document.getElementById('format-select').value;

    for (const file of selectedFiles) {
        const status = file.uiElement.querySelector('.status');
        const actionArea = file.uiElement.querySelector('.action-area');

        status.textContent = 'Converting...';

        try {
            const blob = await window.ImageTools.runImageTask('CONVERT', {
                file, format
            });

            status.textContent = 'Done!';
            status.style.color = 'var(--accent-color)';

            const ext = format.split('/')[1];
            const newName = file.name.split('.')[0] + '.' + (ext === 'jpeg' ? 'jpg' : ext);

            const link = document.createElement('a');
            link.className = 'btn btn-primary convert-download';
            link.textContent = 'Download';
            link.href = URL.createObjectURL(blob);
            link.download = newName;

            actionArea.innerHTML = '';
            actionArea.appendChild(link);

        } catch (err) {
            console.error(err);
            status.textContent = 'Error';
            status.style.color = 'var(--danger-color)';
        }
    }
});
