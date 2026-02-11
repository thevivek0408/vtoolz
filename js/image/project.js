import { state, resetProjectState } from './state.js';
import { createLayer } from './layers.js';
import { requestRender } from './core.js';
import { updateLayerList } from './ui.js';

export function saveProject() {
    const project = {
        version: '1.0',
        width: state.config.width,
        height: state.config.height,
        layers: []
    };

    // Serialize Layers
    state.layers.forEach(l => {
        project.layers.push({
            name: l.name,
            visible: l.visible,
            opacity: l.opacity, // Assuming we add opacity later
            mixBlendMode: l.ctx.globalCompositeOperation,
            data: l.canvas.toDataURL()
        });
    });

    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.vtz'; // Customized extension
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    // Update UI
    if (wrapper) wrapper.classList.remove('hidden');
    if (home) home.classList.add('hidden');
    if (dims) dims.innerText = `${project.width}x${project.height}`;

    document.getElementById('project-bar').style.display = 'flex';
    document.getElementById('project-name-display').innerText = "Loaded Project";

    // Reconstruct Layers
    // We need to load images async
    let loadedCount = 0;

    project.layers.forEach(lData => {
        const layer = createLayer(lData.name);
        layer.visible = lData.visible;
        // layer.opacity = lData.opacity; 

        const img = new Image();
        img.onload = () => {
            layer.ctx.drawImage(img, 0, 0);
            loadedCount++;
            if (loadedCount === project.layers.length) {
                requestRender();
                updateLayerList();
            }
        };
        img.src = lData.data;
    });

    requestRender();
    updateLayerList();
}
