import { state } from './state.js';
import { canvas, getMousePos, requestRender, updateZoom } from './core.js';
import { getActiveLayer } from './layers.js';
import { saveHistory } from './history.js';

let isDrawing = false;
let startX = 0, startY = 0;
let lastX = 0, lastY = 0;

export function initTools() {
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDoubleClick);

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
    if (!layer || layer.type === 'group') return;

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
    // Space + click = pan
    if (state.isSpacePressed) {
        state.isPanning = true;
        state.start = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        return;
    }

    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;
    lastX = pos.x;
    lastY = pos.y;
    isDrawing = true;

    const layer = getActiveLayer();
    if (!layer || layer.type === 'group') return;

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
        const fgDisplay = document.getElementById('fg-color-display');
        const fgInput = document.getElementById('fg-color-picker');
        if (fgDisplay) fgDisplay.style.backgroundColor = hex;
        if (fgInput) fgInput.value = hex;
        if (window.showToast) window.showToast(`Color: ${hex}`, 'info');
    } else if (state.tool === 'clone') {
        if (e.altKey) {
            // Set Source
            state.cloneSource = { x: startX, y: startY };
            if (window.showToast) window.showToast(`Clone source: ${Math.floor(startX)}, ${Math.floor(startY)}`, 'info');
            return;
        }
        if (!state.cloneSource) {
            if (window.showToast) window.showToast('Alt+Click to set a clone source first', 'info');
            return;
        }
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
    // Panning
    if (state.isPanning && state.isSpacePressed) {
        const dx = e.clientX - state.start.x;
        const dy = e.clientY - state.start.y;
        state.pan.x += dx;
        state.pan.y += dy;
        state.start = { x: e.clientX, y: e.clientY };
        updateZoom();
        return;
    }

    // Transform Logic
    if (state.isTransforming && state.transformHandle) {
        handleTransform(e);
        return;
    }

    if (!isDrawing) return;
    const pos = getMousePos(e);
    const layer = getActiveLayer();
    if (!layer) return;

    // Mask Support - Redirect Context
    let targetCtx = layer.ctx;
    if (layer.isMaskActive && layer.maskCtx) {
        targetCtx = layer.maskCtx;
    }

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

    // Clone stamp — separate from brush/eraser
    if (state.tool === 'clone') {
        if (!state.cloneSource) return;

        const deltaX = pos.x - startX;
        const deltaY = pos.y - startY;
        const srcX = state.cloneSource.x + deltaX;
        const srcY = state.cloneSource.y + deltaY;

        const r = state.toolSettings.size / 2;

        layer.ctx.save();
        layer.ctx.beginPath();
        layer.ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        layer.ctx.clip();
        layer.ctx.drawImage(layer.canvas,
            srcX - r, srcY - r, r * 2, r * 2,
            pos.x - r, pos.y - r, r * 2, r * 2
        );
        layer.ctx.restore();

        lastX = pos.x;
        lastY = pos.y;
        requestRender();
        return;
    }

    if (state.tool === 'brush' || state.tool === 'eraser') {
        // Selection Clipping Check
        if (state.selection) {
            if (pos.x < state.selection.x || pos.x > state.selection.x + state.selection.w ||
                pos.y < state.selection.y || pos.y > state.selection.y + state.selection.h) {
                lastX = pos.x;
                lastY = pos.y;
                return;
            }

            if (state.selectionPath && !isPointInPolygon(pos, state.selectionPath)) {
                lastX = pos.x;
                lastY = pos.y;
                return;
            }

            if (state.selectionMask) {
                const idx = (Math.floor(pos.y) * layer.canvas.width + Math.floor(pos.x));
                if (!state.selectionMask[idx]) {
                    lastX = pos.x;
                    lastY = pos.y;
                    return;
                }
            }
        }

        // Per-segment stroke for performance (avoids re-stroking entire path)
        targetCtx.beginPath();
        targetCtx.moveTo(lastX, lastY);
        targetCtx.lineTo(pos.x, pos.y);
        targetCtx.lineCap = 'round';
        targetCtx.lineJoin = 'round';
        targetCtx.lineWidth = state.toolSettings.size;

        if (layer.isMaskActive) {
            if (state.tool === 'eraser') {
                targetCtx.globalCompositeOperation = 'destination-out';
                targetCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                targetCtx.globalCompositeOperation = 'source-over';
                targetCtx.strokeStyle = state.toolSettings.color;
            }
        } else {
            targetCtx.strokeStyle = state.tool === 'eraser' ? 'rgba(0,0,0,1)' : state.toolSettings.color;
            targetCtx.globalCompositeOperation = state.tool === 'eraser' ? 'destination-out' : 'source-over';
        }

        targetCtx.stroke();
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
    // End panning
    if (state.isPanning) {
        state.isPanning = false;
        canvas.style.cursor = state.isSpacePressed ? 'grab' : (state.tool === 'move' ? 'move' : 'crosshair');
        return;
    }

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

    // Generate Path from Mask (Marching Ants)
    // We need to trace the boundary of the filled area.
    // 1. Create a mask array from the filled color? 
    // Actually we just filled it. 
    // Optimized: We can trace while filling or after.
    // Let's do a post-process trace on the image data we just modified.
    // But we need to know WHICH pixels are part of the selection.

    // Better: Magic Wand should create a bitmask first, then fill?
    // Current implementation invalidates this because we modify layer directly.
    // Magic Wand usually creates a SELECTION, not paint pixels.
    // OH via `magicWandSelect` we set `state.selectionMask`.
    // We should use that mask to generate `state.selectionPath`.

    if (state.selectionMask) {
        state.selectionPath = traceContourNew(state.selectionMask, w, h);
    }
}

function traceContourNew(mask, w, h) {
    // Moore-Neighbor Tracing
    const points = [];

    // 1. Find start point (s)
    let s = null;
    for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
            s = i;
            break;
        }
    }
    if (s === null) return null;

    // Helper to get value at x,y
    const getVal = (x, y) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return 0;
        return mask[y * w + x];
    };

    const getXY = (idx) => ({ x: idx % w, y: Math.floor(idx / w) });

    let sPos = getXY(s);
    let curr = { x: sPos.x, y: sPos.y };
    // Enter from top, so backtracking pixel is above
    let prev = { x: curr.x, y: curr.y - 1 };

    points.push({ x: curr.x, y: curr.y });

    let p = curr;
    let b = prev;

    // Clockwise neighbors offset 
    // 0: Top, 1: Top-Right, 2: Right ... 7: Top-Left
    const neighbors = [
        { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
        { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }
    ];

    let guard = 0;
    const limit = w * h * 2; // Safety limit

    while (guard < limit) {
        // 1. Find the starting direction to search for next pixel
        // This direction is based on the backtracking pixel b.
        // We want to start searching clockwise from b.

        // Find vector p->b
        let dx = b.x - p.x;
        let dy = b.y - p.y;

        let startDir = -1;
        for (let i = 0; i < 8; i++) {
            if (neighbors[i].x === dx && neighbors[i].y === dy) {
                startDir = i;
                break;
            }
        }
        // If not found (e.g. b is out of bounds or invalid), standard start (Top)
        if (startDir === -1) startDir = 0;

        let found = false;
        let nextP = null;
        let nextB = null;

        // Search 8 neighbors clockwise starting from (startDir + 1)
        for (let i = 1; i <= 8; i++) {
            const idx = (startDir + i) % 8;
            const n = neighbors[idx];
            const target = { x: p.x + n.x, y: p.y + n.y };

            if (getVal(target.x, target.y)) {
                // Found next boundary pixel
                nextP = target;
                // The new backtracking pixel b is the neighbor immediately preceding nextP in the rotation
                // which is the one we just checked before this one (idx - 1).
                // Or simply: the previous empty pixel in the scan.
                const backIdx = (idx - 1 + 8) % 8;
                const backN = neighbors[backIdx];
                nextB = { x: p.x + backN.x, y: p.y + backN.y };
                found = true;
                break;
            }
        }

        if (!found) {
            // Isolated single pixel
            break;
        }

        p = nextP;
        b = nextB;
        points.push({ x: p.x, y: p.y });

        // Stopping criteria (Jacob's)
        if (p.x === sPos.x && p.y === sPos.y && b.x === prev.x && b.y === prev.y) {
            break;
        }

        guard++;
    }

    return points;
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
