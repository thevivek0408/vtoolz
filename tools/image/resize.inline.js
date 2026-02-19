import '../../js/image/image-main.js';

const fileInput = document.getElementById('file-input');
const results = document.getElementById('results');
const controls = document.getElementById('controls');
const dropZone = document.getElementById('drop-zone');
   const modeDimensionsBtn = document.getElementById('mode-dimensions');
   const modeSizeBtn = document.getElementById('mode-size');
   const dimensionControls = document.getElementById('dimension-controls');
   const sizeControls = document.getElementById('size-controls');
let selectedFiles = [];
   let resizeMode = 'dimensions';

   function setResizeMode(mode) {
       resizeMode = mode;
       const isDimensions = mode === 'dimensions';

       modeDimensionsBtn.classList.toggle('btn-primary', isDimensions);
       modeDimensionsBtn.classList.toggle('btn-secondary', !isDimensions);
       modeSizeBtn.classList.toggle('btn-primary', !isDimensions);
       modeSizeBtn.classList.toggle('btn-secondary', isDimensions);

       dimensionControls.style.display = isDimensions ? 'block' : 'none';
       sizeControls.style.display = isDimensions ? 'none' : 'block';
   }

   modeDimensionsBtn.addEventListener('click', () => setResizeMode('dimensions'));
   modeSizeBtn.addEventListener('click', () => setResizeMode('size'));

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
        div.className = 'tool-card';
        div.innerHTML = `
        <p><strong>${file.name}</strong></p>
        <p class="stats">${window.Utils.formatBytes(file.size)}</p>
        <div class="status">Waiting...</div>
    `;
        results.appendChild(div);
        file.uiElement = div;
    });
}

document.getElementById('resize-btn').addEventListener('click', async () => {
       const w = parseInt(document.getElementById('width-input').value) || 0;
       const h = parseInt(document.getElementById('height-input').value) || 0;
       const targetSizeValue = parseFloat(document.getElementById('target-size-input').value) || 0;
       const targetSizeUnit = document.getElementById('target-size-unit').value;
       const sizeFormat = document.getElementById('size-format').value;

       if (selectedFiles.length === 0) {
           window.Utils.showToast('Please upload at least one image.', 'error');
           return;
       }

       if (resizeMode === 'dimensions' && !w && !h) {
           window.Utils.showToast('Enter at least one dimension.', 'error');
           return;
       }

       if (resizeMode === 'size' && targetSizeValue <= 0) {
           window.Utils.showToast('Enter a valid target size.', 'error');
           return;
       }

       const targetBytes = targetSizeUnit === 'MB'
           ? Math.round(targetSizeValue * 1024 * 1024)
           : Math.round(targetSizeValue * 1024);

    for (const file of selectedFiles) {
        const status = file.uiElement.querySelector('.status');
           status.textContent = resizeMode === 'dimensions' ? 'Resizing...' : 'Optimizing to target size...';

           // Remove previous download button if user runs again
           const oldBtn = file.uiElement.querySelector('button');
           if (oldBtn) oldBtn.remove();

        try {
               const options = resizeMode === 'size'
                   ? { targetBytes, format: sizeFormat }
                   : {};

            const blob = await window.ImageTools.runImageTask('RESIZE', {
                   file,
                   width: resizeMode === 'dimensions' ? w : 0,
                   height: resizeMode === 'dimensions' ? h : 0,
                   options
            });

           const delta = file.size - blob.size;
           const deltaPct = file.size > 0 ? Math.round((delta / file.size) * 100) : 0;
           status.textContent = `Done! ${window.Utils.formatBytes(blob.size)} (${deltaPct >= 0 ? '-' : '+'}${Math.abs(deltaPct)}%)`;
            status.style.color = 'var(--accent-color)';

            const btn = document.createElement('button');
            btn.className = 'btn btn-primary btn-block';
            btn.style.marginTop = '10px';
            btn.textContent = 'Download';
            btn.onclick = () => window.Utils.downloadBlob(blob, `resized-${file.name}`);
            file.uiElement.appendChild(btn);

        } catch (err) {
            console.error(err);
            status.textContent = 'Error';
        }
    }
});