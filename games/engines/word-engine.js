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
        this.resize();

        // Mode Dispatch
        if (this.config.name.includes('Type') || this.config.name.includes('Speed')) {
            this.gameMode = 'typing';
            this.initTyping();
        } else if (this.config.name.includes('Hangman') || this.config.name.includes('Recall')) {
            this.gameMode = 'hangman';
            this.initHangman();
        } else {
            this.gameMode = 'wordle';
            this.resetGame(); // Default Wordle
        }
    }

    // --- TYPING TEST ---
    initTyping() {
        this.targetSentence = "The quick brown fox jumps over the lazy dog.";
        this.typedText = "";
        this.startTime = 0;
        this.wpm = 0;
        this.gameState = 'waiting'; // waiting, playing, finished
        this.draw();
    }

    handleTypingInput(key) {
        if (this.gameState === 'finished') return;
        if (this.gameState === 'waiting') {
            this.gameState = 'playing';
            this.startTime = Date.now();
        }

        if (key === 'BACKSPACE') {
            this.typedText = this.typedText.slice(0, -1);
        } else if (key.length === 1) { // Normal char
            this.typedText += key; // Case sensitive? Or force lower? 
            // Key is UPPER from handler, sentence is mixed. Let's rely on event.key
            // Wait, handler sends e.key.toUpperCase(). 
            // My sentence is mixed case. I should normalize or handle raw input.
            // For now, let's just append what we got.
            // Actually, the main handler forces Upper.
            // I'll adjust the main handler or just check against uppercase target.
        }

        // Calculate WPM
        const time = (Date.now() - this.startTime) / 60000; // mins
        const words = this.typedText.length / 5;
        this.wpm = Math.floor(words / time) || 0;

        // Check finish
        // Upper comparison for simplicity since key handler converts to upper
        if (this.typedText === this.targetSentence.toUpperCase()) {
            this.gameState = 'finished';
            alert(`Done! WPM: ${this.wpm}`);
        }

        this.draw();
    }

    drawTyping() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';

        const targetUpper = this.targetSentence.toUpperCase();

        // Draw Target
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillText(targetUpper, this.canvas.width / 2, this.canvas.height / 2 - 50);

        // Draw Typed (Green for correct, Red for error)
        let x = (this.canvas.width - this.ctx.measureText(targetUpper).width) / 2;
        const startX = x; // Alignment is tricky with center text. 
        // Better: simple left align block or line.
        // Let's do center simple.

        // Overlay typed text
        this.ctx.textAlign = 'left';
        // Hacky centering:
        const width = this.ctx.measureText(targetUpper).width;
        const leftX = (this.canvas.width - width) / 2;

        for (let i = 0; i < this.typedText.length; i++) {
            const char = this.typedText[i];
            const targetChar = targetUpper[i];

            this.ctx.fillStyle = (char === targetChar) ? '#27ae60' : '#e74c3c';
            this.ctx.fillText(char, leftX + this.ctx.measureText(targetUpper.substring(0, i)).width, this.canvas.height / 2 - 50);
        }

        // Stats
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`WPM: ${this.wpm}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.font = '16px Arial';
        this.ctx.fillText("Type the sentence above!", this.canvas.width / 2, this.canvas.height / 2 + 80);
    }

    // --- HANGMAN ---
    initHangman() {
        this.targetWord = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
        this.guessedLetters = new Set();
        this.mistakes = 0;
        this.maxMistakes = 6;
        this.gameState = 'playing';
        this.draw();

        // Reset keyboard colors
        if (this.keyboardEl) {
            const btns = this.keyboardEl.querySelectorAll('button');
            btns.forEach(b => b.style.background = '#d3d6da');
        }
    }

    handleHangmanInput(letter) {
        if (this.gameState !== 'playing') return;
        if (this.guessedLetters.has(letter)) return;

        this.guessedLetters.add(letter);

        if (this.targetWord.includes(letter)) {
            // Good guess
            this.updateKeyColor(letter, '#27ae60');
            // Check Win
            const allFound = this.targetWord.split('').every(c => this.guessedLetters.has(c));
            if (allFound) {
                this.gameState = 'won';
                setTimeout(() => alert("You Saved Him!"), 100);
            }
        } else {
            // Bad guess
            this.mistakes++;
            this.updateKeyColor(letter, '#e74c3c');
            if (this.mistakes >= this.maxMistakes) {
                this.gameState = 'lost';
                setTimeout(() => alert(`Hangman! Word was ${this.targetWord}`), 100);
            }
        }
        this.draw();
    }

    drawHangman() {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Gallows
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(100, 300); this.ctx.lineTo(250, 300); // Base
        this.ctx.moveTo(175, 300); this.ctx.lineTo(175, 50);  // Pole
        this.ctx.lineTo(300, 50);  // Top
        this.ctx.lineTo(300, 80);  // Rope
        this.ctx.stroke();

        // Man
        if (this.mistakes > 0) { // Head
            this.ctx.beginPath(); this.ctx.arc(300, 100, 20, 0, Math.PI * 2); this.ctx.stroke();
        }
        if (this.mistakes > 1) { // Body
            this.ctx.beginPath(); this.ctx.moveTo(300, 120); this.ctx.lineTo(300, 200); this.ctx.stroke();
        }
        if (this.mistakes > 2) { // Left Arm
            this.ctx.beginPath(); this.ctx.moveTo(300, 140); this.ctx.lineTo(270, 170); this.ctx.stroke();
        }
        if (this.mistakes > 3) { // Right Arm
            this.ctx.beginPath(); this.ctx.moveTo(300, 140); this.ctx.lineTo(330, 170); this.ctx.stroke();
        }
        if (this.mistakes > 4) { // Left Leg
            this.ctx.beginPath(); this.ctx.moveTo(300, 200); this.ctx.lineTo(280, 250); this.ctx.stroke();
        }
        if (this.mistakes > 5) { // Right Leg
            this.ctx.beginPath(); this.ctx.moveTo(300, 200); this.ctx.lineTo(320, 250); this.ctx.stroke();
        }

        // Word Display
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';

        let displayWord = "";
        for (const char of this.targetWord) {
            if (this.guessedLetters.has(char)) displayWord += char + " ";
            else displayWord += "_ ";
        }

        this.ctx.fillText(displayWord, this.canvas.width / 2 + 50, 300);
    }

    // --- MAIN DRAW ---
    draw() {
        if (this.gameMode === 'typing') { this.drawTyping(); return; }
        if (this.gameMode === 'hangman') { this.drawHangman(); return; }

        // Default Wordle Draw
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

    // --- MODIFIED INPUT HANDLERS ---
    // We need to route inputs based on Mode

    addLetter(letter) {
        if (this.gameMode === 'hangman') { this.handleHangmanInput(letter); return; }
        if (this.gameMode === 'typing') { this.handleTypingInput(letter); return; }

        // Wordle Logic
        if (this.currentCol < 5) {
            this.grid[this.currentRow][this.currentCol] = letter;
            this.currentCol++;
            this.draw();
        }
    }

    deleteLetter() {
        if (this.gameMode === 'typing') { this.handleTypingInput('BACKSPACE'); return; }
        if (this.gameMode === 'hangman') return;

        // Wordle Logic
        if (this.currentCol > 0) {
            this.currentCol--;
            this.grid[this.currentRow][this.currentCol] = '';
            this.draw();
        }
    }

    submitRow() {
        if (this.gameMode !== 'wordle') return; // Only Wordle uses Enter to submit row

        // Wordle Logic...
        if (this.currentCol < 5) {
            alert("Not enough letters");
            return;
        }

        const guess = this.grid[this.currentRow].join('');
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

    // Stub
    bindMobileControls() { }
}
