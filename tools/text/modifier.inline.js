import { TextUtils } from '../../js/text/text-utils.js';

const input = document.getElementById('input');
const output = document.getElementById('output');

// Expose utils and apply to window for inline onclick handlers
window.TextUtils = TextUtils;

window.apply = (fn) => {
    if (!input.value) return;
    // Handle if fn is a string name of TextUtils (if passed from HTML as string?) No, we passed function ref.
    // But TextUtils.sortLines passed directly works.
    // Wait, inline onclick="apply(TextUtils.sortLines)" requires TextUtils to be global.
    // We set window.TextUtils above.

    output.value = fn(input.value);
    // window.Utils.showToast('Transformation applied', 'success'); // Common utils
};

// Find & Replace
document.getElementById('replace-btn').addEventListener('click', () => {
    const find = document.getElementById('find-text').value;
    const replace = document.getElementById('replace-text').value;
    if (!find) return;
    output.value = TextUtils.replaceAll(input.value, find, replace);
});

// Copy
document.getElementById('copy-btn').addEventListener('click', () => {
    output.select();
    document.execCommand('copy');
});