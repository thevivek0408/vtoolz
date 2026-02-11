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
    renderLayers(ctx, state.layers);

    function renderLayers(targetCtx, layers) {
        // Render from bottom to top?
        // state.layers is usually ordered as [Background, Layer 1, Layer 2] for processing?
        // In UI we reverse it (Layer 2 top).
        // In Render, we draw [0] first (background). Yes.

        layers.forEach(layer => {
            if (!layer.visible) return;

            targetCtx.save();
            targetCtx.globalAlpha = layer.opacity / 100;
            targetCtx.globalCompositeOperation = layer.blendMode;

            if (layer.type === 'group') {
                // Group Rendering:
                // We should isolate group blending? 
                // "Pass Through" (default) means we just recurse.
                // If group has opacity/mode, usually in Photoshop 'Pass Through' ignores it unless 'Normal'.
                // For simplified engine: Apply alpha/blend to the whole group context?
                // Nested rendering is complex.
                // Simple approach: Recurse on current context with applied alpha.
                if (layer.children) {
                    renderLayers(targetCtx, layer.children);
                }
            } else {
                // Raster Layer
                drawLayer(targetCtx, layer);
            }

            targetCtx.restore();
        });
    }

    function drawLayer(targetCtx, layer) {
        if (layer.mask) {
            // Composite Mask
            if (!state.compositeCanvas) {
                state.compositeCanvas = document.createElement('canvas');
                state.compositeCanvas.width = state.config.width;
                state.compositeCanvas.height = state.config.height;
            }
            // Resize if needed
            if (state.compositeCanvas.width !== state.config.width) {
                state.compositeCanvas.width = state.config.width;
                state.compositeCanvas.height = state.config.height;
            }

            const cCtx = state.compositeCanvas.getContext('2d');
            cCtx.clearRect(0, 0, state.compositeCanvas.width, state.compositeCanvas.height);

            // Draw Content
            cCtx.globalCompositeOperation = 'source-over';
            cCtx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);

            // Apply Mask
            cCtx.globalCompositeOperation = 'destination-in';
            cCtx.drawImage(layer.mask, layer.x, layer.y, layer.width, layer.height);

            // Draw to Main
            targetCtx.drawImage(state.compositeCanvas, 0, 0);

        } else {
            targetCtx.drawImage(layer.canvas, layer.x, layer.y, layer.width, layer.height);
        }
    }

    // Preview Layer (Shapes, Gradients)
    if (state.previewCanvas) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        // Preview is usually drawn at 0,0 of document or relative? 
        // For simplicity, we assume previewCanvas is sized to document
        ctx.drawImage(state.previewCanvas, 0, 0);
        ctx.restore();
    }


    // Selection Overlay
    // Selection Overlay
    const dashOffset = (performance.now() / 50) % 10; // Animate

    if (state.selectionPath) {
        // Polygonal Selection
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -dashOffset;
        ctx.beginPath();
        state.selectionPath.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#000';
        ctx.lineDashOffset = -dashOffset + 5;
        ctx.stroke();
        ctx.restore();
    } else if (state.selection) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -dashOffset;
        ctx.strokeRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);

        ctx.strokeStyle = '#000';
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -dashOffset + 5;
        ctx.strokeRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
        ctx.restore();
    }

    // Lasso Preview
    if (state.tool === 'select-lasso' && state.lassoPoints.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#00f'; // Blue for active creation
        ctx.lineWidth = 1;
        ctx.beginPath();
        state.lassoPoints.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        // Rubberband to mouse? Handled in tools.js previewCanvas usually, but let's draw points here
        ctx.stroke();

        // Draw vertices
        ctx.fillStyle = '#fff';
        state.lassoPoints.forEach(p => {
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        ctx.restore();
    }

    // Magic Wand / Mask Overlay
    if (state.selectionMask) {
        ctx.save();
        // Create a temporary canvas/image data to draw the mask? 
        // Or direct pixel manipulation on context? Direct is slow for loop.
        // Better: createImageData
        const maskImg = ctx.createImageData(state.config.width, state.config.height);
        const md = maskImg.data;
        const sm = state.selectionMask;
        for (let i = 0; i < sm.length; i++) {
            if (sm[i]) {
                // Blue overlay with alpha
                const idx = i * 4;
                md[idx] = 100; // R
                md[idx + 1] = 150; // G
                md[idx + 2] = 255; // B
                md[idx + 3] = 100; // A
            }
        }
        ctx.putImageData(maskImg, 0, 0); // This overwrites? No, putImageData replaces.
        // We need to draw ON TOP.
        // Best way: Draw to offscreen canvas then drawImage
        if (!state.maskCanvas) {
            state.maskCanvas = document.createElement('canvas');
            state.maskCanvas.width = state.config.width;
            state.maskCanvas.height = state.config.height;
        }
        const mctx = state.maskCanvas.getContext('2d');
        mctx.putImageData(maskImg, 0, 0);

        ctx.globalAlpha = 0.5;
        ctx.drawImage(state.maskCanvas, 0, 0);
        ctx.globalAlpha = 1.0;

        // Border Marching Ants? Too complex for now. Overlay is enough.
        ctx.restore();
    }

    // Transform Controls are DOM based, updated separately or here?
    updateTransformControls();

    // Loop for animation if selection exists
    if (state.selection || state.selectionPath) {
        requestAnimationFrame(render);
    }
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
