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
import { saveProject, loadProject } from './project.js';

// Global Exports
window.saveProject = saveProject;
window.handleFileLoad = loadProject;
window.exportImage = () => {
    // Open Modal instead of direct download
    const modal = document.getElementById('export-modal');
    if (modal) modal.style.display = 'flex';
};

// Global Error Handler
window.onerror = function (msg, url, line) {
    console.error("VtoolZ Error:", msg, url, line);
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#ff4444';
    toast.style.color = 'white';
    toast.style.padding = '15px';
    toast.style.borderRadius = '5px';
    toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
    toast.style.zIndex = '10000';
    toast.style.fontFamily = 'Segoe UI, sans-serif';
    toast.innerText = `Error: ${msg}`;

    const close = document.createElement('button');
    close.innerText = 'x';
    close.style.background = 'none';
    close.style.border = 'none';
    close.style.color = 'white';
    close.style.marginLeft = '10px';
    close.style.cursor = 'pointer';
    close.style.fontWeight = 'bold';
    close.onclick = () => toast.remove();

    toast.appendChild(close);
    document.body.appendChild(toast);

    // Auto remove after 5s
    setTimeout(() => toast.remove(), 5000);
    return false; // Let default handler run too
};

// Start
window.addEventListener('load', init);
