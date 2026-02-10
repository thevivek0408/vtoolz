class MemoryGame {
    constructor() {
        this.board = document.getElementById('gameBoard');
        this.movesEl = document.getElementById('moves');
        this.timeEl = document.getElementById('time');
        this.bestEl = document.getElementById('best');

        this.emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼']; // 8 pairs
        this.cards = [];
        this.flippedCards = [];
        this.matchedCount = 0;
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.isLocked = false;

        this.init();
    }

    init() {
        // Load best score
        const best = localStorage.getItem('vtoolz_memory_best');
        if (best) this.bestEl.textContent = best;

        this.restart();
    }

    restart() {
        this.resetStats();
        this.generateCards();
        this.startTimer();
    }

    resetStats() {
        this.moves = 0;
        this.seconds = 0;
        this.matchedCount = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.movesEl.textContent = '0';
        this.timeEl.textContent = '00:00';
        clearInterval(this.timer);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
            const s = (this.seconds % 60).toString().padStart(2, '0');
            this.timeEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    generateCards() {
        const deck = [...this.emojis, ...this.emojis];
        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this.board.innerHTML = '';
        deck.forEach(emoji => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.emoji = emoji;

            card.innerHTML = `
                <div class="card-face card-front">?</div>
                <div class="card-face card-back">${emoji}</div>
            `;

            card.addEventListener('click', () => this.flipCard(card));
            this.board.appendChild(card);
        });
    }

    flipCard(card) {
        if (this.isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesEl.textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.isLocked = true;
        const [c1, c2] = this.flippedCards;
        const match = c1.dataset.emoji === c2.dataset.emoji;

        if (match) {
            this.handleMatch(c1, c2);
        } else {
            this.handleMismatch(c1, c2);
        }
    }

    handleMatch(c1, c2) {
        setTimeout(() => {
            c1.classList.add('matched');
            c2.classList.add('matched');
            this.flippedCards = [];
            this.isLocked = false;
            this.matchedCount++;

            if (this.matchedCount === this.emojis.length) {
                this.gameOver();
            }
        }, 500);
    }

    handleMismatch(c1, c2) {
        setTimeout(() => {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    }

    gameOver() {
        clearInterval(this.timer);

        let best = localStorage.getItem('vtoolz_memory_best');
        if (!best || this.moves < parseInt(best)) {
            localStorage.setItem('vtoolz_memory_best', this.moves);
            this.bestEl.textContent = this.moves;
        }

        // Simple alert for now, could be a modal
        setTimeout(() => alert(`You won in ${this.moves} moves!`), 500);
    }
}

window.onload = () => {
    window.game = new MemoryGame();
};
