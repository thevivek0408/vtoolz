class TunnelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.angle = 0;
        this.speed = 0.05;
        this.playerPos = 0; // -1 to 1? Or 0 to 2PI?
        // Let's use discreet lanes for Tempest style
        this.lanes = 16;
        this.laneStep = (Math.PI * 2) / this.lanes;
        this.playerLane = 0;

        this.obstacles = []; // {lane, depth}

        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.playerLane = (this.playerLane - 1 + this.lanes) % this.lanes;
            if (e.key === 'ArrowRight') this.playerLane = (this.playerLane + 1) % this.lanes;
        });

        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2;
    }

    loop() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Tunnel Segments
        // We move 'forward' by expanding rings?
        // Actually usually tunnel is fixed grid + moving obstacles.

        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 1;

        // Radial Lines
        for (let i = 0; i < this.lanes; i++) {
            const a = i * this.laneStep + this.angle;
            const x = Math.cos(a) * 500 + this.cx;
            const y = Math.sin(a) * 500 + this.cy;
            this.ctx.beginPath();
            this.ctx.moveTo(this.cx, this.cy);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }

        // Depth Rings
        // Simulate motion by expanding radii
        const rings = 10;
        const time = Date.now() * 0.001 * this.speed * 20;

        for (let j = 0; j < rings; j++) {
            // Logarithmic scale for depth?
            const d = (j + (time % 1)); // 0..10
            const r = Math.pow(d, 2) * 5; // Exponential expansion

            this.ctx.beginPath();
            this.ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(52, 152, 219, ${d / 10})`;
            this.ctx.stroke();

            // Draw "webs" at this depth
            /*
            for(let i=0; i<this.lanes; i++) {
                const a = i * this.laneStep + this.angle;
                // cross line?
            }
            */
        }

        // Obstacles spawning
        if (Math.random() < 0.02) {
            this.obstacles.push({ lane: Math.floor(Math.random() * this.lanes), depth: 0, color: '#e74c3c' });
        }

        // Update Obstacles
        this.obstacles.forEach(o => {
            o.depth += 0.01;
        });
        this.obstacles = this.obstacles.filter(o => o.depth < 1.2);

        // Draw Obstacles
        this.obstacles.forEach(o => {
            const r = Math.pow(o.depth * 10, 2) * 5;
            const a = o.lane * this.laneStep + this.angle;

            // Draw geometric shape on lane
            const x = Math.cos(a) * r + this.cx;
            const y = Math.sin(a) * r + this.cy;

            // It should fill the lane segment roughly
            const size = r * 0.2;

            this.ctx.fillStyle = o.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Collision check with player?
            // Player is at depth 10 (outer rim)
            if (o.depth > 0.9 && o.depth < 1.1) {
                if (o.lane === this.playerLane) {
                    // Hit
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); // Flash
                }
            }
        });

        // Draw Player Ship (Claw)
        const pR = Math.pow(10, 2) * 5; // Outer rim radius approx
        const pA = this.playerLane * this.laneStep + this.angle;

        const px = Math.cos(pA) * pR + this.cx; // Screen is probably not big enough for r=500
        // Wait, max r in loop: 10^2 * 5 = 500.
        // If window is small, 500 might be outside.
        // Let's constrain R to min(w,h)/2.

        // Let's re-calc maxR dynamically
        const maxR = Math.min(this.canvas.width, this.canvas.height) / 2 - 20;

        // Actually, let's just scale everything.
        // Rewrite drawing loop slightly to use maxR

        // Draw Player finally
        const playerX = Math.cos(pA) * maxR + this.cx;
        const playerY = Math.sin(pA) * maxR + this.cy;

        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(playerX, playerY, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Connector to center
        this.ctx.strokeStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.moveTo(playerX, playerY);
        this.ctx.lineTo(this.cx, this.cy);
        this.ctx.stroke();

        requestAnimationFrame(() => this.loop());
    }
}
window.game = new TunnelGame();
