import { state } from './state.js';
import { createLayer } from './layers.js'; // To recreate layer structure if needed
import { requestRender, updateZoom } from './core.js';
import { updateLayerList } from './ui.js'; // Circular Ref Risk! 
// UI needs history to update list. History needs UI to update list.
// Standard pattern: Events or explicitly calling UI update from main loop.
// For now, let's export a callback or something?
// Helper: "notifyStateChange"?

export function saveHistory(actionName) {
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }

    // Deep Clone Layers
    const layersSnapshot = state.layers.map(l => {
        const newC = document.createElement('canvas');
        newC.width = l.canvas.width;
        newC.height = l.canvas.height;
        newC.getContext('2d').drawImage(l.canvas, 0, 0);
        return {
            ...l,
            canvas: newC,
            ctx: newC.getContext('2d')
        };
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

    // updateHistoryPanel(); // We need to trigger this
}

export function restoreHistory(index) {
    if (index < 0 || index >= state.history.length) return;

    state.historyIndex = index;
    const snapshot = state.history[index];

    state.config.width = snapshot.width;
    state.config.height = snapshot.height;
    state.activeLayerId = snapshot.activeLayerId;

    // Restore Layers
    state.layers = snapshot.layers.map(lState => {
        const newC = document.createElement('canvas');
        newC.width = lState.canvas.width;
        newC.height = lState.canvas.height;
        newC.getContext('2d').drawImage(lState.canvas, 0, 0);

        return {
            ...lState,
            canvas: newC,
            ctx: newC.getContext('2d')
        };
    });

    requestRender();
    updateZoom(); // In case dims changed
    // updateLayerList(); 
}

export function undo() {
    restoreHistory(state.historyIndex - 1);
}

export function redo() {
    restoreHistory(state.historyIndex + 1);
}
