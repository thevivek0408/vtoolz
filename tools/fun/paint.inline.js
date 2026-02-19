import '../../js/utils/common.js';

const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const wrapper = document.getElementById('canvas-wrapper');

// Tools
const tools = {
    brush: document.getElementById('tool-brush'),
    line: document.getElementById('tool-line'),
    rect: document.getElementById('tool-rect'),
    circle: document.getElementById('tool-circle'),
    eraser: document.getElementById('tool-eraser'),
    fill: document.getElementById('tool-fill')
};

// Properties
const colorPicker = document.getElementById('color-picker');
const sizeSlider = document.getElementById('size-slider');
const sizeVal = document.getElementById('size-val');

// Actions
const btnUndo = document.getElementById('btn-undo');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

// State
let isDrawing = false;
let currentTool = 'brush';
let startX, startY;
let snapshot; // For shapes preview
let history = [];
const maxHistory = 20;

function resizeCanvas() {
    // Set canvas size to match wrapper width (responsive)
    // Height fixed or aspect ratio? Let's do 600px height or 0.6 of width
    const w = wrapper.clientWidth;
    const h = Math.min(600, w * 0.75);

    // Avoid clearing if just resizing? 
    // Save content first
    const temp = canvas.toDataURL();

    canvas.width = w;
    canvas.height = h;

    // Restore content
    const img = new Image();
    img.src = temp;
    img.onload = () => {
        ctx.drawImage(img, 0, 0);
    };

    // Set default background to white if empty
    // Actually, best to just fill white now if new
    if (history.length === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
    }
}

window.addEventListener('resize', () => {
    // Debounce logic ideally, but for now just dont resize automatically to prevent data loss glitches
    // Or allow resize but it might crop.
});

// init size
setTimeout(resizeCanvas, 100);

// Tool Switching
Object.keys(tools).forEach(key => {
    tools[key].addEventListener('click', () => {
        document.querySelector('.tool-btn.active').classList.remove('active');
        tools[key].classList.add('active');
        currentTool = key;
    });
});

// Properties events
sizeSlider.addEventListener('input', (e) => sizeVal.textContent = e.target.value);

// Drawing Events
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', drawing);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseout', stopDraw);

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    startDraw({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    drawing({ offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top });
});
canvas.addEventListener('touchend', stopDraw);

function startDraw(e) {
    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
    ctx.beginPath();
    ctx.lineWidth = sizeSlider.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
    ctx.fillStyle = colorPicker.value;

    if (currentTool !== 'brush' && currentTool !== 'eraser') {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        ctx.moveTo(startX, startY);
    }

    if (currentTool === 'fill') {
        floodFill(startX, startY, hexToRgb(colorPicker.value));
        isDrawing = false; // Fill is single action
        saveState();
    }
}

function drawing(e) {
    if (!isDrawing) return;

    if (currentTool === 'brush' || currentTool === 'eraser') {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else {
        ctx.putImageData(snapshot, 0, 0); // Restore to avoid trails
        drawShape(e.offsetX, e.offsetY);
    }
}

function stopDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    saveState();
}

function drawShape(x, y) {
    ctx.beginPath();
    if (currentTool === 'line') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
    } else if (currentTool === 'rect') {
        ctx.rect(startX, startY, x - startX, y - startY);
    } else if (currentTool === 'circle') {
        let radius = Math.sqrt(Math.pow((startX - x), 2) + Math.pow((startY - y), 2));
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    }
    ctx.stroke();
    // Fill shapes? Optional. Currently wireframe.
}

// Flood Fill (Simple Stack-based)
function floodFill(x, y, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Get target color
    const startPos = (y * canvas.width + x) * 4;
    const targetColor = [data[startPos], data[startPos + 1], data[startPos + 2], data[startPos + 3]];

    // If colors match, return
    if (colorsMatch(targetColor, [...fillColor, 255])) return;

    const stack = [[x, y]];

    while (stack.length) {
        const [cx, cy] = stack.pop();
        const pos = (cy * canvas.width + cx) * 4;

        if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;

        if (colorsMatch([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]], targetColor)) {
            data[pos] = fillColor[0];
            data[pos + 1] = fillColor[1];
            data[pos + 2] = fillColor[2];
            data[pos + 3] = 255;

            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// History
function saveState() {
    if (history.length >= maxHistory) history.shift();
    history.push(canvas.toDataURL());
}

btnUndo.addEventListener('click', () => {
    if (history.length <= 1) return; // Keep at least one
    history.pop(); // Remove current state
    const prev = history[history.length - 1];
    const img = new Image();
    img.src = prev;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
});

btnClear.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});

btnSave.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'painting.png';
    link.href = canvas.toDataURL();
    link.click();
});