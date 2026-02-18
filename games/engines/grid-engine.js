export default class GridEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // State
        this.grid = [];
        this.selectedCell = null; // {r, c}
        this.cellSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Sudoku Specifics
        this.initialGrid = []; // Frozen numbers
        this.mistakes = 0;

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
        // Sudoku is 9x9 always
        const size = Math.min(this.canvas.width, this.canvas.height - 150); // Leave space for controls
        this.cellSize = Math.floor(size / 9);
        this.offsetX = Math.floor((this.canvas.width - this.cellSize * 9) / 2);
        this.offsetY = 20; // Padding top

        this.draw();
    }

    setupInput() {
        // Canvas Click -> Select Cell
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top - this.offsetY;

            const c = Math.floor(x / this.cellSize);
            const r = Math.floor(y / this.cellSize);

            if (c >= 0 && c < 9 && r >= 0 && r < 9) {
                this.selectedCell = { r, c };
                this.draw();
                this.showNumpad(true);
            } else {
                this.selectedCell = null;
                this.draw();
                this.showNumpad(false);
            }
        });
    }

    start() {
        this.running = true;
        this.resize();

        // Dispatch based on game name/config
        if (this.config.name.includes('Sudoku')) {
            this.gameType = 'sudoku';
            this.generateSudoku();
            this.showNumpad(true);
        } else if (this.config.name.includes('Minesweeper')) {
            this.gameType = 'minesweeper';
            this.generateMinesweeper();
            this.showNumpad(false);
        } else if (this.config.name.includes('2048') || this.config.name.includes('4096')) {
            this.gameType = '2048';
            this.generate2048();
            this.showNumpad(false);
        } else if (this.config.name.includes('Light') || this.config.name.includes('Pattern')) {
            this.gameType = 'lightsout';
            this.generateLightsOut();
            this.showNumpad(false);
        } else if (this.config.name.includes('Color') || this.config.name.includes('Flood') || this.config.name.includes('Sort')) {
            this.gameType = 'floodfill';
            this.generateFloodFill();
            this.showNumpad(false);
        } else {
            // Default
            this.gameType = 'sudoku';
            this.generateSudoku();
            this.showNumpad(true);
        }
    }

    // --- LIGHTS OUT ---
    generateLightsOut() {
        this.rows = 5;
        this.cols = 5;
        this.grid = Array(5).fill().map(() => Array(5).fill(false)); // false=off, true=on

        // Randomize moves to ensure solvency
        for (let i = 0; i < 20; i++) {
            const r = Math.floor(Math.random() * 5);
            const c = Math.floor(Math.random() * 5);
            this.toggleLights(r, c);
        }
    }

    toggleLights(r, c) {
        const toggle = (r, c) => {
            if (r >= 0 && r < 5 && c >= 0 && c < 5) this.grid[r][c] = !this.grid[r][c];
        };
        toggle(r, c);
        toggle(r - 1, c);
        toggle(r + 1, c);
        toggle(r, c - 1);
        toggle(r, c + 1);
    }

    // --- FLOOD FILL / COLOR MATCH ---
    generateFloodFill() {
        this.rows = 14;
        this.cols = 14;
        this.colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22'];
        this.grid = Array(this.rows).fill().map(() => Array(this.cols).fill(0).map(() => Math.floor(Math.random() * 6)));
        this.moves = 25;
        this.maxMoves = 25;
        this.gameOver = false;
    }

    floodFill(targetColorIdx) {
        if (this.gameOver) return;
        const startColor = this.grid[0][0];
        if (startColor === targetColorIdx) return;

        const queue = [{ r: 0, c: 0 }];
        const visited = new Set(['0,0']);

        while (queue.length > 0) {
            const { r, c } = queue.shift();
            this.grid[r][c] = targetColorIdx;

            const neighbors = [
                { r: r + 1, c: c }, { r: r - 1, c: c }, { r: r, c: c + 1 }, { r: r, c: c - 1 }
            ];

            neighbors.forEach(n => {
                if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols) {
                    const key = `${n.r},${n.c}`;
                    if (!visited.has(key) && this.grid[n.r][n.c] === startColor) {
                        visited.add(key);
                        queue.push(n);
                    }
                }
            });
        }

        this.moves--;
        this.checkFloodWin();
        if (this.moves <= 0 && !this.gameOver) {
            this.gameOver = true;
            alert("Out of Moves! Game Over.");
        }
        this.draw();
    }

    checkFloodWin() {
        const first = this.grid[0][0];
        const allSame = this.grid.every(row => row.every(cell => cell === first));
        if (allSame) {
            this.gameOver = true;
            setTimeout(() => alert("You Won!"), 100);
        }
    }

    // --- INPUT HANDLING ---
    setupInput() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Flood Fill Controls (Bottom Bar?)
            if (this.gameType === 'floodfill') {
                // Check color palette clicks at bottom
                const paletteY = this.canvas.height - 60;
                if (e.clientY - rect.top > paletteY) {
                    const x = e.clientX - rect.left;
                    // Centered palette
                    const pW = 40;
                    const startX = (this.canvas.width - (6 * pW + 5 * 10)) / 2;
                    if (x >= startX) {
                        const idx = Math.floor((x - startX) / (pW + 10));
                        if (idx >= 0 && idx < 6) this.floodFill(idx);
                    }
                    return;
                }
            }

            const x = e.clientX - rect.left - this.offsetX;
            const y = e.clientY - rect.top - this.offsetY;

            if (this.gameType === 'sudoku') this.handleSudokuClick(e);
            else if (this.gameType === 'minesweeper') this.handleMinesweeperClick(e);
            else if (this.gameType === 'lightsout') {
                const c = Math.floor(x / this.cellSize);
                const r = Math.floor(y / this.cellSize);
                if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                    this.toggleLights(r, c);
                    // Check Win
                    if (this.grid.every(row => row.every(val => !val))) setTimeout(() => alert("Lights Out! You Win!"), 100);
                    this.draw();
                }
            }
        });

        // Right click for Minesweeper
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameType === 'minesweeper') this.handleMinesweeperRightClick(e);
        });
    }

    // ... (Keep existing handlers for Sudoku/Mine) ...
    // Re-implemented to ensure context integrity if I replaced whole block
    handleSudokuClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.offsetX;
        const y = e.clientY - rect.top - this.offsetY;
        const c = Math.floor(x / this.cellSize);
        const r = Math.floor(y / this.cellSize);
        if (c >= 0 && c < 9 && r >= 0 && r < 9) {
            this.selectedCell = { r, c };
            this.draw();
            this.showNumpad(true);
        } else {
            this.selectedCell = null;
            this.draw();
            this.showNumpad(false);
        }
    }

    handleMinesweeperClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.offsetX;
        const y = e.clientY - rect.top - this.offsetY;
        const c = Math.floor(x / this.cellSize);
        const r = Math.floor(y / this.cellSize);
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            const cell = this.grid[r][c];
            if (cell.flagged || cell.revealed) return;
            this.grid[r][c] = { ...cell, revealed: true };
            if (cell.mine) {
                alert('BOOM! Game Over.');
                this.generateMinesweeper();
            }
            this.draw();
        }
    }

    handleMinesweeperRightClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - this.offsetX;
        const y = e.clientY - rect.top - this.offsetY;
        const c = Math.floor(x / this.cellSize);
        const r = Math.floor(y / this.cellSize);
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
            const cell = this.grid[r][c];
            if (!cell.revealed) {
                this.grid[r][c] = { ...cell, flagged: !cell.flagged };
                this.draw();
            }
        }
    }

    // --- DRAWING ---
    draw() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameType === 'sudoku') this.drawSudoku();
        else if (this.gameType === 'minesweeper') this.drawMinesweeper();
        else if (this.gameType === '2048') this.draw2048();
        else if (this.gameType === 'lightsout') this.drawLightsOut();
        else if (this.gameType === 'floodfill') this.drawFloodFill();
    }

    drawLightsOut() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Recalc size for 5x5
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.8;
        this.cellSize = size / 5;
        this.offsetX = (this.canvas.width - size) / 2;
        this.offsetY = (this.canvas.height - size) / 2;

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                this.ctx.fillStyle = this.grid[r][c] ? '#f1c40f' : '#34495e';
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                const x = this.offsetX + c * this.cellSize;
                const y = this.offsetY + r * this.cellSize;

                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }
    }

    drawFloodFill() {
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const size = Math.min(this.canvas.width, this.canvas.height - 100) * 0.9;
        this.cellSize = size / this.rows;
        this.offsetX = (this.canvas.width - size) / 2;
        this.offsetY = 20;

        // Grid
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.ctx.fillStyle = this.colors[this.grid[r][c]];
                this.ctx.fillRect(this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize + 1, this.cellSize + 1);
            }
        }

        // UI Palette
        const pW = 40;
        const startX = (this.canvas.width - (6 * pW + 5 * 10)) / 2;
        const palY = this.canvas.height - 60;

        this.colors.forEach((col, i) => {
            this.ctx.fillStyle = col;
            this.ctx.beginPath();
            this.ctx.arc(startX + i * (pW + 10) + pW / 2, palY + pW / 2, pW / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Moves: ${this.moves}/${this.maxMoves}`, this.canvas.width / 2, palY - 20);
    }

    // ... (Keep existing Draw helper methods: drawSudoku, drawMinesweeper, draw2048, getNumberColor, createNumpadUI, fillCell)
    // IMPORTANT: I must include them or they will be lost.

    drawSudoku() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        // Recalc for 9x9 if needed, but assuming resize() handles general layout logic
        // But resize() assumes 9x9 default. If switching modes mid-stream, might need recalc.
        // For now, simpler to just redraw with current assumptions.
        const size = Math.min(this.canvas.width, this.canvas.height - 150);
        this.cellSize = Math.floor(size / 9);
        this.offsetX = Math.floor((this.canvas.width - this.cellSize * 9) / 2);
        this.offsetY = 20;

        for (let i = 0; i <= 9; i++) {
            const pos = i * this.cellSize;
            this.ctx.lineWidth = (i % 3 === 0) ? 3 : 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + pos, this.offsetY);
            this.ctx.lineTo(this.offsetX + pos, this.offsetY + 9 * this.cellSize);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + pos);
            this.ctx.lineTo(this.offsetX + 9 * this.cellSize, this.offsetY + pos);
            this.ctx.stroke();
        }

        this.ctx.font = `${Math.floor(this.cellSize * 0.6)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = this.grid[r][c];
                if (val !== 0) {
                    const x = this.offsetX + c * this.cellSize + this.cellSize / 2;
                    const y = this.offsetY + r * this.cellSize + this.cellSize / 2;
                    if (this.initialGrid[r][c] !== 0) this.ctx.fillStyle = '#000';
                    else this.ctx.fillStyle = '#3498db';
                    if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                        this.ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
                        this.ctx.fillRect(this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize, this.cellSize);
                        this.ctx.fillStyle = '#3498db';
                    }
                    this.ctx.fillText(val, x, y);
                }
            }
        }
    }

    drawMinesweeper() {
        // Recalc for Minesweeper layout (usually 9x9 here too)
        const size = Math.min(this.canvas.width, this.canvas.height - 150);
        this.cellSize = Math.floor(size / 9);
        this.offsetX = Math.floor((this.canvas.width - this.cellSize * 9) / 2);
        this.offsetY = 20;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.grid[r][c];
                const x = this.offsetX + c * this.cellSize;
                const y = this.offsetY + r * this.cellSize;

                this.ctx.strokeStyle = '#95a5a6';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);

                if (cell.revealed) {
                    this.ctx.fillStyle = '#ecf0f1';
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

                    if (cell.mine) {
                        this.ctx.fillStyle = '#e74c3c';
                        this.ctx.beginPath();
                        this.ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, this.cellSize / 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else if (cell.count > 0) {
                        this.ctx.fillStyle = this.getNumberColor(cell.count);
                        this.ctx.font = 'bold 20px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(cell.count, x + this.cellSize / 2, y + this.cellSize / 2);
                    }
                } else {
                    this.ctx.fillStyle = '#bdc3c7'; // Covered
                    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

                    if (cell.flagged) {
                        this.ctx.fillStyle = '#e74c3c';
                        this.ctx.font = '20px Arial';
                        this.ctx.fillText('🚩', x + this.cellSize / 2, y + this.cellSize / 2);
                    }
                }
            }
        }
    }

    draw2048() {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("2048 Game Mode (Preview)", this.canvas.width / 2, this.canvas.height / 2);
    }

    getNumberColor(n) {
        return ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f'][n - 1] || '#000';
    }

    createNumpadUI() {
        let numpad = document.getElementById('grid-numpad');
        if (!numpad) {
            numpad = document.createElement('div');
            numpad.id = 'grid-numpad';
            numpad.style.position = 'absolute';
            numpad.style.bottom = '20px';
            numpad.style.left = '50%';
            numpad.style.transform = 'translateX(-50%)';
            numpad.style.display = 'grid';
            numpad.style.gridTemplateColumns = 'repeat(9, 1fr)';
            numpad.style.gap = '5px';
            numpad.style.width = '90%';
            numpad.style.maxWidth = '400px';

            for (let i = 1; i <= 9; i++) {
                const btn = document.createElement('button');
                btn.innerText = i;
                btn.className = 'control-btn';
                btn.style.width = 'auto';
                btn.style.height = '40px';
                btn.style.borderRadius = '5px';
                btn.style.fontSize = '18px';
                btn.onclick = () => this.fillCell(i);
                numpad.appendChild(btn);
            }
            const btn = document.createElement('button');
            btn.innerText = 'X';
            btn.className = 'control-btn';
            btn.style.background = '#e74c3c';
            btn.onclick = () => this.fillCell(0);
            numpad.appendChild(btn);

            document.querySelector('.game-container').appendChild(numpad);
        }
        this.numpad = numpad;
    }

    fillCell(num) {
        if (!this.selectedCell) return;
        const { r, c } = this.selectedCell;
        if (this.initialGrid[r][c] !== 0) return;
        this.grid[r][c] = num;
        if (num !== 0 && num !== this.solution[r][c]) {
            this.mistakes++;
        }
        this.draw();
    }

    checkWin() { return false; }
    showNumpad(show) { if (this.numpad) this.numpad.style.display = show ? 'grid' : 'none'; }
    bindMobileControls() { }
}
