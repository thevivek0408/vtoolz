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
            iframe.onload = () => document.getElementById('loading').style.display = 'none';
            document.getElementById('game-container').appendChild(gameContainerDiv);
        } else {
            document.getElementById('loading').innerHTML = '<p>Game not found.</p>';
        }
    })
    .catch(e => {
        console.error(e);
        document.getElementById('loading').innerHTML = '<p>Error loading configuration.</p>';
    });