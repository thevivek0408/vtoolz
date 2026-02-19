import { showToast } from '../../../js/utils/common.js';

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const workspace = document.getElementById('workspace');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const zoomSlider = document.getElementById('zoom-slider');
const stage = document.getElementById('stage');

let img = new Image();
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;

// Standard Passport Size (35mm x 45mm @ 300 DPI approx 413x531 px)
// We will use a larger canvas for quality: 826x1062 (2x)
const CANVAS_WIDTH = 826;
const CANVAS_HEIGHT = 1062;

// Init
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFile);

// Drag Handling
stage.addEventListener('mousedown', e => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    stage.style.cursor = 'grabbing';
});
window.addEventListener('mouseup', () => {
    isDragging = false;
    stage.style.cursor = 'default';
});
window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    draw();
});

// Zoom
zoomSlider.addEventListener('input', e => {
    scale = parseFloat(e.target.value);
    draw();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    zoomSlider.value = 1;
    draw();
});

document.getElementById('btn-save').addEventListener('click', () => {
    // Create a temp canvas to crop exactly what's visible in the guide overlay
    // The overlay is essentially the whole canvas view in this simple implementation
    // because we fixed the canvas size to the output size.
    // So we just save the canvas.

    const link = document.createElement('a');
    link.download = 'passport-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Photo downloaded!');
});

function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        img.onload = () => {
            initEditor();
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

function initEditor() {
    dropZone.style.display = 'none';
    workspace.style.display = 'block';

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Fit lines styles
    canvas.style.width = '350px'; // Visual size matches overlay
    canvas.style.height = '450px';

    // Initial auto-fit
    const ratio = Math.max(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
    scale = ratio;
    zoomSlider.value = scale;

    // Center
    offsetX = (CANVAS_WIDTH - img.width * scale) / 2;
    offsetY = (CANVAS_HEIGHT - img.height * scale) / 2;

    draw();
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#eee'; // Light bg to see boundaries
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw image with transform
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
}