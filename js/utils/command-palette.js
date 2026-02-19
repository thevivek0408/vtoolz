import { tools } from './tools.js';

export class CommandPalette {
    constructor() {
        this.isOpen = false;
        this.activeIndex = 0;
        this.results = [];
        this.query = '';
        this.overlay = null;
        this.init();
    }

    init() {
        if (document.getElementById('command-palette')) return;
        this.render();
        this.bindEvents();

        // Check for persisted Zen Mode
        if (localStorage.getItem('zen-mode') === 'true') {
            document.body.classList.add('zen-mode');
        }
    }

    render() {
        const overlay = document.createElement('div');
        overlay.id = 'command-palette-overlay';
        overlay.className = 'palette-overlay';
        overlay.innerHTML = `
            <div class="palette-container fade-in-up">
                <div class="palette-header">
                    <i class="fas fa-search"></i>
                    <input type="text" id="palette-input" placeholder="Type a command or search..." autocomplete="off">
                </div>
                <div class="palette-results" id="palette-results"></div>
                <div class="palette-footer">
                    <span><kbd>↑↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                    <span><kbd>Esc</kbd> to close</span>
                    <span><kbd>Ctrl/Cmd+Shift+K</kbd> to open</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    bindEvents() {
        // Toggle Global Shortcut (Ctrl/Cmd+Shift+K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        const input = document.getElementById('palette-input');

        // Input Search
        input.addEventListener('input', (e) => {
            this.query = e.target.value;
            this.activeIndex = 0;
            this.search();
        });

        // Navigation
        input.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
                this.renderResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.activeIndex = Math.max(this.activeIndex - 1, 0);
                this.renderResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.execute(this.results[this.activeIndex]);
            }
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        this.isOpen = true;
        this.overlay.classList.add('active');
        const input = document.getElementById('palette-input');
        input.value = '';
        input.focus();
        this.activeIndex = 0;
        this.search(); // Show default "Recent" or "System" cmds
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('active');
    }

    search() {
        const q = this.query.toLowerCase().trim();
        let cmds = [];

        // 1. System Commands
        const systemCmds = [
            { id: 'cmd-home', name: 'Go Home', icon: 'fas fa-home', action: () => this.navigate('index.html'), desc: 'Navigate to Home' },
            { id: 'cmd-theme', name: 'Toggle Theme', icon: 'fas fa-adjust', action: () => this.toggleTheme(), desc: 'Switch Light/Dark mode' },
            { id: 'cmd-zen', name: 'Toggle Zen Mode', icon: 'fas fa-compress-alt', action: () => this.toggleZen(), desc: 'Focus Mode (Hide UI)' }
        ];

        // 2. Filter Tools
        const toolResults = tools.filter(t => {
            return t.name.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                (t.keywords && t.keywords.toLowerCase().includes(q));
        }).map(t => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            desc: t.description,
            action: () => this.navigate(t.url),
            isTool: true
        }));

        if (!q) {
            // Default view: System Cmds + Recent (TODO)
            cmds = [...systemCmds, ...toolResults.slice(0, 5)];
        } else {
            // Filter System Cmds
            const matchedSystem = systemCmds.filter(c => c.name.toLowerCase().includes(q));
            cmds = [...matchedSystem, ...toolResults];
        }

        this.results = cmds;
        this.renderResults();
    }

    renderResults() {
        const container = document.getElementById('palette-results');
        container.innerHTML = '';

        if (this.results.length === 0) {
            container.innerHTML = '<div class="palette-empty">No results found</div>';
            return;
        }

        this.results.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `palette-item ${index === this.activeIndex ? 'active' : ''}`;
            el.innerHTML = `
                <div class="palette-icon"><i class="${item.icon}"></i></div>
                <div class="palette-info">
                    <div class="palette-name">${item.name}</div>
                    <div class="palette-desc">${item.desc}</div>
                </div>
                ${item.isTool ? '<div class="palette-tag">Tool</div>' : ''}
            `;
            el.addEventListener('click', () => this.execute(item));
            // Hover
            el.addEventListener('mouseenter', () => {
                this.activeIndex = index;
                this.renderResults(); // Re-render to update active class (inefficient but safe)
            });
            container.appendChild(el);

            // Scroll into view if active
            if (index === this.activeIndex) {
                el.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    execute(item) {
        if (!item) return;
        this.close();
        if (item.action) item.action();
    }

    // Actions
    navigate(url) {
        // Resolve URL based on current depth
        // If we are in 'tools/category/tool.html', we are 2 deep.
        // If we are in 'index.html', we are 0 deep.

        let target = url;

        // Simple logic: check if 'index.html' is in the current folder (Root)
        // or check the logo href.
        const logo = document.querySelector('.logo');
        if (logo) {
            const logoHref = logo.getAttribute('href');
            if (logoHref.startsWith('../../')) {
                // We are deep, prefix with ../../ if the tool url is relative to root
                // Tool URLs in tools.js are like 'tools/pdf/merge.html'
                // If url is 'index.html', we want '../../index.html'
                target = '../../' + url;
            }
        }

        window.location.href = target;
    }

    toggleTheme() {
        // Reuse common.js util if available, or click the button
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.click();
    }

    toggleZen() {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        localStorage.setItem('zen-mode', isZen);
        // Optional: Show toast
        if (window.Utils && window.Utils.showToast) {
            window.Utils.showToast(`Zen Mode ${isZen ? 'ON' : 'OFF'}`);
        }
    }
}
