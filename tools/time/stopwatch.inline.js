import '../../js/utils/common.js';

let startTime;
let elapsedTime = 0;
let timerInterval;
let running = false;
let lapCount = 0;

const display = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapList = document.getElementById('lapList');

function formatTime(time) {
    let date = new Date(time);
    let hours = date.getUTCHours().toString().padStart(2, '0');
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    let milliseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function updateDisplay() {
    let now = Date.now();
    let time = elapsedTime + (now - startTime);
    display.textContent = formatTime(time);
}

startBtn.addEventListener('click', () => {
    if (!running) {
        startTime = Date.now();
        timerInterval = setInterval(updateDisplay, 10);
        startBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        startBtn.classList.replace('btn-primary', 'btn-warning');
        lapBtn.disabled = false;
        resetBtn.disabled = false;
        running = true;
    } else {
        elapsedTime += Date.now() - startTime;
        clearInterval(timerInterval);
        startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
        startBtn.classList.replace('btn-warning', 'btn-primary');
        running = false;
    }
});

lapBtn.addEventListener('click', () => {
    if (running) {
        lapCount++;
        let now = Date.now();
        let currentLapTime = elapsedTime + (now - startTime);

        if (lapCount === 1) lapList.innerHTML = ''; // Clear placeholder

        const li = document.createElement('li');
        li.className = 'lap-item';
        li.innerHTML = `<span>Lap ${lapCount}</span> <span>${formatTime(currentLapTime)}</span>`;
        lapList.prepend(li); // Add to top
    }
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    running = false;
    elapsedTime = 0;
    lapCount = 0;
    display.textContent = "00:00:00.00";
    startBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    startBtn.classList.replace('btn-warning', 'btn-primary');
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    lapList.innerHTML = '<li class="lap-item" style="justify-content: center; color: var(--text-muted);">No laps recorded</li>';
});