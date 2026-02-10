class Raycaster {
    constructor() {
        this.canvas = document.getElementById('screen');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize
        this.ctx.imageSmoothingEnabled = false; // Retro look

        this.w = 640;
        this.h = 360;
        this.canvas.width = this.w;
        this.canvas.height = this.h;

        // Map
        this.mapW = 16;
        this.mapH = 16;
        this.map = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1,
            1, 0, 0, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,
            1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];

        this.posX = 8.5; this.posY = 8.5;
        this.dirX = -1; this.dirY = 0;
        this.planeX = 0; this.planeY = 0.66;

        this.enemies = [];
        this.initEnemies();

        // Textures
        this.texSize = 64;
        this.textures = [];
        this.generateTextures();

        this.keys = { up: false, down: false, left: false, right: false, shoot: false };

        document.addEventListener('keydown', e => this.key(e, true));
        document.addEventListener('keyup', e => this.key(e, false));

        this.lastTime = 0;
        this.shootCooldown = 0;
        this.flash = 0;
        this.bob = 0;

        requestAnimationFrame(t => this.loop(t));
    }

    generateTextures() {
        // 0: Stone Wall, 1: Metal Wall, 2: Crate/Wood, 3: Tech
        const createTex = (color, type) => {
            const c = document.createElement('canvas');
            c.width = this.texSize; c.height = this.texSize;
            const ctx = c.getContext('2d');

            // Base
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 64, 64);

            // Noise / Detail
            if (type === 'stone') {
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)';
                    const s = Math.random() * 10;
                    ctx.fillRect(Math.random() * 64, Math.random() * 64, s, s);
                }
                // Bricks pattern
                ctx.strokeStyle = 'rgba(0,0,0,0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let y = 0; y <= 64; y += 16) {
                    ctx.moveTo(0, y); ctx.lineTo(64, y);
                    for (let x = 0; x <= 64; x += 16) {
                        const off = (y % 32 === 0) ? 0 : 8;
                        ctx.moveTo(x + off, y); ctx.lineTo(x + off, y + 16);
                    }
                }
                ctx.stroke();
            } else if (type === 'tech') {
                ctx.fillStyle = '#444';
                ctx.fillRect(2, 2, 60, 60);
                ctx.fillStyle = '#666';
                ctx.fillRect(4, 4, 56, 56);
                // Glowing vent
                ctx.fillStyle = '#9b59b6';
                for (let y = 10; y < 54; y += 6) ctx.fillRect(10, y, 44, 2);

                ctx.strokeStyle = '#0ff';
                ctx.strokeRect(0, 0, 64, 64);
            }

            return c;
        };

        this.textures[0] = createTex('#7f8c8d', 'stone'); // Default Stone
        this.textures[1] = createTex('#95a5a6', 'stone'); // Lighter Stone
        this.textures[2] = createTex('#2c3e50', 'tech');  // Tech Wall
        this.textures[3] = createTex('#e67e22', 'stone'); // Wood-ish
    }

    initEnemies() {
        this.enemies = []; // clear first
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                if (this.map[y * this.mapW + x] === 2) {
                    this.enemies.push({ x: x + 0.5, y: y + 0.5, alive: true, health: 100, hit: 0 });
                    this.map[y * this.mapW + x] = 0;
                }
            }
        }
    }

    key(e, state) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = state;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = state;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = state;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = state;
        if (e.code === 'Space' || e.code === 'ControlLeft') {
            if (state && !this.keys.shoot) this.shoot();
            this.keys.shoot = state;
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return;
        this.shootCooldown = 15;
        this.flash = 5;

        // Sound effect placeholder
        // Check hit logic
        this.enemies.forEach(e => {
            if (!e.alive) return;
            const dx = e.x - this.posX;
            const dy = e.y - this.posY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const dot = this.dirX * (dx / dist) + this.dirY * (dy / dist);

            // Cone of fire logic
            if (dot > 0.98 && dist < 10) { // Precision
                // Raycast to check walls?
                // Simple version: just hit
                e.hit = 5;
                e.health -= 50;
                if (e.health <= 0) e.alive = false;
            }
        });
    }

    loop(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.flash > 0) this.flash--;

        this.update(dt);
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        const moveSpeed = 4.0 * dt;
        const rotSpeed = 2.5 * dt;

        let moving = false;

        if (this.keys.up) {
            if (this.map[Math.floor(this.posX + this.dirX * moveSpeed) + Math.floor(this.posY) * this.mapW] === 0)
                this.posX += this.dirX * moveSpeed;
            if (this.map[Math.floor(this.posX) + Math.floor(this.posY + this.dirY * moveSpeed) * this.mapW] === 0)
                this.posY += this.dirY * moveSpeed;
            moving = true;
        }
        if (this.keys.down) {
            if (this.map[Math.floor(this.posX - this.dirX * moveSpeed) + Math.floor(this.posY) * this.mapW] === 0)
                this.posX -= this.dirX * moveSpeed;
            if (this.map[Math.floor(this.posX) + Math.floor(this.posY - this.dirY * moveSpeed) * this.mapW] === 0)
                this.posY -= this.dirY * moveSpeed;
            moving = true;
        }

        if (moving) {
            this.bob += dt * 10;
        } else {
            this.bob = 0;
        }

        if (this.keys.right) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(-rotSpeed) - this.dirY * Math.sin(-rotSpeed);
            this.dirY = oldDirX * Math.sin(-rotSpeed) + this.dirY * Math.cos(-rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(-rotSpeed) - this.planeY * Math.sin(-rotSpeed);
            this.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.planeY * Math.cos(-rotSpeed);
        }
        if (this.keys.left) {
            const oldDirX = this.dirX;
            this.dirX = this.dirX * Math.cos(rotSpeed) - this.dirY * Math.sin(rotSpeed);
            this.dirY = oldDirX * Math.sin(rotSpeed) + this.dirY * Math.cos(rotSpeed);
            const oldPlaneX = this.planeX;
            this.planeX = this.planeX * Math.cos(rotSpeed) - this.planeY * Math.sin(rotSpeed);
            this.planeY = oldPlaneX * Math.sin(rotSpeed) + this.planeY * Math.cos(rotSpeed);
        }
    }

    draw() {
        // Floor & Ceiling (Gradients)
        const gradSky = this.ctx.createLinearGradient(0, 0, 0, this.h / 2);
        gradSky.addColorStop(0, '#111'); gradSky.addColorStop(1, '#222');
        this.ctx.fillStyle = gradSky;
        this.ctx.fillRect(0, 0, this.w, this.h / 2);

        const gradFloor = this.ctx.createLinearGradient(0, this.h / 2, 0, this.h);
        gradFloor.addColorStop(0, '#2c3e50'); gradFloor.addColorStop(1, '#111');
        this.ctx.fillStyle = gradFloor;
        this.ctx.fillRect(0, this.h / 2, this.w, this.h / 2);

        const zBuffer = new Array(this.w).fill(0);

        // Raycast
        for (let x = 0; x < this.w; x++) {
            const cameraX = 2 * x / this.w - 1;
            const rayDirX = this.dirX + this.planeX * cameraX;
            const rayDirY = this.dirY + this.planeY * cameraX;

            let mapX = Math.floor(this.posX);
            let mapY = Math.floor(this.posY);
            let sideDistX, sideDistY, perpWallDist;
            let stepX, stepY;
            let hit = 0, side;

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);

            if (rayDirX < 0) { stepX = -1; sideDistX = (this.posX - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1.0 - this.posX) * deltaDistX; }
            if (rayDirY < 0) { stepY = -1; sideDistY = (this.posY - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1.0 - this.posY) * deltaDistY; }

            while (hit === 0) {
                if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
                else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
                if (this.map[mapX + mapY * this.mapW] > 0) hit = 1;
            }

            if (side === 0) perpWallDist = (mapX - this.posX + (1 - stepX) / 2) / rayDirX;
            else perpWallDist = (mapY - this.posY + (1 - stepY) / 2) / rayDirY;

            zBuffer[x] = perpWallDist;

            const lineHeight = Math.floor(this.h / perpWallDist);
            const drawStart = Math.max(0, -lineHeight / 2 + this.h / 2);
            // const drawEnd = Math.min(this.h - 1, lineHeight / 2 + this.h / 2); // Not needed for drawImage

            // Texture Calculation
            let texNum = this.map[mapX + mapY * this.mapW] - 1;
            if (texNum > 3) texNum = 0; // safe
            if (texNum < 0) texNum = 0;
            if (texNum === 0 && side === 1) texNum = 1; // alternate stone for shading

            let wallX; // where exactly the wall was hit
            if (side === 0) wallX = this.posY + perpWallDist * rayDirY;
            else wallX = this.posX + perpWallDist * rayDirX;
            wallX -= Math.floor(wallX);

            let texX = Math.floor(wallX * this.texSize);
            if (side === 0 && rayDirX > 0) texX = this.texSize - texX - 1;
            if (side === 1 && rayDirY < 0) texX = this.texSize - texX - 1;

            // Shading (Distance + Side)
            const brightness = Math.max(0, 1.0 - (perpWallDist / 10)); // simple fog
            const shade = (side === 1) ? 0.7 : 1.0;

            // Draw Texture Strip
            this.ctx.globalAlpha = 1.0; // reset
            this.ctx.drawImage(
                this.textures[texNum],
                texX, 0, 1, this.texSize,
                x, drawStart, 1, lineHeight
            );

            // Apply Shadow
            if (brightness < 1.0 || side === 1) {
                this.ctx.fillStyle = `rgba(0,0,0,${1 - (brightness * shade)})`;
                this.ctx.fillRect(x, drawStart, 1, lineHeight);
            }
        }

        this.ctx.globalAlpha = 1.0;

        // Sprites (Enemies)
        this.enemies.forEach(e => {
            if (!e.alive) return;
            const spriteX = e.x - this.posX;
            const spriteY = e.y - this.posY;

            const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
            const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
            const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);

            if (transformY > 0) {
                const spriteScreenX = Math.floor((this.w / 2) * (1 + transformX / transformY));
                const spriteSize = Math.abs(Math.floor(this.h / transformY));
                const spriteTop = Math.floor(-spriteSize / 2 + this.h / 2);
                const spriteLeft = Math.floor(-spriteSize / 2 + spriteScreenX);

                if (transformY < zBuffer[Math.max(0, Math.min(this.w - 1, spriteScreenX))]) {
                    // Draw Enemy Monster
                    const flicker = e.hit > 0 ? (Math.random() > 0.5 ? 1 : 0) : 0;
                    if (flicker) this.ctx.globalCompositeOperation = 'lighter';

                    // Body
                    this.ctx.fillStyle = '#27ae60';
                    this.ctx.beginPath();
                    this.ctx.arc(spriteLeft + spriteSize / 2, spriteTop + spriteSize / 2, spriteSize / 2.5, 0, Math.PI * 2);
                    this.ctx.fill();

                    // Eyes (Glowing)
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#f00';
                    this.ctx.beginPath();
                    this.ctx.arc(spriteLeft + spriteSize * 0.35, spriteTop + spriteSize * 0.4, spriteSize * 0.08, 0, Math.PI * 2);
                    this.ctx.arc(spriteLeft + spriteSize * 0.65, spriteTop + spriteSize * 0.4, spriteSize * 0.08, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;

                    if (flicker) {
                        e.hit--;
                        this.ctx.globalCompositeOperation = 'source-over';
                    }
                }
            }
        });

        // Gun
        this.drawGun();

        // Damage Flash
        if (this.flash > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 0, ${this.flash * 0.1})`;
            this.ctx.fillRect(0, 0, this.w, this.h);
        }
    }

    drawGun() {
        const bobOffset = Math.sin(this.bob) * 10;
        const recoil = (this.shootCooldown > 12) ? 20 : 0;

        const gunW = 200;
        const gunH = 200;
        const gunX = this.w / 2 - gunW / 2;
        const gunY = this.h - gunH + bobOffset + recoil;

        // Sci-fi Gun
        this.ctx.fillStyle = '#555';
        this.ctx.fillRect(gunX + 60, gunY + 40, 80, 200); // Main Body

        // Highlight
        this.ctx.fillStyle = '#777';
        this.ctx.fillRect(gunX + 65, gunY + 40, 10, 200);

        // Barrel
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(gunX + 85, gunY + 40, 30, 20); // Muzzle hole area

        // Muzzle Flash
        if (this.shootCooldown > 12) {
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.beginPath();
            this.ctx.arc(this.w / 2, this.h - 180 + bobOffset, 30 + Math.random() * 20, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(this.w / 2, this.h - 180 + bobOffset, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Crosshair
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.w / 2 - 15, this.h / 2); this.ctx.lineTo(this.w / 2 + 15, this.h / 2);
        this.ctx.moveTo(this.w / 2, this.h / 2 - 15); this.ctx.lineTo(this.w / 2, this.h / 2 + 15);
        this.ctx.stroke();
    }
}
window.game = new Raycaster();
