import '../../js/utils/common.js';

const coin = document.getElementById('coin');
const flipBtn = document.getElementById('flipBtn');
const resultEl = document.getElementById('result');
const headsEl = document.getElementById('headsCount');
const tailsEl = document.getElementById('tailsCount');

let heads = 0;
let tails = 0;
let isFlipping = false;

flipBtn.addEventListener('click', () => {
    if (isFlipping) return;
    isFlipping = true;
    resultEl.textContent = "Flipping...";

    // Random outcome 0 or 1
    const outcome = Math.floor(Math.random() * 2);

    // To animate, we need to spin a lot then land.
    // basic rots: Heads = 0, Tails = 180
    // Add (5 * 360) for 5 full spins
    const spins = 1800; // 5 spins
    const degrees = spins + (outcome === 0 ? 0 : 180);

    // Reset transition for instant rewind if needed? No, let's accumulate if possible or reset.
    // Resetting is cleaner to avoid huge numbers.
    coin.style.transition = 'none';
    coin.style.transform = 'rotateX(0deg)';

    setTimeout(() => {
        coin.style.transition = 'transform 3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        coin.style.transform = `rotateX(${degrees}deg)`;
    }, 50);

    setTimeout(() => {
        if (outcome === 0) {
            heads++;
            headsEl.textContent = heads;
            resultEl.textContent = "It's HEADS!";
        } else {
            tails++;
            tailsEl.textContent = tails;
            resultEl.textContent = "It's TAILS!";
        }
        isFlipping = false;
    }, 3000);
});