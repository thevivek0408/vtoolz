// Image Worker for heavy processing

self.onmessage = async function (e) {
    const { type, payload, id } = e.data;
    try {
        let result;
        switch (type) {
            case 'COMPRESS':
                result = await processImage(payload.file, payload.options);
                break;
            case 'RESIZE':
                result = await resizeImage(payload.file, payload.width, payload.height, payload.options);
                break;
            case 'CONVERT':
                result = await convertFormat(payload.file, payload.format);
                break;
            case 'APPLY_FILTER':
                result = await applyFilter(payload.file, payload.filterType, payload.value);
                break;
            default:
                throw new Error(`Unknown operation: ${type}`);
        }
        self.postMessage({ type: 'SUCCESS', id, result });
    } catch (error) {
        self.postMessage({ type: 'ERROR', id, error: error.message });
    }
};

async function processImage(file, options = {}) {
    // Options: quality (0-1), format, width, height
    const bitmap = await createImageBitmap(file);
    const width = options.width || bitmap.width;
    const height = options.height || bitmap.height;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Quality resizing usually better with stepping or Pica, 
    // but browser native is fast and decent for "Tools" site privacy focused.
    ctx.drawImage(bitmap, 0, 0, width, height);

    const quality = options.quality || 0.8;
    const format = options.format || file.type;

    const blob = await canvas.convertToBlob({ type: format, quality });
    return blob;
}

async function resizeImage(file, targetWidth, targetHeight, options = {}) {
    const bitmap = await createImageBitmap(file);

    let w = targetWidth;
    let h = targetHeight;

    // Auto-calculate aspect ratio if one dim is missing
    if (!w && !h) { w = bitmap.width; h = bitmap.height; }
    else if (!w) { w = Math.round(bitmap.width * (targetHeight / bitmap.height)); }
    else if (!h) { h = Math.round(bitmap.height * (targetWidth / bitmap.width)); }

    return processImage(file, { width: w, height: h, ...options });
}

async function convertFormat(file, format) {
    // format: 'image/jpeg', 'image/png', 'image/webp'
    return processImage(file, { format, quality: 0.92 });
}

async function applyFilter(file, filterType, value) {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');

    // Apply filters BEFORE drawing? allow canvas filters
    // Note: OffscreenCanvas context filter text syntax: "blur(5px) grayscale(100%)"

    let filterString = 'none';
    switch (filterType) {
        case 'grayscale':
            filterString = `grayscale(${value || 100}%)`;
            break;
        case 'blur':
            filterString = `blur(${value || 5}px)`;
            break;
        case 'brightness':
            filterString = `brightness(${value || 100}%)`; // value 0-200+, 100 is normal
            break;
        case 'contrast':
            filterString = `contrast(${value || 100}%)`;
            break;
    }

    ctx.filter = filterString;
    ctx.drawImage(bitmap, 0, 0);

    return canvas.convertToBlob({ type: file.type });
}
