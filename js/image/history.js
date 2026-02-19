import { state } from './state.js';
// import { createLayer } from './layers.js'; // Removed to fix circular dependency
import { requestRender, updateZoom } from './core.js';

// Removed ui.js import to fix circular dependency

export function saveHistory(actionName) {
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    // Deep Clone Layers (skip groups without canvas)
    const layersSnapshot = state.layers.map(l => {
        if (l.type === 'group') {
            return { ...l, children: l.children ? l.children.map(cloneRasterLayer) : [] };
        }
        return cloneRasterLayer(l);
    });

    state.history.push({
        name: actionName,
        layers: layersSnapshot,
        width: state.config.width,
        height: state.config.height,
        activeLayerId: state.activeLayerId
    });

    if (state.history.length > state.maxHistory) state.history.shift();
    else state.historyIndex++;

    window.dispatchEvent(new CustomEvent('history-update'));
}

function cloneRasterLayer(l) {
    if (!l.canvas) return { ...l };
    const newC = document.createElement('canvas');
    newC.width = l.canvas.width;
    newC.height = l.canvas.height;
    const newCtx = newC.getContext('2d');
    newCtx.drawImage(l.canvas, 0, 0);
    return {
        ...l,
        canvas: newC,
        ctx: newCtx
    };
}

    state.history.push({
        name: actionName,
        layers: layersSnapshot,
        width: state.config.width,
        height: state.config.height,
        activeLayerId: state.activeLayerId
    });

    if (state.history.length > state.maxHistory) state.history.shift();
    else state.historyIndex++;

    window.dispatchEvent(new CustomEvent('history-update'));
}

export function restoreHistory(index) {
    if (index < 0 || index >= state.history.length) return;

    state.historyIndex = index;
    const snapshot = state.history[index];
    // ... continue restore


    state.config.width = snapshot.width;
    state.config.height = snapshot.height;
    state.activeLayerId = snapshot.activeLayerId;

    // Restore Layers
    state.layers = snapshot.layers.map(lState => {
        if (lState.type === 'group') {
            return { ...lState, children: lState.children ? lState.children.map(cloneRasterLayer) : [] };
        }
        return cloneRasterLayer(lState);
    });

    requestRender();
    updateZoom();
    window.dispatchEvent(new CustomEvent('history-update'));
    window.dispatchEvent(new CustomEvent('layer-update')); // Since layers changed
}

export function undo() {
    restoreHistory(state.historyIndex - 1);
}

export function redo() {
    restoreHistory(state.historyIndex + 1);
}
