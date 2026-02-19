// --- Tab Logic ---
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.converter-box');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// --- Common Utils ---
function copyToClipboard(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand('copy'); // Legacy but works everywhere, or use navigator.clipboard
    // navigator.clipboard.writeText(el.value);
    // Show toast (if available via common.js or makeshift)
}

function clearText(inId, outId) {
    document.getElementById(inId).value = '';
    document.getElementById(outId).value = '';
}

// --- Morse Logic ---
const morseMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.', '0': '-----', ' ': ' / ' // Space separator
};
const revMorseMap = Object.fromEntries(Object.entries(morseMap).map(a => a.reverse()));

const morseIn = document.getElementById('morseInput');
const morseOut = document.getElementById('morseOutput');

morseIn.addEventListener('input', () => {
    const text = morseIn.value.toUpperCase();
    morseOut.value = text.split('').map(c => morseMap[c] || c).join(' ');
});

morseOut.addEventListener('input', () => {
    // Basic decode attempt
    const text = morseOut.value.trim();
    // Split by 3 spaces for word, 1 space for char usually, but here we used ' / '
    // Let's try flexible split
    const words = text.split(' / ');
    morseIn.value = words.map(w => w.split(' ').map(c => revMorseMap[c] || '').join('')).join(' ');
});

// Audio Context for Morse
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playMorse() {
    const code = morseOut.value;
    const dot = 0.08; // seconds
    let t = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600;

    gain.gain.value = 0;
    osc.start(t);

    for (let c of code) {
        if (c === '.') {
            gain.gain.setValueAtTime(1, t);
            t += dot;
            gain.gain.setValueAtTime(0, t);
            t += dot; // Inner space
        } else if (c === '-') {
            gain.gain.setValueAtTime(1, t);
            t += dot * 3;
            gain.gain.setValueAtTime(0, t);
            t += dot; // Inner space
        } else if (c === ' ' || c === '/') {
            t += dot * 3; // Word/Char space
        }
    }

    osc.stop(t);
}

// --- Binary Logic ---
const binIn = document.getElementById('binaryInput');
const binOut = document.getElementById('binaryOutput');

binIn.addEventListener('input', () => {
    binOut.value = binIn.value.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
});

binOut.addEventListener('input', () => {
    // Try to decode
    const bins = binOut.value.trim().split(/\s+/);
    binIn.value = bins.map(b => String.fromCharCode(parseInt(b, 2))).join('');
});

// --- Base64 Logic ---
const b64In = document.getElementById('base64Input');
const b64Out = document.getElementById('base64Output');

b64In.addEventListener('input', () => {
    try {
        b64Out.value = btoa(b64In.value);
    } catch (e) { /* typing... */ }
});

b64Out.addEventListener('input', () => {
    try {
        b64In.value = atob(b64Out.value);
    } catch (e) { /* typing... */ }
});


// --- Braille Logic ---
// Basic mapping for English letters (Grade 1)
const brailleMap = {
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
    'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
    'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
    '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
    ' ': ' ', ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '(': '⠦', ')': '⠴', '?': '⠦', '"': '⠶'
};
// Invert map? Braille is ambiguous sometimes but for Grade 1 it's mostly 1-1

const brailleIn = document.getElementById('brailleInput');
const brailleOut = document.getElementById('brailleOutput');

brailleIn.addEventListener('input', () => {
    brailleOut.value = brailleIn.value.toLowerCase().split('').map(c => brailleMap[c] || c).join('');
});