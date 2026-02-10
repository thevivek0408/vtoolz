class TowerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');

        this.clickArea = document.getElementById('clickArea');
        this.clickArea.addEventListener('mousedown', (e) => {
            // prevent click on header from triggering game
            if (e.target.tagName !== 'BUTTON') this.placeBlock();
        });
        this.clickArea.addEventListener('touchstart', (e) => {
            if (e.target.tagName !== 'BUTTON') this.placeBlock();
            e.preventDefault();
        }, { passive: false });

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.reset();
    }

    reset() {
        this.score = 0;
        this.blocks = [];
        this.currentBlock = null;
        this.direction = 1; // 1 or -1
        this.speed = 3;
        this.cameraY = 0;
        this.isRunning = false;
        this.gameOverState = false;

        // Base config
        this.baseSize = 150;
        this.blockHeight = 30;
    }

    resize() {
        this.canvas.width = Math.min(window.innerWidth, 500);
        this.canvas.height = window.innerHeight - 70;
        // Center view
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height - 100;
    }

    start(e) {
        if (e) e.stopPropagation();
        this.reset();
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.scoreEl.textContent = 0;

        // Base Block
        this.blocks.push({
            x: -this.baseSize / 2,
            z: -this.baseSize / 2, // using z as depth for logic
            w: this.baseSize,
            d: this.baseSize,
            y: 0,
            color: '#34495e'
        });

        this.spawnBlock();
        this.isRunning = true;
        this.loop();
    }

    spawnBlock() {
        const prev = this.blocks[this.blocks.length - 1];

        this.currentBlock = {
            x: -200, // spawn off screen
            z: prev.z,
            w: prev.w,
            d: prev.d,
            y: this.blocks.length * this.blockHeight,
            axis: this.score % 2 === 0 ? 'x' : 'z', // alternate axis
            color: `hsl(${this.score * 10}, 70%, 60%)`
        };

        // Setup spawn pos based on axis
        if (this.currentBlock.axis === 'x') {
            this.currentBlock.x = -250;
            this.currentBlock.z = prev.z;
        } else {
            this.currentBlock.x = prev.x;
            this.currentBlock.z = -250;
        }
    }

    placeBlock() {
        if (!this.isRunning || this.gameOverState) return;

        const curr = this.currentBlock;
        const prev = this.blocks[this.blocks.length - 1];

        let delta = 0;
        let overlap = 0;
        let size = 0;

        if (curr.axis === 'x') {
            delta = curr.x - prev.x;
            size = prev.w;
        } else {
            delta = curr.z - prev.z;
            size = prev.d;
        }

        if (Math.abs(delta) > size) {
            // Missed completely
            this.gameOver();
            return;
        }

        // Cut Logic
        const tolerance = 5;
        if (Math.abs(delta) < tolerance) {
            // Perfect! Snap to prev
            if (curr.axis === 'x') curr.x = prev.x;
            else curr.z = prev.z;

            // Visual flair?
        } else {
            // Cut
            if (curr.axis === 'x') {
                curr.w -= Math.abs(delta);
                if (delta > 0) curr.x = prev.x + (prev.w - curr.w); // moved right, align right
                else curr.x = prev.x;
                // Actually logic is simpler:
                // New width is overlap. New pos is...
                // intersection maths simplified:
                const overlapW = prev.w - Math.abs(curr.x - prev.x);
                curr.w = overlapW;
                if (curr.x < prev.x) curr.x = prev.x; // cut left side
                // Wait, if I'm left of prev: curr.x is -100, prev.x is 0. width 150.
                // overlap is 50. new block should actally start at prev.x (0) and have width 50? No.
                // It should start at 0 and have width 50..
                // Let's rely on visual center logic?

                // Let's stick to standard slice:
                // If moving X:
                // OverlapStart = max(curr.x, prev.x)
                // OverlapEnd = min(curr.x + curr.w, prev.x + prev.w)
                // NewW = OverlapEnd - OverlapStart
                // NewX = OverlapStart

                const start = Math.max(curr.x, prev.x);
                const end = Math.min(curr.x + curr.w, prev.x + prev.w);
                curr.w = end - start;
                curr.x = start;

            } else {
                const start = Math.max(curr.z, prev.z);
                const end = Math.min(curr.z + curr.d, prev.z + prev.d);
                curr.d = end - start;
                curr.z = start;
            }
        }

        this.blocks.push(curr);
        this.score++;
        this.scoreEl.textContent = this.score;
        this.spawnBlock();

        // Speed up
        this.speed += 0.1;
    }

    gameOver() {
        this.isRunning = false;
        this.gameOverState = true;
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    loop() {
        if (!this.isRunning) return;

        // Move Current Block
        const limit = 250;
        if (this.currentBlock.axis === 'x') {
            this.currentBlock.x += this.speed * this.direction;
            if (this.currentBlock.x > limit || this.currentBlock.x < -limit) this.direction *= -1;
        } else {
            this.currentBlock.z += this.speed * this.direction;
            if (this.currentBlock.z > limit || this.currentBlock.z < -limit) this.direction *= -1;
        }

        // Camera Logic (Lerp)
        const targetY = (this.blocks.length - 5) * this.blockHeight;
        this.cameraY += (Math.max(0, targetY) - this.cameraY) * 0.1;

        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY + this.cameraY); // Pseudo-3D view center

        // Draw all blocks (painter's algo already sorted by Y usually)
        // We render from bottom up
        [...this.blocks, this.currentBlock].forEach(b => {
            if (!b) return;
            // Isometric projection
            // x screen = x - z
            // y screen = (x + z) * 0.5 - y

            const isoX = (b.x - b.z);
            const isoY = (b.x + b.z) * 0.5 - b.y;

            // Draw Block Face (Top)
            this.ctx.fillStyle = b.color;
            this.ctx.beginPath();
            this.ctx.moveTo(isoX, isoY);
            this.ctx.lineTo(isoX + b.w, isoY + b.w * 0.5);
            this.ctx.lineTo(isoX + b.w - b.d, isoY + b.w * 0.5 - b.d * 0.5); // wait, math is simpler

            // Simpler Projection for strict rectangle stacking view (actually easier for Tower Blocks)
            // Just offset Y by Z? No, use real iso.

            // Top Face Vertices:
            // 1. x, z
            // 2. x+w, z
            // 3. x+w, z+d
            // 4. x, z+d

            const project = (x, z, y) => {
                return {
                    x: (x - z),
                    y: ((x + z) * 0.5) - y
                };
            };

            const p1 = project(b.x, b.z, b.y);
            const p2 = project(b.x + b.w, b.z, b.y);
            const p3 = project(b.x + b.w, b.z + b.d, b.y);
            const p4 = project(b.x, b.z + b.d, b.y);

            // Top
            this.ctx.fillStyle = this.lighten(b.color, 20);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.lineTo(p4.x, p4.y);
            this.ctx.fill();

            // Right Face (p2, p3 down)
            const h = this.blockHeight;
            const p2_b = project(b.x + b.w, b.z, b.y - h); // wait, y grows UP in game logic (0, 30, 60), but screen Y grows DOWN.
            // Game logic y=0 is bottom. Screen Y needs to subtract game Y.
            // Project function handles -y.
            // BUT, height extends "down" visually.

            // Let's manual vert extension
            const depth = this.blockHeight;

            // Right Side
            this.ctx.fillStyle = this.darken(b.color, 20);
            this.ctx.beginPath();
            this.ctx.moveTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.lineTo(p3.x, p3.y + depth); // visually straight down isn't iso?
            // In true iso, vertical lines are vertical.
            // y coords in projection include -y.
            // So y=0 is lower on screen than y=30.
            // So 'Height' is just y difference.

            // Actually, we need to draw the volume. The top face is at 'y'. The bottom face is at 'y - 30'?
            // No, blocks stack UP.
            // Top face is at y+30?
            // Let's assume b.y is the BOTTOM of the block.
            // So Top face is at b.y + blockHeight.

            // Correction:
            // p1..p4 are BOTTOM face.
            const topY = b.y + this.blockHeight;
            const t1 = project(b.x, b.z, topY);
            const t2 = project(b.x + b.w, b.z, topY);
            const t3 = project(b.x + b.w, b.z + b.d, topY);
            const t4 = project(b.x, b.z + b.d, topY);

            // Draw Side Faces first (Back ones blocked, only Front/Right visible)
            // Left Side (t1-t4-p4-p1) - Visible? No.
            // Front Side (t4-t3-p3-p4) - Visible.
            this.ctx.fillStyle = this.darken(b.color, 10);
            this.ctx.beginPath();
            this.ctx.moveTo(t4.x, t4.y);
            this.ctx.lineTo(t3.x, t3.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.lineTo(p4.x, p4.y);
            this.ctx.fill();

            // Right Side (t3-t2-p2-p3) - Visible.
            this.ctx.fillStyle = this.darken(b.color, 30);
            this.ctx.beginPath();
            this.ctx.moveTo(t3.x, t3.y);
            this.ctx.lineTo(t2.x, t2.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.fill();

            // Top Face
            this.ctx.fillStyle = b.color;
            this.ctx.beginPath();
            this.ctx.moveTo(t1.x, t1.y);
            this.ctx.lineTo(t2.x, t2.y);
            this.ctx.lineTo(t3.x, t3.y);
            this.ctx.lineTo(t4.x, t4.y);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    // Helpers
    lighten(col, amt) { return this.adjust(col, amt); }
    darken(col, amt) { return this.adjust(col, -amt); }
    adjust(col, amt) {
        // Assume HSL string
        // hsl(123, 45%, 67%)
        // just regex replace the Lightness
        return col.replace(/(\d+)%\)/, (match, p1) => {
            let l = parseInt(p1) + amt;
            if (l > 100) l = 100; if (l < 0) l = 0;
            return l + '%)';
        });
    }
}

window.onload = () => {
    window.game = new TowerGame();
};
