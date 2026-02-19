
document.addEventListener('DOMContentLoaded', () => {
    // Instant fade-in (no delay)
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.2s ease-out';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        });
    });

    // Intercept links for smooth page transitions
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Skip external links, anchors, new tabs, downloads
        if (link.hostname !== window.location.hostname ||
            link.getAttribute('target') === '_blank' ||
            (link.getAttribute('href') || '').startsWith('#') ||
            link.hasAttribute('download') ||
            e.ctrlKey || e.metaKey || e.shiftKey) return;

        const href = link.getAttribute('href');
        if (!href) return;

        e.preventDefault();

        // Use View Transitions API if available (Chrome 111+)
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                window.location.href = href;
            });
        } else {
            // Fast fallback — 150ms exit animation
            document.body.style.opacity = '0';
            setTimeout(() => { window.location.href = href; }, 150);
        }
    });
});
