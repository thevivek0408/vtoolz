/*
 * Advanced Filters Worker
 * Heavy image processing for VtoolZ Editor
 */

self.onmessage = function (e) {
    const { type, imageData, width, height, value } = e.data;
    const data = new Uint8ClampedArray(imageData);
    let result;

    switch (type) {
        case 'oil':
            result = oilPaint(data, width, height, value || 4, 30); // Radius, Levels
            break;
        case 'denoise':
            result = medianFilter(data, width, height);
            break;
        case 'solarize':
            result = solarize(data, width, height, value || 128);
            break;
        case 'levels':
            result = levels(data, width, height, value.min, value.max);
            break;
        case 'blur':
            result = convolve(data, width, height, [
                1 / 9, 1 / 9, 1 / 9,
                1 / 9, 1 / 9, 1 / 9,
                1 / 9, 1 / 9, 1 / 9
            ]);
            break;
        case 'sharpen':
            result = convolve(data, width, height, [
                0, -1, 0,
                -1, 5, -1,
                0, -1, 0
            ]);
            break;
        case 'emboss':
            result = convolve(data, width, height, [
                -2, -1, 0,
                -1, 1, 1,
                0, 1, 2
            ]);
            break;
        case 'edge':
            result = convolve(data, width, height, [
                -1, -1, -1,
                -1, 8, -1,
                -1, -1, -1
            ]);
            break;
        default:
            result = data;
    }

    self.postMessage({
        imageData: result.buffer,
        width: width,
        height: height
    }, [result.buffer]);
};

// --- Filters ---

function levels(data, w, h, min, max) {
    const output = new Uint8ClampedArray(data);
    const range = max - min;
    const factor = 255 / (range === 0 ? 1 : range); // Avoid div by zero

    for (let i = 0; i < data.length; i += 4) {
        output[i] = (data[i] - min) * factor;
        output[i + 1] = (data[i + 1] - min) * factor;
        output[i + 2] = (data[i + 2] - min) * factor;
        // Alpha unchanged
    }
    return output;
}

function solarize(data, w, h, threshold) {
    const output = new Uint8ClampedArray(data);
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > threshold) r = 255 - r;
        if (g > threshold) g = 255 - g;
        if (b > threshold) b = 255 - b;
        output[i] = r; output[i + 1] = g; output[i + 2] = b;
    }
    return output;
}

function medianFilter(data, w, h) {
    const output = new Uint8ClampedArray(data.length);
    const radius = 1; // 3x3 window

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const r = [], g = [], b = [], a = [];

            for (let ky = -radius; ky <= radius; ky++) {
                for (let kx = -radius; kx <= radius; kx++) {
                    const py = Math.min(Math.max(y + ky, 0), h - 1);
                    const px = Math.min(Math.max(x + kx, 0), w - 1);
                    const kidx = (py * w + px) * 4;
                    r.push(data[kidx]);
                    g.push(data[kidx + 1]);
                    b.push(data[kidx + 2]);
                    a.push(data[kidx + 3]);
                }
            }

            r.sort((M, N) => M - N);
            g.sort((M, N) => M - N);
            b.sort((M, N) => M - N);
            a.sort((M, N) => M - N);

            const mid = Math.floor(r.length / 2);
            const idx = (y * w + x) * 4;
            output[idx] = r[mid];
            output[idx + 1] = g[mid];
            output[idx + 2] = b[mid];
            output[idx + 3] = a[mid];
        }
    }
    return output;
}

function oilPaint(data, w, h, radius, levels) {
    // Kuwahara filter
    const output = new Uint8ClampedArray(data.length);
    const width = w;
    const height = h;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const meanR = [0, 0, 0, 0], meanG = [0, 0, 0, 0], meanB = [0, 0, 0, 0];
            const sigmaR = [0, 0, 0, 0], sigmaG = [0, 0, 0, 0], sigmaB = [0, 0, 0, 0];
            const count = [0, 0, 0, 0];

            const os = [
                [-radius, -radius, 0, 0], // Top Left
                [0, -radius, radius, 0], // Top Right
                [-radius, 0, 0, radius], // Bottom Left
                [0, 0, radius, radius] // Bottom Right
            ];

            for (let k = 0; k < 4; k++) {
                for (let j = os[k][1]; j <= os[k][3]; j++) {
                    for (let i = os[k][0]; i <= os[k][2]; i++) {
                        const iy = Math.min(Math.max(y + j, 0), height - 1);
                        const ix = Math.min(Math.max(x + i, 0), width - 1);
                        const idx = (iy * width + ix) * 4;

                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        meanR[k] += r; meanG[k] += g; meanB[k] += b;
                        sigmaR[k] += r * r; sigmaG[k] += g * g; sigmaB[k] += b * b;
                        count[k]++;
                    }
                }
            }

            let minVar = Infinity;
            let bestK = 0;

            for (let k = 0; k < 4; k++) {
                meanR[k] /= count[k];
                meanG[k] /= count[k];
                meanB[k] /= count[k];

                const varR = Math.abs(sigmaR[k] / count[k] - meanR[k] * meanR[k]);
                const varG = Math.abs(sigmaG[k] / count[k] - meanG[k] * meanG[k]);
                const varB = Math.abs(sigmaB[k] / count[k] - meanB[k] * meanB[k]);
                const totalVar = varR + varG + varB;

                if (totalVar < minVar) {
                    minVar = totalVar;
                    bestK = k;
                }
            }

            const idx = (y * width + x) * 4;
            output[idx] = meanR[bestK];
            output[idx + 1] = meanG[bestK];
            output[idx + 2] = meanB[bestK];
            output[idx + 3] = data[idx + 3];
        }
    }

    return output;
}

function convolve(data, w, h, kernel) {
    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);
    const output = new Uint8ClampedArray(data.length);
    const width = w;
    const height = h;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;

            for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                    const scy = y + cy - halfSide;
                    const scx = x + cx - halfSide;

                    if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
                        const srcOff = (scy * width + scx) * 4;
                        const wt = kernel[cy * side + cx];
                        r += data[srcOff] * wt;
                        g += data[srcOff + 1] * wt;
                        b += data[srcOff + 2] * wt;
                    }
                }
            }

            const dstOff = (y * width + x) * 4;
            output[dstOff] = r;
            output[dstOff + 1] = g;
            output[dstOff + 2] = b;
            output[dstOff + 3] = data[dstOff + 3];
        }
    }
    return output;
}
