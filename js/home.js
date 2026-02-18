import { tools } from './utils/tools.js';
import { Utils } from './utils/common.js';

// State
let currentCategory = 'all';

// DOM Elements
const toolsGrid = document.getElementById('tools-grid');
const searchInput = document.getElementById('tool-search');
const filterTabs = document.querySelectorAll('.filter-tab');

// Initialize
function init() {
    renderTools(tools);
    setupEventListeners();

    // Check URL params for search/category
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
}

// Render Tools
function renderTools(toolsToRender) {
    toolsGrid.innerHTML = '';
    const noResults = document.getElementById('no-results');

    if (toolsToRender.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    toolsToRender.forEach(tool => {
        const card = document.createElement('a');
        card.href = tool.url;
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

    // Spotlight Effect Listener (Global for Grid)
    // Updates ALL cards to create a seamless "flashlight" effect
    toolsGrid.onmousemove = e => {
        for (const card of document.getElementsByClassName('spotlight-card')) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };
}

// Filter Logic (Enhanced Fuzzy Search + Strict Category)
function filterTools(query) {
    const lowerQuery = query ? query.toLowerCase().trim() : '';

    // Synonym Mapping (Simple Fuzzy Logic)
    const synonyms = {
        'pic': 'image',
        'photo': 'image',
        'picture': 'image',
        'join': 'merge',
        'combine': 'merge',
        'shrink': 'compress',
        'min': 'compress',
        'cut': 'split',
        'trim': 'audio',
        'sound': 'audio',
        'music': 'audio',
        'web': 'dev',
        'code': 'dev',
        'programming': 'dev'
    };

    // Check if query matches a synonym
    let effectiveQuery = lowerQuery;
    for (const [key, value] of Object.entries(synonyms)) {
        if (lowerQuery.includes(key)) {
            effectiveQuery = value; // Boost category match
            break;
        }
    }

    return tools.filter(tool => {
        // 1. Category Check
        // If we are in a specific category (not 'all'), we MUST filter by it first.
        if (currentCategory !== 'all') {
            const isMatch = (tool.category === currentCategory) ||
                (currentCategory === 'dev' && tool.category === 'qr') ||
                (currentCategory === 'govt' && tool.category === 'government');

            if (!isMatch) return false;
        }

        // 2. Search Check
        if (!lowerQuery) return true; // If no search, all tools in this category

        const matchName = tool.name.toLowerCase().includes(lowerQuery);
        const matchDesc = tool.description.toLowerCase().includes(lowerQuery);
        const matchKeywords = (tool.keywords || '').toLowerCase().includes(lowerQuery);
        const matchCategory = tool.category.toLowerCase().includes(effectiveQuery);

        const matchId = tool.id.toLowerCase().includes(lowerQuery);

        return matchName || matchDesc || matchKeywords || matchCategory || matchId;
    });
}

// Events
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        const results = filterTools(e.target.value);
        renderTools(results);
    });

    // Search Button
    document.getElementById('search-btn').addEventListener('click', () => {
        const results = filterTools(searchInput.value);
        renderTools(results);
        toolsGrid.scrollIntoView({ behavior: 'smooth' });
    });

    // Enter Key Search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            toolsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Explore Button listener removed to allow default link behavior
    // const exploreBtn = document.getElementById('btn-explore');
    // if (exploreBtn) { ... }

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
    if (tab) {
        tab.click();
        // Force scroll to tools if not already there
        const toolsSection = document.getElementById('tools');
        if (toolsSection) {
            toolsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}


// Magic Drag & Drop
function initDragAndDrop() {
    const overlay = document.getElementById('drop-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        // Only trigger if users are dragging files (prevents internal link dragging issues)
        if (e.dataTransfer.types && !Array.from(e.dataTransfer.types).includes('Files')) {
            return;
        }
        e.preventDefault();
        dragCounter++;
        overlay.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            overlay.classList.remove('active');
        }
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        overlay.classList.remove('active');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileDrop(files[0]);
        }
    });
}

function handleFileDrop(file) {
    const type = file.type;
    let category = 'all';

    if (type.includes('pdf')) {
        category = 'pdf';
    } else if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg')) {
        category = 'image';
    } else if (type.includes('text') || type.includes('json') || type === '' || type.includes('javascript')) {
        // Text files often have empty type in some browsers, or specific code types
        category = 'text';
    }

    // Trigger filter
    setCategory(category);

    // Show toast
    showToast(`Detected ${file.name}. Showing ${category.toUpperCase()} tools!`, 'success');
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// Feature: Dynamic Theme
function initDynamicTheme() {
    const hour = new Date().getHours();
    const root = document.documentElement;

    // We can set a data-attribute to handle this in CSS, or set vars directly.
    // Let's set a class on body for broader styling control.

    // Morning: 5 - 11 (Energetic Orange/Morning feel)
    if (hour >= 5 && hour < 12) {
        document.body.classList.add('theme-morning');
        // root.style.setProperty('--primary-color', '#ff8c00'); // Example override
    }
    // Afternoon: 12 - 17 (Default Blue - No class needed or explicit class)
    else if (hour >= 12 && hour < 18) {
        document.body.classList.add('theme-afternoon');
    }
    // Evening/Night: 18 - 4 (Calm Purple/Indigo)
    else {
        document.body.classList.add('theme-evening');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    init();
    initDragAndDrop();
    initDynamicTheme();
});
