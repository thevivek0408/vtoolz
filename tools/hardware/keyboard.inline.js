const els = {
    keyboard: document.getElementById('keyboard'),
    lastKey: document.getElementById('lastKey'),
    lastCode: document.getElementById('lastCode'),
    eventCode: document.getElementById('eventCode'),
    activeCount: document.getElementById('activeCount'),
    log: document.getElementById('eventLog'),
    btnReset: document.getElementById('btnReset')
};

// Layout Definitions (ANSI Standard)
const layout = [
    [
        { code: 'Escape', label: 'Esc' },
        { code: 'F1', label: 'F1' }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' },
        { code: 'F5', label: 'F5' }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' },
        { code: 'F9', label: 'F9' }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' }
    ],
    [
        { code: 'Backquote', label: '`' }, { code: 'Digit1', label: '1' }, { code: 'Digit2', label: '2' }, { code: 'Digit3', label: '3' },
        { code: 'Digit4', label: '4' }, { code: 'Digit5', label: '5' }, { code: 'Digit6', label: '6' }, { code: 'Digit7', label: '7' },
        { code: 'Digit8', label: '8' }, { code: 'Digit9', label: '9' }, { code: 'Digit0', label: '0' }, { code: 'Minus', label: '-' },
        { code: 'Equal', label: '=' }, { code: 'Backspace', label: 'Bksp', width: 'w-2' }
    ],
    [
        { code: 'Tab', label: 'Tab', width: 'w-1-5' }, { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' },
        { code: 'KeyR', label: 'R' }, { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' }, { code: 'KeyU', label: 'U' },
        { code: 'KeyI', label: 'I' }, { code: 'KeyO', label: 'O' }, { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[' },
        { code: 'BracketRight', label: ']' }, { code: 'Backslash', label: '\\', width: 'w-1-5' }
    ],
    [
        { code: 'CapsLock', label: 'Caps', width: 'w-1-5' }, { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' },
        { code: 'KeyF', label: 'F' }, { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' }, { code: 'KeyJ', label: 'J' },
        { code: 'KeyK', label: 'K' }, { code: 'KeyL', label: 'L' }, { code: 'Semicolon', label: ';' }, { code: 'Quote', label: '\'' },
        { code: 'Enter', label: 'Enter', width: 'w-2' }
    ],
    [
        { code: 'ShiftLeft', label: 'Shift', width: 'w-2' }, { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' },
        { code: 'KeyV', label: 'V' }, { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' }, { code: 'KeyM', label: 'M' },
        { code: 'Comma', label: ',' }, { code: 'Period', label: '.' }, { code: 'Slash', label: '/' }, { code: 'ShiftRight', label: 'Shift', width: 'w-2-5' }
    ],
    [
        { code: 'ControlLeft', label: 'Ctrl', width: 'w-1-5' }, { code: 'MetaLeft', label: 'Win' }, { code: 'AltLeft', label: 'Alt' },
        { code: 'Space', label: 'Space', width: 'w-space' },
        { code: 'AltRight', label: 'Alt' }, { code: 'MetaRight', label: 'Win' }, { code: 'ContextMenu', label: 'Menu' }, { code: 'ControlRight', label: 'Ctrl', width: 'w-1-5' }
    ]
];

// Arrow and Nav Key Cluster (Simplified)
const navCluster = [
    { code: 'Insert', label: 'Ins' }, { code: 'Home', label: 'Home' }, { code: 'PageUp', label: 'PgUp' },
    { code: 'Delete', label: 'Del' }, { code: 'End', label: 'End' }, { code: 'PageDown', label: 'PgDn' },
    { code: 'ArrowUp', label: '↑' },
    { code: 'ArrowLeft', label: '←' }, { code: 'ArrowDown', label: '↓' }, { code: 'ArrowRight', label: '→' }
];

const state = {
    pressedKeys: new Set()
};

function renderKeyboard() {
    layout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'kb-row';
        row.forEach(key => {
            const keyEl = document.createElement('div');
            keyEl.className = `key ${key.width || ''}`;
            keyEl.dataset.code = key.code;
            keyEl.textContent = key.label;
            rowEl.appendChild(keyEl);
        });
        els.keyboard.appendChild(rowEl);
    });

    // Render Nav Cluster separately or below? For now, add a separator
    const divider = document.createElement('div');
    divider.style.height = '20px';
    els.keyboard.appendChild(divider);

    const navRow = document.createElement('div');
    navRow.className = 'kb-row';
    navCluster.forEach(key => {
        const keyEl = document.createElement('div');
        keyEl.className = `key`;
        keyEl.dataset.code = key.code;
        keyEl.textContent = key.label;
        navRow.appendChild(keyEl);
    });
    els.keyboard.appendChild(navRow);
}

function logEvent(e) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const typeSpan = document.createElement('span');
    typeSpan.textContent = e.type;
    entry.appendChild(typeSpan);
    entry.appendChild(document.createTextNode(`: Key="${e.key}" Code="`));
    const codeSpan = document.createElement('span');
    codeSpan.className = 'code';
    codeSpan.textContent = e.code;
    entry.appendChild(codeSpan);
    entry.appendChild(document.createTextNode(`" Which=${e.which}`));
    els.log.insertBefore(entry, els.log.firstChild);
}

function handleKey(e, isDown) {
    e.preventDefault(); // Prevent default browser actions (like scrolling with space)

    const keyEl = document.querySelector(`.key[dataset-code="${e.code}"]`) ||
        document.querySelector(`.key[data-code="${e.code}"]`); // Select by data-code

    if (isDown) {
        if (!state.pressedKeys.has(e.code)) {
            state.pressedKeys.add(e.code);
            logEvent(e);

            // Update Stats
            els.lastKey.textContent = e.key;
            els.lastCode.textContent = e.which;
            els.eventCode.textContent = e.code;
        }

        if (keyEl) {
            keyEl.classList.add('pressed');
            keyEl.classList.add('history');
        }
    } else {
        state.pressedKeys.delete(e.code);
        if (keyEl) keyEl.classList.remove('pressed');
    }

    els.activeCount.textContent = state.pressedKeys.size;
}

// Init
renderKeyboard();

// Listeners
window.addEventListener('keydown', (e) => handleKey(e, true));
window.addEventListener('keyup', (e) => handleKey(e, false));

els.btnReset.addEventListener('click', () => {
    document.querySelectorAll('.key.history').forEach(el => el.classList.remove('history'));
    els.log.innerHTML = '';
    els.lastKey.textContent = '-';
    els.lastCode.textContent = '-';
    els.eventCode.textContent = '-';
});