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
    }
};

// Initialize Theme & SW
window.addEventListener('DOMContentLoaded', () => {
    window.Utils.initTheme();

    // Responsive PWA Registration
    if ('serviceWorker' in navigator) {
        // Determine base path based on location
        // If hosted at /vtoolz/, use /vtoolz/sw.js
        // If hosted at root, use /sw.js
        const isGitHubPages = window.location.pathname.startsWith('/vtoolz/');
        const swPath = isGitHubPages ? '/vtoolz/sw.js' : './sw.js';
        const swScope = isGitHubPages ? '/vtoolz/' : './';

        navigator.serviceWorker.register(swPath, { scope: swScope })
            .then(reg => console.log('✅ SW Registered:', reg.scope))
            .catch(err => console.log('❌ SW Registration Failure:', err));
    }
});

// Expose to window for inline scripts
window.Utils = Utils;
