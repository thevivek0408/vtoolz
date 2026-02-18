export default class IdleEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Game State
        this.resources = 0; // "Coins"
        this.clickValue = 1;
        this.autoRate = 0; // Per second

        this.lastTime = 0;
        this.accumulatedTime = 0;

        // Upgrades
        this.upgrades = [
            { id: 1, name: "Better Clicks", cost: 10, count: 0, mult: 1, type: 'click' },
            { id: 2, name: "Auto Clicker", cost: 50, count: 0, fps: 1, type: 'auto' },
            { id: 3, name: "Factory", cost: 200, count: 0, fps: 5, type: 'auto' },
            { id: 4, name: "Mine", cost: 1000, count: 0, fps: 25, type: 'auto' }
        ];

        // Visuals
        this.particles = []; // Little numbers popping up

        // Input
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        }, { passive: false });

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
        this.lastTime = performance.now();
        this.loop();
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check UI Buttons (Right Side)
        const uiX = this.canvas.width - 220;
        if (x > uiX) {
            this.checkUpgrades(x, y);
            return;
        }

        // Main Click Area (Left Side)
        this.click();
        this.spawnParticle(x, y, `+${this.clickValue}`);
    }

    click() {
        this.resources += this.clickValue;
        // Animation trigger? 
    }

    checkUpgrades(x, y) {
        let startY = 100;
        this.upgrades.forEach(u => {
            if (x > this.canvas.width - 210 && x < this.canvas.width - 10 &&
                y > startY && y < startY + 50) {
                this.buyUpgrade(u);
            }
            startY += 60;
        });
    }

    buyUpgrade(u) {
        if (this.resources >= u.cost) {
            this.resources -= u.cost;
            u.count++;
            u.cost = Math.floor(u.cost * 1.5);

            if (u.type === 'click') this.clickValue += u.mult;
            if (u.type === 'auto') this.autoRate += u.fps;
        }
    }

    spawnParticle(x, y, text) {
        this.particles.push({
            x, y, text,
            life: 1.0,
            vy: -2
        });
    }

    update(dt) {
        // Auto Resources
        this.accumulatedTime += dt;
        if (this.accumulatedTime >= 1000) {
            this.resources += this.autoRate;
            this.accumulatedTime -= 1000;
            if (this.autoRate > 0) this.spawnParticle(this.canvas.width / 2, this.canvas.height / 2, `+${this.autoRate}`);
        }

        // Particles
        this.particles.forEach(p => {
            p.y += p.vy;
            p.life -= dt / 1000;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Main Area
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(this.resources)}`, (this.canvas.width - 220) / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText("Coins", (this.canvas.width - 220) / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText(`+${this.autoRate}/sec`, (this.canvas.width - 220) / 2, this.canvas.height / 2 + 60);

        this.ctx.font = 'italic 16px Arial';
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.fillText("Tap anywhere to earn!", (this.canvas.width - 220) / 2, this.canvas.height - 50);

        // Sidebar (Upgrades)
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(this.canvas.width - 220, 0, 220, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText("Upgrades", this.canvas.width - 200, 40);

        let startY = 100;
        this.upgrades.forEach(u => {
            // Button Bg
            this.ctx.fillStyle = this.resources >= u.cost ? '#27ae60' : '#7f8c8d';
            this.ctx.fillRect(this.canvas.width - 210, startY, 200, 50);

            // Text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(u.name, this.canvas.width - 200, startY + 20);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`Cost: ${u.cost} | Lvl: ${u.count}`, this.canvas.width - 200, startY + 40);

            startY += 60;
        });

        // Particles
        this.ctx.textAlign = 'center';
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(p.text, p.x, p.y);
        });
        this.ctx.globalAlpha = 1.0;
    }

    loop(timestamp) {
        if (!this.running) return;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt || 0);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    // Stub
    bindMobileControls() { }
}
