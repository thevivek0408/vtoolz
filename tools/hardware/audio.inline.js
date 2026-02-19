const els = {
    btnPlayFreq: document.getElementById('btnPlayFreq'),
    oscType: document.getElementById('oscType'),
    freqSlider: document.getElementById('freqSlider'),
    freqVal: document.getElementById('freqVal'),
    canvas: document.getElementById('visualizer'),
    // Stereo
    btnLeft: document.getElementById('btnLeft'),
    btnCenter: document.getElementById('btnCenter'),
    btnRight: document.getElementById('btnRight'),
    // Phase
    btnInPhase: document.getElementById('btnInPhase'),
    btnOutPhase: document.getElementById('btnOutPhase')
};

const state = {
    ctx: null,
    osc: null,
    gain: null,
    isPlaying: false,
    analyser: null,
    animId: null
};

function initAudio() {
    if (!state.ctx) {
        state.ctx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.ctx.createAnalyser();
        state.analyser.fftSize = 2048;
    }
    if (state.ctx.state === 'suspended') state.ctx.resume();
    return state.ctx;
}

// --- Frequency Generator ---
els.freqSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    els.freqVal.textContent = val;
    if (state.osc) state.osc.frequency.setValueAtTime(val, state.ctx.currentTime);
});

els.oscType.addEventListener('change', (e) => {
    if (state.osc) state.osc.type = e.target.value;
});

els.btnPlayFreq.addEventListener('click', () => {
    const ctx = initAudio();

    if (state.isPlaying) {
        // Stop
        state.osc.stop();
        state.osc.disconnect();
        state.isPlaying = false;
        els.btnPlayFreq.innerHTML = '<i class="fas fa-play"></i> Play';
        cancelAnimationFrame(state.animId);
    } else {
        // Start
        state.osc = ctx.createOscillator();
        state.gain = ctx.createGain();

        state.osc.type = els.oscType.value;
        state.osc.frequency.value = els.freqSlider.value;
        state.gain.gain.value = 0.5;

        state.osc.connect(state.gain);
        state.gain.connect(state.analyser);
        state.analyser.connect(ctx.destination);

        state.osc.start();
        state.isPlaying = true;
        els.btnPlayFreq.innerHTML = '<i class="fas fa-stop"></i> Stop';
        drawVisualizer();
    }
});

function drawVisualizer() {
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvasCtx = els.canvas.getContext('2d');
    const width = els.canvas.width = els.canvas.offsetWidth;
    const height = els.canvas.height = els.canvas.offsetHeight;

    function draw() {
        if (!state.isPlaying) return;
        state.animId = requestAnimationFrame(draw);
        state.analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Trail effect
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#00d2ff'; // Cyan
        canvasCtx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) canvasCtx.moveTo(x, y);
            else canvasCtx.lineTo(x, y);

            x += sliceWidth;
        }
        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();
    }
    draw();
}

// --- Stereo Test ---
function playTone(panValue) {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const panner = ctx.createStereoPanner();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // Sweep up

    panner.pan.value = panValue;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
}

els.btnLeft.addEventListener('click', () => playTone(-1));
els.btnCenter.addEventListener('click', () => playTone(0));
els.btnRight.addEventListener('click', () => playTone(1));


// --- Phase Test ---
// Plays noise in both channels
// In phase: Same noise
// Out phase: One channel inverted
let phaseSource = null;

function playPhase(isInPhase) {
    const ctx = initAudio();
    if (phaseSource) {
        phaseSource.stop();
        phaseSource = null;
        return;
    }

    // Create buffer with noise
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < bufferSize; i++) {
        const noise = Math.random() * 2 - 1;
        left[i] = noise;
        right[i] = isInPhase ? noise : -noise; // Invert for out of phase
    }

    phaseSource = ctx.createBufferSource();
    phaseSource.buffer = buffer;
    phaseSource.loop = true;
    phaseSource.connect(ctx.destination);
    phaseSource.start();

    setTimeout(() => {
        if (phaseSource) {
            phaseSource.stop();
            phaseSource = null;
        }
    }, 2000); // Play for 2s
}

els.btnInPhase.addEventListener('click', () => playPhase(true));
els.btnOutPhase.addEventListener('click', () => playPhase(false));