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
        this.applyTheme();
        this.lastTime = performance.now();
        this.loop();
    }

    applyTheme() {
        // Default
        this.theme = {
            resource: "Coins",
            bg: '#2c3e50',
            text: '#fff',
            clickColor: '#f1c40f',
            upgrades: [
                { name: "Better Clicks", type: 'click' },
                { name: "Auto Clicker", type: 'auto' },
                { name: "Factory", type: 'auto' },
                { name: "Mine", type: 'auto' }
            ]
        };

        const name = this.config.name.toLowerCase();

        if (name.includes('cookie') || name.includes('sweet')) {
            this.theme.resource = "Cookies";
            this.theme.bg = '#d35400';
            this.theme.clickColor = '#e67e22';
            this.theme.upgrades = [
                { name: "Extra Chips", type: 'click' },
                { name: "Grandma", type: 'auto' },
                { name: "Bakery", type: 'auto' },
                { name: "Cookie Factory", type: 'auto' }
            ];
        } else if (name.includes('tech') || name.includes('cyber') || name.includes('bit')) {
            this.theme.resource = "Bits";
            this.theme.bg = '#000000';
            this.theme.text = '#00ff00';
            this.theme.clickColor = '#00ff00';
            this.theme.upgrades = [
                { name: "Faster CPU", type: 'click' },
                { name: "Bot Net", type: 'auto' },
                { name: "Server Farm", type: 'auto' },
                { name: "Quantum Core", type: 'auto' }
            ];
        } else if (name.includes('magic') || name.includes('mana')) {
            this.theme.resource = "Mana";
            this.theme.bg = '#2c003e'; // Dark Purple
            this.theme.text = '#d1c4e9';
            this.theme.clickColor = '#9b59b6';
            this.theme.upgrades = [
                { name: "Wand Polish", type: 'click' },
                { name: "Apprentice", type: 'auto' },
                { name: "Mana Well", type: 'auto' },
                { name: "Void Siphon", type: 'auto' }
            ];
        } else if (name.includes('farm') || name.includes('crop')) {
            this.theme.resource = "Crops";
            this.theme.bg = '#27ae60';
            this.theme.clickColor = '#f1c40f';
            this.theme.upgrades = [
                { name: "Better Tools", type: 'click' },
                { name: "Farmhand", type: 'auto' },
                { name: "Tractor", type: 'auto' },
                { name: "Greenhouse", type: 'auto' }
            ];
        }

        // Apply names to existing upgrade structure (keeping costs/ids same for simplicity)
        this.upgrades.forEach((u, i) => {
            if (this.theme.upgrades[i]) {
                u.name = this.theme.upgrades[i].name;
            }
        });
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
        // Clear & BG Theme
        this.ctx.fillStyle = this.theme ? this.theme.bg : '#2c3e50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Main Area
        this.ctx.fillStyle = this.theme ? this.theme.text : '#fff';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(this.resources)}`, (this.canvas.width - 220) / 2, this.canvas.height / 2);

        this.ctx.font = '20px Arial';
        this.ctx.fillText(this.theme ? this.theme.resource : "Coins", (this.canvas.width - 220) / 2, this.canvas.height / 2 + 30);
        this.ctx.fillText(`+${this.autoRate}/sec`, (this.canvas.width - 220) / 2, this.canvas.height / 2 + 60);

        this.ctx.font = 'italic 16px Arial';
        this.ctx.fillStyle = this.theme ? this.theme.text : '#95a5a6'; // Use theme text color for visibility
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillText("Tap anywhere to earn!", (this.canvas.width - 220) / 2, this.canvas.height - 50);
        this.ctx.globalAlpha = 1.0;

        // Sidebar (Upgrades)
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)'; // Darker overlay for sidebar
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
            this.ctx.fillStyle = this.theme ? this.theme.clickColor : '#f1c40f';
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

    bindMobileControls() { }
}
