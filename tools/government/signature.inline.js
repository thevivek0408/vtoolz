import '../../js/utils/common.js';

const canvas = document.getElementById('sigCanvas');
const ctx = canvas.getContext('2d');
const colorInput = document.getElementById('penColor');
const widthInput = document.getElementById('penWidth');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const dlPngBtn = document.getElementById('downloadPngBtn');
const dlJpgBtn = document.getElementById('downloadJpgBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let history = [];
const maxHistory = 20;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDrawing({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    draw({
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    });
});

canvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    saveState();
}

function draw(e) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = widthInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

function saveState() {
    if (history.length >= maxHistory) history.shift();
    history.push(canvas.toDataURL());
    undoBtn.disabled = false;
}

undoBtn.addEventListener('click', () => {
    if (history.length === 0) return;
    const previousState = history.pop();
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
});

saveState();

clearBtn.addEventListener('click', () => {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

dlPngBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

dlJpgBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'signature.jpg';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tCtx.drawImage(canvas, 0, 0);
    link.href = tempCanvas.toDataURL('image/jpeg');
    link.click();
});