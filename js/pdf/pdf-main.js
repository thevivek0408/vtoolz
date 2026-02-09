import '../utils/common.js';

const worker = new Worker('../../js/pdf/pdf-worker.js');
let requestId = 0;
const pendingRequests = new Map();

worker.onmessage = (e) => {
    const { type, id, result, error } = e.data;
    if (pendingRequests.has(id)) {
        const { resolve, reject } = pendingRequests.get(id);
        if (type === 'SUCCESS') resolve(result);
        else reject(new Error(error));
        pendingRequests.delete(id);
    }
};

/**
 * Send task to PDF worker
 * @param {string} type 
 * @param {any} payload 
 */
function runPdfTask(type, payload) {
    return new Promise((resolve, reject) => {
        const id = requestId++;
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ type, payload, id });
    });
}

/**
 * Read file as ArrayBuffer
 * @param {File} file 
 */
function readFileAsBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// UI Handlers
// These will be attached by the specific tool pages
// e.g. window.setupMergeTool()

window.PdfTools = {
    runPdfTask,
    readFileAsBuffer
};

console.log("PDF Tools facade loaded.");
