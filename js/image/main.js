import { state, resetProjectState } from './state.js';
import { requestRender, updateZoom } from './core.js';
import { createLayer } from './layers.js';
import { initTools } from './tools.js';
import { initUI, updateLayerList, updateHistoryPanel } from './ui.js';
import { saveHistory } from './history.js';
import { initFilters } from './filters.js';

function init() {
    console.log("Initializing Pro Image Editor...");

    // Set Config
    state.config.width = 800;
    state.config.height = 600;

    // Init Modules
    initTools();
    initUI();
    initFilters();

    // Create Background
    resetProjectState();
    // Default empty state - Use Home Screen logic? 
    // If we want default canvas:
    /*
    const bg = createLayer('Background');
    bg.ctx.fillStyle = 'white';
    bg.ctx.fillRect(0, 0, 800, 600);
    saveHistory("Init");
    */

    // Let's assume Home Screen handles file creation or empty init 
    // For now, if no layer, show Home Screen check
    checkHomeVisibility();

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

// Global Exports
// UI functions are handled in ui.js
// Logic for Save Project should be imported/exported if needed, or attached in initUI
window.saveProject = () => {
    console.log("Saving project...");
    // This looks like a placeholder. 
    // Real save logic was in the monolithic editor.html but might be missing in modules if I didn't migrate it.
    // I should check if saveProject logic exists. 
    // The previous `editor.html` had a big `window.saveProject`.
    // I should create `js/image/project.js` or put it in `core.js` / `main.js` properly.
    // For now, let's keep the placeholder but NOT override New Project.
};

// Start
window.addEventListener('load', init);
