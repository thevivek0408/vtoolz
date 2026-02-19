// Tab Switching
function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
}

// --- Stopwatch Logic ---
let swInterval;
let swStartTime;
let swElapsed = 0;
let swRunning = false;

const swDisplay = document.getElementById('swDisplay');
const swStartBtn = document.getElementById('swStart');
const swLapBtn = document.getElementById('swLap');
const swLaps = document.getElementById('swLaps');

function formatTime(ms) {
    const date = new Date(ms);
    const m = String(date.getUTCHours() * 60 + date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    const msStr = String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0');
    return `${m}:${s}.${msStr}`;
}

function updateSW() {
    const now = Date.now();
    const diff = now - swStartTime + swElapsed;
    swDisplay.textContent = formatTime(diff);
}

swStartBtn.addEventListener('click', () => {
    if (!swRunning) {
        swStartTime = Date.now();
        swInterval = setInterval(updateSW, 10);
        swRunning = true;
        swStartBtn.textContent = 'Stop';
        swStartBtn.className = 'btn btn-stop';
        swLapBtn.disabled = false;
    } else {
        clearInterval(swInterval);
        swElapsed += Date.now() - swStartTime;
        swRunning = false;
        swStartBtn.textContent = 'Start';
        swStartBtn.className = 'btn btn-start';
        swLapBtn.disabled = true;
    }
});

document.getElementById('swReset').addEventListener('click', () => {
    clearInterval(swInterval);
    swElapsed = 0;
    swRunning = false;
    swDisplay.textContent = '00:00:00.00';
    swStartBtn.textContent = 'Start';
    swStartBtn.className = 'btn btn-start';
    swLapBtn.disabled = true;
    swLaps.innerHTML = '';
});

swLapBtn.addEventListener('click', () => {
    if (swRunning) {
        const now = Date.now();
        const diff = now - swStartTime + swElapsed;
        const lapTime = formatTime(diff);
        const li = document.createElement('div');
        li.className = 'lap-item';
        li.innerHTML = `<span>Lap ${swLaps.childElementCount + 1}</span> <span>${lapTime}</span>`;
        swLaps.prepend(li);
    }
});

// --- Timer Logic ---
let tInterval;
let tTotalTime;
let tRemaining;
let tRunning = false;

const tStartBtn = document.getElementById('tStart');
const tStopBtn = document.getElementById('tStop'); // Reusing start btn really
const tResetBtn = document.getElementById('tReset');
const tDisplay = document.getElementById('tDisplay');
const tInputs = document.getElementById('timerInputs');
const tProgress = document.getElementById('tProgress');
let audioCtx;

function playBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = 'square';
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1);
    osc.stop(audioCtx.currentTime + 1);
}

function formatTimer(sec) {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateTimer() {
    tRemaining--;
    tDisplay.textContent = formatTimer(tRemaining);
    const pct = (tRemaining / tTotalTime) * 100;
    tProgress.style.width = `${pct}%`;

    if (tRemaining <= 0) {
        clearInterval(tInterval);
        tRunning = false;
        playBeep();
        tStartBtn.style.display = 'inline-block';
        tStopBtn.style.display = 'none';
        tProgress.style.width = '0%';
        alert('Timer Finished!');
    }
}

tStartBtn.addEventListener('click', () => {
    if (!tRunning) {
        // Read inputs if fresh start
        if (!tRemaining && tRemaining !== 0) {
            const h = parseInt(document.getElementById('tHours').value) || 0;
            const m = parseInt(document.getElementById('tMins').value) || 0;
            const s = parseInt(document.getElementById('tSecs').value) || 0;
            tTotalTime = h * 3600 + m * 60 + s;
            if (tTotalTime <= 0) return;
            tRemaining = tTotalTime;
        }

        // UI Switch
        tInputs.style.display = 'none';
        tDisplay.style.display = 'block';
        tStartBtn.style.display = 'none';
        tStopBtn.style.display = 'inline-block';
        tStopBtn.textContent = 'Pause';
        tDisplay.textContent = formatTimer(tRemaining);

        tInterval = setInterval(updateTimer, 1000);
        tRunning = true;
    }
});

tStopBtn.addEventListener('click', () => {
    clearInterval(tInterval);
    tRunning = false;
    tStartBtn.style.display = 'inline-block';
    tStartBtn.textContent = 'Resume';
    tStopBtn.style.display = 'none';
});

tResetBtn.addEventListener('click', () => {
    clearInterval(tInterval);
    tRunning = false;
    tRemaining = null;
    tInputs.style.display = 'flex';
    tDisplay.style.display = 'none';
    tStartBtn.style.display = 'inline-block';
    tStartBtn.textContent = 'Start';
    tStopBtn.style.display = 'none';
    tProgress.style.width = '0%';
});