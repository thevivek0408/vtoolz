const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'];
let currentIndex = 0;
const overlay = document.getElementById('overlay');
const btnStart = document.getElementById('btnStart');

function updateColor() {
    overlay.style.backgroundColor = colors[currentIndex];
}

function nextColor() {
    currentIndex = (currentIndex + 1) % colors.length;
    updateColor();
}

function prevColor() {
    currentIndex = (currentIndex - 1 + colors.length) % colors.length;
    updateColor();
}

function startTest() {
    currentIndex = 0;
    updateColor();
    overlay.classList.add('active');

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
}

function stopTest() {
    overlay.classList.remove('active');
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

btnStart.addEventListener('click', startTest);

// Overlay Navigation
overlay.addEventListener('click', nextColor);

window.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;

    if (e.key === 'Escape') {
        stopTest();
    } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        nextColor();
    } else if (e.key === 'ArrowLeft') {
        prevColor();
    }
});

// Exit handler
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        overlay.classList.remove('active');
    }
});