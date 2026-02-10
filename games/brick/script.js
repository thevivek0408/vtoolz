class BrickGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');
        this.goTitle = document.getElementById('goTitle');

        this.ballRadius = 8;
        this.paddleHeight = 15;
        this.paddleWidth = 100;

        this.resetDefaults();

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input
        document.addEventListener('keydown', (e) => this.keyDownHandler(e), false);
        document.addEventListener('keyup', (e) => this.keyUpHandler(e), false);
        document.addEventListener('mousemove', (e) => this.mouseMoveHandler(e), false);

        // Touch
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const relativeX = e.touches[0].clientX - rect.left;
            if (relativeX > 0 && relativeX < this.canvas.width) {
                this.paddleX = relativeX - this.paddleWidth / 2;
            }
        }, { passive: false });
    }

    resetDefaults() {
        this.score = 0;
        this.lives = 3;
        this.rightPressed = false;
        this.leftPressed = false;
        this.bricks = [];
        this.particles = [];
        this.paddleX = 0; // set in resize
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.isRunning = false;
    }

    resize() {
        this.canvas.width = Math.min(window.innerWidth - 20, 600);
        this.canvas.height = window.innerHeight - 100;
        this.paddleX = (this.canvas.width - this.paddleWidth) / 2;

        if (!this.isRunning) {
            this.x = this.canvas.width / 2;
            this.y = this.canvas.height - 30;
        }
    }

    createBricks() {
        this.bricks = [];
        const rows = 6;
        const cols = 7;
        const padding = 10;
        const offsetTop = 40;
        const offsetLeft = 35;

        // Dynamic sizing
        const availWidth = this.canvas.width - (2 * offsetLeft);
        const brickWidth = (availWidth - (cols - 1) * padding) / cols;
        const brickHeight = 20;

        const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

        for (let c = 0; c < cols; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < rows; r++) {
                this.bricks[c][r] = {
                    x: 0, y: 0,
                    status: 1,
                    color: colors[r],
                    width: brickWidth,
                    height: brickHeight
                };

                const brickX = (c * (brickWidth + padding)) + offsetLeft;
                const brickY = (r * (brickHeight + padding)) + offsetTop;
                this.bricks[c][r].x = brickX;
                this.bricks[c][r].y = brickY;
            }
        }
    }

    keyDownHandler(e) {
        if (e.key == "Right" || e.key == "ArrowRight") this.rightPressed = true;
        else if (e.key == "Left" || e.key == "ArrowLeft") this.leftPressed = true;
    }

    keyUpHandler(e) {
        if (e.key == "Right" || e.key == "ArrowRight") this.rightPressed = false;
        else if (e.key == "Left" || e.key == "ArrowLeft") this.leftPressed = false;
    }

    mouseMoveHandler(e) {
        const rect = this.canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < this.canvas.width) {
            this.paddleX = relativeX - this.paddleWidth / 2;
        }
    }

    start() {
        this.resetDefaults();
        this.resize(); // ensure sizes
        this.createBricks();
        this.isRunning = true;

        // Ball launch
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 40;
        this.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.dy = -4;

        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        this.scoreEl.textContent = 0;
        this.livesEl.textContent = 3;

        requestAnimationFrame(() => this.draw());
    }

    draw() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // BG
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBricks();
        this.drawBall();
        this.drawPaddle();
        this.drawParticles();
        this.collisionDetection();
        this.updateBall();
        this.updateParticles();

        requestAnimationFrame(() => this.draw());
    }

    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "#fff";
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = "#fff";
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.closePath();
    }

    drawPaddle() {
        this.ctx.beginPath();
        this.ctx.rect(this.paddleX, this.canvas.height - this.paddleHeight - 10, this.paddleWidth, this.paddleHeight);
        this.ctx.fillStyle = "#00f2ff";
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#00f2ff";
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.closePath();
    }

    drawBricks() {
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const b = this.bricks[c][r];
                if (b.status == 1) {
                    this.ctx.beginPath();
                    this.ctx.rect(b.x, b.y, b.width, b.height);
                    this.ctx.fillStyle = b.color;
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = b.color;
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                    this.ctx.closePath();
                }
            }
        }
    }

    collisionDetection() {
        for (let c = 0; c < this.bricks.length; c++) {
            for (let r = 0; r < this.bricks[c].length; r++) {
                const b = this.bricks[c][r];
                if (b.status == 1) {
                    if (this.x > b.x && this.x < b.x + b.width && this.y > b.y && this.y < b.y + b.height) {
                        this.dy = -this.dy;
                        b.status = 0;
                        this.score++;
                        this.scoreEl.textContent = this.score;
                        this.createParticles(b.x + b.width / 2, b.y + b.height / 2, b.color);

                        // Check Win
                        if (this.score == this.bricks.length * this.bricks[0].length) {
                            this.gameOver(true);
                        }
                    }
                }
            }
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: color
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 4, 4);
            this.ctx.globalAlpha = 1;
        });
    }

    updateBall() {
        // Walls
        if (this.x + this.dx > this.canvas.width - this.ballRadius || this.x + this.dx < this.ballRadius) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy < this.ballRadius) {
            this.dy = -this.dy;
        } else if (this.y + this.dy > this.canvas.height - this.paddleHeight - 10 - this.ballRadius) {
            // Paddle Check
            if (this.x > this.paddleX && this.x < this.paddleX + this.paddleWidth) {
                // Angle based on hit position
                const hitPoint = this.x - (this.paddleX + this.paddleWidth / 2);
                this.dx = hitPoint * 0.15; // spin effect
                this.dy = -this.dy * 1.05; // speed up slightly
            } else if (this.y + this.dy > this.canvas.height - this.ballRadius) {
                // Miss
                this.lives--;
                this.livesEl.textContent = this.lives;
                if (!this.lives) {
                    this.gameOver(false);
                } else {
                    this.x = this.canvas.width / 2;
                    this.y = this.canvas.height - 40;
                    this.dx = 4;
                    this.dy = -4;
                    this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
                }
            }
        }

        this.x += this.dx;
        this.y += this.dy;

        // Paddle Move
        if (this.rightPressed && this.paddleX < this.canvas.width - this.paddleWidth) {
            this.paddleX += 7;
        }
        else if (this.leftPressed && this.paddleX > 0) {
            this.paddleX -= 7;
        }
    }

    gameOver(win) {
        this.isRunning = false;
        this.goTitle.textContent = win ? "YOU WIN!" : "GAME OVER";
        this.goTitle.style.color = win ? "#2ecc71" : "#e74c3c";
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
}

window.onload = () => {
    window.game = new BrickGame();
};
