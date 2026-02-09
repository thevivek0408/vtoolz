export class CubeRotator {
    constructor(element) {
        this.element = element;
        this.isDragging = false;

        // Rotation State
        this.currentX = -20;
        this.currentY = 45;
        this.targetX = -20;
        this.targetY = 45;

        // Momentum
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastX = 0;
        this.lastY = 0;

        // Config
        this.sensitivity = 0.5;
        this.friction = 0.95;
        this.autoRotateSpeed = 0.2;
        this.autoRotate = true;

        this.resumeTimeout = null;

        this.init();
    }

    init() {
        this.element.style.cursor = 'grab';

        // Mouse Events
        document.addEventListener('mousedown', this.onDown.bind(this));
        document.addEventListener('mousemove', this.onMove.bind(this));
        document.addEventListener('mouseup', this.onUp.bind(this));

        // Touch Events
        document.addEventListener('touchstart', this.onDown.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onUp.bind(this));

        // Prevent default drag interactions on links
        const links = this.element.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                if (this.wasDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            link.addEventListener('dragstart', e => e.preventDefault());
        });

        // Start Loop
        this.animate();
    }

    onDown(e) {
        if (!e.target.closest('.hero-scene')) return;

        this.isDragging = true;
        this.autoRotate = false;
        this.wasDragging = false;
        clearTimeout(this.resumeTimeout);

        // Stop inertia
        this.velocityX = 0;
        this.velocityY = 0;

        this.startX = e.pageX || e.touches[0].pageX;
        this.startY = e.pageY || e.touches[0].pageY;

        this.lastX = this.startX;
        this.lastY = this.startY;

        this.element.style.cursor = 'grabbing';
    }

    onMove(e) {
        if (!this.isDragging) return;

        const x = e.pageX || e.touches[0].pageX;
        const y = e.pageY || e.touches[0].pageY;

        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;

        // Click vs Drag threshold
        if (Math.abs(x - this.startX) > 5 || Math.abs(y - this.startY) > 5) {
            this.wasDragging = true;
        }

        this.lastX = x;
        this.lastY = y;

        // Update velocity for inertia
        this.velocityX = deltaX * this.sensitivity;
        this.velocityY = deltaY * this.sensitivity;

        // Direct rotation while dragging
        this.currentY += this.velocityX;
        this.currentX -= this.velocityY;

        if (e.type === 'touchmove') e.preventDefault();
    }

    onUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.element.style.cursor = 'grab';

            // Resume Auto-Rotation after 2s of inactivity
            clearTimeout(this.resumeTimeout);
            this.resumeTimeout = setTimeout(() => {
                this.autoRotate = true;
            }, 2000);
        }
    }

    animate() {
        if (!this.isDragging) {
            if (this.autoRotate) {
                // Auto rotate logic (overrides inertia if active)
                this.currentY += this.autoRotateSpeed;
                // Fade out tilt
                this.currentX += ((-20 - this.currentX) * 0.05);
            } else {
                // Inertia logic
                this.currentY += this.velocityX;
                this.currentX -= this.velocityY;

                // Friction
                this.velocityX *= this.friction;
                this.velocityY *= this.friction;

                // Stop if very slow
                if (Math.abs(this.velocityX) < 0.001) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.001) this.velocityY = 0;
            }
        }

        this.element.style.transform = `translateZ(-50px) rotateX(${this.currentX}deg) rotateY(${this.currentY}deg)`;

        requestAnimationFrame(this.animate.bind(this));
    }
}
