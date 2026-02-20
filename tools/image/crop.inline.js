import '../../js/image/image-main.js';

const dropZone = document.getElementById('drop-zone');
const editorArea = document.getElementById('editor-area');
const img = document.getElementById('image-to-crop');
let cropper;
let fileName = 'cropped.png';

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) loadImage(files[0]);
});
document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadImage(e.target.files[0]);
});

function loadImage(file) {
    fileName = file.name;
    const url = URL.createObjectURL(file);
    img.src = url;
    dropZone.style.display = 'none';
    editorArea.style.display = 'block';

    // Initialize Cropper
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
        viewMode: 2,
        autoCropArea: 0.8,
    });
}

// Expose to window for inline onclick handlers
window.cropper = null;
// Sync the variable
const checkCropper = setInterval(() => {
    if (cropper) window.cropper = cropper;
}, 100);

window.flipCropHorizontal = () => {
    if (!cropper) return;
    window.scaleXVal = (window.scaleXVal || 1) * -1;
    cropper.scaleX(window.scaleXVal);
};


document.getElementById('crop-btn').addEventListener('click', () => {
    if (!cropper) return;

    cropper.getCroppedCanvas().toBlob((blob) => {
        window.Utils.downloadBlob(blob, `cropped-${fileName}`);
    });
});
