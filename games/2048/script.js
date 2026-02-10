class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('vtoolz_2048_best') || 0;
        this.tileContainer = document.getElementById('tile-container');
        this.scoreEl = document.getElementById('score');
        this.bestScoreEl = document.getElementById('best-score');
        this.gameOverEl = document.getElementById('game-over');
        this.isGameOver = false;

        this.touchStartX = 0;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        this.bestScoreEl.textContent = this.bestScore;
        this.restart();
        this.setupInput();
    }

    restart() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.score = 0;
        this.isGameOver = false;
        this.gameOverEl.classList.remove('show');
        this.updateScore(0);
        this.tileContainer.innerHTML = '';
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.grid[r][c]) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); this.move('up'); break;
                case 'ArrowDown': e.preventDefault(); this.move('down'); break;
                case 'ArrowLeft': e.preventDefault(); this.move('left'); break;
                case 'ArrowRight': e.preventDefault(); this.move('right'); break;
            }
        });

        const container = document.getElementById('game-container');
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (this.isGameOver) return;
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchEndX, touchEndY);
        }, { passive: false });
    }

    handleSwipe(endX, endY) {
        const dx = endX - this.touchStartX;
        const dy = endY - this.touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 10) { // Threshold
            if (absDx > absDy) {
                this.move(dx > 0 ? 'right' : 'left');
            } else {
                this.move(dy > 0 ? 'down' : 'up');
            }
        }
    }

    move(direction) {
        let moved = false;
        const newGrid = this.grid.map(row => [...row]); // Deep copy not needed for numbers, but helps structure
        let mergedScore = 0;

        // Logic helper for one row/col
        const processLine = (line) => {
            let limit = 0; // Where the next tile can slide to
            // 1. Remove zeros
            let clean = line.filter(val => val !== null);

            // 2. Merge
            for (let i = 0; i < clean.length - 1; i++) {
                if (clean[i] === clean[i + 1]) {
                    clean[i] *= 2;
                    mergedScore += clean[i];
                    clean[i + 1] = null;
                    i++; // Skip next
                }
            }
            clean = clean.filter(val => val !== null);

            // 3. Pad with zeros
            while (clean.length < this.size) clean.push(null);
            return clean;
        };

        // Transform grid to lines based on direction
        // For UP, columns are lines. For LEFT, rows are lines.
        // To simplify, we'll rotate the grid to always process LEFT, then rotate back.

        const rotateGrid = (grid) => {
            // Rotate 90 deg clockwise
            return grid[0].map((val, index) => grid.map(row => row[index]).reverse());
        };

        const rotateGridCounter = (grid) => {
            // Rotate 90 deg counter-clockwise
            return grid[0].map((val, index) => grid.map(row => row[row.length - 1 - index]));
        };

        const moveLeft = (g) => {
            return g.map(row => processLine(row));
        };

        let workingGrid = this.grid.map(r => [...r]);

        if (direction === 'left') {
            workingGrid = moveLeft(workingGrid);
        } else if (direction === 'right') {
            workingGrid = workingGrid.map(row => row.reverse());
            workingGrid = moveLeft(workingGrid);
            workingGrid = workingGrid.map(row => row.reverse());
        } else if (direction === 'up') {
            workingGrid = rotateGridCounter(workingGrid);
            workingGrid = moveLeft(workingGrid);
            workingGrid = rotateGrid(workingGrid);
        } else if (direction === 'down') {
            workingGrid = rotateGrid(workingGrid);
            workingGrid = moveLeft(workingGrid);
            workingGrid = rotateGridCounter(workingGrid);
        }

        // Check if changed
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== workingGrid[r][c]) moved = true;
            }
        }

        if (moved) {
            this.grid = workingGrid;
            this.updateScore(this.score + mergedScore);
            this.addRandomTile();
            this.render();
            this.checkGameOver();
        }
    }

    checkGameOver() {
        // 1. Any empty?
        for (let r = 0; r < this.size; r++) {
            if (this.grid[r].includes(null)) return;
        }
        // 2. Any merge possible?
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                if (c < 3 && val === this.grid[r][c + 1]) return;
                if (r < 3 && val === this.grid[r + 1][c]) return;
            }
        }

        this.isGameOver = true;
        this.gameOverEl.classList.add('show');
    }

    updateScore(newScore) {
        this.score = newScore;
        this.scoreEl.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('vtoolz_2048_best', this.bestScore);
            this.bestScoreEl.textContent = this.bestScore;
        }
    }

    render() {
        this.tileContainer.innerHTML = '';
        const gap = 15;
        const padding = 15;
        // Need to calculate strict positions for animation
        // Instead of strict pixels which breaks responsively, lets use % logic for `top/left`
        // grid width = 100%
        // cell width = (100% - padding*2 - gap*3)/4  <-- this is roughly 21.25% at 500px...
        // Let's use CSS classes `tile-position-1-1` 

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                if (val) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${val}`;
                    if (val > 2048) tile.classList.add('tile-super');
                    tile.textContent = val;

                    // Positioning Calculation relative to container
                    // Using % is safest for responsiveness
                    // Gap and Padding are fixed in px locally, but in % globally they vary.
                    // Actually, let's use calc() for position.
                    // Left = padding + c * (cellWidth + gap)
                    // width ~ 21.2% ?
                    // Let's just hardcode classes for positions in CSS? No, 16 classes is tedious but reliable.
                    // Or set inline styles.

                    // Container is 100%. 
                    // Let's try to assume container width is X.
                    // Let's rely on simple percentages ignoring fixed pixel gaps for a sec? NO, misalignment.

                    // Correct approach: CSS Grid for background, Absolute for Tiles?
                    // To align perfectly, we need to know the cell positions.

                    // Simple Hack: Use transform: translate( X%, Y% )
                    // Cell 0,0 = 0,0
                    // Cell 0,1 = 100% + gap%, 0
                    // But gap is px.

                    // Okay, let's use the layout engine of grid itself?
                    // But we want animation.

                    // Let's stick to the visual approximation or getBoundingClientRect of grid cells?
                    // That's heavy but accurate.

                    this.setTilePosition(tile, r, c);
                    this.tileContainer.appendChild(tile);
                }
            }
        }
    }

    setTilePosition(tile, r, c) {
        // We know the grid structure:
        // gap: 15px (10px mobile)
        // padding: 15px (10px mobile)
        // We can't easily know if we are mobile in JS without checking width.
        // Let's try CSS Variables for position? 
        // Or cleaner: `tile-r-0 tile-c-0` and define them in CSS using calc().

        // Let's do inline styles with calc().
        // Width of one cell w = (100% - 2*P - 3*G) / 4
        // Left = P + c*(w+G)
        // Top = P + r*(h+G)

        // P = 15px, G = 15px.
        // This is fragile on mobile where P=10px.

        // Better: Find the DOM element of the grid cell and match its position?
        // Since the grid background is drawn by `.grid-container .grid-cell`, we can query them.
        // There are 16 static cells.

        const index = r * 4 + c;
        const gridCells = document.querySelectorAll('.grid-cell');
        const targetCell = gridCells[index];

        // Get relative position
        // We need to be careful about offsets. 
        // tileContainer matches gridContainer position exactly.
        const targetX = targetCell.offsetLeft;
        const targetY = targetCell.offsetTop;
        const targetW = targetCell.offsetWidth; // width including border/padding

        tile.style.left = targetX + 'px';
        tile.style.top = targetY + 'px';
        tile.style.width = targetW + 'px';
        tile.style.height = targetW + 'px'; // square
    }
}

// Start
window.onload = () => {
    window.game = new Game2048();

    // Handle resize to fix positions
    let timeout;
    window.onresize = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => window.game.render(), 100);
    };
};
