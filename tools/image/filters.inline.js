import '../../js/image/image-main.js';

const dropZone = document.getElementById('drop-zone');
const editorArea = document.getElementById('editor-area');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let originalImage = new Image();
let fileName = 'image.png';

window.Utils.initDragAndDrop('#drop-zone', (files) => {
    if (files.length > 0) loadImage(files[0]);
});
document.getElementById('file-input').addEventListener('change', (e) => {
    if (e.target.files.length > 0) loadImage(e.target.files[0]);
});

function loadImage(file) {
    if (!file.type.startsWith('image/')) return;
    fileName = file.name;
    const url = URL.createObjectURL(file);
    originalImage.onload = () => {
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        applyFilters(); // Initial draw
        dropZone.style.display = 'none';
        editorArea.style.display = 'block';
        URL.revokeObjectURL(url);
    };
    originalImage.src = url;
}

// Filters State
const filters = {
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    blur: 0
};

// Attach listeners
['brightness', 'contrast', 'grayscale', 'blur'].forEach(key => {
    const slider = document.getElementById(key);
    const val = document.getElementById(`val-${key}`);

    slider.addEventListener('input', (e) => {
        filters[key] = e.target.value;
        val.textContent = e.target.value + (key === 'blur' ? 'px' : '%');
        requestAnimationFrame(applyFilters);
    });
});

function applyFilters() {
    // We use main-thread canvas for preview interactivity (Workers are async/laggy for sliders)
    // Ideally we'd optimize, but for standard images this is fine.
    const filterString = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        grayscale(${filters.grayscale}%) 
        blur(${filters.blur}px)
    `;

    ctx.filter = filterString;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0);
}

document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('grayscale').value = 0;
    document.getElementById('blur').value = 0;

    // Trigger inputs
    ['brightness', 'contrast', 'grayscale', 'blur'].forEach(k => {
        document.getElementById(k).dispatchEvent(new Event('input'));
    });
});

document.getElementById('download-btn').addEventListener('click', () => {
    canvas.toBlob((blob) => {
        window.Utils.downloadBlob(blob, `edited-${fileName}`);
    }, 'image/png'); // Default to PNG for quality
});