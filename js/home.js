import { tools } from './utils/tools.js';
import { Utils } from './utils/common.js';
import { initParticles } from './utils/particles.js';

// State
let currentCategory = 'all';
let dropdownIndex = -1;

// DOM Elements
const toolsGrid = document.getElementById('tools-grid');
const searchInput = document.getElementById('tool-search');
const filterTabs = document.querySelectorAll('.filter-tab');

// Initialize
function init() {
    renderRecentTools();
    renderTools(tools);
    setupEventListeners();

    // Hide skeleton loader once tools are rendered
    const skeleton = document.getElementById('skeleton-loader');
    if (skeleton) skeleton.classList.add('hidden');

    // Keyboard shortcut: '/' or Ctrl+K to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !isInputFocused()) {
            e.preventDefault();
            searchInput?.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
    });

    // Check URL params for search/category
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    if (cat) setCategory(cat);
}

function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

// Render Recently Used Tools
function renderRecentTools() {
    const recentIds = Utils.getRecentTools ? Utils.getRecentTools() : [];
    if (recentIds.length === 0) return;

    const recentTools = recentIds
        .map(id => tools.find(t => t.id === id))
        .filter(Boolean);

    if (recentTools.length === 0) return;

    // Create section before the tools grid
    const toolsSection = document.getElementById('tools');
    if (!toolsSection) return;

    const section = document.createElement('div');
    section.className = 'recent-tools-section';
    section.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 15px;">
            <h3 style="margin:0; font-size:1.1rem; color:var(--text-dark);"><i class="fas fa-history" style="margin-right:8px; opacity:0.6;"></i>Recently Used</h3>
            <button id="clear-recent" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:0.8rem; opacity:0.7; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">Clear</button>
        </div>
        <div class="recent-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-bottom:30px;"></div>
    `;

    // Insert before the filter tabs
    const filterTabs = toolsSection.querySelector('.filter-tabs');
    if (filterTabs) {
        toolsSection.insertBefore(section, filterTabs);
    } else {
        toolsSection.prepend(section);
    }

    const grid = section.querySelector('.recent-grid');
    recentTools.forEach(tool => {
        const card = document.createElement('a');
        card.href = tool.url;
        card.className = 'tool-card zoom-in spotlight-card';
        card.style.cssText = 'padding: 12px; min-height: auto;';
        card.innerHTML = `
            <div class="tool-thumb" style="color: ${tool.color}; width:36px; height:36px; font-size:1rem;">
                <i class="${tool.icon}"></i>
            </div>
            <div class="tool-info" style="padding: 0 8px;">
                <h3 style="font-size:0.9rem; margin:0;">${tool.name}</h3>
            </div>
        `;
        grid.appendChild(card);
    });

    // Clear button
    section.querySelector('#clear-recent').addEventListener('click', () => {
        localStorage.removeItem('recentTools');
        section.remove();
    });
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
                <i class=\"${tool.icon}\" aria-hidden=\"true\"></i>
            </div>
            <div class=\"tool-info\">
                <h3>${tool.name}</h3>
                <p>${tool.description}</p>
            </div>
            <div class=\"tool-arrow\">
                <i class=\"fas fa-chevron-right\" aria-hidden=\"true\"></i>
            </div>
        `;
        toolsGrid.appendChild(card);
    });

    // Spotlight Effect Listener — throttled via rAF for smooth 60fps
    let spotlightRaf = null;
    toolsGrid.onmousemove = e => {
        if (spotlightRaf) return;
        spotlightRaf = requestAnimationFrame(() => {
            for (const card of document.getElementsByClassName('spotlight-card')) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
            spotlightRaf = null;
        });
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
    // Search with dropdown
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = filterTools(query);
        renderTools(results);
        
        // Show dropdown for quick access
        if (query.trim().length > 0) {
            showSearchDropdown(query);
        } else {
            hideSearchDropdown();
        }
    });

    // Hide dropdown on blur (with delay for click)
    searchInput.addEventListener('blur', () => {
        setTimeout(hideSearchDropdown, 200);
    });
    
    // Keyboard navigation for dropdown
    searchInput.addEventListener('keydown', (e) => {
        const dropdown = document.getElementById('search-dropdown');
        const isOpen = dropdown && dropdown.classList.contains('active');

        if (e.key === 'Escape') {
            hideSearchDropdown();
            searchInput.blur();
            return;
        }

        if (!isOpen) return;

        const items = Array.from(dropdown.querySelectorAll('a.search-dropdown-item'));
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            dropdownIndex = Math.min(dropdownIndex + 1, items.length - 1);
            updateDropdownSelection(items);
            items[dropdownIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            dropdownIndex = Math.max(dropdownIndex - 1, 0);
            updateDropdownSelection(items);
            items[dropdownIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && dropdownIndex >= 0) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = items[dropdownIndex].href;
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) hideSearchDropdown();
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
            filterTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            // Logic Update
            currentCategory = tab.dataset.category;
            searchInput.value = ''; // Clear search on cat switch
            const results = filterTools('');
            renderTools(results);
        });
    });

    // Keyboard arrow navigation for tabs (WAI-ARIA tab pattern)
    const tabList = document.querySelector('.filter-tabs');
    if (tabList) {
        tabList.addEventListener('keydown', (e) => {
            const tabs = Array.from(filterTabs);
            const current = tabs.indexOf(document.activeElement);
            if (current === -1) return;

            let next = current;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                next = (current + 1) % tabs.length;
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                next = (current - 1 + tabs.length) % tabs.length;
                e.preventDefault();
            } else if (e.key === 'Home') {
                next = 0;
                e.preventDefault();
            } else if (e.key === 'End') {
                next = tabs.length - 1;
                e.preventDefault();
            } else {
                return;
            }

            tabs[next].focus();
            tabs[next].click();
        });
    }
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


// Search Dropdown
function buildDropdownHTML(matches) {
    return matches.map(tool => `
        <a href="${tool.url}" class="search-dropdown-item">
            <div class="dd-icon" style="color: ${tool.color}"><i class="${tool.icon}"></i></div>
            <div class="dd-info">
                <div class="dd-name">${tool.name}</div>
                <div class="dd-desc">${tool.description}</div>
            </div>
            <i class="fas fa-chevron-right dd-arrow"></i>
        </a>
    `).join('');
}

function showSearchDropdown(query) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;
    
    const lowerQuery = query.toLowerCase().trim();
    const matches = tools.filter(t => 
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        (t.keywords || '').toLowerCase().includes(lowerQuery)
    ).slice(0, 6);
    
    if (matches.length === 0) {
        dropdown.innerHTML = `<div class="search-dropdown-item" style="pointer-events:none;opacity:0.5;"><div class="dd-info"><div class="dd-name">No results for "${query}"</div></div></div>`;
        dropdown.classList.add('active');
        return;
    }
    
    dropdown.innerHTML = buildDropdownHTML(matches);
    dropdown.classList.add('active');
    dropdownIndex = -1;
}

function hideSearchDropdown() {
    const dropdown = document.getElementById('search-dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
        dropdownIndex = -1;
    }
}

function updateDropdownSelection(items) {
    items.forEach((item, i) => {
        item.classList.toggle('active', i === dropdownIndex);
    });
}


// Back to Top
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    }, { passive: true });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// PC-only hints visibility
function initPCHints() {
    // Only show PC hints on devices with precise pointer (mouse)
    const isPCLike = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (isPCLike) {
        document.querySelectorAll('.pc-hint').forEach(el => {
            el.style.display = '';
        });
    }
}


// Magic Drag & Drop
function initDragAndDrop() {
    const overlay = document.getElementById('drop-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
        // Disable on mobile/touch devices to prevent stuck overlay
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

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
    initParticles('hero-particles');
    initBackToTop();
    initPCHints();
});
