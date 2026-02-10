class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.speedEl = document.getElementById('speed');
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.finalScoreEl = document.getElementById('finalScore');

        this.roadWidth = 300;
        this.laneWidth = 100;
        this.carWidth = 50;
        this.carHeight = 90;

        this.player = { x: 0, y: 0, speedX: 0 };
        this.traffic = [];
        this.roadY = 0;
        this.score = 0;
        this.speed = 0;
        this.isRunning = false;
        this.keys = { left: false, right: false };

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Controls
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
        });

        // Touch Controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', () => { this.keys.left = false; this.keys.right = false; });
    }

    handleTouch(e) {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const width = window.innerWidth;
        if (touchX < width / 2) {
            this.keys.left = true;
            this.keys.right = false;
        } else {
            this.keys.right = true;
            this.keys.left = false;
        }
    }

    resize() {
        // limit canvas width for better playability logic, but scale visually
        this.canvas.width = Math.min(window.innerWidth, 400);
        this.canvas.height = window.innerHeight - 70;

        // Reset player pos
        this.player.y = this.canvas.height - 150;
        this.player.x = this.canvas.width / 2 - this.carWidth / 2;
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.speed = 400; // pixels per second equiv
        this.traffic = [];
        this.scoreEl.textContent = 0;
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(now) {
        if (!this.isRunning) return;

        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Increase difficulty
        this.speed += dt * 10;
        this.score += Math.floor(this.speed * dt * 0.1);
        this.scoreEl.textContent = this.score;
        this.speedEl.textContent = Math.floor(this.speed / 10);

        // Move Road
        this.roadY += this.speed * dt;
        if (this.roadY > 50) this.roadY = 0; // seamless loop strip

        // Player Movement
        const moveSpeed = 300;
        if (this.keys.left) this.player.x -= moveSpeed * dt;
        if (this.keys.right) this.player.x += moveSpeed * dt;

        // Boundaries
        const roadLeft = (this.canvas.width - this.roadWidth) / 2;
        const roadRight = roadLeft + this.roadWidth;

        if (this.player.x < roadLeft) this.player.x = roadLeft;
        if (this.player.x + this.carWidth > roadRight) this.player.x = roadRight - this.carWidth;

        // Spawn Traffic
        if (this.traffic.length === 0 || this.traffic[this.traffic.length - 1].y > 250) {
            if (Math.random() < 0.02) {
                const lane = Math.floor(Math.random() * 3); // 0, 1, 2
                const laneX = roadLeft + (lane * 100) + (50 - this.carWidth / 2); // center in lane
                this.traffic.push({
                    x: laneX,
                    y: -100,
                    speed: this.speed * 0.5 + Math.random() * 100,
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                });
            }
        }

        // Move Traffic
        for (let i = this.traffic.length - 1; i >= 0; i--) {
            const car = this.traffic[i];
            car.y += (this.speed - car.speed + 150) * dt; // relative speed

            if (car.y > this.canvas.height) {
                this.traffic.splice(i, 1);
            }

            // Collision
            // Simple AABB
            if (
                this.player.x < car.x + this.carWidth &&
                this.player.x + this.carWidth > car.x &&
                this.player.y < car.y + this.carHeight &&
                this.player.y + this.carHeight > car.y
            ) {
                this.gameOver();
            }
        }
    }

    draw() {
        this.ctx.fillStyle = '#27ae60'; // Grass
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const roadLeft = (this.canvas.width - this.roadWidth) / 2;

        // Road
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(roadLeft, 0, this.roadWidth, this.canvas.height);

        // Lane markers
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.globalAlpha = 0.5;
        const markerH = 50;
        const gap = 50;
        const offset = this.roadY; // move logic handled in update, but actually easier here to just offset visuals?
        // No, roadY accumulates. 
        const effectiveOffset = this.roadY % (markerH + gap);

        for (let y = -100; y < this.canvas.height; y += markerH + gap) {
            // Lane 1 divider
            this.ctx.fillRect(roadLeft + 100 - 5, y + effectiveOffset, 10, markerH);
            // Lane 2 divider
            this.ctx.fillRect(roadLeft + 200 - 5, y + effectiveOffset, 10, markerH);
        }
        this.ctx.globalAlpha = 1.0;

        // Player Car
        this.drawCar(this.player.x, this.player.y, '#e74c3c');

        // Traffic
        this.traffic.forEach(car => {
            this.drawCar(car.x, car.y, car.color);
        });
    }

    drawCar(x, y, color) {
        this.ctx.fillStyle = color;
        // Main body
        this.ctx.fillRect(x, y, this.carWidth, this.carHeight);

        // Roof/Windshield
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.fillRect(x + 5, y + 20, this.carWidth - 10, 20); // windshield
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(x + 5, y + 40, this.carWidth - 10, 30); // roof

        // Headlights / Taillights depending on pos? 
        // We see rear of player, front of traffic?
        // Simple generic lights
        this.ctx.fillStyle = '#f1c40f'; // headlights
        this.ctx.fillRect(x + 3, y, 10, 5);
        this.ctx.fillRect(x + this.carWidth - 13, y, 10, 5);
    }

    gameOver() {
        this.isRunning = false;
        this.finalScoreEl.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }
}

window.onload = () => {
    window.game = new RacingGame();
};
