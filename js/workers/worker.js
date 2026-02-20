/**
 * Web Worker for handling heavy computations off the main thread.
 * Use this for image processing, large text manipulation, etc.
 */

self.onmessage = function (e) {
    const { type, data } = e.data;

    switch (type) {
        case 'EXAMPLE_TASK':
            // perform task
            const result = performExampleTask(data);
            self.postMessage({ type: 'EXAMPLE_RESULT', result });
            break;
        default:
            console.error('Worker: Unknown message type', type);
    }
}

function performExampleTask(data) {
    // Simulate heavy work
    return data;
}
