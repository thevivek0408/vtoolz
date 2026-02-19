/**
 * Common Utilities & Globals
 * Included in every page.
 */

// Import SEO script automatically
import './seo.js';
import { Tilt } from './tilt.js';
import { CubeRotator } from './cube.js';
import { CommandPalette } from './command-palette.js';

// ... existing code ...
export const Utils = {
    // ... existing utils ...
    formatBytes: (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    // File validation
    validateFile: (file, allowedTypes, maxSizeMB = 50) => {
        if (allowedTypes && !allowedTypes.includes(file.type) && !allowedTypes.some(t => t.endsWith('/*') && file.type.startsWith(t.slice(0, -1)))) {
            throw new Error(`Invalid file type: ${file.type}`);
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`File too large (Max ${maxSizeMB}MB)`);
        }
        return true;
    },

    // Toast Notification
    showToast: (message, type = 'info', duration = 3000) => {
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
        }, duration);
    },

    // Drag and Drop Helper (legacy alias)
    setupDragAndDrop: (dropZone, input, callback) => {
        if (!dropZone || !input) return;
        // Delegate to initDragAndDrop with adapter
        Utils.initDragAndDrop(null, (files) => callback(files[0] || files), dropZone);
        // Also wire up the specific input
        input.addEventListener('change', (e) => {
            if (e.target.files.length) callback(e.target.files[0]);
            input.value = '';
        });
    },

    // Download Helper
    downloadBlob: (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Drag & Drop Init
    initDragAndDrop: (dropZoneSelector, onFiles) => {
        const dropZone = document.querySelector(dropZoneSelector);
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('highlight'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            onFiles(files);
        }, false);

        // Make draggable clickable too (with loop protection)
        dropZone.addEventListener('click', (e) => {
            const input = dropZone.querySelector('input[type="file"]');

            // 1. If no input found, do nothing
            // 2. If the click CAME from the input (bubbling), stop to prevent loop
            if (!input || e.target === input) return;

            input.click();
        });
    },

    // Theme Management
    initTheme: () => {
        // Toggle Button
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.title = "Toggle Dark Mode";
        toggle.ariaLabel = "Toggle Dark Mode";

        const updateToggleIcon = (theme) => {
            toggle.innerHTML = theme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        };

        const nav = document.querySelector('nav ul');
        if (nav) {
            const li = document.createElement('li');
            li.appendChild(toggle);
            nav.appendChild(li);
        }

        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);

            // Update Meta Theme Color for Mobile Browsers
            let metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) {
                metaTheme = document.createElement('meta');
                metaTheme.name = 'theme-color';
                document.head.appendChild(metaTheme);
            }
            metaTheme.content = theme === 'dark' ? '#0f172a' : '#f8f9fa';
            updateToggleIcon(theme);
        };

        // Default to Dark for 3D feel, or load saved
        const saved = localStorage.getItem('theme');
        if (saved) {
            applyTheme(saved);
        } else {
            applyTheme('dark');
        }

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });

        // Initialize 3D Tilt
        // Initialize 3D Tilt (Disabled per user request)
        /*
        const cards = document.querySelectorAll('.tool-card');
        cards.forEach(card => {
            try {
                new Tilt(card, { max: 10, speed: 400, glare: true });
            } catch (e) { console.warn('Tilt init failed', e); }
        });
        */

        // Initialize 3D Cube Rotation
        const cube = document.querySelector('.cube');
        if (cube) {
            try {
                new CubeRotator(cube);
            } catch (e) { console.warn('Cube init failed', e); }
        }

        // Mobile Menu Injection
        const headerContainer = document.querySelector('header .container');
        const navContainer = document.querySelector('nav');
        if (headerContainer && navContainer) {
            // Create Hamburger Button
            const btn = document.createElement('button');
            btn.className = 'mobile-menu-btn';
            btn.innerHTML = '<i class="fas fa-bars"></i>'; // FontAwesome fallback
            if (!document.querySelector('link[href*="font-awesome"]')) {
                btn.innerHTML = '☰'; // Unicode fallback
            }
            btn.ariaLabel = "Menu";

            // Insert before nav
            headerContainer.insertBefore(btn, navContainer);

            // Create Overlay
            const overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            document.body.appendChild(overlay);

            // Toggle Logic
            const toggleMenu = () => {
                const isActive = navContainer.classList.toggle('nav-active');
                overlay.classList.toggle('active');
                btn.innerHTML = isActive ? '✕' : '☰';

                // Lock Body Scroll
                document.body.style.overflow = isActive ? 'hidden' : '';
            };

            btn.addEventListener('click', toggleMenu);

            overlay.addEventListener('click', toggleMenu);

            // Close on link click
            navContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (navContainer.classList.contains('nav-active')) toggleMenu();
                });
            });
        }

        // 2. Card Spotlight Effect (rAF-throttled)
        const initSpotlight = () => {
            const toolsCards = document.querySelectorAll('.tool-card');
            let spotRaf = null;

            toolsCards.forEach(card => {
                card.classList.add('spotlight-card');
                card.addEventListener('mousemove', e => {
                    if (spotRaf) return;
                    spotRaf = requestAnimationFrame(() => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        card.style.setProperty('--mouse-x', `${x}px`);
                        card.style.setProperty('--mouse-y', `${y}px`);
                        spotRaf = null;
                    });
                }, { passive: true });
            });
        };
        initSpotlight();

        // 3. Scroll Animations (staggered reveal)
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Stagger tool cards with incremental delay
        const staggerCards = () => {
            const cards = document.querySelectorAll('.tool-card');
            cards.forEach((card, i) => {
                card.classList.add('fade-in-section');
                card.style.transitionDelay = `${Math.min(i * 50, 400)}ms`;
                observer.observe(card);
            });
        };

        document.querySelectorAll('.hero, h2, canvas').forEach(el => {
            el.classList.add('fade-in-section');
            observer.observe(el);
        });

        // Run stagger now and re-run when grid changes (filtering)
        staggerCards();
        const grid = document.getElementById('tools-grid');
        if (grid) {
            const mo = new MutationObserver(() => {
                requestAnimationFrame(staggerCards);
            });
            mo.observe(grid, { childList: true });
        }

        // 4. Neon Mode Secret (Triple Click Theme Toggle or dedicated button)
        // For now, let's auto-enable it if 'neon' is in localStorage, or add a secret trigger.
        // 4. Neon Mode Secret (Restored to Nav for visibility)
        const navUl = document.querySelector('nav ul');
        if (navUl) {
            // Check if button already exists to prevent duplicates
            let cyberBtn = document.getElementById('neon-toggle-btn');
            if (!cyberBtn) {
                const cyberLi = document.createElement('li');
                cyberBtn = document.createElement('button');
                cyberBtn.id = 'neon-toggle-btn';
                cyberBtn.textContent = '🔮';
                cyberBtn.title = 'Cyberpunk Mode';
                cyberBtn.ariaLabel = 'Toggle Cyberpunk Mode';
                // Minimal styling to fit nav
                cyberBtn.style.cssText = 'background:none; border:none; font-size:1.2rem; cursor:pointer; opacity:0.8; transition:transform 0.2s; padding: 5px; margin-left: 10px;';

                cyberBtn.addEventListener('mouseenter', () => cyberBtn.style.transform = 'scale(1.2)');
                cyberBtn.addEventListener('mouseleave', () => cyberBtn.style.transform = 'scale(1)');

                cyberBtn.addEventListener('click', () => {
                    document.body.classList.toggle('neon-mode');
                    const isNeon = document.body.classList.contains('neon-mode');
                    localStorage.setItem('neon-mode', isNeon);
                    if (isNeon) Utils.showToast('Cyberpunk Mode Activated! 🦾', 'success');
                });

                cyberLi.appendChild(cyberBtn);
                navUl.appendChild(cyberLi);
            }

            // Restore state
            if (localStorage.getItem('neon-mode') === 'true') {
                document.body.classList.add('neon-mode');
            }
        }

    },

    // --- Gamified Privacy Stats (Phase 18) ---
    trackStat: (key, value) => {
        const current = Number(sessionStorage.getItem(key) || 0);
        sessionStorage.setItem(key, current + value);

        // Trigger generic event for UI updates
        window.dispatchEvent(new CustomEvent('stat-updated'));
    },

    getStats: () => {
        return {
            saved: Number(sessionStorage.getItem('bytes_saved') || 0),
            files: Number(sessionStorage.getItem('files_processed') || 0)
        };
    },

    initStatsWidget: () => {
        const footer = document.querySelector('footer');
        if (!footer) return;

        // Create Widget if missing
        let widget = document.getElementById('stats-widget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'stats-widget';
            widget.style.cssText = 'margin-top: 15px; font-size: 0.9rem; color: var(--accent-color); font-weight: bold; opacity: 0; transition: opacity 0.5s;';
            footer.insertBefore(widget, footer.firstChild);
        }

        const updateUI = () => {
            const stats = Utils.getStats();
            if (stats.files > 0 || stats.saved > 0) {
                const savedStr = Utils.formatBytes(stats.saved);
                widget.innerHTML = `<i class="fas fa-shield-alt"></i> Session Privacy Stats: <span style="color:var(--text-color)">${stats.files} Files Processed</span> | <span style="color:var(--text-color)">${savedStr} Data Saved Locally</span>`;
                widget.style.opacity = '1';
            }
        };

        // Listen for updates
        window.addEventListener('stat-updated', updateUI);

        // Initial check
        updateUI();
    },

    // --- Recently Used Tools ---
    trackRecentTool: (toolId) => {
        try {
            const MAX_RECENT = 8;
            let recent = JSON.parse(localStorage.getItem('recentTools') || '[]');
            // Remove if already exists, then prepend
            recent = recent.filter(id => id !== toolId);
            recent.unshift(toolId);
            // Trim to max
            if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
            localStorage.setItem('recentTools', JSON.stringify(recent));
        } catch (e) { /* localStorage unavailable */ }
    },

    getRecentTools: () => {
        try {
            return JSON.parse(localStorage.getItem('recentTools') || '[]');
        } catch (e) { return []; }
    },

    // --- Error Boundary for Tool Pages ---
    initErrorBoundary: () => {
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                const src = event.target.src || event.target.href || 'unknown resource';
                console.error('Resource failed to load:', src);

                if (!document.getElementById('error-boundary-banner')) {
                    const banner = document.createElement('div');
                    banner.id = 'error-boundary-banner';
                    banner.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:99999; background:#e74c3c; color:white; padding:12px 20px; text-align:center; font-size:0.9rem; box-shadow:0 2px 10px rgba(0,0,0,0.3);';

                    const msg = document.createElement('strong');
                    msg.textContent = '⚠️ A required resource failed to load. This tool may not work correctly. ';
                    banner.appendChild(msg);

                    const reloadBtn = document.createElement('button');
                    reloadBtn.textContent = 'Reload Page';
                    reloadBtn.style.cssText = 'margin-left:10px; padding:4px 12px; border:1px solid white; background:transparent; color:white; border-radius:4px; cursor:pointer; font-weight:600;';
                    reloadBtn.addEventListener('click', () => location.reload());
                    banner.appendChild(reloadBtn);

                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕';
                    closeBtn.style.cssText = 'margin-left:5px; padding:4px 12px; border:none; background:transparent; color:white; cursor:pointer; font-size:1.1rem;';
                    closeBtn.addEventListener('click', () => banner.remove());
                    banner.appendChild(closeBtn);

                    document.body.prepend(banner);
                }
            }
        }, true);

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Silently prevent the default browser error for handled-class rejections
            if (event.reason && event.reason.name === 'AbortError') return;
            // Show non-intrusive toast for genuine unhandled errors
            if (typeof Utils.showToast === 'function') {
                Utils.showToast('Something went wrong. Try again or reload.', 'error', 5000);
            }
        });
    },

    // --- File Size Validator (reusable across tools) ---
    validateFileSize: (file, maxMB = 100) => {
        const maxBytes = maxMB * 1024 * 1024;
        if (file.size > maxBytes) {
            if (typeof Utils.showToast === 'function') {
                Utils.showToast(`File too large (${Utils.formatBytes(file.size)}). Max ${maxMB}MB.`, 'error', 5000);
            }
            return false;
        }
        return true;
    },

    // --- Validate File MIME Type ---
    validateFileType: (file, allowedTypes = []) => {
        if (allowedTypes.length === 0) return true;
        const valid = allowedTypes.some(t => {
            if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
            return file.type === t;
        });
        if (!valid && typeof Utils.showToast === 'function') {
            Utils.showToast('Unsupported file type. Please select a valid file.', 'error', 5000);
        }
        return valid;
    },

    // --- Inject Font Awesome if missing (for tool pages) ---
    ensureFontAwesome: () => {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(link);
        }
    },

    // --- Inject Skip Link if missing (for tool/game pages) ---
    ensureSkipLink: () => {
        if (!document.querySelector('.skip-link')) {
            const mainTarget = document.querySelector('main') || document.querySelector('.tool-container') || document.querySelector('.container');
            if (mainTarget && !mainTarget.id) mainTarget.id = 'main-content';
            const targetId = mainTarget?.id || 'main-content';

            const skipLink = document.createElement('a');
            skipLink.href = '#' + targetId;
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to content';
            document.body.prepend(skipLink);
        }
    },

    initBreadcrumb: () => {
        // Only on tool pages (not home)
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html' || path.endsWith('/tools/') || path.endsWith('/tools/index.html')) return;
        
        const segments = path.split('/').filter(s => s && s !== 'index.html');
        if (segments.length < 2) return;
        
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.setAttribute('aria-label', 'Breadcrumb');
        
        const items = [{ label: 'Home', href: '/' }];
        let href = '';
        segments.forEach((seg, i) => {
            href += '/' + seg;
            const label = seg.replace(/-/g, ' ').replace(/\.html$/, '');
            if (i === segments.length - 1) {
                items.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: null });
            } else {
                items.push({ label: label.charAt(0).toUpperCase() + label.slice(1), href: href + '/' });
            }
        });
        
        breadcrumb.innerHTML = items.map((item, i) => 
            item.href 
                ? `<a href="${item.href}">${item.label}</a>${i < items.length - 1 ? '<span class="separator">/</span>' : ''}`
                : `<span class="current">${item.label}</span>`
        ).join('');
        
        const main = document.querySelector('main') || document.querySelector('.tool-container');
        if (main) main.parentNode.insertBefore(breadcrumb, main);
    }
};

// Initialize Theme & SW & Stats & Error Boundary
window.addEventListener('DOMContentLoaded', () => {
    Utils.initTheme();
    Utils.initStatsWidget();
    Utils.initErrorBoundary();
    Utils.ensureFontAwesome();
    Utils.ensureSkipLink();
    Utils.initBreadcrumb();
    new CommandPalette();

    // Track recently used tool (if on a tool page)
    const path = window.location.pathname;
    if (path.includes('/tools/') && !path.endsWith('index.html')) {
        // Import tool registry to find matching tool
        import('./tools.js').then(({ tools }) => {
            const match = tools.find(t => path.includes(t.url.replace('tools/', '')));
            if (match) Utils.trackRecentTool(match.id);
        }).catch(() => {});
    }


    // Responsive PWA Registration
    if ('serviceWorker' in navigator) {
        // dynamic SW path strategy:
        // 1. Try to find the manifest link tag
        // 2. Resolve 'sw.js' relative to the manifest location
        // 3. Fallback to host root or current path checks

        let swPath = '/sw.js'; // Default for custom domains at root
        let swScope = '/';

        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            try {
                const manifestUrl = new URL(manifestLink.href);
                // sw.js should be in the same folder as manifest.json
                const swUrl = new URL('sw.js', manifestUrl);
                swPath = swUrl.pathname;
                swScope = new URL('./', manifestUrl).pathname;
            } catch (e) {
                console.warn('Manifest URL parse failed', e);
            }
        }

        // Fallback / Override check
        const path = window.location.pathname;
        if (path.includes('/vtoolz/')) {
            swPath = '/vtoolz/sw.js';
            swScope = '/vtoolz/';
        } else if (path.includes('/vibox/')) {
            swPath = '/vibox/sw.js';
            swScope = '/vibox/';
        }

        // Log for debugging
        // console.log('Attempting SW Register:', swPath, 'Scope:', swScope);

        navigator.serviceWorker.register(swPath, { scope: swScope })
            .then(reg => {
                // Detect SW updates and notify user
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (typeof Utils.showToast === 'function') {
                                Utils.showToast('Update available! Reload for the latest version.', 'info', 8000);
                            }
                        }
                    });
                });
                // Ask SW to lazy-cache vendor libs
                if (reg.active) reg.active.postMessage('CACHE_VENDORS');
            })
            .catch(err => {
                console.warn('SW Registration Failed:', err);
                // Last ditch effort for GitHub Pages if the above failed
                if (swPath === '/sw.js' && window.location.hostname.includes('github.io')) {
                    const repo = window.location.pathname.split('/')[1]; // likely 'vtoolz'
                    if (repo) navigator.serviceWorker.register(`/${repo}/sw.js`, { scope: `/${repo}/` });
                }
            });
    }
});

// Expose to window for inline scripts (set IMMEDIATELY, not deferred)
window.Utils = Utils;
