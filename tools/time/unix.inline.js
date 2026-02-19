import '../../js/utils/common.js';

const currentEl = document.getElementById('currentTimestamp');
const pauseBtn = document.getElementById('pauseBtn');
let paused = false;

// Footer is handled by common.js or needs to be added manually? 
// usually standard templates have it. I'll stick to this structure.

// Live Clock
setInterval(() => {
    if (!paused) {
        currentEl.textContent = Math.floor(Date.now() / 1000);
    }
}, 1000);

pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Start" : "Stop";
    pauseBtn.classList.toggle('btn-secondary');
    pauseBtn.classList.toggle('btn-primary');
});

// Timestamp -> Date
document.getElementById('convertTsBtn').addEventListener('click', () => {
    const input = document.getElementById('tsInput').value;
    if (!input) return;

    const date = new Date(input * 1000);
    document.getElementById('resGmt').textContent = date.toUTCString();
    document.getElementById('resLocal').textContent = date.toString();

    // Relative
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    let timeAgo = diff > 0 ? `${diff} seconds ago` : `in ${Math.abs(diff)} seconds`;
    if (Math.abs(diff) > 60) timeAgo = `${Math.floor(diff / 60)} minutes ago`;
    // Simplified relative time logic for demo

    document.getElementById('resRelative').textContent = timeAgo;
    document.getElementById('tsResult').style.display = 'table';
});

// Date -> Timestamp
document.getElementById('convertDateBtn').addEventListener('click', () => {
    const input = document.getElementById('dateInput').value;
    if (!input) return;

    const date = new Date(input);
    const ts = Math.floor(date.getTime() / 1000);

    document.getElementById('resTimestamp').textContent = ts;
    document.getElementById('dateResult').style.display = 'block';
});

// Set default values
document.getElementById('tsInput').value = Math.floor(Date.now() / 1000);