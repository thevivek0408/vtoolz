class VoidRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game State
        this.fov = 300;
        this.cameraZ = 0;
        this.speed = 40;
        this.score = 0;
        this.isRunning = false;
        this.gridOffset = 0;

        // Ship
        this.ship = {
            x: 0,
            y: 0,
            targetX: 0,
            tilt: 0
        };

        this.cubes = [];
        this.particles = [];

        // Input
        const handleInput = (x) => {
            // Map 0..width to -1000..1000
            const norm = (x / this.width) * 2 - 1;
            this.ship.targetX = norm * 1500;
        };

        document.addEventListener('mousemove', e => handleInput(e.clientX));
        document.addEventListener('touchmove', e => {
            e.preventDefault();
            handleInput(e.touches[0].clientX);
        }, { passive: false });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
    }

    start() {
        this.cubes = [];
        this.particles = [];
        this.cameraZ = 0;
        this.score = 0;
        this.speed = 40;
        this.isRunning = true;
        this.ship.x = 0;

        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');

        // Pre-spawn
        for (let z = 1000; z < 10000; z += 500) this.spawnObstacles(z);

        this.loop();
    }

    spawnObstacles(z) {
        // Random patterns
        const r = Math.random();
        if (r < 0.3) {
            // Tunnel (Left and Right walls)
            this.cubes.push({ x: -600, y: -200, z: z, w: 200, h: 1000, color: '#f0f' });
            this.cubes.push({ x: 600, y: -200, z: z, w: 200, h: 1000, color: '#f0f' });
        } else if (r < 0.6) {
            // Center block
            this.cubes.push({ x: 0, y: 0, z: z, w: 200, h: 200, color: '#0ff' });
        } else {
            // Random scatter
            for (let i = 0; i < 3; i++) {
                this.cubes.push({
                    x: (Math.random() - 0.5) * 2000,
                    y: 0,
                    z: z + Math.random() * 200,
                    w: 100 + Math.random() * 100,
                    h: 100 + Math.random() * 100,
                    color: `hsl(${Math.random() * 60 + 280}, 100%, 50%)`
                });
            }
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.speed += 0.05;
        this.cameraZ += this.speed;
        this.gridOffset = (this.gridOffset + this.speed) % 200; // For grid lines
        this.score = Math.floor(this.cameraZ / 100);
        this.scoreEl.innerText = this.score;

        // Ship Params
        const dx = this.ship.targetX - this.ship.x;
        this.ship.x += dx * 0.1;
        this.ship.tilt = dx * 0.05; // Visual tilt

        // Clean old
        this.cubes = this.cubes.filter(c => c.z > this.cameraZ - 500);

        // Spawn new
        const lastZ = this.cubes.length ? this.cubes[this.cubes.length - 1].z : 0;
        if (lastZ < this.cameraZ + 5000) {
            this.spawnObstacles(lastZ + 800);
        }

        // Collision
        const shipRealZ = this.cameraZ + 200; // Ship is closer to camera? No, fixed dist.
        // Let's assume ship is a box at (ship.x, 0, shipRealZ) with size 50.

        this.cubes.forEach(c => {
            // Depth check
            // Object z is world coord.
            if (c.z < shipRealZ + 50 && c.z + 100 > shipRealZ - 50) { // depth overlap
                // X overlap
                // c.x is center?
                // Let's assume c.x is center.
                const buffer = (c.w / 2) + 30; // ship radius ~30
                if (Math.abs(c.x - this.ship.x) < buffer) {
                    this.gameOver();
                }
            }
        });
    }

    project(x, y, z) {
        const dist = z - this.cameraZ;
        if (dist <= 0) return null;
        const scale = this.fov / dist;
        return {
            x: this.cx + (x * scale),
            y: this.cy + ((y + 150) * scale), // +150 to lower world (camera is high)
            s: scale
        };
    }

    draw() {
        // Clear
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        grad.addColorStop(0, '#000020');
        grad.addColorStop(1, '#200020');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Sun
        this.ctx.fillStyle = '#ff00de';
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy - 50, 200, 0, Math.PI * 2);
        this.ctx.fill();

        // Mountain silhouette? (Optional, maybe just horizon)
        this.ctx.fillStyle = '#100010';
        this.ctx.fillRect(0, this.cy, this.width, this.height / 2);

        // Grid
        const horizon = this.cy;
        this.ctx.strokeStyle = '#f0f';
        this.ctx.lineWidth = 2;

        // Vertical lines (Perspective)
        this.ctx.beginPath();
        for (let i = -2000; i <= 2000; i += 200) {
            const p1 = this.project(i, 0, this.cameraZ + 10);
            const p2 = this.project(i, 0, this.cameraZ + 2000);
            if (p1 && p2) {
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
            }
        }
        this.ctx.stroke();

        // Horizontal lines (Moving)
        this.ctx.beginPath();
        // Start from rounded cameraZ to keep grid stuck to world
        const startZ = Math.floor(this.cameraZ / 200) * 200;
        for (let z = startZ; z < this.cameraZ + 2000; z += 200) {
            const p1 = this.project(-2000, 0, z);
            const p2 = this.project(2000, 0, z);
            if (p1 && p2) {
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
            }
        }
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
        this.ctx.stroke();

        // Objects
        this.cubes.sort((a, b) => b.z - a.z);

        this.cubes.forEach(c => {
            const p = this.project(c.x, c.y, c.z);
            if (!p) return;

            const w = c.w * p.s;
            const h = (c.h || c.w) * p.s;

            // Neon Box
            this.ctx.strokeStyle = c.color;
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';

            const bx = p.x - w / 2;
            const by = p.y - h; // ground is bottom

            this.ctx.fillRect(bx, by, w, h);
            this.ctx.strokeRect(bx, by, w, h);

            // X? for tech look
            this.ctx.beginPath();
            this.ctx.moveTo(bx, by); this.ctx.lineTo(bx + w, by + h);
            this.ctx.moveTo(bx + w, by); this.ctx.lineTo(bx, by + h);
            this.ctx.stroke();
        });

        // Ship
        // Render 2D on top for sharpness
        const sx = this.cx + (this.ship.x - 0) * 0.2; // slight parallax? No, ship is locked to screen X essentially?
        // Let's use ship X directly relative to screen center? 
        // No, current logic: ship.targetX is in -1500..1500 space.
        // We project objects.
        // Let's project ship too.
        const pShip = this.project(this.ship.x, 0, this.cameraZ + 200);
        if (pShip) {
            this.ctx.save();
            this.ctx.translate(pShip.x, pShip.y - 20);
            this.ctx.rotate(this.ship.tilt * 0.002); // radians

            // Draw Viper
            this.ctx.fillStyle = '#0ff';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#0ff';

            this.ctx.beginPath();
            this.ctx.moveTo(0, -20);
            this.ctx.lineTo(30, 20);
            this.ctx.lineTo(0, 10);
            this.ctx.lineTo(-30, 20);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
}
window.game = new VoidRunner();
