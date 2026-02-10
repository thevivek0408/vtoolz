/**
 * Common Utilities & Globals
 * Included in every page.
 */

// Import SEO script automatically
import './seo.js';
import { Tilt } from './tilt.js';
import { CubeRotator } from './cube.js';

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

    // Drag and Drop Helper
    setupDragAndDrop: (dropZone, input, callback) => {
        if (!dropZone || !input) return;

        // Smart click handler - works whether Input is INSIDE or OUTSIDE
        dropZone.addEventListener('click', (e) => {
            // Stop if we clicked the input itself (bubbling)
            if (e.target === input) return;

            input.click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                callback(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length) {
                callback(e.target.files[0]);
            }
            input.value = ''; // Reset
        });
    },

    // Download Helper

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
        toggle.innerHTML = '🌓';
        toggle.title = "Toggle Dark Mode";
        toggle.ariaLabel = "Toggle Dark Mode";

        const nav = document.querySelector('nav ul');
        if (nav) {
            const li = document.createElement('li');
            li.appendChild(toggle);
            nav.appendChild(li);
        }

        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
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
        const cards = document.querySelectorAll('.tool-card');
        cards.forEach(card => {
            try {
                new Tilt(card, { max: 10, speed: 400, glare: true });
            } catch (e) { console.warn('Tilt init failed', e); }
        });

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

        // 1. Ambient Lights Injection
        const injectLights = () => {
            if (!document.querySelector('.ambient-light')) {
                const light1 = document.createElement('div');
                light1.className = 'ambient-light one';
                const light2 = document.createElement('div');
                light2.className = 'ambient-light two';
                document.body.appendChild(light1);
                document.body.appendChild(light2);
            }
        };
        injectLights();

        // 2. Card Spotlight Effect
        const initSpotlight = () => {
            const toolsCards = document.querySelectorAll('.tool-card');

            toolsCards.forEach(card => {
                card.classList.add('spotlight-card');
                card.addEventListener('mousemove', e => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);
                });
            });
        };
        initSpotlight();

        // 3. Scroll Animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        document.querySelectorAll('.tool-card, .hero, h2, canvas').forEach(el => {
            el.classList.add('fade-in-section');
            observer.observe(el);
        });

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

    }
};

// Initialize Theme & SW
window.addEventListener('DOMContentLoaded', () => {
    window.Utils.initTheme();

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
        } else {
            // Fallback if no manifest link (e.g. sub-pages missing tag)
            // If we are at /vtoolz/tools/pdf/index.html, we want /vtoolz/sw.js
            // We can guess based on script location? 
            // Better: just check consistent locations.
            if (window.location.pathname.includes('/vtoolz/')) {
                swPath = '/vtoolz/sw.js';
                swScope = '/vtoolz/';
            }
        }

        // Log for debugging
        console.log('Attempting SW Register:', swPath, 'Scope:', swScope);

        navigator.serviceWorker.register(swPath, { scope: swScope })
            .then(reg => console.log('✅ SW Registered:', reg.scope))
            .catch(err => {
                console.log('❌ SW Registration Failed:', err);
                // Last ditch effort for GitHub Pages if the above failed
                if (swPath === '/sw.js' && window.location.hostname.includes('github.io')) {
                    const repo = window.location.pathname.split('/')[1]; // likely 'vtoolz'
                    if (repo) navigator.serviceWorker.register(`/${repo}/sw.js`, { scope: `/${repo}/` });
                }
            });
    }
});

// Expose to window for inline scripts
window.Utils = Utils;
