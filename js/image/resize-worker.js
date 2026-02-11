/*
 * Hermite Resize Worker
 * High-quality image resizing for VtoolZ Editor
 */

self.onmessage = function (e) {
    const { imageData, width, height, targetWidth, targetHeight } = e.data;

    // Create view on the data
    const data = new Uint8ClampedArray(imageData);
    const result = hermiteResize(data, width, height, targetWidth, targetHeight);

    // Send back results
    self.postMessage({
        imageData: result.buffer,
        width: targetWidth,
        height: targetHeight
    }, [result.buffer]);
};

function hermiteResize(data, w, h, targetW, targetH) {
    const ratio_w = w / targetW;
    const ratio_h = h / targetH;
    const ratio_w_half = Math.ceil(ratio_w / 2);
    const ratio_h_half = Math.ceil(ratio_h / 2);

    const target = new Uint8ClampedArray(targetW * targetH * 4);

    for (let j = 0; j < targetH; j++) {
        for (let i = 0; i < targetW; i++) {
            const x2 = (i + j * targetW) * 4;
            let weight = 0;
            let weights = 0;
            let weights_alpha = 0;
            let gx_r = 0;
            let gx_g = 0;
            let gx_b = 0;
            let gx_a = 0;
            const center_y = (j + 0.5) * ratio_h;

            const yy_start = Math.floor(j * ratio_h);
            const yy_stop = Math.ceil((j + 1) * ratio_h);

            for (let yy = yy_start; yy < yy_stop; yy++) {
                const dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
                const center_x = (i + 0.5) * ratio_w;
                const w0 = dy * dy; // pre-calc part of w

                const xx_start = Math.floor(i * ratio_w);
                const xx_stop = Math.ceil((i + 1) * ratio_w);

                for (let xx = xx_start; xx < xx_stop; xx++) {
                    const dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
                    const w = Math.sqrt(w0 + dx * dx);

                    if (w >= 1) {
                        // pixel too far
                        continue;
                    }

                    // hermite filter
                    weight = 2 * w * w * w - 3 * w * w + 1;

                    const pos_x = 4 * (xx + yy * w);
                    // alpha
                    gx_a += weight * data[pos_x + 3];
                    weights_alpha += weight;
                    // colors
                    if (data[pos_x + 3] < 255)
                        weight = weight * data[pos_x + 3] / 250;
                    gx_r += weight * data[pos_x];
                    gx_g += weight * data[pos_x + 1];
                    gx_b += weight * data[pos_x + 2];
                    weights += weight;
                }
            }

            target[x2] = gx_r / weights;
            target[x2 + 1] = gx_g / weights;
            target[x2 + 2] = gx_b / weights;
            target[x2 + 3] = gx_a / weights_alpha;
        }
    }

    return target;
}
