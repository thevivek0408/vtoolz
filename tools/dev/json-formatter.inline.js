import { showToast } from '../../../js/utils/common.js';

const inputEl = document.getElementById('json-input');
const outputEl = document.getElementById('json-output');
const inputStatus = document.getElementById('input-status');
const outputStatus = document.getElementById('output-status');

// Buttons
document.getElementById('btn-format').addEventListener('click', () => processJSON(true));
document.getElementById('btn-minify').addEventListener('click', () => processJSON(false));
document.getElementById('btn-clear').addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
    updateStats();
});
document.getElementById('btn-copy').addEventListener('click', () => {
    if (!outputEl.value) return;
    navigator.clipboard.writeText(outputEl.value);
    showToast('Copied to clipboard');
});
document.getElementById('btn-paste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        inputEl.value = text;
        updateStats();
    } catch (err) {
        showToast('Failed to read clipboard', 'error');
    }
});
document.getElementById('btn-sample').addEventListener('click', () => {
    inputEl.value = '{"id":1,"name":"Vibox","features":["Privacy","Speed","Offline"],"meta":{"version":2.0,"active":true}}';
    updateStats();
    processJSON(true);
});

// Live stats update
inputEl.addEventListener('input', updateStats);

function updateStats() {
    const lines = inputEl.value.split('\n').length;
    const length = inputEl.value.length;
    inputStatus.textContent = `Lines: ${lines} | Length: ${length}`;
}

function processJSON(beautify = true) {
    const raw = inputEl.value.trim();
    if (!raw) {
        outputEl.value = '';
        return;
    }

    try {
        const parsed = JSON.parse(raw);
        if (beautify) {
            outputEl.value = JSON.stringify(parsed, null, 4); // 4 spaces indentation
        } else {
            outputEl.value = JSON.stringify(parsed);
        }
        outputStatus.className = 'status-bar status-success';
        outputStatus.textContent = 'Valid JSON';
    } catch (e) {
        outputStatus.className = 'status-bar status-error';
        outputStatus.textContent = `Invalid JSON: ${e.message}`;
    }
}