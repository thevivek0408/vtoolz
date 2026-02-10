class ConnectFour {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = []; // 6x7 array
        this.currentPlayer = 'red'; // red or yellow
        this.isActive = true;

        this.boardEl = document.getElementById('gameBoard');
        this.statusEl = document.getElementById('statusBar');
        this.turnTextEl = document.getElementById('turnText');

        this.init();
    }

    init() {
        this.renderBoard();
        this.restart();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                // Click on any cell in column C drops in that col
                cell.onclick = () => this.dropToken(c);
                rowDiv.appendChild(cell);
            }
            this.boardEl.appendChild(rowDiv);
        }
    }

    restart() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.currentPlayer = 'red';
        this.isActive = true;
        this.updateUI();

        // Clear visuals
        const cells = document.querySelectorAll('.cell');
        cells.forEach(c => c.className = 'cell');
    }

    dropToken(colIndex) {
        if (!this.isActive) return;

        // Find lowest empty row in this col
        for (let r = this.rows - 1; r >= 0; r--) {
            if (!this.board[r][colIndex]) {
                this.board[r][colIndex] = this.currentPlayer;
                this.animateDrop(r, colIndex);

                if (this.checkWin(r, colIndex)) {
                    this.isActive = false;
                    this.turnTextEl.textContent = `${this.currentPlayer.toUpperCase()} WINS! 🎉`;
                    return;
                }

                if (this.checkDraw()) {
                    this.isActive = false;
                    this.turnTextEl.textContent = "It's a Draw! 🤝";
                    return;
                }

                this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
                this.updateUI();
                return;
            }
        }
    }

    animateDrop(r, c) {
        const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        cell.classList.add(this.currentPlayer);
        // Visual drop animation handled by CSS is tricky without standard DOM elements moving, 
        // essentially we just color it.
    }

    updateUI() {
        this.statusEl.className = `status-bar turn-${this.currentPlayer}`;
        this.turnTextEl.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
    }

    checkWin(r, c) {
        const player = this.board[r][c];

        // Directions: [dr, dc]
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diag Down-Right
            [1, -1]  // Diag Down-Left
        ];

        for (let [dr, dc] of directions) {
            let count = 1;

            // Check forward
            for (let i = 1; i < 4; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) break;
                if (this.board[nr][nc] === player) count++;
                else break;
            }

            // Check backward
            for (let i = 1; i < 4; i++) {
                const nr = r - dr * i;
                const nc = c - dc * i;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) break;
                if (this.board[nr][nc] === player) count++;
                else break;
            }

            if (count >= 4) return true;
        }
        return false;
    }

    checkDraw() {
        return this.board[0].every(val => val !== null);
    }
}

window.onload = () => {
    window.game = new ConnectFour();
};
