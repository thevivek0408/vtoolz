import { DevUtils } from '../../js/dev/dev-utils.js';

const input = document.getElementById('input');
const output = document.getElementById('output');

window.format = () => {
    try {
        output.value = DevUtils.formatJson(input.value);
        window.Utils.showToast('JSON is valid and formatted', 'success');
    } catch (e) {
        output.value = e.message;
        window.Utils.showToast('Invalid JSON', 'error');
    }
};

window.minify = () => {
    try {
        output.value = DevUtils.minifyJson(input.value);
        window.Utils.showToast('JSON Minified', 'success');
    } catch (e) {
        window.Utils.showToast('Invalid JSON', 'error');
    }
};

window.toCsv = () => {
    try {
        output.value = DevUtils.jsonToCsv(input.value);
        window.Utils.showToast('Converted to CSV', 'success');
    } catch (e) {
        window.Utils.showToast('Error converting to CSV: ' + e.message, 'error');
    }
};

window.clearAll = () => {
    input.value = '';
    output.value = '';
};