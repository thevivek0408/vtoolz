import '../../js/utils/common.js';

const input = document.getElementById('inputList');
const output = document.getElementById('outputList');
const winnerDisplay = document.getElementById('winnerDisplay');

function getItems() {
    return input.value.split('\n').filter(line => line.trim() !== '');
}

document.getElementById('shuffleBtn').addEventListener('click', () => {
    const items = getItems();
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    output.value = items.join('\n');
});

document.getElementById('sortBtn').addEventListener('click', () => {
    const items = getItems();
    items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    output.value = items.join('\n');
});

document.getElementById('reverseBtn').addEventListener('click', () => {
    const items = getItems();
    items.reverse();
    output.value = items.join('\n');
});

document.getElementById('pickBtn').addEventListener('click', () => {
    const items = getItems();
    if (items.length === 0) return;
    const winner = items[Math.floor(Math.random() * items.length)];
    winnerDisplay.innerHTML = `<i class="fas fa-trophy"></i> Winner: <strong>${winner}</strong>`;
    winnerDisplay.style.display = 'block';
});