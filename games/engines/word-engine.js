export default class WordEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Constants
        this.rows = 6;
        this.cols = 5;
        this.cellSize = 60;
        this.gap = 10;

        // State
        this.currentRow = 0;
        this.currentCol = 0;
        this.grid = Array(6).fill().map(() => Array(5).fill('')); // 6 attempts, 5 letters
        this.colors = Array(6).fill().map(() => Array(5).fill('#34495e')); // Default grey
        this.targetWord = "VIBOX"; // Default, will randomize
        this.gameState = 'playing'; // playing, won, lost

        // Dictionary (Small subset for demo)
        this.dictionary = ["APPLE", "VIBOX", "GAMES", "WORLD", "HELLO", "SMART", "BRAIN", "LOGIC", "SNAKE", "WATER", "MUSIC"];

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
        // Max cell size based on width/height
        const boardW = this.cols * this.cellSize + (this.cols - 1) * this.gap;
        const boardH = this.rows * this.cellSize + (this.rows - 1) * this.gap;

        const scale = Math.min(
            (this.canvas.width - 40) / boardW,
            (this.canvas.height - 250) / boardH // Leave room for keyboard
        );

        this.renderScale = Math.min(1, scale);

        this.offsetX = (this.canvas.width - boardW * this.renderScale) / 2;
        this.offsetY = 20;

        this.draw();
    }

    setupInput() {
        // Physical Keyboard
        window.addEventListener('keydown', (e) => {
            if (!this.running || this.gameState !== 'playing') return;

            const key = e.key.toUpperCase();
            if (key === 'ENTER') this.submitRow();
            else if (key === 'BACKSPACE') this.deleteLetter();
            else if (key.length === 1 && key >= 'A' && key <= 'Z') this.addLetter(key);
        });

        // Virtual Keyboard
        this.createKeyboardUI();
    }

    createKeyboardUI() {
        let kb = document.getElementById('word-keyboard');
        if (kb) kb.remove(); // specific remove for restart

        kb = document.createElement('div');
        kb.id = 'word-keyboard';
        kb.className = 'virtual-keyboard';

        // Style handled in JS or CSS? Let's use JS for self-contained engine
        Object.assign(kb.style, {
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            width: '100%',
            maxWidth: '500px',
            touchAction: 'none'
        });

        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];

        rows.forEach(rowKeys => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.gap = '3px';

            rowKeys.forEach(k => {
                const btn = document.createElement('button');
                btn.innerText = k;
                btn.setAttribute('data-key', k);

                // Style
                Object.assign(btn.style, {
                    padding: '10px 0',
                    flex: k.length > 1 ? '1.5' : '1',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#d3d6da',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                });

                btn.onclick = (e) => {
                    e.preventDefault(); // Stop focus change
                    if (!this.running || this.gameState !== 'playing') return;
                    if (k === 'ENTER') this.submitRow();
                    else if (k === '⌫') this.deleteLetter();
                    else this.addLetter(k);
                };

                rowDiv.appendChild(btn);
            });
            kb.appendChild(rowDiv);
        });

        const container = document.querySelector('.game-container');
        if (container) container.appendChild(kb);
        this.keyboardEl = kb;
    }

    start() {
        this.running = true;
        this.resetGame();
        this.resize();
    }

    resetGame() {
        this.currentRow = 0;
        this.currentCol = 0;
        this.grid = Array(6).fill().map(() => Array(5).fill(''));
        this.colors = Array(6).fill().map(() => Array(5).fill('#34495e')); // dark slate
        this.gameState = 'playing';

        // Pick new word
        this.targetWord = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
        console.log("Target:", this.targetWord); // for debug

        // Reset keyboard colors
        if (this.keyboardEl) {
            const btns = this.keyboardEl.querySelectorAll('button');
            btns.forEach(b => b.style.background = '#d3d6da');
        }

        this.draw();
    }

    addLetter(letter) {
        if (this.currentCol < 5) {
            this.grid[this.currentRow][this.currentCol] = letter;
            this.currentCol++;
            this.draw();
        }
    }

    deleteLetter() {
        if (this.currentCol > 0) {
            this.currentCol--;
            this.grid[this.currentRow][this.currentCol] = '';
            this.draw();
        }
    }

    submitRow() {
        if (this.currentCol < 5) {
            alert("Not enough letters");
            return;
        }

        const guess = this.grid[this.currentRow].join('');
        // Check dictionary logic valid? (Skipping strict check for MVP, allow any 5 letters)

        // Check Colors
        const targetArr = this.targetWord.split('');
        const guessArr = guess.split('');

        // 1. Green Check (Correct pos)
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === targetArr[i]) {
                this.colors[this.currentRow][i] = '#27ae60'; // Green
                targetArr[i] = null; // Consume
                guessArr[i] = null;
                this.updateKeyColor(this.grid[this.currentRow][i], '#27ae60');
            }
        }

        // 2. Yellow Check (Wrong pos)
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] && targetArr.includes(guessArr[i])) {
                this.colors[this.currentRow][i] = '#f1c40f'; // Yellow
                // Remove ONE instance from target to handle duplicates correctly
                const idx = targetArr.indexOf(guessArr[i]);
                targetArr[idx] = null;
                this.updateKeyColor(this.grid[this.currentRow][i], '#f1c40f');
            } else if (guessArr[i]) {
                this.colors[this.currentRow][i] = '#7f8c8d'; // Grey (Wrong)
                this.updateKeyColor(this.grid[this.currentRow][i], '#7f8c8d');
            }
        }

        this.draw();

        // Win/Loss
        if (guess === this.targetWord) {
            this.gameState = 'won';
            setTimeout(() => alert("You Won!"), 100);
        } else {
            this.currentRow++;
            this.currentCol = 0;
            if (this.currentRow >= 6) {
                this.gameState = 'lost';
                setTimeout(() => alert(`Game Over! Word was ${this.targetWord}`), 100);
            }
        }
    }

    updateKeyColor(key, color) {
        if (!this.keyboardEl) return;
        const btn = this.keyboardEl.querySelector(`button[data-key="${key}"]`);
        if (btn) {
            const cur = btn.style.background;
            // Green beats Yellow beats Grey
            if (color === '#27ae60') btn.style.background = color;
            else if (color === '#f1c40f' && cur !== 'rgb(39, 174, 96)') btn.style.background = color; // rgb check is tricky, relying on var logic
            else if (color === '#7f8c8d' && cur === 'rgb(211, 214, 218)') btn.style.background = color; // Only if default
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.renderScale, this.renderScale);

        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 5; c++) {
                const x = c * (this.cellSize + this.gap);
                const y = r * (this.cellSize + this.gap);

                // Box
                // Fill if submitted
                if (r < this.currentRow) {
                    this.ctx.fillStyle = this.colors[r][c];
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    this.ctx.strokeStyle = this.colors[r][c]; // Border same
                } else {
                    this.ctx.fillStyle = 'transparent';
                    this.ctx.strokeStyle = (r === this.currentRow && c === this.currentCol) ? '#fff' : '#555';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                }

                // Letter
                const char = this.grid[r][c];
                if (char) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 30px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(char, x + this.cellSize / 2, y + this.cellSize / 2);
                }
            }
        }

        this.ctx.restore();
    }

    // Stub
    bindMobileControls() { }
}
