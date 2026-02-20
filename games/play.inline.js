const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get('id'));

fetch('data/games-config.json')
    .then(res => res.json())
    .then(games => {
        const game = games.find(g => g.id === id);
        if (game) {
            document.title = game.name;
            const gameContainerDiv = document.createElement('div');
            gameContainerDiv.className = 'game-container';
            const iframe = document.createElement('iframe');
            iframe.id = 'gameFrame';
            iframe.src = game.url;
            iframe.allowFullscreen = true;
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
            iframe.setAttribute('loading', 'lazy');
            gameContainerDiv.appendChild(iframe);

            // Timeout fallback — if game doesn't signal readiness in 15s, hide spinner anyway
            const loadTimeout = setTimeout(() => {
                const loadEl = document.getElementById('loading');
                if (loadEl) loadEl.style.display = 'none';
            }, 15000);

            iframe.onload = () => {
                clearTimeout(loadTimeout);
                const loadEl = document.getElementById('loading');
                if (loadEl) loadEl.style.display = 'none';
                // Check if iframe loaded an error page (same-origin only)
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (doc && doc.title && doc.title.toLowerCase().includes('404')) {
                        showError('Game failed to load. It may have been removed.');
                    }
                } catch (e) { /* cross-origin — ignore */ }
            };

            iframe.onerror = () => {
                clearTimeout(loadTimeout);
                showError('Game failed to load. Please try again later.');
            };

            document.getElementById('game-container').appendChild(gameContainerDiv);
        } else {
            showError('Game not found.');
        }
    })
    .catch(e => {
        console.error(e);
        showError('Error loading configuration.');
    });

function showError(msg) {
    const loadEl = document.getElementById('loading');
    if (loadEl) loadEl.innerHTML = '<p style="color:#ef4444;padding:40px;font-size:1.1rem;">' + msg + '</p>';
}
