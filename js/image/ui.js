import { state } from './state.js';
import { requestRender, canvas } from './core.js';
import { createLayer, deleteLayer, getActiveLayer, addLayerMask, createGroup } from './layers.js';
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
        const name = document.getElementById('np-name').value || "New Project";
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

        // Update Tab
        document.getElementById('project-bar').style.display = 'flex';
        document.getElementById('project-name-display').innerText = name + ".psd"; // Mock extension

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
        // Save original for Compare
        setTimeout(() => {
            state.originalImage = canvas.toDataURL();
        }, 100);
    });

    window.closeProject = () => {
        // Simple close logic
        document.getElementById('project-bar').style.display = 'none';
        document.getElementById('canvas-wrapper').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');

        // Clear state (optional but good practice)
        state.layers = [];
        state.history = [];
        updateLayerList();
        updateHistoryPanel();
    };

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
            updateOptionsBar();
        });
    });

    // Init Options
    updateOptionsBar();


    // --- Color Picker Logic (Photopea Style) ---
    const fgDisplay = document.getElementById('fg-color-display');
    const bgDisplay = document.getElementById('bg-color-display');
    const fgInput = document.getElementById('fg-color-picker');
    const bgInput = document.getElementById('bg-color-picker');
    const switchBtn = document.getElementById('btn-switch-colors');

    // Safety check (fixes the error popup if elements missing)
    if (fgDisplay && bgDisplay && fgInput && bgInput) {
        // Init Defaults
        state.toolSettings.color = state.toolSettings.color || '#000000';
        state.toolSettings.bgColor = state.toolSettings.bgColor || '#ffffff';

        function updateSwatches() {
            fgDisplay.style.backgroundColor = state.toolSettings.color;
            bgDisplay.style.backgroundColor = state.toolSettings.bgColor;
            fgInput.value = state.toolSettings.color;
            bgInput.value = state.toolSettings.bgColor;
        }

        // FG Click
        fgDisplay.addEventListener('click', () => fgInput.click());
        fgInput.addEventListener('input', (e) => {
            state.toolSettings.color = e.target.value;
            updateSwatches();
        });

        // BG Click
        bgDisplay.addEventListener('click', () => bgInput.click());
        bgInput.addEventListener('input', (e) => {
            state.toolSettings.bgColor = e.target.value;
            updateSwatches();
        });

        // Switch Colors
        switchBtn.addEventListener('click', () => {
            const temp = state.toolSettings.color;
            state.toolSettings.color = state.toolSettings.bgColor;
            state.toolSettings.bgColor = temp;
            updateSwatches();
        });

        updateSwatches();
    }
    // --- End Color Logic ---

    // Layer Buttons
    const btnAddLayer = document.getElementById('btn-add-layer');
    if (btnAddLayer) {
        btnAddLayer.onclick = () => {
            createLayer('Layer ' + (state.layers.length + 1));
            saveHistory("New Layer"); // Re-added saveHistory
            requestRender();
            updateLayerList();
        };
    }

    const btnAddGroup = document.getElementById('btn-add-group');
    if (btnAddGroup) {
        btnAddGroup.onclick = () => {
            createGroup('Group ' + (Math.floor(Math.random() * 100)));
            saveHistory("New Group"); // Added saveHistory for new group
            updateLayerList();
        };
    }

    document.getElementById('btn-del-layer').onclick = () => {
        deleteLayer();
        saveHistory("Delete Layer");
        updateLayerList();
        requestRender();
    };

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
    // Event Listeners for State Changes
    window.addEventListener('history-update', () => {
        updateHistoryPanel();
    });

    window.addEventListener('layer-update', () => {
        updateLayerList();
    });

    // Mask Btn
    const maskBtn = document.getElementById('btn-add-mask');
    if (maskBtn) {
        maskBtn.addEventListener('click', () => {
            addLayerMask();
            updateLayerList();
        });
    }

    // --- Compare Modal Logic ---
    window.openCompareModal = () => {
        const modal = document.getElementById('compare-modal');
        const beforeImg = document.getElementById('compare-before');
        const afterImg = document.getElementById('compare-after');
        const slider = document.querySelector('.compare-slider');

        if (!state.originalImage) {
            // Fallback if no original saved (e.g. drawn from blank)
            // Just use white/transparent? Or use history[0]?
            // Let's use history[0] if available, else blank.
            // For now, alert or fallback
            if (state.history.length > 0) {
                // Try to reconstruct? Hard. 
                // Just show current vs current (pointless) or alert.
                // Ideally we saved original on load/create.
            }
        }

        beforeImg.src = state.originalImage || '';
        afterImg.src = canvas.toDataURL();

        modal.display = 'flex'; // Wait, modal is the element
        modal.style.display = 'flex';

        // Slider Logic
        let isDragging = false;
        const compareView = document.getElementById('compare-view');

        // Reset slider
        slider.style.left = '50%';
        afterImg.style.clipPath = 'inset(0 0 0 50%)';

        const updateSlider = (x) => {
            const rect = compareView.getBoundingClientRect();
            let pos = ((x - rect.left) / rect.width) * 100;
            pos = Math.max(0, Math.min(100, pos));

            slider.style.left = `${pos}%`;
            afterImg.style.clipPath = `inset(0 0 0 ${pos}%)`;
        };

        slider.onmousedown = (e) => { isDragging = true; };
        window.onmouseup = () => { isDragging = false; };
        window.onmousemove = (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        };

        // Click to jump
        compareView.onclick = (e) => {
            updateSlider(e.clientX);
        };
    };
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

    // Recursive render function
    function renderItem(container, layer, depth = 0) {
        const item = document.createElement('div');
        item.className = 'layer-item' + (layer.id === state.activeLayerId ? ' active' : '');
        item.style.paddingLeft = (depth * 20 + 5) + 'px'; // Indent

        item.onclick = (e) => {
            if (state.activeLayerId !== layer.id) {
                state.activeLayerId = layer.id;
                if (layer.type !== 'group') layer.isMaskActive = false;
            }
            updateLayerList();
            requestRender();

            // Update UI props
            const op = document.getElementById('layer-opacity');
            if (op) op.value = layer.opacity;
            const bl = document.getElementById('layer-blend');
            if (bl) bl.value = layer.blendMode;
        };

        // Visibility Toggle
        const vis = document.createElement('div');
        vis.className = 'layer-vis' + (layer.visible ? ' visible' : '');
        vis.innerHTML = layer.visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        vis.onclick = (e) => {
            e.stopPropagation();
            layer.visible = !layer.visible;
            requestRender();
            updateLayerList();
        };
        item.appendChild(vis);

        // Group Toggle (Folder Icon)
        if (layer.type === 'group') {
            const folder = document.createElement('div');
            folder.className = 'layer-group-toggle';
            folder.style.marginRight = '5px';
            folder.style.cursor = 'pointer';
            folder.innerHTML = layer.expanded ? '<i class="fas fa-folder-open"></i>' : '<i class="fas fa-folder"></i>';
            folder.onclick = (e) => {
                e.stopPropagation();
                layer.expanded = !layer.expanded;
                updateLayerList();
            };
            item.appendChild(folder);
        }

        // Thumbnails (only for raster, unless we want group icon)
        if (layer.type !== 'group') {
            const thumbs = document.createElement('div');
            thumbs.className = 'layer-thumbs';
            thumbs.style.display = 'flex';
            thumbs.style.alignItems = 'center';
            thumbs.style.gap = '5px';

            // Content Thumb
            const contentThumb = document.createElement('div');
            contentThumb.className = 'layer-thumb-wrap' + (!layer.isMaskActive ? ' active-target' : '');
            contentThumb.style.border = (layer.id === state.activeLayerId && !layer.isMaskActive) ? '2px solid #fff' : '1px solid #444';

            const img = document.createElement('img');
            img.className = 'layer-thumb';
            // Use placeholder for new empty layers to avoid issues? 
            // layer.canvas should be valid.
            img.src = layer.canvas.toDataURL();
            contentThumb.appendChild(img);

            contentThumb.onclick = (e) => {
                e.stopPropagation();
                state.activeLayerId = layer.id;
                layer.isMaskActive = false;
                updateLayerList();
                requestRender();
            };
            thumbs.appendChild(contentThumb);

            // Mask Thumb
            if (layer.mask) {
                const maskThumb = document.createElement('div');
                maskThumb.className = 'layer-thumb-wrap' + (layer.isMaskActive ? ' active-target' : '');
                maskThumb.style.border = (layer.id === state.activeLayerId && layer.isMaskActive) ? '2px solid #fff' : '1px solid #444';

                const mImg = document.createElement('img');
                mImg.className = 'layer-thumb';
                mImg.src = layer.mask.toDataURL();

                maskThumb.appendChild(mImg);
                maskThumb.onclick = (e) => {
                    e.stopPropagation();
                    state.activeLayerId = layer.id;
                    layer.isMaskActive = true;
                    updateLayerList();
                    requestRender();
                };
                thumbs.appendChild(maskThumb);
            }
            item.appendChild(thumbs);
        }

        // Name
        const name = document.createElement('div');
        name.className = 'layer-name';
        name.innerText = layer.name;
        item.appendChild(name);

        container.appendChild(item);

        // Render Children if expanded
        if (layer.type === 'group' && layer.expanded && layer.children) {
            // Render children in reverse order (top to bottom)
            [...layer.children].reverse().forEach(child => {
                renderItem(container, child, depth + 1);
            });
        }
    }

    // Render Top Level Layers (Reverse order)
    [...state.layers].reverse().forEach(l => {
        renderItem(list, l, 0);
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

export function updateOptionsBar() {
    const bar = document.getElementById('options-bar');
    bar.innerHTML = '';

    const label = document.createElement('span');
    label.style.color = '#aaa';
    label.style.fontStyle = 'italic';
    label.style.marginLeft = '10px';
    label.style.marginRight = '15px';
    label.innerText = state.tool.charAt(0).toUpperCase() + state.tool.slice(1);
    bar.appendChild(label);

    // Helpers
    const createSep = () => {
        const s = document.createElement('div');
        s.style.width = '1px'; s.style.height = '20px'; s.style.background = '#555'; s.style.margin = '0 10px';
        bar.appendChild(s);
    };

    const createSlider = (min, max, val, labelText, onChange) => {
        const wrap = document.createElement('div');
        wrap.className = 'opt-group';
        wrap.innerHTML = `<span class="opt-label">${labelText}:</span>`;
        const input = document.createElement('input');
        input.type = 'range'; input.min = min; input.max = max; input.value = val;
        input.oninput = (e) => onChange(parseInt(e.target.value));
        wrap.appendChild(input);
        const valDisp = document.createElement('span');
        valDisp.innerText = val;
        valDisp.style.width = '25px'; valDisp.style.textAlign = 'center';
        input.addEventListener('input', (e) => valDisp.innerText = e.target.value);
        wrap.appendChild(valDisp);
        bar.appendChild(wrap);
    };

    const createSelect = (opts, val, onChange) => {
        const sel = document.createElement('select');
        opts.forEach(o => {
            const op = document.createElement('option');
            op.value = o.val; op.innerText = o.text;
            if (o.val === val) op.selected = true;
            sel.appendChild(op);
        });
        sel.onchange = (e) => onChange(e.target.value);
        bar.appendChild(sel);
    };

    const createCheck = (val, labelText, onChange) => {
        const wrap = document.createElement('div');
        wrap.className = 'opt-group';
        const id = 'opt-check-' + Math.random().toString(36).substr(2, 5);
        wrap.innerHTML = `<input type="checkbox" id="${id}" ${val ? 'checked' : ''}><label for="${id}" class="opt-label">${labelText}</label>`;
        wrap.querySelector('input').onchange = (e) => onChange(e.target.checked);
        bar.appendChild(wrap);
    };

    // Tool Specifics
    if (state.tool === 'select-rect' || state.tool === 'select-lasso' || state.tool === 'magic-wand') {
        createSep();
        const btn = document.createElement('button');
        btn.innerText = 'Deselect (Ctrl+D)';
        btn.className = 'btn-secondary'; // Helper class?
        btn.style.padding = '2px 8px';
        btn.onclick = () => {
            state.selection = null;
            state.selectionPath = null;
            state.selectionMask = null;
            requestRender();
        };
        bar.appendChild(btn);
    } else if (state.tool === 'move') {
        createSep();
        createCheck(state.toolSettings.showTransformControls, 'Show Controls', (v) => {
            state.toolSettings.showTransformControls = v;
            state.isTransforming = v; // Auto-trigger transform mode
            requestRender();
        });
    } else if (['brush', 'eraser', 'clone', 'blur-tool', 'dodge', 'burn', 'heal'].includes(state.tool)) {
        createSep();
        createSlider(1, 100, state.toolSettings.size, 'Size', (v) => state.toolSettings.size = v);
    } else if (state.tool === 'shape') {
        createSep();
        createSelect([
            { val: 'rect', text: 'Rectangle' },
            { val: 'circle', text: 'Circle' },
            { val: 'line', text: 'Line' }
        ], state.toolSettings.shape, (v) => state.toolSettings.shape = v);

        createSep();
        createCheck(state.toolSettings.fillShape, 'Fill', (v) => state.toolSettings.fillShape = v);

        createSep();
        createSlider(1, 50, state.toolSettings.size, 'Stroke', (v) => state.toolSettings.size = v);
    } else if (state.tool === 'text') {
        createSep();
        createSlider(8, 200, state.toolSettings.fontSize, 'Size', (v) => state.toolSettings.fontSize = v);
        createSep();
        createSelect([
            { val: 'Arial', text: 'Arial' },
            { val: 'Verdana', text: 'Verdana' },
            { val: 'Times New Roman', text: 'Times New Roman' },
            { val: 'Courier New', text: 'Courier New' },
            { val: 'Impact', text: 'Impact' }
        ], state.toolSettings.font, (v) => state.toolSettings.font = v);
    } else if (state.tool === 'gradient') {
        createSep();
        const wrap = document.createElement('div');
        wrap.className = 'opt-group';
        wrap.innerHTML = `<span class="opt-label">Type:</span> <span style="color:#fff">Linear</span>`;
        bar.appendChild(wrap);
    } else if (state.tool === 'fill' || state.tool === 'magic-wand') {
        createSep();
        createSlider(0, 100, state.toolSettings.tolerance, 'Tolerance', (v) => state.toolSettings.tolerance = v);
    }

    // --- Smart Export Actions ---
    const btnExport = document.getElementById('btn-do-export');
    const btnShare = document.getElementById('btn-share-export');
    const btnSaveAs = document.getElementById('btn-save-as-export');
    const formatSelect = document.getElementById('export-format');

    // Helper: Get Blob
    const getExportBlob = async () => {
        const format = formatSelect.value;
        const dataUrl = canvas.toDataURL(format);
        const res = await fetch(dataUrl);
        return await res.blob();
    };

    // 1. Download (Standard)
    if (btnExport) {
        btnExport.onclick = async () => {
            const format = formatSelect.value;
            const ext = format.split('/')[1];
            const link = document.createElement('a');
            link.download = `export.${ext}`;
            link.href = canvas.toDataURL(format);

            // Stats
            const blob = await getExportBlob();
            if (window.Utils && window.Utils.trackStat) {
                window.Utils.trackStat('files_processed', 1);
                window.Utils.trackStat('bytes_saved', blob.size);
            }

            link.click();
            document.getElementById('export-modal').style.display = 'none';
        };
    }

    // 2. Share (Navigator API)
    if (btnShare && navigator.canShare) {
        btnShare.style.display = 'inline-block';
        btnShare.onclick = async () => {
            try {
                const blob = await getExportBlob();
                const format = formatSelect.value;
                const ext = format.split('/')[1];
                const file = new File([blob], `share.${ext}`, { type: format });

                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Edited Image',
                        text: 'Check out this image I edited with VtoolZ!'
                    });
                    if (window.Utils) window.Utils.trackStat('files_processed', 1);
                } else {
                    alert("Sharing not supported for this file type.");
                }
            } catch (err) {
                console.error("Share failed:", err);
            }
        };
    }

    // 3. Save As (File System Access API)
    if (btnSaveAs && window.showSaveFilePicker) {
        btnSaveAs.style.display = 'inline-block';
        btnSaveAs.onclick = async () => {
            try {
                const format = formatSelect.value;
                const ext = format.split('/')[1];

                const handle = await window.showSaveFilePicker({
                    suggestedName: `image.${ext}`,
                    types: [{
                        description: 'Image File',
                        accept: { [format]: [`.${ext}`] },
                    }],
                });

                const blob = await getExportBlob();
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                if (window.Utils) window.Utils.trackStat('files_processed', 1);
                document.getElementById('export-modal').style.display = 'none';
            } catch (err) {
                if (err.name !== 'AbortError') console.error("Save As failed:", err);
            }
        };
    }
}
