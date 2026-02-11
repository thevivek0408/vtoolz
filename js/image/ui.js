import { state } from './state.js';
import { requestRender, canvas } from './core.js';
import { createLayer, deleteLayer, getActiveLayer } from './layers.js';
import { saveHistory, restoreHistory } from './history.js';
import { PRESETS } from './presets.js';

export function initUI() {
    // --- New Project Dialog Logic ---
    const grid = document.getElementById('np-grid');
    const tabs = document.querySelectorAll('.np-tab');

    // Render Presets
    function renderPresets(category) {
        grid.innerHTML = '';
        const items = PRESETS[category] || [];
        items.forEach(p => {
            const el = document.createElement('div');
            el.className = 'np-card';
            el.onclick = () => selectPreset(p, el);

            // Calc Aspect for preview
            const ratio = p.w / p.h;
            let pw = 100, ph = 70;
            if (ratio > 1) ph = 100 / ratio;
            else pw = 70 * ratio;

            // Limit max
            if (ph > 70) ph = 70;
            if (pw > 100) pw = 100;

            el.innerHTML = `
                <div class="np-preview">
                    <div style="width:${pw}px; height:${ph}px; border:1px solid #555;"></div>
                </div>
                <div class="np-card-title">${p.name}</div>
                <div class="np-card-dims">${p.w} x ${p.h} ${p.unit}</div>
            `;
            grid.appendChild(el);
        });
    }

    function selectPreset(p, el) {
        document.querySelectorAll('.np-card.active').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');

        document.getElementById('np-width').value = p.w;
        document.getElementById('np-height').value = p.h;
        // document.getElementById('np-unit').value = p.dispatchUnit || 'px'; 
    }

    // Tabs
    tabs.forEach(t => {
        t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            renderPresets(t.dataset.cat);
        });
    });

    // Create Button
    document.getElementById('btn-create-project').addEventListener('click', () => {
        const w = parseInt(document.getElementById('np-width').value);
        const h = parseInt(document.getElementById('np-height').value);
        const bgType = document.getElementById('np-bg-type').value;
        const bgColor = document.getElementById('np-bg-color').value;

        // Setup Project
        state.config.width = w;
        state.config.height = h;
        canvas.width = w;
        canvas.height = h;
        document.getElementById('canvas-dims').innerText = `${w}x${h}`;

        state.layers = [];

        if (bgType !== 'transparent') {
            const l = createLayer("Background");
            l.ctx.fillStyle = bgType === 'white' ? '#fff' : (bgType === 'black' ? '#000' : bgColor);
            l.ctx.fillRect(0, 0, w, h);
        }

        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('canvas-wrapper').classList.remove('hidden');
        document.getElementById('new-project-modal').style.display = 'none';

        state.history = []; // Clear old history
        saveHistory("New Project");
        updateLayerList();
        requestRender();
    });

    // Init with Social
    renderPresets('social');

    // Toggle Color Input
    window.toggleNpColor = (val) => {
        const input = document.getElementById('np-bg-color');
        input.style.display = val === 'custom' ? 'inline-block' : 'none';
    };

    // --- End New Project Logic ---

    // Tool Buttons
    document.querySelectorAll('.tool').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(e => e.classList.remove('active'));
            t.classList.add('active');
            state.tool = t.dataset.tool;
            console.log("Tool selected:", state.tool);
        });
    });

    // Layer Buttons
    document.getElementById('btn-add-layer').addEventListener('click', () => {
        createLayer("Layer " + (state.layers.length + 1));
        saveHistory("New Layer");
        updateLayerList();
        requestRender();
    });

    document.getElementById('btn-del-layer').addEventListener('click', () => {
        deleteLayer();
        saveHistory("Delete Layer");
        updateLayerList();
        requestRender();
    });

    // Opacity Slider
    const opacityInput = document.getElementById('layer-opacity');
    opacityInput.addEventListener('input', (e) => {
        const l = getActiveLayer();
        if (l) {
            l.opacity = parseInt(e.target.value);
            requestRender();
        }
    });

    // Blend Mode
    document.getElementById('layer-blend').addEventListener('change', (e) => {
        const l = getActiveLayer();
        if (l) {
            l.blendMode = e.target.value;
            requestRender();
        }
    });

    // Resize Button Logic
    document.getElementById('btn-do-resize').addEventListener('click', () => {
        const newW = parseInt(document.getElementById('resize-w').value);
        const newH = parseInt(document.getElementById('resize-h').value);

        if (state.resizeType === 'new-project') {
            state.config.width = newW;
            state.config.height = newH;
            canvas.width = newW;
            canvas.height = newH;
            document.getElementById('canvas-dims').innerText = `${newW}x${newH}`;

            // Create BG
            state.layers = [];
            const l = createLayer("Background");
            l.ctx.fillStyle = "white";
            l.ctx.fillRect(0, 0, newW, newH);

            // Hide Home
            document.getElementById('home-screen').classList.add('hidden');
            document.getElementById('canvas-wrapper').classList.remove('hidden');

        } else if (state.resizeType === 'image') {
            // Scale visual
            const sx = newW / state.config.width;
            const sy = newH / state.config.height;
            state.layers.forEach(l => {
                l.x *= sx; l.y *= sy;
                l.width *= sx; l.height *= sy;
            });
            state.config.width = newW;
            state.config.height = newH;
            canvas.width = newW;
            canvas.height = newH;
        } else if (state.resizeType === 'canvas') {
            const dx = (newW - state.config.width) / 2;
            const dy = (newH - state.config.height) / 2;
            state.layers.forEach(l => { l.x += dx; l.y += dy; });
            state.config.width = newW;
            state.config.height = newH;
            canvas.width = newW;
            canvas.height = newH;
        }

        updateLayerList();
        requestRender();
        saveHistory("Resize " + state.resizeType);
        document.getElementById('resize-modal').style.display = 'none';
    });
}

// Global UI Functions
window.toggleDropdown = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const display = el.style.display;
    document.querySelectorAll('.dropdown-content').forEach(e => e.style.display = 'none');
    el.style.display = display === 'block' ? 'none' : 'block';
};

window.openNewProjectDialog = () => {
    document.getElementById('new-project-modal').style.display = 'flex';
};

window.saveProject = () => {
    const project = {
        width: state.config.width,
        height: state.config.height,
        layers: state.layers.map(l => ({
            id: l.id,
            name: l.name,
            type: l.type,
            x: l.x, y: l.y,
            width: l.width, height: l.height,
            visible: l.visible, opacity: l.opacity,
            blendMode: l.blendMode,
            filters: l.filters,
            text: l.text,
            data: l.canvas.toDataURL()
        }))
    };

    const blob = new Blob([JSON.stringify(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "vtoolz_project.vtz";
    a.click();
    URL.revokeObjectURL(url);
    console.log("Project saved.");
};

// Menu Hooks (Indirectly called via global state or onclick, but we can add listeners here for better clean code)
// ... existing hooks ...

window.onclick = function (event) {
    if (!event.target.matches('.menu-item')) {
        document.querySelectorAll('.dropdown-content').forEach(e => e.style.display = 'none');
    }
};

window.openResizeModal = (mode) => {
    state.resizeType = mode;
    document.getElementById('resize-title').innerText = mode === 'image' ? 'Image Size' : 'Canvas Size';
    document.getElementById('resize-w').value = state.config.width;
    document.getElementById('resize-h').value = state.config.height;
    document.getElementById('resize-modal').style.display = 'flex';
};

export function updateLayerList() {
    const list = document.getElementById('layer-list');
    list.innerHTML = '';

    // Reverse logic: Top layer first in UI
    [...state.layers].reverse().forEach(l => {
        const item = document.createElement('div');
        item.className = 'layer-item' + (l.id === state.activeLayerId ? ' active' : '');
        item.onclick = () => {
            state.activeLayerId = l.id;
            updateLayerList();
            requestRender();

            // Update UI props
            document.getElementById('layer-opacity').value = l.opacity;
            document.getElementById('layer-blend').value = l.blendMode;
        };

        const vis = document.createElement('div');
        vis.className = 'layer-vis' + (l.visible ? ' visible' : '');
        vis.innerHTML = l.visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        vis.onclick = (e) => {
            e.stopPropagation();
            l.visible = !l.visible;
            requestRender();
            updateLayerList();
        };

        const thumb = document.createElement('img');
        thumb.className = 'layer-thumb';
        thumb.src = l.canvas.toDataURL(); // Expensive? Maybe optimize

        const name = document.createElement('div');
        name.className = 'layer-name';
        name.innerText = l.name;

        item.appendChild(vis);
        item.appendChild(thumb);
        item.appendChild(name);
        list.appendChild(item);
    });
}

export function updateHistoryPanel() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    state.history.forEach((h, i) => {
        const item = document.createElement('div');
        item.className = 'history-item' + (i === state.historyIndex ? ' active' : '');
        item.innerText = h.name;
        item.onclick = () => {
            restoreHistory(i);
            updateHistoryPanel();
            updateLayerList();
        };
        list.appendChild(item);
    });
    list.scrollTop = list.scrollHeight;
}
