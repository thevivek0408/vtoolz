import '../utils/common.js';

const worker = new Worker('../../js/image/image-worker.js');
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

function runImageTask(type, payload) {
    return new Promise((resolve, reject) => {
        const id = requestId++;
        pendingRequests.set(id, { resolve, reject });
        worker.postMessage({ type, payload, id });
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

window.ImageTools = {
    runImageTask,
    readFileAsDataURL
};

console.log("Image Tools facade loaded.");
