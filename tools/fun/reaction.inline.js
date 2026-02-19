import '../../js/utils/common.js';

const target = document.getElementById('target');
const lastEl = document.getElementById('lastScore');
const bestEl = document.getElementById('bestScore');

let state = 'idle'; // idle, wait, click, result
let timer;
let startTime;
let bestScore = Infinity;

target.addEventListener('mousedown', () => {
    if (state === 'idle' || state === 'result') {
        startTest();
    } else if (state === 'wait') {
        tooEarly();
    } else if (state === 'click') {
        finish();
    }
});

function startTest() {
    state = 'wait';
    target.className = 'reaction-area wait';
    target.innerHTML = '<i class="fas fa-ellipsis-h" style="font-size: 4rem; margin-bottom: 20px;"></i><div>Wait for Green...</div>';

    const delay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
    timer = setTimeout(() => {
        state = 'click';
        startTime = Date.now();
        target.className = 'reaction-area click';
        target.innerHTML = '<i class="fas fa-exclamation" style="font-size: 4rem; margin-bottom: 20px;"></i><div>CLICK!</div>';
    }, delay);
}

function tooEarly() {
    clearTimeout(timer);
    state = 'result'; // or back to idle
    target.className = 'reaction-area early';
    target.innerHTML = '<i class="fas fa-times" style="font-size: 4rem; margin-bottom: 20px;"></i><div>Too Early!</div><div style="font-size:1rem">Click to try again</div>';
}

function finish() {
    const time = Date.now() - startTime;
    state = 'result';
    target.className = 'reaction-area idle';
    target.innerHTML = `<i class="fas fa-clock" style="font-size: 4rem; margin-bottom: 20px;"></i><div>${time} ms</div><div style="font-size:1rem">Click to measure again</div>`;

    lastEl.textContent = time;
    if (time < bestScore) {
        bestScore = time;
        bestEl.textContent = bestScore;
    }
}