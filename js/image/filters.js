import { state } from './state.js';
import { requestRender } from './core.js';
import { getActiveLayer } from './layers.js'; // Helper
import { saveHistory } from './history.js';
import { updateLayerList } from './ui.js';

// Workers
// Logic: Paths are relative to editor.html (tools/image/)
let resizeWorker, filterWorker;
try {
    resizeWorker = new Worker('../../js/image/resize-worker.js');
    filterWorker = new Worker('../../js/image/filters-worker.js');
} catch (e) {
    console.warn('Workers failed to load:', e);
}

export function initFilters() {
    // Resize Worker Callback
    resizeWorker.onmessage = function (e) {
        const { imageData, width, height, targetWidth, targetHeight } = e.data;
        if (state.resizeType === 'hq') {
            const l = getActiveLayer();
            if (l) {
                const finalW = targetWidth || width;
                const finalH = targetHeight || height;

                l.width = finalW;
                l.height = finalH;
                l.canvas.width = finalW;
                l.canvas.height = finalH;
                l.ctx.putImageData(new ImageData(new Uint8ClampedArray(imageData), finalW, finalH), 0, 0);

                requestRender();
                saveHistory("HQ Resize");
                if (window.showToast) window.showToast('Resize complete!', 'success');
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
            if (window.showToast) window.showToast('Filter applied!', 'success');
        }
    };

    // Hue/Sat Events
    const btnApplyHS = document.getElementById('btn-apply-huesat');
    if (btnApplyHS) {
        btnApplyHS.addEventListener('click', () => {
            const h = parseInt(document.getElementById('hs-hue').value);
            const s = parseInt(document.getElementById('hs-sat').value);
            const l = parseInt(document.getElementById('hs-light').value);
            applyHueSat(h, s, l);
            document.getElementById('huesat-modal').style.display = 'none';
        });
    }
}

export function applyHueSat(hue, sat, light) {
    const layer = getActiveLayer();
    if (!layer) return;

    const w = layer.canvas.width;
    const h = layer.canvas.height;
    const imgData = layer.ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // RGB to HSL
        let [hVal, sVal, lVal] = rgbToHsl(r, g, b);

        // Adjust
        hVal = (hVal * 360 + hue) % 360;
        if (hVal < 0) hVal += 360;
        hVal /= 360; // back to 0-1

        sVal = Math.max(0, Math.min(1, sVal + sat / 100));
        lVal = Math.max(0, Math.min(1, lVal + light / 100));

        // HSL to RGB
        const [nr, ng, nb] = hslToRgb(hVal, sVal, lVal);

        data[i] = nr;
        data[i + 1] = ng;
        data[i + 2] = nb;
    }

    layer.ctx.putImageData(imgData, 0, 0);
    requestRender();
    saveHistory("Hue/Saturation");
}

// Helpers
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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
    if (!filterWorker) { if (window.showToast) window.showToast('Filter worker unavailable', 'error'); return; }

    // Get raw data
    const data = l.ctx.getImageData(0, 0, l.canvas.width, l.canvas.height);

    filterWorker.postMessage({
        type: type, // 'denoise', 'oil', etc.
        imageData: data.data.buffer,
        width: l.canvas.width,
        height: l.canvas.height,
        value: val
    }, [data.data.buffer]);

    if (window.showToast) window.showToast('Applying filter...', 'info');
}
}

// Global Expose for Menu Items
window.applyWorkerFilter = applyWorkerFilter;
window.openHueSatModal = () => document.getElementById('huesat-modal').style.display = 'flex'; // UI logic mixed here helper
window.promptLevels = () => {
    if (window.showToast) window.showToast('Levels: coming soon!', 'info');
};
