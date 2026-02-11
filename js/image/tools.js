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
    window.addEventListener('dblclick', onDoubleClick); // Add double click

    // Bind Handles
    document.querySelectorAll('.handle').forEach(h => {
        h.addEventListener('mousedown', onHandleDown);
    });
}

function onHandleDown(e) {
    if (state.tool !== 'move' || !state.toolSettings.showTransformControls) return;
    e.stopPropagation(); // Don't trigger canvas mousedown
    e.preventDefault();

    const layer = getActiveLayer();
    if (!layer) return;

    state.isTransforming = true;
    state.transformHandle = e.target.dataset.handle;
    state.start = getMousePos(e);
    // Snapshot layer state
    state.transformStart = {
        x: layer.x,
        y: layer.y,
        w: layer.width,
        h: layer.height
    };
    lastX = state.start.x;
    lastY = state.start.y;
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
    } else if (state.tool === 'magic-wand') {
        const color = layer.ctx.getImageData(startX, startY, 1, 1).data;
        const hex = rgbToHex(color[0], color[1], color[2]);
        magicWandSelect(layer, Math.floor(startX), Math.floor(startY), hex);
        requestRender();
    } else if (state.tool === 'select-rect') {
        // Start Selection
        state.selection = {
            x: startX,
            y: startY,
            w: 0,
            h: 0
        };
        requestRender(); // Render initial selection (invisible)
    } else if (state.tool === 'select-lasso') {
        // Add point
        const pt = { x: startX, y: startY };

        // Check for closure (near start)
        if (state.lassoPoints.length > 2) {
            const start = state.lassoPoints[0];
            const dist = Math.hypot(pt.x - start.x, pt.y - start.y);
            if (dist < 10) {
                // Close loop
                state.selectionPath = [...state.lassoPoints];
                state.lassoPoints = [];
                // Calculate bounds for simple rect check optimization
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                state.selectionPath.forEach(p => {
                    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                });
                state.selection = {
                    x: minX, y: minY, w: maxX - minX, h: maxY - minY
                };
                requestRender();
                return;
            }
        }
        state.lassoPoints.push(pt);
        requestRender();
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
    // Transform Logic
    if (state.isTransforming && state.transformHandle) {
        handleTransform(e);
        return;
    }

    if (!isDrawing) return;
    const pos = getMousePos(e);
    const layer = getActiveLayer();
    if (!layer) return;

    if (state.tool === 'select-rect') {
        const w = pos.x - startX;
        const h = pos.y - startY;
        state.selection = {
            x: w < 0 ? startX + w : startX,
            y: h < 0 ? startY + h : startY,
            w: Math.abs(w),
            h: Math.abs(h)
        };
        requestRender();
        return;
    }

    if (state.tool === 'brush' || state.tool === 'eraser') {
        // Selection Clipping Check
        if (state.selection) {
            // Simple Point Check (Clipping path is better but context state is tricky)
            // If any part of the line segment is outside, we might skip or clip.
            // For now, strict check: if current mouse pos is outside, don't draw.
            // A better way for smooth strokes is using clip() on the context, but that requires save/restore per stroke or per frame.
            // Let's try simple bounds check for the current point.
            if (pos.x < state.selection.x || pos.x > state.selection.x + state.selection.w ||
                pos.y < state.selection.y || pos.y > state.selection.y + state.selection.h) {
                // Determine if we should lift pen or just not draw segment?
                layer.ctx.moveTo(pos.x, pos.y); // Skip to new pos without drawing
                lastX = pos.x;
                lastY = pos.y;
                return;
            }

            // Polygon Check
            if (state.selectionPath && !isPointInPolygon(pos, state.selectionPath)) {
                layer.ctx.moveTo(pos.x, pos.y);
                lastX = pos.x;
                lastY = pos.y;
                return;
            }

            // Mask Check (Magic Wand)
            if (state.selectionMask) {
                const idx = (Math.floor(pos.y) * layer.canvas.width + Math.floor(pos.x));
                if (!state.selectionMask[idx]) {
                    layer.ctx.moveTo(pos.x, pos.y);
                    lastX = pos.x;
                    lastY = pos.y;
                    return;
                }
            }
        }

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
    } else if (state.tool === 'shape') {
        updateShapePreview(pos);
    } else if (state.tool === 'gradient') {
        updateGradientPreview(pos);
    }

    lastX = pos.x;
    lastY = pos.y;
}

function onMouseUp(e) {
    if (state.transformHandle) {
        state.transformHandle = null;
        saveHistory('Transform');
        requestRender();
    }

    if (isDrawing) {
        if (state.tool === 'brush' || state.tool === 'eraser' || state.tool === 'move') {
            saveHistory(state.tool);
        } else if (state.tool === 'shape' || state.tool === 'gradient') {
            commitPreviewToLayer();
            saveHistory(state.tool);
            // Clear preview
            state.previewCanvas = null;
            state.previewCtx = null;
            requestRender();
        }
        isDrawing = false;
    }
}

function handleTransform(evt) {
    const layer = getActiveLayer();
    if (!layer) return;

    const pos = getMousePos(evt);
    const start = state.transformStart;
    const handle = state.transformHandle;

    // Delta from start mouse to current mouse
    // NOTE: Mouse pos is in canvas coordinates. 
    const dx = pos.x - state.start.x;
    const dy = pos.y - state.start.y;

    if (handle === 'br') {
        layer.width = Math.max(1, start.w + dx);
        layer.height = Math.max(1, start.h + dy);
    } else if (handle === 'bl') {
        layer.x = start.x + dx;
        layer.width = Math.max(1, start.w - dx);
        layer.height = Math.max(1, start.h + dy);
    } else if (handle === 'tr') {
        layer.y = start.y + dy;
        layer.width = Math.max(1, start.w + dx);
        layer.height = Math.max(1, start.h - dy);
    } else if (handle === 'tl') {
        layer.x = start.x + dx;
        layer.y = start.y + dy;
        layer.width = Math.max(1, start.w - dx);
        layer.height = Math.max(1, start.h - dy);
    }

    // Update canvas size implies clearing/resizing internal canvas?
    // Doing straightforward scaling of the internal canvas content is expensive (ctx.drawImage).
    // Better approach: layer.width/height is the DISPLAY size. 
    // internal canvas stays same size, or we resample on commit.
    // For this simple editor, let's treat layer.width/height as display size.
    // Core render loop uses `ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height)` which handles scaling!

    requestRender();
}

// --- Tool Implementations ---

function commitPreviewToLayer() {
    const l = getActiveLayer();
    if (!l || !state.previewCanvas) return;

    // Draw preview onto active layer
    l.ctx.drawImage(state.previewCanvas, 0, 0);
}

function updateShapePreview(pos) {
    initPreviewCanvas();
    const ctx = state.previewCtx;
    const start = state.start;
    const w = pos.x - start.x;
    const h = pos.y - start.y;

    ctx.clearRect(0, 0, state.previewCanvas.width, state.previewCanvas.height);

    ctx.beginPath();
    ctx.lineWidth = state.toolSettings.size;
    ctx.strokeStyle = state.toolSettings.color;
    ctx.fillStyle = state.toolSettings.color;

    if (state.toolSettings.shape === 'rect') {
        if (state.toolSettings.fillShape) ctx.fillRect(start.x, start.y, w, h);
        else ctx.strokeRect(start.x, start.y, w, h);
    } else if (state.toolSettings.shape === 'circle') {
        // Simple ellipse approximation
        ctx.beginPath();
        const centerX = start.x + w / 2;
        const centerY = start.y + h / 2;
        ctx.ellipse(centerX, centerY, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
        if (state.toolSettings.fillShape) ctx.fill();
        else ctx.stroke();
    } else if (state.toolSettings.shape === 'line') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    requestRender();
}

function updateGradientPreview(pos) {
    initPreviewCanvas();
    const ctx = state.previewCtx;
    const start = state.start;

    // Gradient is drawn over the WHOLE canvas usually, based on the line
    // For local layer gradient, we should probably clip? 
    // For now, full canvas gradient
    const grad = ctx.createLinearGradient(start.x, start.y, pos.x, pos.y);
    grad.addColorStop(0, state.toolSettings.color);
    grad.addColorStop(1, state.toolSettings.bgColor); // Use BG color as end

    ctx.clearRect(0, 0, state.previewCanvas.width, state.previewCanvas.height);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, state.previewCanvas.width, state.previewCanvas.height);
    requestRender();
}

function initPreviewCanvas() {
    if (!state.previewCanvas) {
        state.previewCanvas = document.createElement('canvas');
        state.previewCanvas.width = state.config.width;
        state.previewCanvas.height = state.config.height;
        state.previewCtx = state.previewCanvas.getContext('2d');
    }
}

// Text Tool
window.addEventListener('click', onOneClick); // We need a click handler for text

function onOneClick(e) {
    if (state.tool !== 'text') return;
    // Don't trigger if dragging
    if (Math.abs(lastX - startX) > 5 || Math.abs(lastY - startY) > 5) return;

    const pos = getMousePos(e);
    promptTextTool(pos, e.clientX, e.clientY);
}

function promptTextTool(pos, cx, cy) {
    const input = document.getElementById('text-input');
    const overlay = document.getElementById('text-editor-overlay');

    overlay.style.display = 'block';
    overlay.style.left = cx + 'px'; // Screen coordinates for input
    overlay.style.top = cy + 'px';

    input.value = "";
    input.focus();

    // One-time handler for OK or Enter
    const onConfirm = () => {
        const text = input.value;
        if (text) {
            const l = getActiveLayer();
            if (l) {
                l.ctx.font = `${state.toolSettings.fontSize}px ${state.toolSettings.font}`;
                l.ctx.fillStyle = state.toolSettings.color;
                l.ctx.fillText(text, pos.x, pos.y);
                saveHistory("Type Text");
                requestRender();
            }
        }
        overlay.style.display = 'none';
        document.getElementById('text-ok').removeEventListener('click', onConfirm);
    };

    document.getElementById('text-ok').addEventListener('click', onConfirm);
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

function onDoubleClick(e) {
    if (state.tool !== 'select-lasso') return;
    // Finalize finding if points exist
    if (state.lassoPoints.length > 2) {
        state.selectionPath = [...state.lassoPoints];
        state.lassoPoints = [];

        // Bounds for optimization
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.selectionPath.forEach(p => {
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        });
        state.selection = {
            x: minX, y: minY, w: maxX - minX, h: maxY - minY
        };
        requestRender();
    }
}

function isPointInPolygon(p, polygon) {
    let isInside = false;
    let minX = polygon[0].x, maxX = polygon[0].x;
    let minY = polygon[0].y, maxY = polygon[0].y;
    for (let n = 1; n < polygon.length; n++) {
        const q = polygon[n];
        minX = Math.min(q.x, minX);
        maxX = Math.max(q.x, maxX);
        minY = Math.min(q.y, minY);
        maxY = Math.max(q.y, maxY);
    }

    if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
        return false;
    }

    let i = 0, j = polygon.length - 1;
    for (i, j; i < polygon.length; j = i++) {
        if ((polygon[i].y > p.y) != (polygon[j].y > p.y) &&
            p.x < (polygon[j].x - polygon[i].x) * (p.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x) {
            isInside = !isInside;
        }
    }
    return isInside;
}

function magicWandSelect(layer, x, y, hexColor) {
    const w = layer.canvas.width;
    const h = layer.canvas.height;
    const imgData = layer.ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const startPos = (y * w + x) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    const tolerance = state.toolSettings.tolerance || 0;
    const mask = new Uint8Array(w * h); // 0 or 1
    const stack = [[x, y]];
    const visited = new Uint8Array(w * h); // To avoid loops

    while (stack.length) {
        const [cx, cy] = stack.pop();
        const idx = cy * w + cx;
        const pos = idx * 4;

        if (cx < 0 || cx >= w || cy < 0 || cy >= h || visited[idx]) continue;
        visited[idx] = 1;

        // Check Color Match
        const r = data[pos];
        const g = data[pos + 1];
        const b = data[pos + 2];
        const a = data[pos + 3];

        const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
        // Simple diff sum, avg logic is better but this works for tolerance
        if (diff <= tolerance * 4) { // tolerance * 3 channels + alpha? scale it
            mask[idx] = 1;
            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
    }

    state.selectionMask = mask;
    // To enable "Deselect" to work, we need to ensure selection state is "active"
    // We can set a dummy selection rect or just rely on selectionMask being present
    // Let's set a dummy selection so render loop knows SOMETHING is selected if we want generic support
    // But core.js will check for selectionMask specifically.

    // Bounds for render overlay optimization?
    state.selection = { x: 0, y: 0, w: w, h: h }; // Full bounds for now, renders generic box if we don't handle mask
}
