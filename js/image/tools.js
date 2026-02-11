import { state } from './state.js';
import { canvas, getMousePos, requestRender } from './core.js';
import { getActiveLayer } from './layers.js';
import { saveHistory } from './history.js';

let isDrawing = false;
let startX = 0, startY = 0;
let lastX = 0, lastY = 0;

export function initTools() {
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

function onMouseDown(e) {
    if (state.isSpacePressed) return;

    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    lastX = pos.x;
    lastY = pos.y;
    isDrawing = true;

    const layer = getActiveLayer();
    if (!layer) return;

    state.start = { x: startX, y: startY };

    if (state.tool === 'fill') {
        // Flood Fill
        const color = state.toolSettings.color;
        floodFill(layer, Math.floor(startX), Math.floor(startY), color);
        saveHistory('flood fill');
        requestRender();
    } else if (state.tool === 'pipette') {
        const p = layer.ctx.getImageData(startX, startY, 1, 1).data;
        const hex = rgbToHex(p[0], p[1], p[2]);
        state.toolSettings.color = hex;
        // Update UI color picker?
        // document.getElementById('color-picker').value = hex; 
    } else {
        // Brush/Eraser Start
        layer.ctx.beginPath();
        layer.ctx.moveTo(startX, startY);
    }
}

// Retouching Logic
function applyRetouch(e) {
    const l = getActiveLayer();
    if (!l) return;

    const pos = getMousePos(e); // {x, y} in Canvas Screen Space

    // Map to Layer Local
    const scaleX = l.canvas.width / l.width;
    const scaleY = l.canvas.height / l.height;

    const lx = (pos.x - l.x) * scaleX;
    const ly = (pos.y - l.y) * scaleY;

    // Brush Size
    const size = (state.toolSettings.size || 20) * scaleX;
    const r = Math.floor(size / 2);

    // Patch bounds
    const sx = Math.max(0, Math.floor(lx - r));
    const sy = Math.max(0, Math.floor(ly - r));
    const sw = Math.min(l.canvas.width - sx, 2 * r);
    const sh = Math.min(l.canvas.height - sy, 2 * r);

    if (sw <= 0 || sh <= 0) return;

    const imgData = l.ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;
    const mode = state.tool;

    for (let i = 0; i < data.length; i += 4) {
        // Circular check
        const px = (i / 4) % sw;
        const py = Math.floor((i / 4) / sw);

        // Pixel global pos relative to patch start
        const gpx = sx + px;
        const gpy = sy + py;

        // Distance from mouse center
        const dx = gpx - lx;
        const dy = gpy - ly;

        if (dx * dx + dy * dy > r * r) continue;

        if (mode === 'dodge') {
            data[i] = Math.min(255, data[i] * 1.05);
            data[i + 1] = Math.min(255, data[i + 1] * 1.05);
            data[i + 2] = Math.min(255, data[i + 2] * 1.05);
        } else if (mode === 'burn') {
            data[i] *= 0.95;
            data[i + 1] *= 0.95;
            data[i + 2] *= 0.95;
        } else if (mode === 'blur-tool') {
            if (Math.random() > 0.5) data[i] = (data[i] + data[i + 4] || data[i]) / 2; // cheap smear
        }
        // ... other modes simplified
    }

    l.ctx.putImageData(imgData, sx, sy);
    requestRender();
}

function onMouseMove(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    const layer = getActiveLayer();
    if (!layer) return;

    if (state.tool === 'brush' || state.tool === 'eraser') {
        // ... (existing)
        layer.ctx.lineTo(pos.x, pos.y);
        layer.ctx.lineCap = 'round';
        layer.ctx.lineJoin = 'round';
        layer.ctx.lineWidth = state.toolSettings.size;
        layer.ctx.strokeStyle = state.tool === 'eraser' ? 'rgba(0,0,0,1)' : state.toolSettings.color;
        layer.ctx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
        layer.ctx.stroke();
        requestRender();
    } else if (state.tool === 'move') {
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        layer.x += dx;
        layer.y += dy;
        requestRender();
    } else if (['dodge', 'burn', 'blur-tool'].includes(state.tool)) {
        applyRetouch(e);
    }

    lastX = pos.x;
    lastY = pos.y;
}

function onMouseUp(e) {
    if (isDrawing) {
        if (state.tool === 'brush' || state.tool === 'eraser' || state.tool === 'move') {
            saveHistory(state.tool);
        }
        isDrawing = false;
    }
}

// Helpers
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function floodFill(layer, x, y, hexColor) {
    // Convert hex to r,g,b,a
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const a = 255;

    // Get image data
    const w = layer.canvas.width;
    const h = layer.canvas.height;
    const imgData = layer.ctx.getImageData(0, 0, w, h);
    const data = imgData.data; // Uint8ClampedArray

    const stack = [[x, y]];
    const startPos = (y * w + x) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    if (startR === r && startG === g && startB === b && startA === a) return;

    while (stack.length) {
        const [cx, cy] = stack.pop();
        const pos = (cy * w + cx) * 4;

        if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;

        // Match start color?
        if (data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA) {
            data[pos] = r;
            data[pos + 1] = g;
            data[pos + 2] = b;
            data[pos + 3] = a;

            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
    }

    layer.ctx.putImageData(imgData, 0, 0);
}
