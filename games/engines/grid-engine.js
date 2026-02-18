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
        this.generateSudoku();
        this.resize();
        this.createNumpadUI();
    }

    generateSudoku() {
        // Simple valid sudoku for testing
        // A full valid grid
        const base = [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ];

        // Shuffle rows/cols/numbers to randomize?
        // For MVP, just remove some numbers
        this.solution = JSON.parse(JSON.stringify(base));
        this.grid = JSON.parse(JSON.stringify(base));
        this.initialGrid = JSON.parse(JSON.stringify(base));

        // Remove random cells
        for (let i = 0; i < 40; i++) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            this.grid[r][c] = 0;
            this.initialGrid[r][c] = 0;
        }
    }

    createNumpadUI() {
        // Create HTML overlay for Numpad if mobile or desktop
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
                btn.className = 'control-btn'; // Reusing style
                btn.style.width = 'auto'; // fluid
                btn.style.height = '40px';
                btn.style.borderRadius = '5px';
                btn.style.fontSize = '18px';
                btn.onclick = () => this.fillCell(i);
                numpad.appendChild(btn);
            }
            // Add Clear
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

    showNumpad(show) {
        if (this.numpad) this.numpad.style.display = show ? 'grid' : 'none';
    }

    fillCell(num) {
        if (!this.selectedCell) return;
        const { r, c } = this.selectedCell;

        // Cannot edit initial cells
        if (this.initialGrid[r][c] !== 0) return;

        this.grid[r][c] = num;

        // Check validity
        if (num !== 0 && num !== this.solution[r][c]) {
            // Wrong move
            this.mistakes++;
            // Could animate red flash
        }

        this.draw();

        // Win Check
        if (this.checkWin()) {
            setTimeout(() => alert("You Won!"), 100);
        }
    }

    checkWin() {
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
                if (this.grid[r][c] !== this.solution[r][c]) return false;
        return true;
    }

    draw() {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid Lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 9; i++) {
            const pos = i * this.cellSize;
            // Thick lines for 3x3
            this.ctx.lineWidth = (i % 3 === 0) ? 3 : 1;

            // Vertical
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX + pos, this.offsetY);
            this.ctx.lineTo(this.offsetX + pos, this.offsetY + 9 * this.cellSize);
            this.ctx.stroke();

            // Horizontal
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, this.offsetY + pos);
            this.ctx.lineTo(this.offsetX + 9 * this.cellSize, this.offsetY + pos);
            this.ctx.stroke();
        }

        // Draw Numbers
        this.ctx.font = `${Math.floor(this.cellSize * 0.6)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = this.grid[r][c];
                if (val !== 0) {
                    const x = this.offsetX + c * this.cellSize + this.cellSize / 2;
                    const y = this.offsetY + r * this.cellSize + this.cellSize / 2;

                    if (this.initialGrid[r][c] !== 0) {
                        this.ctx.fillStyle = '#000'; // Fixed
                    } else {
                        this.ctx.fillStyle = '#3498db'; // User filled
                    }

                    // Highlight selected
                    if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                        this.ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
                        this.ctx.fillRect(this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize, this.cellSize);
                        this.ctx.fillStyle = '#3498db'; // Restore text color
                    }

                    this.ctx.fillText(val, x, y);
                } else {
                    // Empty cell highlight if selected
                    if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                        this.ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
                        this.ctx.fillRect(this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize, this.cellSize);
                    }
                }
            }
        }

        // Draw Mistakes
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Mistakes: ${this.mistakes}/3`, this.canvas.width / 2, this.offsetY + 9 * this.cellSize + 30);
    }

    // Stub
    bindMobileControls() { }
}
