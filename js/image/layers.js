import { state } from './state.js';
import { requestRender, canvas } from './core.js';
import { saveHistory } from './history.js'; // Circular dependency? history needs layers. Layers needs history?
// history.js will import state. saveHistory needs to Snapshot state.
// We can inject saveHistory or just import it.

// DOM
const layerList = document.getElementById('layer-list');

export function getActiveLayer() {
    return state.layers.find(l => l.id === state.activeLayerId);
}

export function createLayer(name = 'Layer', wOverride, hOverride, type = 'raster') {
    const id = Date.now().toString() + Math.random().toString().substr(2, 5);
    const w = wOverride || state.config.width;
    const h = hOverride || state.config.height;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = w;
    newCanvas.height = h;

    const newLayer = {
        id: id,
        name: name,
        visible: true,
        x: 0,
        y: 0,
        width: w,
        height: h,
        opacity: 100,
        blendMode: 'source-over',
        canvas: newCanvas, // The pixel data
        ctx: newCanvas.getContext('2d'),
        type: type, // 'raster', 'text', 'adjustment'?
        filters: {}, // { blur: 0, brightness: 0 }
        styles: {} // { dropShadow: { blur, x, y, color } }
    };

    state.layers.push(newLayer);
    state.activeLayerId = id;

    return newLayer;
}

export function deleteLayer(id) {
    if (!id) id = state.activeLayerId;
    state.layers = state.layers.filter(l => l.id !== id);
    if (state.layers.length > 0) {
        state.activeLayerId = state.layers[state.layers.length - 1].id;
    } else {
        state.activeLayerId = null;
    }
    requestRender();
}

export function duplicateLayer() {
    const l = getActiveLayer();
    if (!l) return;

    // Deep Clone
    const clone = createLayer(l.name + " Copy", l.width, l.height);
    clone.x = l.x;
    clone.y = l.y;
    clone.visible = l.visible;
    clone.opacity = l.opacity;
    clone.blendMode = l.blendMode;
    clone.ctx.drawImage(l.canvas, 0, 0);

    requestRender();
    return clone;
}

export function moveLayer(direction) {
    const idx = state.layers.findIndex(l => l.id === state.activeLayerId);
    if (idx === -1) return;

    if (direction === 'up') {
        if (idx < state.layers.length - 1) {
            const temp = state.layers[idx];
            state.layers[idx] = state.layers[idx + 1];
            state.layers[idx + 1] = temp;
        }
    } else if (direction === 'down') {
        if (idx > 0) {
            const temp = state.layers[idx];
            state.layers[idx] = state.layers[idx - 1];
            state.layers[idx - 1] = temp;
        }
    }
    requestRender();
}

export function mergeDown() {
    const idx = state.layers.findIndex(l => l.id === state.activeLayerId);
    if (idx <= 0) return; // Cant merge bottom

    const top = state.layers[idx];
    const bottom = state.layers[idx - 1];

    // Simple Merge: Draw top onto bottom
    // Problem: If they have different X/Y.
    // We need to render Top onto Bottom's context, respecting relative positions.

    const dx = top.x - bottom.x;
    const dy = top.y - bottom.y;

    bottom.ctx.save();
    bottom.ctx.globalAlpha = top.opacity / 100;
    bottom.ctx.globalCompositeOperation = top.blendMode;
    bottom.ctx.drawImage(top.canvas, dx, dy);
    bottom.ctx.restore();

    // Delete top
    state.layers.splice(idx, 1);
    state.activeLayerId = bottom.id;

    requestRender();
}
