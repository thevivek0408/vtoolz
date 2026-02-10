class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.isActive = true;

        this.cells = document.querySelectorAll('.cell');
        this.statusArea = document.getElementById('statusArea');
        this.turnIndicator = document.getElementById('turnIndicator');

        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });

        this.restart();
    }

    restart() {
        this.board.fill(null);
        this.currentPlayer = 'X';
        this.isActive = true;
        this.statusArea.className = 'status-area turn-x';
        this.turnIndicator.textContent = "Player X's Turn";

        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
    }

    handleCellClick(cell) {
        const index = parseInt(cell.getAttribute('data-index'));

        if (this.board[index] || !this.isActive) return;

        this.board[index] = this.currentPlayer;
        cell.textContent = this.currentPlayer;
        cell.classList.add('taken', this.currentPlayer.toLowerCase());

        if (this.checkWin()) {
            this.isActive = false;
            this.turnIndicator.textContent = `Player ${this.currentPlayer} Wins! 🎉`;
            return;
        }

        if (this.checkDraw()) {
            this.isActive = false;
            this.turnIndicator.textContent = "It's a Draw! 🤝";
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.turnIndicator.textContent = `Player ${this.currentPlayer}'s Turn`;
        this.statusArea.className = `status-area turn-${this.currentPlayer.toLowerCase()}`;
    }

    checkWin() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        for (const condition of winConditions) {
            const [a, b, c] = condition;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                // Highlight winner
                this.cells[a].classList.add('winner-line');
                this.cells[b].classList.add('winner-line');
                this.cells[c].classList.add('winner-line');
                return true;
            }
        }
        return false;
    }

    checkDraw() {
        return !this.board.includes(null);
    }
}

window.onload = () => {
    window.game = new TicTacToe();
};
