import { tools } from './utils/tools.js';

// DOM Elements
const searchInput = document.getElementById('tool-search');
const toolsGrid = document.getElementById('tools-grid');
const filterTabs = document.querySelectorAll('.filter-tab');
const noResults = document.getElementById('no-results');

let currentCategory = 'all';

// Initialize
function init() {
    renderTools(tools);
    setupEventListeners();

    // Check URL params for category
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    if (cat) setCategory(cat);
}

// Render Grid
function renderTools(toolsToRender) {
    toolsGrid.innerHTML = '';

    if (toolsToRender.length === 0) {
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    toolsToRender.forEach(tool => {
        const card = document.createElement('a');
        card.href = tool.url;
        card.className = 'tool-card zoom-in'; // Animation class
        card.style.borderLeft = `4px solid ${tool.color}`;

        card.innerHTML = `
            <div class="tool-icon" style="color: ${tool.color}">
                <i class="${tool.icon}"></i>
            </div>
            <div class="tool-info">
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
            </div>
            <div class="tool-arrow">
                <i class="fas fa-arrow-right"></i>
            </div>
        `;
        toolsGrid.appendChild(card);
    });
}

// Filter Logic
function filterTools(query) {
    const lowerQuery = query.toLowerCase();

    return tools.filter(tool => {
        // Category Check
        if (currentCategory !== 'all' && tool.category !== currentCategory) {
            // Special cases mapping
            if (currentCategory === 'dev' && tool.category === 'qr') return true; // Include QR in Dev
            return false;
        }

        // Search Check
        if (!lowerQuery) return true;

        return (
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery) ||
            tool.keywords.toLowerCase().includes(lowerQuery)
        );
    });
}

// Events
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        const results = filterTools(e.target.value);
        renderTools(results);
    });

    // Keyboard shortcut '/'
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // Tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // UI Update
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Logic Update
            currentCategory = tab.dataset.category;
            searchInput.value = ''; // Clear search on cat switch
            const results = filterTools('');
            renderTools(results);
        });
    });
}

// Helper to set category manually
function setCategory(cat) {
    const tab = document.querySelector(`.filter-tab[data-category="${cat}"]`);
    if (tab) tab.click();
}

window.addEventListener('DOMContentLoaded', init);
