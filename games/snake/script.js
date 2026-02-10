class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 20; // Size of one block
        this.rows = this.canvas.height / this.scale;
        this.cols = this.canvas.width / this.scale;

        this.score = 0;
        this.highScore = localStorage.getItem('vtoolz_snake_high') || 0;
        document.getElementById('highscore').innerText = this.highScore;

        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'Right'; // Right, Left, Up, Down
        this.nextDirection = 'Right'; // Buffer for rapid keypresses

        this.gameLoop = null;
        this.speed = 100; // ms per frame
        this.isRunning = false;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.input(key);
        });
    }

    input(key) {
        // Prevent reverse direction
        if ((key === 'arrowup' || key === 'w') && this.direction !== 'Down')
            this.nextDirection = 'Up';
        if ((key === 'arrowdown' || key === 's') && this.direction !== 'Up')
            this.nextDirection = 'Down';
        if ((key === 'arrowleft' || key === 'a') && this.direction !== 'Right')
            this.nextDirection = 'Left';
        if ((key === 'arrowright' || key === 'd') && this.direction !== 'Left')
            this.nextDirection = 'Right';
    }

    start() {
        document.getElementById('startScreen').classList.remove('visible');
        document.getElementById('gameOverScreen').classList.remove('visible');

        this.score = 0;
        document.getElementById('score').innerText = 0;

        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        this.direction = 'Right';
        this.nextDirection = 'Right';
        this.placeFood();
        this.isRunning = true;

        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    placeFood() {
        // Random pos excluding snake body
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            // Check collision with snake
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    update() {
        if (!this.isRunning) return;

        this.direction = this.nextDirection;

        // Calculate new head position
        const head = { ...this.snake[0] };

        if (this.direction === 'Up') head.y--;
        if (this.direction === 'Down') head.y++;
        if (this.direction === 'Left') head.x--;
        if (this.direction === 'Right') head.x++;

        // Collision Check (Walls)
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            return this.gameOver();
        }

        // Collision Check (Self)
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            return this.gameOver();
        }

        this.snake.unshift(head); // Add new head

        // Check Food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').innerText = this.score;
            this.placeFood();
            // Speed up slightly?
        } else {
            this.snake.pop(); // Remove tail
        }

        this.draw();
    }

    draw() {
        // BG
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Food
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        const cx = this.food.x * this.scale + this.scale / 2;
        const cy = this.food.y * this.scale + this.scale / 2;
        this.ctx.arc(cx, cy, this.scale / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#2ecc71'; // Lighter green
            } else {
                this.ctx.fillStyle = '#27ae60'; // Darker green
            }

            // Add slight gap for grid effect
            this.ctx.fillRect(
                segment.x * this.scale + 1,
                segment.y * this.scale + 1,
                this.scale - 2,
                this.scale - 2
            );
        });
    }

    gameOver() {
        this.isRunning = false;
        clearInterval(this.gameLoop);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('vtoolz_snake_high', this.highScore);
            document.getElementById('highscore').innerText = this.highScore;
        }

        document.getElementById('finalScore').innerText = this.score;
        document.getElementById('gameOverScreen').classList.add('visible');
    }
}

window.onload = () => {
    window.game = new SnakeGame();
    // Initial draw
    window.game.draw();
};
