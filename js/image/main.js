import { state, resetProjectState } from './state.js';
import { requestRender, updateZoom, canvas } from './core.js';
import { createLayer } from './layers.js';
import { initTools } from './tools.js';
import { initUI, updateLayerList, updateHistoryPanel } from './ui.js';
import { saveHistory, restoreHistory, undo, redo } from './history.js';
import { initFilters } from './filters.js';

function init() {
    // Set Config
    state.config.width = 800;
    state.config.height = 600;

    // Init Modules
    initTools();
    initUI();
    initFilters();

    // Reset state (sets zoom/pan)
    resetProjectState();

    checkHomeVisibility();
    initKeyboardShortcuts();
    initFileUpload();
    initDragDrop();

    requestRender();
    updateLayerList();
    updateZoom();
}

function checkHomeVisibility() {
    const home = document.getElementById('home-screen');
    const wrapper = document.getElementById('canvas-wrapper');
    if (state.layers.length === 0) {
        if (home) home.classList.remove('hidden');
        if (wrapper) wrapper.classList.add('hidden');
    } else {
        if (home) home.classList.add('hidden');
        if (wrapper) wrapper.classList.remove('hidden');
    }
}

// --- File Upload Handler ---
function initFileUpload() {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) loadImageFile(file);
            fileInput.value = ''; // Reset for re-upload
        });
    }
}

function loadImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Set canvas size to image size
            state.config.width = img.width;
            state.config.height = img.height;
            canvas.width = img.width;
            canvas.height = img.height;

            // Reset layers
            state.layers = [];
            state.history = [];
            state.historyIndex = -1;

            // Create background layer with image
            const layer = createLayer('Background');
            layer.ctx.drawImage(img, 0, 0);

            // Show project
            document.getElementById('home-screen').classList.add('hidden');
            document.getElementById('canvas-wrapper').classList.remove('hidden');
            document.getElementById('project-bar').style.display = 'flex';
            document.getElementById('project-name-display').innerText = file.name;
            document.getElementById('canvas-dims').innerText = `${img.width}x${img.height}`;

            saveHistory('Open Image');
            updateLayerList();
            requestRender();
            updateZoom();

            // Save original for Compare
            setTimeout(() => {
                state.originalImage = canvas.toDataURL();
            }, 200);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- Drag & Drop ---
function initDragDrop() {
    const workspace = document.getElementById('workspace');
    const dropZone = document.getElementById('home-screen');

    [workspace, dropZone].forEach(el => {
        if (!el) return;
        el.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.classList.add('drag-over');
        });
        el.addEventListener('dragleave', (e) => {
            e.preventDefault();
            el.classList.remove('drag-over');
        });
        el.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            el.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) loadImageFile(file);
        });
    });
}

// --- Keyboard Shortcuts ---
function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Don't trigger when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        const ctrl = e.ctrlKey || e.metaKey;

        // Ctrl+Z Undo
        if (ctrl && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
        // Ctrl+Shift+Z or Ctrl+Y Redo
        if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) { e.preventDefault(); redo(); return; }
        // Ctrl+D Deselect
        if (ctrl && e.key === 'd') {
            e.preventDefault();
            state.selection = null;
            state.selectionPath = null;
            state.selectionMask = null;
            requestRender();
            return;
        }
        // Ctrl+S Save Project
        if (ctrl && e.key === 's') { e.preventDefault(); window.saveProject(); return; }
        // Ctrl+E Export
        if (ctrl && e.key === 'e') { e.preventDefault(); window.exportImage(); return; }
        // Delete — clear selection area
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (state.selection || state.selectionMask) {
                e.preventDefault();
                const layer = state.layers.find(l => l.id === state.activeLayerId);
                if (layer && layer.ctx) {
                    if (state.selectionMask) {
                        const w = layer.canvas.width, h = layer.canvas.height;
                        const imgData = layer.ctx.getImageData(0, 0, w, h);
                        const d = imgData.data;
                        for (let i = 0; i < state.selectionMask.length; i++) {
                            if (state.selectionMask[i]) {
                                d[i * 4 + 3] = 0; // Set alpha to 0
                            }
                        }
                        layer.ctx.putImageData(imgData, 0, 0);
                    } else if (state.selection) {
                        layer.ctx.clearRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
                    }
                    saveHistory('Clear');
                    requestRender();
                }
            }
            return;
        }

        // Zoom +/- 
        if (e.key === '+' || e.key === '=') { state.zoom = Math.min(10, state.zoom + 0.1); updateZoom(); return; }
        if (e.key === '-') { state.zoom = Math.max(0.1, state.zoom - 0.1); updateZoom(); return; }
        // Zoom Reset
        if (e.key === '0' && ctrl) { e.preventDefault(); state.zoom = 1; state.pan = { x: 0, y: 0 }; updateZoom(); return; }

        // Space — panning mode
        if (e.code === 'Space' && !state.isSpacePressed) {
            e.preventDefault();
            state.isSpacePressed = true;
            canvas.style.cursor = 'grab';
            return;
        }

        // Tool shortcuts (single keys)
        const toolMap = {
            'v': 'move', 'b': 'brush', 'e': 'eraser', 't': 'text',
            'm': 'select-rect', 'l': 'select-lasso', 'w': 'magic-wand',
            'g': 'fill', 's': 'clone', 'i': 'pipette', 'p': 'pen',
            'u': 'shape'
        };
        const key = e.key.toLowerCase();
        if (!ctrl && toolMap[key]) {
            state.tool = toolMap[key];
            // Update UI
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            const btn = document.querySelector(`.tool[data-tool="${toolMap[key]}"]`);
            if (btn) btn.classList.add('active');
            canvas.style.cursor = state.tool === 'move' ? 'move' : state.tool === 'text' ? 'text' : 'crosshair';
            // Update options bar
            if (window._updateOptionsBar) window._updateOptionsBar();
            return;
        }

        // X — switch colors
        if (key === 'x' && !ctrl) {
            const temp = state.toolSettings.color;
            state.toolSettings.color = state.toolSettings.bgColor;
            state.toolSettings.bgColor = temp;
            // Update swatches
            const fgDisplay = document.getElementById('fg-color-display');
            const bgDisplay = document.getElementById('bg-color-display');
            if (fgDisplay) fgDisplay.style.backgroundColor = state.toolSettings.color;
            if (bgDisplay) bgDisplay.style.backgroundColor = state.toolSettings.bgColor;
            return;
        }

        // [ ] — brush size
        if (key === '[') { state.toolSettings.size = Math.max(1, state.toolSettings.size - 2); return; }
        if (key === ']') { state.toolSettings.size = Math.min(200, state.toolSettings.size + 2); return; }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            state.isSpacePressed = false;
            canvas.style.cursor = state.tool === 'move' ? 'move' : state.tool === 'text' ? 'text' : 'crosshair';
        }
    });
}

// --- Toast Notification (replaces alert) ---
window.showToast = function (msg, type = 'info') {
    const existing = document.querySelector('.editor-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'editor-toast';
    const bg = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db';
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${bg};color:white;padding:12px 20px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);z-index:10000;font-family:'Segoe UI',sans-serif;font-size:0.9rem;max-width:400px;animation:slideIn 0.3s ease;`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
};

// Global Exports for HTML onclick handlers
import { saveProject, loadProject } from './project.js';

window.saveProject = saveProject;
window.handleFileLoad = loadProject;
window.exportImage = () => {
    const modal = document.getElementById('export-modal');
    if (modal) modal.style.display = 'flex';
};

// Expose functions referenced in inline onclick handlers
window.restoreHistory = restoreHistory;
window.state = state;
window.updateZoom = updateZoom;
window.applyAutoFix = () => {
    // Auto Magic Fix: auto-levels, contrast, sharpening
    const layer = state.layers.find(l => l.id === state.activeLayerId);
    if (!layer || !layer.ctx) { showToast('No active layer', 'error'); return; }
    const w = layer.canvas.width, h = layer.canvas.height;
    const imgData = layer.ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Auto-levels: find min/max and stretch
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i] < minR) minR = d[i]; if (d[i] > maxR) maxR = d[i];
        if (d[i+1] < minG) minG = d[i+1]; if (d[i+1] > maxG) maxG = d[i+1];
        if (d[i+2] < minB) minB = d[i+2]; if (d[i+2] > maxB) maxB = d[i+2];
    }
    const rangeR = maxR - minR || 1, rangeG = maxG - minG || 1, rangeB = maxB - minB || 1;
    for (let i = 0; i < d.length; i += 4) {
        d[i]   = ((d[i]   - minR) / rangeR) * 255;
        d[i+1] = ((d[i+1] - minG) / rangeG) * 255;
        d[i+2] = ((d[i+2] - minB) / rangeB) * 255;
    }
    // Slight contrast boost
    const contrast = 1.1, mid = 128;
    for (let i = 0; i < d.length; i += 4) {
        d[i]   = Math.max(0, Math.min(255, (d[i]   - mid) * contrast + mid));
        d[i+1] = Math.max(0, Math.min(255, (d[i+1] - mid) * contrast + mid));
        d[i+2] = Math.max(0, Math.min(255, (d[i+2] - mid) * contrast + mid));
    }
    layer.ctx.putImageData(imgData, 0, 0);
    saveHistory('Auto Magic Fix');
    requestRender();
    showToast('Auto fix applied!', 'success');
};

// Global Error Handler
window.onerror = function (msg, url, line) {
    console.error("VtoolZ Error:", msg, url, line);
    showToast(`Error: ${msg}`, 'error');
    return false;
};

document.addEventListener('DOMContentLoaded', init);
// Start
window.addEventListener('load', init);
