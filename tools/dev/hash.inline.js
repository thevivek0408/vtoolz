import { showToast } from '../../../js/utils/common.js';

window.copyHash = (id) => {
    const text = document.getElementById(id).textContent;
    if (text === '...') return;
    navigator.clipboard.writeText(text);
    showToast('Hash copied to clipboard');
};

const input = document.getElementById('text-input');

input.addEventListener('input', updateHashes);

async function updateHashes() {
    const text = input.value;
    if (!text) {
        ['sha1', 'sha256', 'sha512'].forEach(algo => {
            document.getElementById(`res-${algo}`).textContent = '...';
        });
        return;
    }

    document.getElementById('res-sha1').textContent = await sha(text, 'SHA-1');
    document.getElementById('res-sha256').textContent = await sha(text, 'SHA-256');
    document.getElementById('res-sha512').textContent = await sha(text, 'SHA-512');
}

async function sha(text, algo) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}