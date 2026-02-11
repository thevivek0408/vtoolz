import { state } from './state.js';

// DOM Elements
export const canvas = document.getElementById('canvas-stage');
export const ctx = canvas.getContext('2d');
export const wrapper = document.getElementById('canvas-wrapper');
export const transformControls = document.getElementById('transform-controls');

// Coordinate Queries
export function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

// Window Resize Auto-Fit
window.addEventListener('resize', () => {
    updateZoom();
    requestRender();
});

// Main Render Loop
let isRenderPending = false;

export function requestRender() {
    if (!isRenderPending) {
        isRenderPending = true;
        requestAnimationFrame(render);
    }
}

function render() {
    isRenderPending = false;

    // Clear Workspace
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Checkerboard Background (if transparent)
    // For now, we assume bottom layer is background, or we draw a grid?
    // Let's draw a checkerboard pattern just in case
    drawCheckerboard();

    // Render Layers
    [...state.layers].forEach(layer => {
        if (!layer.visible) return;

        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode;

        // Draw the layer canvas
        ctx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);

        ctx.restore();
    });

    // Selection Overlay
    if (state.selection) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
        ctx.strokeStyle = '#000';
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = 5;
        ctx.strokeRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
        ctx.restore();
    }

    // Transform Controls are DOM based, updated separately or here?
    updateTransformControls();
}

function drawCheckerboard() {
    // Optional: Draw transparency grid
    // ctx.fillStyle = '#ccc'; ...
}

function updateTransformControls() {
    if (state.isTransforming && state.activeLayerId !== null) {
        const layer = state.layers.find(l => l.id === state.activeLayerId);
        if (layer) {
            transformControls.style.display = 'block';
            // We need to map layer coordinates to screen CSS coordinates for the overlay
            // This relies on zoom/pan CSS transforms on the canvas-wrapper

            // Actually, the transform overlay is inside #canvas-wrapper, so it shares the coordinate space!
            // We just need to position it at layer.x, layer.y with layer.width, layer.height

            transformControls.style.left = layer.x + 'px';
            transformControls.style.top = layer.y + 'px';
            transformControls.style.width = layer.width + 'px';
            transformControls.style.height = layer.height + 'px';

            // Rotation?
            // transformControls.style.transform = `rotate(${layer.rotation}deg)`;
        }
    } else {
        transformControls.style.display = 'none';
    }
}

export function updateZoom() {
    state.config.width = state.config.width || 800; // Safety

    // Update CSS transform of wrapper
    wrapper.style.width = state.config.width + 'px';
    wrapper.style.height = state.config.height + 'px';

    // Pan logic needs to apply to wrapper
    // wrapper.style.transform = `translate(-50%, -50%) scale(${state.zoom})`; 
    // Wait, pan is offset.
    // Basic Zoom/Pan Implementation:
    // wrapper is centered. We apply translate(panX, panY) scale(zoom)

    wrapper.style.transform = `translate(calc(-50% + ${state.pan.x}px), calc(-50% + ${state.pan.y}px)) scale(${state.zoom})`;

    document.getElementById('zoom-level').innerText = Math.round(state.zoom * 100) + '%';
    document.getElementById('canvas-dims').innerText = `${state.config.width}x${state.config.height}`;
}
