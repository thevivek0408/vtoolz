document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('gamesGrid');
    const gameSearch = document.getElementById('gameSearch');
    const categoryTabs = document.getElementById('categoryTabs');
    const pills = document.querySelectorAll('.category-pill');
    let allGames = [];
    let currentFilter = 'all';

    // Load Games
    try {
        const res = await fetch('data/games-config.json');
        allGames = await res.json();
        renderGames(allGames);
    } catch (e) {
        grid.innerHTML = '<div class="loading-state" style="color:var(--danger-color, #FF6B6B)">Could not load library. Please try again.</div>';
    }

    // Featured Render Removed

    // Grid Render
    function renderGames(games) {
        grid.innerHTML = '';
        document.getElementById('gameCount').innerText = `${games.length} Games`;

        if (games.length === 0) {
            grid.innerHTML = '<div class="loading-state">No games found.</div>';
            return;
        }

        games.forEach(game => {
            // Skip if it is the featured one? Optional. Let's show all.
            const card = document.createElement('a');
            card.className = 'game-card';
            card.href = `play.html?id=${game.id}`;

            let icon = '🎮';
            if (game.category === 'arcade') icon = '🕹️';
            if (game.category === 'puzzle') icon = '🧩';

            // Specific icons
            if (game.name.toLowerCase().includes('subway')) icon = '🏄';
            if (game.name.toLowerCase().includes('chess')) icon = '♟️';

            if (game.image) {
                // Use image if available
                card.innerHTML = `
                    <div class="game-thumb" style="background-image: url('${game.image}'); background-size: cover; background-position: center;"></div>
                    <div class="game-details">
                        <div class="game-name">${game.name}</div>
                        <div class="game-cat"><i class="fas fa-tag" style="font-size:0.7em"></i> ${game.category}</div>
                    </div>
                `;
            } else {
                // Fallback to Icon
                card.innerHTML = `
                    <div class="game-thumb" loading="lazy">${icon}</div>
                    <div class="game-details">
                        <div class="game-name">${game.name}</div>
                        <div class="game-cat"><i class="fas fa-tag" style="font-size:0.7em"></i> ${game.category}</div>
                    </div>
                `;
            }
            grid.appendChild(card);
        });
    }

    // Filtering
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.cat;
            filterLogic();
        });
    });

    gameSearch.addEventListener('input', filterLogic);

    function filterLogic() {
        const term = gameSearch.value.toLowerCase();
        const filtered = allGames.filter(g => {
            const matchesTerm = g.name.toLowerCase().includes(term);
            const matchesCat = currentFilter === 'all' || g.category.toLowerCase() === currentFilter;
            return matchesTerm && matchesCat;
        });
        renderGames(filtered);
    }
});
