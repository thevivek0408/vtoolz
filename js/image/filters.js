import { state } from './state.js';
import { requestRender } from './core.js';
import { getActiveLayer } from './layers.js'; // Helper
import { saveHistory } from './history.js';
import { updateLayerList } from './ui.js';

// Workers
// Logic: Paths are relative to editor.html (tools/image/)
const resizeWorker = new Worker('../../js/image/resize-worker.js');
const filterWorker = new Worker('../../js/image/filters-worker.js');

export function initFilters() {
    // Resize Worker Callback
    resizeWorker.onmessage = function (e) {
        const { imageData, width, height, targetWidth, targetHeight } = e.data;
        // Logic depends on what we sent. 
        // If it was resize:
        if (state.resizeType === 'hq') {
            const l = getActiveLayer();
            if (l) {
                console.log("Resize Worker Done", width, height);
                // If we passed target dimensions, use them
                const finalW = targetWidth || width;
                const finalH = targetHeight || height;

                l.width = finalW;
                l.height = finalH;
                l.canvas.width = finalW;
                l.canvas.height = finalH;
                l.ctx.putImageData(new ImageData(new Uint8ClampedArray(imageData), finalW, finalH), 0, 0);

                requestRender();
                saveHistory("HQ Resize");
                alert("Resize Complete");
            }
        }
    };

    // Filter Worker Callback
    filterWorker.onmessage = function (e) {
        const { imageData, width, height } = e.data;
        const l = getActiveLayer();
        if (l) {
            const newData = new Uint8ClampedArray(imageData);
            const imgData = new ImageData(newData, width, height);
            l.ctx.putImageData(imgData, 0, 0);
            requestRender();
            saveHistory("Filter Async");
            alert("Filter Applied");
        }
    };
}

export function applyFilter(type, val) {
    const layer = getActiveLayer();
    if (!layer) return;

    if (type === 'brightness') layer.filters.brightness = val;
    if (type === 'blur') layer.filters.blur = val;
    if (type === 'contrast') layer.filters.contrast = val;
    // Toggles
    if (type === 'grayscale') layer.filters.grayscale = layer.filters.grayscale > 0 ? 0 : 100;
    if (type === 'invert') layer.filters.invert = layer.filters.invert > 0 ? 0 : 100;
    if (type === 'sepia') layer.filters.sepia = layer.filters.sepia > 0 ? 0 : 100;

    requestRender();
}

export function applyWorkerFilter(type, val) {
    const l = getActiveLayer();
    if (!l) return;

    // Get raw data
    const data = l.ctx.getImageData(0, 0, l.canvas.width, l.canvas.height);

    filterWorker.postMessage({
        type: type, // 'denoise', 'oil', etc.
        imageData: data.data.buffer,
        width: l.canvas.width,
        height: l.canvas.height,
        value: val
    }, [data.data.buffer]);

    alert("Applying filter... please wait.");
}

// Global Expose for Menu Items
window.applyWorkerFilter = applyWorkerFilter;
window.openHueSatModal = () => document.getElementById('huesat-modal').style.display = 'flex'; // UI logic mixed here helper
window.promptLevels = () => alert("Levels not implemented in this version.");
