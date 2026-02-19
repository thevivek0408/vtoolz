// Simple spotlight effect for this page
const grid = document.querySelector('.tool-grid');
if (grid) {
    grid.onmousemove = e => {
        for (const card of document.getElementsByClassName('tool-card')) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };
}