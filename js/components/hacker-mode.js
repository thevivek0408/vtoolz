export class HackerMode {
    constructor(tools) {
        this.tools = tools;
        this.isOpen = false;
        this.selectedIndex = 0;
        this.results = [];
        this.overlay = null;
        this.input = null;
        this.resultsList = null;

        this.init();
    }

    init() {
        this.createDOM();
        this.attachEvents();
    }

    createDOM() {
        const overlay = document.createElement('div');
        overlay.className = 'hacker-overlay';
        overlay.innerHTML = `
            <div class="hacker-cmd">
                <div class="hacker-header">
                    <span class="prompt">></span>
                    <input type="text" class="hacker-input" placeholder="Run command..." autocomplete="off">
                </div>
                <div class="hacker-results"></div>
                <div class="hacker-footer">
                    <span><span class="key">↑↓</span> Navigate</span>
                    <span><span class="key">↵</span> Select</span>
                    <span><span class="key">Esc</span> Close</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.input = overlay.querySelector('.hacker-input');
        this.resultsList = overlay.querySelector('.hacker-results');
    }

    attachEvents() {
        // Toggle
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !this.isOpen && document.activeElement.tagName !== 'INPUT')) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Click outside
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Input
        this.input.addEventListener('input', (e) => this.search(e.target.value));

        // Navigation
        this.input.addEventListener('keydown', (e) => this.handleNav(e));
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.overlay.classList.add('active');
        this.input.value = '';
        this.input.focus();
        this.search('');
    }

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('active');
    }

    search(query) {
        // Reuse fuzzy logic or simplified version
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            this.results = this.tools.slice(0, 5); // Show top 5 default
        } else {
            this.results = this.tools.filter(t =>
                t.name.toLowerCase().includes(lowerQuery) ||
                t.keywords.toLowerCase().includes(lowerQuery)
            ).slice(0, 10);
        }

        this.selectedIndex = 0;
        this.renderResults();
    }

    renderResults() {
        this.resultsList.innerHTML = this.results.map((tool, index) => `
            <div class="hacker-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
                <i class="${tool.icon}"></i>
                <div class="hacker-info">
                    <span class="name">${tool.name}</span>
                    <span class="desc">${tool.description}</span>
                </div>
                <span class="action">Run</span>
            </div>
        `).join('');

        // Click events
        this.resultsList.querySelectorAll('.hacker-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectTool(this.results[item.dataset.index]);
            });
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = parseInt(item.dataset.index);
                this.renderResults(); // Re-render to update selected style
            });
        });
    }

    handleNav(e) {
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
            this.renderResults();
        } else if (e.key === 'ArrowUp') {
            this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
            this.renderResults();
        } else if (e.key === 'Enter') {
            if (this.results[this.selectedIndex]) {
                this.selectTool(this.results[this.selectedIndex]);
            }
        }
    }

    selectTool(tool) {
        window.location.href = tool.url;
        this.close();
    }
}
