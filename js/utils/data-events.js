(() => {
    const run = (code, element, event) => {
        if (!code) return;
        try {
            new Function('event', code).call(element, event);
        } catch (error) {
            console.error('Event handler error:', error);
        }
    };

    document.addEventListener('click', (event) => {
        const element = event.target.closest('[data-onclick]');
        if (!element) return;
        run(element.getAttribute('data-onclick'), element, event);
    });

    document.addEventListener('change', (event) => {
        const element = event.target.closest('[data-onchange]');
        if (!element) return;
        run(element.getAttribute('data-onchange'), element, event);
    });
})();
