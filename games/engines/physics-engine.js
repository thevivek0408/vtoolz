export default class PhysicsEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Game State
        this.player = {
            x: 50,
            y: 200,
            width: 30,
            height: 30,
            vx: 0,
            vy: 0,
            speed: 5,
            jumpPower: -12,
            grounded: false,
            color: '#e74c3c'
        };

        this.platforms = [];
        this.gravity = 0.6;
        this.friction = 0.8;
        this.score = 0;
        this.cameraY = 0;
        this.gameOver = false;

        // Input
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Resize
        window.addEventListener('resize', () => this.resize());

        this.resize();
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
        if (this.running) this.draw();
    }

    start() {
        this.running = true;
        this.resetGame();
        this.loop();
    }

    resetGame() {
        this.player.x = this.canvas.width / 2 - 15;
        this.player.y = this.canvas.height - 100;
        this.player.vx = 0;
        this.player.vy = 0;
        this.score = 0;
        this.gameOver = false;

        // Generate Platforms
        this.platforms = [];
        // Ground
        this.platforms.push({ x: 0, y: this.canvas.height - 20, width: this.canvas.width, height: 20 });

        // Random Platforms upwards
        for (let i = 1; i < 20; i++) {
            this.platforms.push({
                x: Math.random() * (this.canvas.width - 100),
                y: this.canvas.height - (i * 100),
                width: 80 + Math.random() * 60,
                height: 15,
                moving: Math.random() > 0.8 // 20% moving platforms
            });
        }
    }

    update() {
        if (this.gameOver) return;

        // Controls
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.vx--;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.vx++;
        }
        if ((this.keys['ArrowUp'] || this.keys['Space'] || this.keys['KeyW']) && this.player.grounded) {
            this.player.vy = this.player.jumpPower;
            this.player.grounded = false;
        }

        // Physics
        this.player.vx *= this.friction;
        this.player.vy += this.gravity;

        this.player.x += this.player.vx;
        this.player.y += this.player.vy;

        // Floor Collision (Game Over if fell too far)
        if (this.player.y > this.canvas.height + 500) { // Off screen bottom
            this.endGame();
        }

        // Screen Wrap? Or Walls? Let's do walls
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) this.player.x = this.canvas.width - this.player.width;

        // Platform Collision
        this.player.grounded = false;
        this.platforms.forEach(p => {
            // Update moving platforms
            if (p.moving) {
                if (!p.dir) p.dir = 1;
                p.x += p.dir * 2;
                if (p.x < 0 || p.x + p.width > this.canvas.width) p.dir *= -1;
            }

            // AABB Collision (Simple: only checking feet falling down)
            if (this.player.vy > 0 &&
                this.player.y + this.player.height > p.y &&
                this.player.y + this.player.height < p.y + p.height + 10 &&
                this.player.x + this.player.width > p.x &&
                this.player.x < p.x + p.width) {

                this.player.grounded = true;
                this.player.vy = 0;
                this.player.y = p.y - this.player.height;
            }
        });

        // Infinite Level Generation
        const highestPlat = this.platforms[this.platforms.length - 1];
        if (highestPlat.y > this.cameraY) {
            // Logic to add more platforms if we go higher, simplistic for now
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Camera Follow Y (keep player in middleish)
        // this.cameraY = -this.player.y + this.canvas.height / 2;
        // Simple View: static for this demo or scroll? 
        // Let's keep it simple: player moves, if player goes high, move everything down?
        // Implementing simple "Infinite Jumper" style scroll
        if (this.player.y < this.canvas.height / 2) {
            const diff = (this.canvas.height / 2) - this.player.y;
            this.player.y += diff;
            this.platforms.forEach(p => p.y += diff);
            this.score += Math.floor(diff);

            // Recycle platforms
            this.platforms = this.platforms.filter(p => p.y < this.canvas.height);
            while (this.platforms.length < 10) {
                const lastY = this.platforms[this.platforms.length - 1].y;
                this.platforms.push({
                    x: Math.random() * (this.canvas.width - 100),
                    y: lastY - 100,
                    width: 80 + Math.random() * 60,
                    height: 15,
                    moving: Math.random() > 0.8
                });
            }
        }

        // Draw Platforms
        this.ctx.fillStyle = '#27ae60';
        this.platforms.forEach(p => {
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
        });

        // Draw Player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);

        this.ctx.restore();
    }

    endGame() {
        this.gameOver = true;
        setTimeout(() => {
            alert(`Game Over! Score: ${this.score}`);
            this.resetGame();
        }, 100);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // Touch Controls for Mobile
    bindMobileControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            if (this.canvas.width / 2 > touch.clientX) this.keys['ArrowLeft'] = true;
            else this.keys['ArrowRight'] = true;
            this.keys['ArrowUp'] = true; // Auto jump on touch? or both?
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['ArrowLeft'] = false;
            this.keys['ArrowRight'] = false;
            this.keys['ArrowUp'] = false;
        });
    }
}
