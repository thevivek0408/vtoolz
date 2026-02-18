
export default class ArcadeEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Game State defaults
        this.score = 0;
        this.gameOver = false;

        // Snake Specifics
        this.gridSize = 20;
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = 100; // ms per move
        this.lastMoveTime = 0;

        // Resize Listener
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Input Setup
        this.setupControls();
    }

    resize() {
        // Fit Parent
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }

        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();

            // Prevent 180 turn
            if (e.key === 'ArrowUp' && this.direction !== 'down') this.nextDirection = 'up';
            else if (e.key === 'ArrowDown' && this.direction !== 'up') this.nextDirection = 'down';
            else if (e.key === 'ArrowLeft' && this.direction !== 'right') this.nextDirection = 'left';
            else if (e.key === 'ArrowRight' && this.direction !== 'left') this.nextDirection = 'right';
        });

        // Touch handling would be bound via bindMobileControls
    }

    bindMobileControls(controls) {
        const handle = (dir) => {
            if (dir === 'up' && this.direction !== 'down') this.nextDirection = 'up';
            if (dir === 'down' && this.direction !== 'up') this.nextDirection = 'down';
            if (dir === 'left' && this.direction !== 'right') this.nextDirection = 'left';
            if (dir === 'right' && this.direction !== 'left') this.nextDirection = 'right';
        };

        if (controls.up) controls.up.onclick = () => handle('up');
        if (controls.down) controls.down.onclick = () => handle('down');
        if (controls.left) controls.left.onclick = () => handle('left');
        if (controls.right) controls.right.onclick = () => handle('right');
    }

    start() {
        this.reset();
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    reset() {
        this.score = 0;
        this.gameOver = false;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];

        // Variant Logic
        this.speed = 100;
        if (this.config.name.includes('Fast') || this.config.name.includes('Speed')) this.speed = 50;
        if (this.config.name.includes('Slow')) this.speed = 150;

        // Maze Generation
        this.walls = [];
        if (this.config.name.includes('Maze') || this.config.name.includes('Obstacle')) {
            for (let i = 0; i < 15; i++) {
                this.walls.push({
                    x: Math.floor(Math.random() * this.cols),
                    y: Math.floor(Math.random() * this.rows)
                });
            }
        }

        this.spawnFood();
        this.updateUI();
    }

    spawnFood() {
        // Random pos, avoid walls and snake
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y) &&
                !this.walls.some(w => w.x === this.food.x && w.y === this.food.y);
        }
    }

    updateUI() {
        const el = document.getElementById('score-display');
        if (el) el.innerText = `Score: ${this.score}`;
    }

    loop(timestamp) {
        if (!this.running) return;
        requestAnimationFrame((t) => this.loop(t));

        if (this.gameOver) {
            this.drawGameOver();
            return;
        }

        const dt = timestamp - this.lastMoveTime;
        if (dt > this.speed) {
            this.lastMoveTime = timestamp;
            this.update();
        }

        this.draw();
    }

    update() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        // Move
        if (this.direction === 'up') head.y--;
        if (this.direction === 'down') head.y++;
        if (this.direction === 'left') head.x--;
        if (this.direction === 'right') head.x++;

        // Walls (Boundary)
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver = true;
            return;
        }

        // Walls (Obstacles)
        if (this.walls && this.walls.some(w => w.x === head.x && w.y === head.y)) {
            this.gameOver = true;
            return;
        }

        // Self Collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver = true;
            return;
        }

        this.snake.unshift(head);

        // Eat
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateUI();
            this.spawnFood();
            // Speed up
            this.speed = Math.max(50, this.speed - 2);
        } else {
            this.snake.pop();
        }
    }

    draw() {
        // BG
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Snake
        this.ctx.fillStyle = '#0f0';
        this.snake.forEach(s => {
            this.ctx.fillRect(s.x * this.gridSize, s.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        });

        // Food
        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

        // Walls
        if (this.walls) {
            this.ctx.fillStyle = '#7f8c8d';
            this.walls.forEach(w => {
                this.ctx.fillRect(w.x * this.gridSize, w.y * this.gridSize, this.gridSize, this.gridSize);
            });
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("Game Over", this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '20px Arial';
        this.ctx.fillText("Tap to Restart", this.canvas.width / 2, this.canvas.height / 2 + 40);

        // Restart click
        this.canvas.addEventListener('click', () => {
            this.start();
        }, { once: true });
    }
}
