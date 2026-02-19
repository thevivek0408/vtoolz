import '../../js/utils/common.js';

document.getElementById('generateBtn').addEventListener('click', () => {
    const text = document.getElementById('namesInput').value;
    const names = text.split('\n').map(n => n.trim()).filter(n => n.length > 0);

    if (names.length < 2) {
        alert("Please enter at least 2 names.");
        return;
    }

    // Fisher-Yates Shuffle
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }

    const type = document.getElementById('splitType').value;
    const val = parseInt(document.getElementById('splitValue').value);
    const teams = [];

    if (type === 'count') {
        const teamCount = val;
        for (let i = 0; i < teamCount; i++) teams.push([]);
        names.forEach((name, i) => {
            teams[i % teamCount].push(name);
        });
    } else {
        const size = val;
        for (let i = 0; i < names.length; i += size) {
            teams.push(names.slice(i, i + size));
        }
    }

    renderTeams(teams);
});

function renderTeams(teams) {
    const container = document.getElementById('results');
    container.innerHTML = '';

    teams.forEach((team, i) => {
        if (team.length === 0) return;
        const div = document.createElement('div');
        div.className = 'team-card';
        div.innerHTML = `
            <h3>Team ${i + 1}</h3>
            <ul>
                ${team.map(n => `<li>${n}</li>`).join('')}
            </ul>
        `;
        container.appendChild(div);
    });
}