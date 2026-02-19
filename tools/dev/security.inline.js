import { DevUtils } from '../../js/dev/dev-utils.js';

// Hash
document.getElementById('btn-hash').addEventListener('click', async () => {
    const text = document.getElementById('hash-input').value;
    const algo = document.getElementById('algo').value;

    if (algo === 'MD5') {
        // SubtleCrypto doesn't support MD5 typically. Simple workaround or alert.
        // For offline strict, maybe skip MD5 or use JS shim. 
        // I'll assume SHA only for now as MD5 is broken.
        window.Utils.showToast('MD5 not supported in secure context yet. Using SHA-256.', 'info');
        // Fallback
    }

    try {
        const hash = await DevUtils.generateHash(text, algo === 'MD5' ? 'SHA-256' : algo);
        document.getElementById('hash-result').textContent = hash;
    } catch (e) {
        console.error(e);
    }
});

// Password Gen
window.generate = () => {
    const len = parseInt(document.getElementById('opt-len').value);
    const opts = {
        upper: document.getElementById('opt-upper').checked,
        lower: document.getElementById('opt-lower').checked,
        numbers: document.getElementById('opt-num').checked,
        symbols: document.getElementById('opt-sym').checked
    };
    document.getElementById('pass-gen-out').value = DevUtils.generatePassword(len, opts);
};
// Init
generate();

// Check Strength
document.getElementById('pass-check').addEventListener('input', (e) => {
    const val = e.target.value;
    const res = DevUtils.checkPasswordStrength(val);
    document.getElementById('strength-text').textContent = res.rating;

    const bar = document.getElementById('strength-bar');
    bar.style.width = (res.score * 20) + '%';

    const colors = ['red', 'red', 'orange', 'yellow', 'lightgreen', 'green'];
    bar.style.background = colors[res.score];
});