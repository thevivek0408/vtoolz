class FlappyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.isRunning = false;
        this.score = 0;
        this.highScore = localStorage.getItem('vtoolz_flappy_high') || 0;
        this.frames = 0;
        this.speed = 2.5;

        // Physics
        this.gravity = 0.25;

        // Entities
        this.bird = {
            x: 50,
            y: 150,
            w: 30,
            h: 30,
            velocity: 0,
            jump: -5.5,
            rotation: 0
        };

        this.pipes = []; // {x, bottomY, topY, w}
        this.pipeGap = 130;
        this.pipeWidth = 60;
        this.pipeSpawnRate = 140; // frames

        // Input
        this.setupInput();

        // UI
        this.scoreEl = document.getElementById('scoreDisplay');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
    }

    setupInput() {
        const jump = (e) => {
            if (e.type === 'keydown' && e.code !== 'Space') return;
            if (e.type !== 'keydown') e.preventDefault(); // prevent double firing or scrolling

            if (this.isRunning) {
                this.bird.velocity = this.bird.jump;
            } else if (!this.gameOverScreen.classList.contains('visible') && this.frames === 0) {
                // Prevent accidental restart clicks if not resetting
            }
        };

        window.addEventListener('keydown', jump);
        this.canvas.addEventListener('touchstart', jump, { passive: false });
        this.canvas.addEventListener('mousedown', jump);
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.frames = 0;
        this.pipes = [];
        this.bird.y = 150;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.scoreEl.innerText = 0;

        this.startScreen.classList.remove('visible');
        this.gameOverScreen.classList.remove('visible');

        requestAnimationFrame(() => this.loop());
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        this.frames++;
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // Bird Physics
        this.bird.velocity += this.gravity;
        this.bird.y += this.bird.velocity;

        // Floor/Ceiling collision
        if (this.bird.y + this.bird.h >= this.canvas.height) {
            this.bird.y = this.canvas.height - this.bird.h;
            this.gameOver();
            return;
        }
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }

        // Rotation logic
        if (this.bird.velocity < 0) this.bird.rotation = -25 * Math.PI / 180;
        else if (this.bird.velocity > 0) {
            this.bird.rotation += 0.05; // slowly rotate down
            if (this.bird.rotation > 70 * Math.PI / 180) this.bird.rotation = 70 * Math.PI / 180;
        }

        // Pipes
        if (this.frames % this.pipeSpawnRate === 0) {
            const minHeight = 50;
            const maxHeight = this.canvas.height - this.pipeGap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

            this.pipes.push({
                x: this.canvas.width,
                y: topHeight, // Height of top pipe
                passed: false
            });
        }

        for (let i = 0; i < this.pipes.length; i++) {
            const p = this.pipes[i];
            p.x -= this.speed;

            // Collision Detection
            // Bird Box: this.bird.x, this.bird.y, this.bird.w, this.bird.h
            // Top Pipe: x=p.x, y=0, w=this.pipeWidth, h=p.y
            // Bottom Pipe: x=p.x, y=p.y+this.pipeGap, w=this.pipeWidth, h=...

            const birdLeft = this.bird.x + 5; // hitbox adjustments
            const birdRight = this.bird.x + this.bird.w - 5;
            const birdTop = this.bird.y + 5;
            const birdBottom = this.bird.y + this.bird.h - 5;

            const pipeLeft = p.x;
            const pipeRight = p.x + this.pipeWidth;
            const topPipeBottom = p.y;
            const bottomPipeTop = p.y + this.pipeGap;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
                    this.gameOver();
                    return;
                }
            }

            // Score
            if (p.x + this.pipeWidth < this.bird.x && !p.passed) {
                this.score++;
                this.scoreEl.innerText = this.score;
                p.passed = true;
            }

            // Clean up
            if (p.x + this.pipeWidth < 0) {
                this.pipes.shift();
                i--;
            }
        }
    }

    draw() {
        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Pipes
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 2;

        this.pipes.forEach(p => {
            // Top Pipe
            this.ctx.fillRect(p.x, 0, this.pipeWidth, p.y);
            this.ctx.strokeRect(p.x, 0, this.pipeWidth, p.y);

            // Bottom Pipe
            const bottomY = p.y + this.pipeGap;
            const bottomH = this.canvas.height - bottomY;
            this.ctx.fillRect(p.x, bottomY, this.pipeWidth, bottomH);
            this.ctx.strokeRect(p.x, bottomY, this.pipeWidth, bottomH);
        });

        // Bird
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.w / 2, this.bird.y + this.bird.h / 2);
        this.ctx.rotate(this.bird.rotation);

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fillRect(-this.bird.w / 2, -this.bird.h / 2, this.bird.w, this.bird.h);
        // Eye
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(5, -5, 4, 0, Math.PI * 2); // Relative to center
        this.ctx.fill();
        // Beak
        this.ctx.fillStyle = '#e67e22';
        this.ctx.fillRect(5, 0, 10, 8);

        this.ctx.restore();

        // Ground (Visual only)
        // this.ctx.fillStyle = '#e0ce85';
        // this.ctx.fillRect(0, this.canvas.height - 10, this.canvas.width, 10);
    }

    gameOver() {
        this.isRunning = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('vtoolz_flappy_high', this.highScore);
        }

        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('bestScore').innerText = this.highScore;
        this.gameOverScreen.classList.add('visible');
    }
}

window.onload = () => {
    window.game = new FlappyGame();
    // No initial draw needed as start screen covers it, but nice to have? 
};
