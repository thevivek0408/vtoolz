class DuelGame {
    constructor() {
        this.p1 = document.getElementById('p1Zone');
        this.p2 = document.getElementById('p2Zone');
        this.msg = document.getElementById('centerMsg');

        this.state = 'idle'; // idle, waiting, go, result
        this.timer = null;
        this.scores = { p1: 0, p2: 0 };

        this.init();
    }

    init() {
        // We use pointerdown to support both touch and mouse immediately
        this.p1.addEventListener('pointerdown', (e) => this.handleInput('p1'));
        this.p2.addEventListener('pointerdown', (e) => this.handleInput('p2'));

        // Start handler for idle state (click anywhere to start)
        document.body.addEventListener('click', (e) => {
            if (this.state === 'idle' || this.state === 'result') {
                // Ignore if clicking header
                if (e.target.closest('header')) return;
                this.startRound();
            }
        });
    }

    startRound() {
        if (this.state === 'waiting' || this.state === 'go') return;

        this.state = 'waiting';
        this.msg.textContent = "Wait...";
        this.msg.style.display = 'block';

        this.p1.className = 'player-zone waiting';
        this.p2.className = 'player-zone waiting';
        this.p1.querySelector('#p1Text').textContent = "Wait...";
        this.p2.querySelector('#p2Text').textContent = "Wait...";

        // Random delay 2-6 seconds
        const delay = 2000 + Math.random() * 4000;

        this.timer = setTimeout(() => {
            this.go();
        }, delay);
    }

    go() {
        if (this.state !== 'waiting') return;

        this.state = 'go';
        this.msg.textContent = "TAP!";
        this.msg.style.display = 'none'; // Clear visual obstruction

        this.p1.className = 'player-zone go';
        this.p2.className = 'player-zone go';
        this.p1.querySelector('#p1Text').textContent = "TAP!";
        this.p2.querySelector('#p2Text').textContent = "TAP!";
    }

    handleInput(player) {
        if (this.state === 'waiting') {
            // False Start!
            clearTimeout(this.timer);
            this.endRound(player === 'p1' ? 'p2' : 'p1', "False Start!");
        } else if (this.state === 'go') {
            // Win!
            this.endRound(player, "Winner!");
        }
    }

    endRound(winner, reason) {
        this.state = 'result';
        this.scores[winner]++;
        document.getElementById('p1Score').textContent = this.scores.p1;
        document.getElementById('p2Score').textContent = this.scores.p2;

        const loser = winner === 'p1' ? 'p2' : 'p1';

        const winZone = winner === 'p1' ? this.p1 : this.p2;
        const loseZone = winner === 'p1' ? this.p2 : this.p1;

        winZone.className = 'player-zone win';
        loseZone.className = 'player-zone lose';

        winZone.querySelector('span').textContent = reason;
        loseZone.querySelector('span').textContent = "Too Slow";

        this.msg.textContent = "Tap to Play Again";
        this.msg.style.display = 'block';
    }
}

window.onload = () => {
    window.game = new DuelGame();
};
