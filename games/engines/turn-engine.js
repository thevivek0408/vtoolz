export default class TurnEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Board State
        this.rows = 6;
        this.cols = 7;
        this.grid = []; // 0=empty, 1=P1, 2=P2
        this.turn = 1; // Player 1 starts
        this.winner = 0;

        // Visuals
        this.cellSize = 0;
        this.boardColor = '#2980b9';
        this.p1Color = '#e74c3c'; // Red
        this.p2Color = '#f1c40f'; // Yellow
        this.offsetX = 0;
        this.offsetY = 0;

        // Resize
        window.addEventListener('resize', () => this.resize());

        // Input
        this.setupInput();
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }

        // Calc Grid layout
        const size = Math.min(this.canvas.width / this.cols, (this.canvas.height - 100) / this.rows);
        this.cellSize = Math.floor(size * 0.9);
        this.offsetX = (this.canvas.width - this.cellSize * this.cols) / 2;
        this.offsetY = 50;

        this.draw();
        this.drawStatus();
    }

    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            if (this.winner !== 0) {
                this.resetGame();
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            // No Y check needed for Connect 4, just column

            if (x >= 0 && x < this.cols * this.cellSize) {
                const col = Math.floor(x / this.cellSize);
                this.dropPiece(col);
            }
        });
    }

    start() {
        this.running = true;
        this.resetGame();
        this.resize();
    }

    resetGame() {
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.turn = 1;
        this.winner = 0;
        this.draw();
        this.drawStatus();
    }

    dropPiece(col) {
        // Find lowest empty row in col
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.grid[r][col] === 0) {
                this.grid[r][col] = this.turn;
                // Animate drop? For now just place
                if (this.checkWin(r, col)) {
                    this.winner = this.turn;
                    setTimeout(() => alert(`Player ${this.turn} Wins! Click to restart.`), 100);
                } else if (this.checkDraw()) {
                    this.winner = -1; // Draw
                    setTimeout(() => alert("Draw! Click to restart."), 100);
                } else {
                    this.turn = this.turn === 1 ? 2 : 1;
                }

                this.draw();
                this.drawStatus();
                return;
            }
        }
    }

    checkDraw() {
        return this.grid[0].every(cell => cell !== 0);
    }

    checkWin(r, c) {
        const player = this.grid[r][c];

        // Horizontal
        let count = 0;
        for (let i = 0; i < this.cols; i++) {
            if (this.grid[r][i] === player) count++;
            else count = 0;
            if (count >= 4) return true;
        }

        // Vertical
        count = 0;
        for (let i = 0; i < this.rows; i++) {
            if (this.grid[i][c] === player) count++;
            else count = 0;
            if (count >= 4) return true;
        }

        // Diagonal /
        // Need to check entire diagonals or just around the piece?
        // Simple scan all diagonals
        for (let i = 0; i < this.rows - 3; i++) {
            for (let j = 0; j < this.cols - 3; j++) {
                if (this.grid[i][j] === player && this.grid[i + 1][j + 1] === player && this.grid[i + 2][j + 2] === player && this.grid[i + 3][j + 3] === player) return true;
            }
        }
        for (let i = 3; i < this.rows; i++) {
            for (let j = 0; j < this.cols - 3; j++) {
                if (this.grid[i][j] === player && this.grid[i - 1][j + 1] === player && this.grid[i - 2][j + 2] === player && this.grid[i - 3][j + 3] === player) return true;
            }
        }

        return false;
    }

    draw() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Board Background
        this.ctx.fillStyle = this.boardColor;
        this.ctx.fillRect(this.offsetX - 10, this.offsetY, this.cols * this.cellSize + 20, this.rows * this.cellSize + 10);

        // Draw Holes/Pieces
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = this.offsetX + c * this.cellSize + this.cellSize / 2;
                const y = this.offsetY + r * this.cellSize + this.cellSize / 2;
                const radius = this.cellSize * 0.4;

                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);

                const val = this.grid[r][c];
                if (val === 0) this.ctx.fillStyle = '#ecf0f1'; // Background color (hole)
                else if (val === 1) this.ctx.fillStyle = this.p1Color;
                else if (val === 2) this.ctx.fillStyle = this.p2Color;

                this.ctx.fill();
                this.ctx.strokeStyle = '#2471a3';
                this.ctx.stroke();
            }
        }
    }

    drawStatus() {
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#2c3e50';

        let text = `Player ${this.turn}'s Turn (${this.turn === 1 ? 'Red' : 'Yellow'})`;
        if (this.winner !== 0) {
            text = this.winner === -1 ? "Game Draw!" : `Player ${this.winner} Wins!`;
            this.ctx.fillStyle = this.winner === 1 ? this.p1Color : (this.winner === 2 ? this.p2Color : '#333');
        }

        this.ctx.fillText(text, this.canvas.width / 2, 30);
    }

    // Stub
    bindMobileControls() { }
}
