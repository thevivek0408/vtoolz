import { state } from './state.js';
import { requestRender, canvas } from './core.js';
import { saveHistory } from './history.js'; // Circular dependency? history needs layers. Layers needs history?
// history.js will import state. saveHistory needs to Snapshot state.
// We can inject saveHistory or just import it.

// DOM
const layerList = document.getElementById('layer-list');

// Helper to find layer and its parent list
export function findLayer(id, list = state.layers) {
    for (let i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            return { layer: list[i], list: list, index: i };
        }
        if (list[i].type === 'group' && list[i].children) {
            const result = findLayer(id, list[i].children);
            if (result) return result;
        }
    }
    return null;
}

export function getActiveLayer() {
    const res = findLayer(state.activeLayerId);
    return res ? res.layer : null;
}

export function createGroup(name = 'Group') {
    const id = Date.now().toString() + Math.random().toString().substr(2, 5);
    const newGroup = {
        id: id,
        name: name,
        type: 'group',
        visible: true,
        expanded: true,
        opacity: 100,
        blendMode: 'source-over',
        children: [],
        // Groups don't have canvas/ctx/mask usually, but they might have a group mask later.
        // For now, simple folder.
        x: 0, y: 0, width: state.config.width, height: state.config.height // Just for transform ref?
    };

    // Insert into active list or root
    const active = findLayer(state.activeLayerId);
    if (active && active.layer.type === 'group') {
        active.layer.children.push(newGroup);
    } else if (active) {
        // Insert after active layer in valid list
        active.list.splice(active.index + 1, 0, newGroup);
    } else {
        state.layers.push(newGroup);
    }

    state.activeLayerId = id;
    requestRender();
    return newGroup;
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
        type: type, // 'raster'
        visible: true,
        x: 0,
        y: 0,
        width: w,
        height: h,
        opacity: 100,
        blendMode: 'source-over',
        canvas: newCanvas, // The pixel data
        ctx: newCanvas.getContext('2d'), // Drawing context

        filters: { brightness: 100, contrast: 100, blur: 0, grayscale: 0, invert: 0, sepia: 0 },

        mask: null, // Canvas
        maskCtx: null,
        isMaskActive: false
    };

    // Insert logic
    const active = findLayer(state.activeLayerId);
    if (active && active.layer.type === 'group') {
        active.layer.children.push(newLayer);
    } else if (active) {
        active.list.splice(active.index + 1, 0, newLayer);
    } else {
        state.layers.push(newLayer);
    }

    state.activeLayerId = id;
    return newLayer;
}

export function deleteLayer(id) {
    if (!id) id = state.activeLayerId;
    const res = findLayer(id);
    if (res) {
        res.list.splice(res.index, 1);
        // Set new active?
        // If list has items, pick closest?
        if (res.list.length > 0) {
            const newIdx = Math.min(res.index, res.list.length - 1);
            state.activeLayerId = res.list[newIdx].id;
        } else {
            // If empty list, go up level? 
            // Too complex for MVP. Just unset or find root.
            state.activeLayerId = null;
        }
    }
    requestRender();
}

export function duplicateLayer() {
    // Deep clone needs refactoring for groups. 
    // For MVP: Duplicate raster only or skip groups.
    const l = getActiveLayer();
    if (!l || l.type === 'group') return; // Pending group support

    // Deep Clone
    const clone = createLayer(l.name + " Copy", l.width, l.height);
    // ... copy props ...
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
    const res = findLayer(state.activeLayerId);
    if (!res) return;

    const list = res.list;
    const idx = res.index;

    if (direction === 'up') {
        if (idx < list.length - 1) {
            const temp = list[idx];
            list[idx] = list[idx + 1];
            list[idx + 1] = temp;
        }
    } else if (direction === 'down') {
        if (idx > 0) {
            const temp = list[idx];
            list[idx] = list[idx - 1];
            list[idx - 1] = temp;
        }
    }
    requestRender();
}

export function mergeDown() {
    // Logic complicates with groups.
    // MVP: Only merge if both in same list and raster.
    const res = findLayer(state.activeLayerId);
    if (!res || res.index === 0) return;

    const top = res.layer;
    const bottom = res.list[res.index - 1];

    if (top.type === 'group' || bottom.type === 'group') return; // Todo

    const dx = top.x - bottom.x;
    const dy = top.y - bottom.y;

    bottom.ctx.save();
    bottom.ctx.globalAlpha = top.opacity / 100;
    bottom.ctx.globalCompositeOperation = top.blendMode;
    bottom.ctx.drawImage(top.canvas, dx, dy);
    bottom.ctx.restore();

    // Delete top
    res.list.splice(res.index, 1);
    state.activeLayerId = bottom.id;

    requestRender();
}

export function addLayerMask() {
    const layer = getActiveLayer();
    if (!layer || layer.mask || layer.type === 'group') return;

    const mCanvas = document.createElement('canvas');
    mCanvas.width = layer.width;
    mCanvas.height = layer.height;
    const mCtx = mCanvas.getContext('2d');

    // Fill with white (Reveal All)
    mCtx.fillStyle = '#ffffff';
    mCtx.fillRect(0, 0, layer.width, layer.height);

    layer.mask = mCanvas;
    layer.maskCtx = mCtx;
    layer.isMaskActive = true; // Auto-select mask

    requestRender();
}

export function toggleMaskEdit(layerId) {
    // ...
}
