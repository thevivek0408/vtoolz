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
        shape: 'rect',
        fillShape: false,
        tolerance: 30
    },

    // Navigation
    zoom: 1.0,
    pan: { x: 0, y: 0 },

    // History
    history: [],
    historyIndex: -1,
    maxHistory: 20,

    // State Flags
    resizeType: 'image', // 'image', 'canvas', 'new-project'
    isDrawing: false,
    isTransforming: false,
    isSpacePressed: false,
    isPanning: false,

    // Selection & Data
    selection: null,
    clipboard: null,
    transformHandle: null,

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
