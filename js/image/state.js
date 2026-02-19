export const state = {
    // Canvas Config
    config: {
        width: 800,
        height: 600
    },

    // Layers
    layers: [],
    activeLayerId: null,

    // Tools
    tool: 'move',
    toolSettings: {
        color: '#000000',
        bgColor: '#ffffff', // Added background color for swatches
        size: 5,
        font: 'Arial',
        fontSize: 40,
        shape: 'rect', // rect, circle, line
        gradientType: 'linear', // linear, radial
        fillShape: false,
        tolerance: 30,
        showTransformControls: false
    },

    // Preview Layer (For Shape/Gradient/Crop)
    previewCanvas: null,
    previewCtx: null,

    // Navigation
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    transformHandle: null,
    isTransforming: false,

    // Clone Stamp
    cloneSource: null, // {x, y}

    // History
    history: [],
    historyIndex: -1,
    maxHistory: 20,

    // State Flags
    resizeType: 'image', // 'image', 'canvas', 'new-project'
    isDrawing: false,
    isSpacePressed: false,
    isPanning: false,

    // Selection & Data
    selection: null,
    selectionPath: null, // Array of {x, y} for polygon
    selectionMask: null, // Uint8Array 0/1 for pixel mask
    lassoPoints: [], // Temp points during creation
    clipboard: null,

    // Data
    originalImage: null,

    // Mouse Start Pos
    start: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 }
};

// Helper to reset state for new project
export function resetProjectState() {
    state.layers = [];
    state.activeLayerId = null;
    state.history = [];
    state.historyIndex = -1;
    state.selection = null;
    state.zoom = 1.0;
    state.pan = { x: 0, y: 0 };
}
