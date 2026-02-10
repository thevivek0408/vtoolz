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
        // Neon Night Sky Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(1, '#302b63');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid / Horizon sun effect
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.height; i += 40) {
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
        }
        this.ctx.stroke();

        const roadLeft = (this.canvas.width - this.roadWidth) / 2;

        // Road with glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#000';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(roadLeft, 0, this.roadWidth, this.canvas.height);
        this.ctx.shadowBlur = 0;

        // Road borders (Neon)
        this.ctx.fillStyle = '#ff00de'; // Neon Pink border
        this.ctx.fillRect(roadLeft - 5, 0, 5, this.canvas.height);
        this.ctx.fillRect(roadLeft + this.roadWidth, 0, 5, this.canvas.height);

        // Rolling Lane Markers
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const markerH = 60;
        const gap = 60;
        const effectiveOffset = this.roadY % (markerH + gap);

        for (let y = -100; y < this.canvas.height; y += markerH + gap) {
            this.ctx.fillRect(roadLeft + 100 - 3, y + effectiveOffset, 6, markerH);
            this.ctx.fillRect(roadLeft + 200 - 3, y + effectiveOffset, 6, markerH);
        }

        // Player Car (Retro Supercar)
        this.drawCar(this.player.x, this.player.y, '#00f2ff', true); // Cyan Hero Car

        // Traffic
        this.traffic.forEach(car => {
            this.drawCar(car.x, car.y, car.color, false);
        });

        // Speed lines effect
        if (this.speed > 500) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * this.canvas.width;
                const len = Math.random() * 50 + 20;
                const y = Math.random() * this.canvas.height;
                this.ctx.moveTo(x, y);
                this.ctx.lineTo(x, y + len);
            }
            this.ctx.stroke();
        }
    }

    drawCar(x, y, color, isPlayer) {
        this.ctx.save();

        // Glow if player
        if (isPlayer) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
        }

        // Chassis
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y);
        this.ctx.lineTo(x + this.carWidth - 5, y);
        this.ctx.lineTo(x + this.carWidth, y + 20);
        this.ctx.lineTo(x + this.carWidth, y + this.carHeight - 5);
        this.ctx.quadraticCurveTo(x + this.carWidth, y + this.carHeight, x + this.carWidth - 5, y + this.carHeight);
        this.ctx.lineTo(x + 5, y + this.carHeight);
        this.ctx.quadraticCurveTo(x, y + this.carHeight, x, y + this.carHeight - 5);
        this.ctx.lineTo(x, y + 20);
        this.ctx.closePath();
        this.ctx.fill();

        // Racing Stripes
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(x + this.carWidth / 2 - 5, y, 10, this.carHeight);

        // Windshield (Blacked out)
        this.ctx.fillStyle = '#111';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + 20);
        this.ctx.lineTo(x + this.carWidth - 5, y + 20);
        this.ctx.lineTo(x + this.carWidth - 8, y + 35);
        this.ctx.lineTo(x + 8, y + 35);
        this.ctx.closePath();
        this.ctx.fill();

        // Rear window
        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, y + 55);
        this.ctx.lineTo(x + this.carWidth - 8, y + 55);
        this.ctx.lineTo(x + this.carWidth - 5, y + 70);
        this.ctx.lineTo(x + 5, y + 70);
        this.ctx.closePath();
        this.ctx.fill();

        // Lights
        if (isPlayer) {
            // Tail lights (Red)
            this.ctx.fillStyle = '#ff0000';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.fillRect(x + 5, y + this.carHeight - 5, 10, 3);
            this.ctx.fillRect(x + this.carWidth - 15, y + this.carHeight - 5, 10, 3);
        } else {
            // Headlights (Yellow/White) - facing us? Traffic moves same way? 
            // Usually in these games we see rear of traffic too.
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(x + 5, y + this.carHeight - 5, 10, 3);
            this.ctx.fillRect(x + this.carWidth - 15, y + this.carHeight - 5, 10, 3);
        }

        this.ctx.restore();
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
