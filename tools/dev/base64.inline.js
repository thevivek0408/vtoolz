import { DevUtils } from '../../js/dev/dev-utils.js';

const decoded = document.getElementById('decoded');
const encoded = document.getElementById('encoded');
const mode = document.getElementById('mode');

document.getElementById('btn-encode').addEventListener('click', () => {
    try {
        if (mode.value === 'base64') encoded.value = DevUtils.base64Encode(decoded.value);
        else encoded.value = DevUtils.urlEncode(decoded.value);
    } catch (e) {
        window.Utils.showToast('Encoding Error', 'error');
    }
});

document.getElementById('btn-decode').addEventListener('click', () => {
    try {
        if (mode.value === 'base64') decoded.value = DevUtils.base64Decode(encoded.value);
        else decoded.value = DevUtils.urlDecode(encoded.value);
    } catch (e) {
        window.Utils.showToast('Decoding Error', 'error');
    }
});