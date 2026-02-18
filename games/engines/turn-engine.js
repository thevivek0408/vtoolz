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
        this.resize(); // Sets up defaults

        // Logic Dispatch
        if (this.config.name.includes('Tic')) {
            this.gameType = 'tictactoe';
            this.rows = 3;
            this.cols = 3;
            // Tic Tac Toe colors/setup
            this.boardColor = '#fff';
            this.resize(); // Re-calc cell size for 3x3
        } else {
            this.gameType = 'connect4';
            // Default Connect 4
            this.rows = 6;
            this.cols = 7;
        }

        this.resetGame();
    }

    resetGame() {
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.turn = 1;
        this.winner = 0;
        this.draw();
        this.drawStatus();
    }

    // Unified Input Handler
    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            if (this.winner !== 0) {
                this.resetGame();
                return;
            }

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top - this.offsetY;

            if (this.gameType === 'connect4') {
                if (x >= 0 && x < this.cols * this.cellSize) {
                    const col = Math.floor(x / this.cellSize);
                    this.dropPiece(col);
                }
            } else if (this.gameType === 'tictactoe') {
                const c = Math.floor(x / this.cellSize);
                const r = Math.floor(y / this.cellSize);
                if (r >= 0 && r < 3 && c >= 0 && c < 3) {
                    this.placeTicTacToe(r, c);
                }
            }
        });
    }

    // --- Connect 4 Logic ---
    dropPiece(col) {
        // Find lowest empty row in col
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.grid[r][col] === 0) {
                this.grid[r][col] = this.turn;
                if (this.checkWin(r, col)) {
                    this.winner = this.turn;
                    setTimeout(() => alert(`Player ${this.turn} Wins! Click to restart.`), 100);
                } else if (this.checkDraw()) {
                    this.winner = -1;
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

    // --- Tic Tac Toe Logic ---
    placeTicTacToe(r, c) {
        if (this.grid[r][c] !== 0) return;

        this.grid[r][c] = this.turn;

        if (this.checkWinTicTacToe()) {
            this.winner = this.turn;
            setTimeout(() => alert(`Player ${this.turn} Wins! Click to restart.`), 100);
        } else if (this.checkDraw()) {
            this.winner = -1;
            setTimeout(() => alert("Draw! Click to restart."), 100);
        } else {
            this.turn = this.turn === 1 ? 2 : 1;
        }
        this.draw();
        this.drawStatus();
    }

    checkWinTicTacToe() {
        const g = this.grid;
        // Rows
        for (let i = 0; i < 3; i++) if (g[i][0] !== 0 && g[i][0] === g[i][1] && g[i][1] === g[i][2]) return true;
        // Cols
        for (let i = 0; i < 3; i++) if (g[0][i] !== 0 && g[0][i] === g[1][i] && g[1][i] === g[2][i]) return true;
        // Diagonals
        if (g[0][0] !== 0 && g[0][0] === g[1][1] && g[1][1] === g[2][2]) return true;
        if (g[0][2] !== 0 && g[0][2] === g[1][1] && g[1][1] === g[2][0]) return true;

        return false;
    }

    checkDraw() {
        return this.grid.every(row => row.every(cell => cell !== 0));
    }

    checkWin(r, c) {
        // Connect 4 Win Check (Keep existing)
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
        // Diagonals (Simplified scan)
        // ... (Keep existing logic or optimized one)
        // Re-implementing simplified for brevity/safety in replace
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j] === player) {
                    // Check diagonal down-right
                    if (i + 3 < this.rows && j + 3 < this.cols && this.grid[i + 1][j + 1] == player && this.grid[i + 2][j + 2] == player && this.grid[i + 3][j + 3] == player) return true;
                    // Check diagonal down-left
                    if (i + 3 < this.rows && j - 3 >= 0 && this.grid[i + 1][j - 1] == player && this.grid[i + 2][j - 2] == player && this.grid[i + 3][j - 3] == player) return true;
                }
            }
        }
        return false;
    }

    draw() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameType === 'tictactoe') {
            this.drawTicTacToe();
        } else {
            this.drawConnect4();
        }
    }

    drawTicTacToe() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';

        // Grid Lines
        for (let i = 1; i < 3; i++) {
            // Vert
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
            this.ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + 3 * this.cellSize);
            this.ctx.stroke();
            // Horiz
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
            this.ctx.lineTo(this.offsetX + 3 * this.cellSize, this.offsetY + i * this.cellSize);
            this.ctx.stroke();
        }

        // X and O
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const val = this.grid[r][c];
                const x = this.offsetX + c * this.cellSize + this.cellSize / 2;
                const y = this.offsetY + r * this.cellSize + this.cellSize / 2;
                const size = this.cellSize * 0.3;

                if (val === 1) { // X (Red)
                    this.ctx.strokeStyle = this.p1Color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x - size, y - size);
                    this.ctx.lineTo(x + size, y + size);
                    this.ctx.moveTo(x + size, y - size);
                    this.ctx.lineTo(x - size, y + size);
                    this.ctx.stroke();
                } else if (val === 2) { // O (Yellow/Blue)
                    this.ctx.strokeStyle = this.p2Color;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawConnect4() {
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

        let text = `Player ${this.turn}'s Turn`;
        if (this.winner !== 0) {
            text = this.winner === -1 ? "Game Draw!" : `Player ${this.winner} Wins!`;
            this.ctx.fillStyle = this.winner === 1 ? this.p1Color : (this.winner === 2 ? this.p2Color : '#333');
        }

        this.ctx.fillText(text, this.canvas.width / 2, 30);
    }

    // Stub
    bindMobileControls() { }
}
