const scores = JSON.parse(localStorage.getItem('fruitNinjaHighScores')) || [];
const highScoresList = document.getElementById('highScoresList');

if (scores.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="2" style="text-align:center;">No high scores yet! Play a game first.</td>';
    row.style.backgroundColor = '#d1ff19ae';
    highScoresList.appendChild(row);
} else {
    scores.forEach((score) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${score.name}</td><td>${score.score}</td>`;
        row.style.backgroundColor = '#d1ff19ae';
        highScoresList.appendChild(row);
    });
}
