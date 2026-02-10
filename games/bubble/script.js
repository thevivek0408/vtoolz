class BubbleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');

        this.bubbles = [];
        this.particles = []; // pop effects
        this.score = 0;
        this.isRunning = false;
        this.spawnRate = 60;
        this.frames = 0;
        this.missed = 0;
        this.maxMissed = 5;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        this.canvas.addEventListener('mousedown', (e) => this.input(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.input(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }, { passive: false });
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.missed = 0;
        this.frames = 0;
        this.bubbles = [];
        this.particles = [];
        this.scoreEl.textContent = 0;
        this.spawnRate = 60;

        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        requestAnimationFrame(() => this.loop());
    }

    input(x, y) {
        if (!this.isRunning) return;

        // Adjust x,y to canvas coords if there are margins (none here but good practice)
        // Canvas is full screen relative to header, so clientY needs header offset minus
        const rect = this.canvas.getBoundingClientRect();
        const cx = x - rect.left;
        const cy = y - rect.top;

        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            const dist = Math.hypot(cx - b.x, cy - b.y);

            if (dist < b.radius) {
                // Pop!
                this.popBubble(b);
                this.bubbles.splice(i, 1);
                this.score += 10;
                this.scoreEl.textContent = this.score;

                // Increase difficulty
                if (this.score % 100 === 0 && this.spawnRate > 20) this.spawnRate -= 5;
                break; // Only pop one per click? Or multi? Standard is top-most.
            }
        }
    }

    popBubble(b) {
        // Create particles
        const color = b.color;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color
            });
        }
        // Play sound? (Optional)
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        this.frames++;
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // Spawn
        if (this.frames % this.spawnRate === 0) {
            const radius = 20 + Math.random() * 30;
            this.bubbles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + radius,
                radius: radius,
                speed: 1 + Math.random() * 2 + (this.score / 500), // Speed up over time
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                wobble: Math.random() * Math.PI * 2
            });
        }

        // Bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y -= b.speed;
            b.x += Math.sin(this.frames * 0.05 + b.wobble) * 0.5; // Sine wave float

            if (b.y + b.radius < 0) {
                // Escaped
                this.bubbles.splice(i, 1);
                this.missed++;
                // Visual feedback for missing? 
                if (this.missed >= this.maxMissed) {
                    this.gameOver();
                }
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        // Gradient Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#a1c4fd');
        grad.addColorStop(1, '#c2e9fb');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Bubbles
        this.bubbles.forEach(b => {
            // Shadow for depth
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
            this.ctx.shadowOffsetY = 5;

            // Main Bubble Body
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            // Radial Gradient for 3D look
            const bGrad = this.ctx.createRadialGradient(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1, b.x, b.y, b.radius);
            bGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
            bGrad.addColorStop(0.5, b.color);
            bGrad.addColorStop(1, b.color); // Darker edge if needed

            this.ctx.fillStyle = bGrad;
            this.ctx.globalAlpha = 0.8;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Reset
            this.ctx.shadowOffsetY = 0;

            // Highlight (Gloss)
            this.ctx.beginPath();
            this.ctx.ellipse(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, b.radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            this.ctx.fill();

            // Rim Light (Bottom)
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius * 0.9, 0.1 * Math.PI, 0.9 * Math.PI);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.globalAlpha = 1.0;
        });

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        });

        // Missed Counter (Modern)
        if (this.missed > 0) {
            this.ctx.fillStyle = '#ff6b6b';
            const barW = this.canvas.width / this.maxMissed;
            for (let i = 0; i < this.missed; i++) {
                this.ctx.fillRect(i * barW, 0, barW - 4, 6);
            }
        }
    }

    gameOver() {
        this.isRunning = false;
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
}

window.onload = () => {
    window.game = new BubbleGame();
};
