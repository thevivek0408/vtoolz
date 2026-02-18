import { tools } from './utils/tools.js';

// DOM Elements
const toolsGrid = document.querySelector('.tool-grid'); // Ensure this exists in HTML
const searchInput = document.getElementById('tool-search');
let currentCategory = '';

// Initialize
function init() {
    // 1. Determine Category from URL or Path
    // e.g. /tools/pdf/index.html -> 'pdf'
    // or ?category=pdf

    const path = window.location.pathname;

    if (path.includes('/pdf/')) currentCategory = 'pdf';
    else if (path.includes('/image/')) currentCategory = 'image';
    else if (path.includes('/text/')) currentCategory = 'text';
    else if (path.includes('/dev/')) currentCategory = 'dev';
    else if (path.includes('/government/') || path.includes('/govt/')) currentCategory = 'govt';
    else if (path.includes('/fun/')) currentCategory = 'fun';
    else if (path.includes('/hardware/')) currentCategory = 'hardware';
    else if (path.includes('/network/')) currentCategory = 'network';
    else if (path.includes('/office/')) currentCategory = 'office';
    else if (path.includes('/productivity/')) currentCategory = 'utility'; // or productivity
    else if (path.includes('/utility/')) currentCategory = 'utility';
    else if (path.includes('/media/')) currentCategory = 'media';
    else if (path.includes('/qr/')) currentCategory = 'dev'; // tools.js maps qr to dev usually, or check tools.js
    else if (path.includes('/barcode/')) currentCategory = 'dev'; // tools.js maps barcode to dev
    else if (path.includes('/archive/')) currentCategory = 'dev'; // tools.js maps zip to dev
    else {
        // Fallback: Check tools.js to see what category the folder maps to?
        // Or default to 'all' (but we want specific)
        console.warn('Could not determine category from path:', path);
    }

    // specific overrides based on tools.js content if needed
    if (window.location.href.includes('qr')) currentCategory = 'dev'; // or 'qr' if you change tools.js
    // Actually tools.js has category: 'dev' for QR/Barcode.
    // Let's filter by the category defined in tools.js.

    renderCategory(currentCategory);
    setupEventListeners();
}

// Render
function renderCategory(category) {
    if (!toolsGrid) return;

    // Filter tools for this category
    // For 'dev', we might want to include 'qr', 'barcode', 'archive' if they are tagged as 'dev' in tools.js
    // OR if the folder is 'qr', we might want to show checks.

    // Let's rely on tools.js 'category' property.
    let toolsToRender = tools.filter(tool => {
        if (!category) return true;

        // Special mapping for sub-folders that are 'dev' in tools.js but have their own folder overrides?
        // No, let's stick to tools.js structure.
        // If currentCategory is 'pdf', show 'category: pdf'.

        // Handling 'dev' which contains qr/barcode in tools.js?
        // In tools.js:
        // { id: 'dev-qr', category: 'dev' ... }
        // { id: 'dev-barcode', category: 'dev' ... }
        // So if we are in /tools/dev/index.html, we show all 'dev'.

        // What if we are in /tools/qr/index.html?
        // Does that exist? Yes.
        // If user goes to /tools/qr/, they probably want QR tools.
        // But QR tools are category 'dev'.
        // We might need to filter by ID or Sub-Category if we want specific pages.
        // But for now, let's just match category.

        return tool.category === category;
    });

    // Special Case: If we are in /tools/qr/ and tools are 'dev', we might show 0 tools if we filter by 'qr'.
    // We should check if we need to map folder->category differently.
    // Let's handle logical mapping.

    // If folder is 'qr', we want tools that are related to QR.
    if (location.pathname.includes('/qr/')) {
        toolsToRender = tools.filter(t => t.id.includes('qr'));
    }
    else if (location.pathname.includes('/barcode/')) {
        toolsToRender = tools.filter(t => t.id.includes('barcode'));
    }
    else if (location.pathname.includes('/archive/')) {
        toolsToRender = tools.filter(t => t.id.includes('zip') || t.keywords.includes('archive'));
    }

    renderGrid(toolsToRender);
    updateHero(category, toolsToRender.length);
}

function renderGrid(list) {
    toolsGrid.innerHTML = '';

    if (list.length === 0) {
        toolsGrid.innerHTML = '<p class="no-results">No tools found in this category yet.</p>';
        return;
    }

    list.forEach(tool => {
        // Fix relative paths. tools.js has 'tools/pdf/merge.html'.
        // We are in 'tools/pdf/index.html'.
        // We need to go up '../pdf/merge.html' ? 
        // Or just use absolute path '/' or handle relative.
        // 'tools/pdf/merge.html' is from root.
        // If we uses '../../tools/pdf/merge.html' it works.
        // Or just '../../' + tool.url

        const relativeUrl = '../../' + tool.url;

        const card = document.createElement('a');
        card.href = relativeUrl;
        card.className = 'tool-card zoom-in spotlight-card';
        card.innerHTML = `
            <div class="tool-thumb" style="color: ${tool.color}">
                <i class="${tool.icon}"></i>
            </div>
            <div class="tool-info">
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
            </div>
            <div class="tool-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        toolsGrid.appendChild(card);
    });

    // Re-init spotlight
    initSpotlight();
}

function updateHero(category, count) {
    // Optional: Update H1 or Description if they exist
    const title = document.querySelector('h1');
    const desc = document.querySelector('.hero p'); // if exists

    // We assume static HTML has generic "PDF Tools" title.
    // We can leave it or enhance it.
    // Let's leave it for now, static HTML usually has correct H1.
}

function initSpotlight() {
    const grid = document.querySelector('.tool-grid');
    if (!grid) return;

    grid.onmousemove = e => {
        for (const card of document.getElementsByClassName('spotlight-card')) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };
}

function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            // Refilter based on current category logic
            // Ideally we'd store the initial list.
            // For simplicity, let's just re-run main filter + search
            // But main filter is complex.

            // Better: Filter the current DOM? Or re-render.
            // Let's re-render. We need to store full list.

            // Re-fetch category list (optimized: do it once)
        });
    }
}

// Run
document.addEventListener('DOMContentLoaded', init);
