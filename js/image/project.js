import { state, resetProjectState } from './state.js';
import { createLayer } from './layers.js';
import { requestRender, updateZoom } from './core.js';
import { updateLayerList } from './ui.js';

export function saveProject() {
    const project = {
        version: '1.1',
        width: state.config.width,
        height: state.config.height,
        layers: []
    };

    // Serialize Layers
    state.layers.forEach(l => {
        const layerData = {
            name: l.name,
            type: l.type,
            visible: l.visible,
            opacity: l.opacity,
            blendMode: l.blendMode,
            x: l.x, y: l.y,
            width: l.width, height: l.height
        };
        if (l.canvas) {
            layerData.data = l.canvas.toDataURL();
        }
        if (l.type === 'group' && l.children) {
            layerData.children = l.children.map(c => ({
                name: c.name, type: c.type, visible: c.visible,
                opacity: c.opacity, blendMode: c.blendMode,
                x: c.x, y: c.y, width: c.width, height: c.height,
                data: c.canvas ? c.canvas.toDataURL() : null
            }));
        }
        project.layers.push(layerData);
    });

    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.vtz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) window.showToast('Project saved!', 'success');
}

export function loadProject(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const project = JSON.parse(e.target.result);
            loadProjectData(project);
        } catch (err) {
            console.error(err);
            alert('Failed to load project');
        }
    };
    reader.readAsText(file);
}

function loadProjectData(project) {
    // Reset
    resetProjectState();

    // Config
    state.config.width = project.width;
    state.config.height = project.height;

    const wrapper = document.getElementById('canvas-wrapper');
    const home = document.getElementById('home-screen');
    const dims = document.getElementById('canvas-dims');
    const canvasEl = document.getElementById('canvas-stage');

    // Update canvas size
    if (canvasEl) { canvasEl.width = project.width; canvasEl.height = project.height; }

    // Update UI
    if (wrapper) wrapper.classList.remove('hidden');
    if (home) home.classList.add('hidden');
    if (dims) dims.innerText = `${project.width}x${project.height}`;

    document.getElementById('project-bar').style.display = 'flex';
    document.getElementById('project-name-display').innerText = "Loaded Project";

    // Reconstruct Layers
    let loadedCount = 0;

    project.layers.forEach(lData => {
        const layer = createLayer(lData.name);
        layer.visible = lData.visible !== undefined ? lData.visible : true;
        layer.opacity = lData.opacity !== undefined ? lData.opacity : 100;
        layer.blendMode = lData.blendMode || 'source-over';
        if (lData.x !== undefined) { layer.x = lData.x; layer.y = lData.y; }

        const img = new Image();
        img.onload = () => {
            layer.ctx.drawImage(img, 0, 0);
            loadedCount++;
            if (loadedCount === project.layers.length) {
                requestRender();
                updateLayerList();
                updateZoom();
                // Save original state for Compare
                setTimeout(() => {
                    state.originalImage = canvasEl.toDataURL();
                }, 100);
                if (window.showToast) window.showToast('Project loaded!', 'success');
            }
        };
        img.src = lData.data;
    });

    requestRender();
    updateLayerList();
}
