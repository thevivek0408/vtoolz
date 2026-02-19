import '../../js/utils/common.js';

const els = {
    table: document.getElementById('table'),
    countInput: document.getElementById('diceCount'),
    countVal: document.getElementById('countVal'),
    colorInput: document.getElementById('diceColor'),
    dotColorInput: document.getElementById('dotColor'),
    rollBtn: document.getElementById('rollBtn'),
    totalDisplay: document.getElementById('totalDisplay')
};

const state = {
    count: 1,
    color: '#ffffff',
    dotColor: '#333333',
    values: [1]
};

function init() {
    els.countInput.addEventListener('input', updateCount);
    els.colorInput.addEventListener('input', updateStyle);
    els.dotColorInput.addEventListener('input', updateStyle);
    els.rollBtn.addEventListener('click', rollAll);

    // Allow clicking on table to roll
    els.table.addEventListener('click', (e) => {
        if (e.target === els.table) rollAll();
    });

    updateCount(); // Init dice
}

function updateCount() {
    state.count = parseInt(els.countInput.value);
    els.countVal.textContent = state.count;
    renderDice();
}

function updateStyle() {
    state.color = els.colorInput.value;
    state.dotColor = els.dotColorInput.value;

    document.documentElement.style.setProperty('--dice-color', state.color);
    document.documentElement.style.setProperty('--dot-color', state.dotColor);
}

function renderDice() {
    els.table.innerHTML = '';
    state.values = [];

    for (let i = 0; i < state.count; i++) {
        const dice = createDiceElement(i);
        els.table.appendChild(dice);
        state.values.push(1);
    }
    updateTotal();
}

function createDiceElement(index) {
    const dice = document.createElement('div');
    dice.className = 'dice';
    dice.id = `dice-${index}`;
    dice.onclick = (e) => { e.stopPropagation(); rollOne(index); };

    // Faces
    const faces = [
        { cls: 'face-1', dots: 1 },
        { cls: 'face-2', dots: 2 },
        { cls: 'face-3', dots: 3 },
        { cls: 'face-4', dots: 4 },
        { cls: 'face-5', dots: 5 },
        { cls: 'face-6', dots: 6 }
    ];

    faces.forEach(f => {
        const face = document.createElement('div');
        face.className = `face ${f.cls}`;
        for (let j = 0; j < f.dots; j++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            face.appendChild(dot);
        }
        dice.appendChild(face);
    });

    return dice;
}

function rollAll() {
    state.values.forEach((_, i) => rollOne(i, false));
}

function rollOne(index, updateTot = true) {
    const dice = document.getElementById(`dice-${index}`);
    if (dice.classList.contains('rolling')) return;

    // Audio (Synth)
    playRollSound();

    dice.classList.add('rolling');

    const result = Math.floor(Math.random() * 6) + 1;
    state.values[index] = result;

    // Physics Landing
    // We need to set the final transform based on the result
    const rotations = {
        1: [0, 0],
        2: [0, -90],
        3: [0, -180],
        4: [0, 90],
        5: [-90, 0],
        6: [90, 0]
    };

    // Add some random extra spins (full 360s)
    const extraX = Math.floor(Math.random() * 4) * 360;
    const extraY = Math.floor(Math.random() * 4) * 360;

    setTimeout(() => {
        dice.classList.remove('rolling');
        const [rx, ry] = rotations[result];
        dice.style.transform = `rotateX(${rx + extraX}deg) rotateY(${ry + extraY}deg)`;

        if (updateTot || index === state.count - 1) updateTotal();
    }, 600 + (index * 100)); // Stagger slightly if rolling all? No, concurrent is better for chaos.
}

function updateTotal() {
    const total = state.values.reduce((a, b) => a + b, 0);
    els.totalDisplay.textContent = total;
}

function playRollSound() {
    // Simple synth since external assets might fail
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    }
}

init();