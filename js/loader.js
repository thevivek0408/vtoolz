
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fade In on Load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease-out';

    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });

    // 2. Intercept Links for Fade Out
    const links = document.querySelectorAll('a');

    links.forEach(link => {
        // Skip external links, anchors, or new tabs
        if (link.hostname !== window.location.hostname ||
            link.getAttribute('target') === '_blank' ||
            link.getAttribute('href').startsWith('#')) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');

            document.body.style.opacity = '0';

            setTimeout(() => {
                window.location.href = href;
            }, 400); // Wait for transition
        });
    });
});
