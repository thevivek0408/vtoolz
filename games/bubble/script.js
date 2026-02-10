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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Bubbles
        this.bubbles.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = b.color;
            this.ctx.globalAlpha = 0.6; // Transparent bubbles
            this.ctx.fill();

            // Shine
            this.ctx.beginPath();
            this.ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.globalAlpha = 0.4;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;

            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        });

        // Missed Counter (Red bar at top?)
        if (this.missed > 0) {
            this.ctx.fillStyle = '#e74c3c';
            const barW = this.canvas.width / this.maxMissed;
            for (let i = 0; i < this.missed; i++) {
                this.ctx.fillRect(i * barW, 0, barW - 2, 5);
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
