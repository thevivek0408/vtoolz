export class CubeRotator {
    constructor(element) {
        this.element = element;
        this.isDragging = false;
        this.isVisible = true;
        this.rafId = null;

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
        this.element.style.willChange = 'transform';

        // Bound handlers for cleanup
        this._onDown = this.onDown.bind(this);
        this._onMove = this.onMove.bind(this);
        this._onUp = this.onUp.bind(this);

        // Mouse Events — scoped to hero-scene to avoid global jank
        const scene = this.element.closest('.hero-scene') || this.element;
        scene.addEventListener('mousedown', this._onDown);
        document.addEventListener('mousemove', this._onMove, { passive: true });
        document.addEventListener('mouseup', this._onUp);

        // Touch Events — scoped
        scene.addEventListener('touchstart', this._onDown, { passive: false });
        document.addEventListener('touchmove', this._onMove, { passive: false });
        document.addEventListener('touchend', this._onUp);

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

        // IntersectionObserver — pause when off-screen
        if ('IntersectionObserver' in window) {
            this._observer = new IntersectionObserver((entries) => {
                this.isVisible = entries[0].isIntersecting;
                if (this.isVisible && !this.rafId) {
                    this.animate();
                }
            }, { threshold: 0.1 });
            this._observer.observe(scene);
        }

        // Pause on tab hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isVisible = false;
            } else {
                this.isVisible = true;
                if (!this.rafId) this.animate();
            }
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
        // Stop loop when off-screen or tab hidden
        if (!this.isVisible) {
            this.rafId = null;
            return;
        }

        if (!this.isDragging) {
            if (this.autoRotate) {
                this.currentY += this.autoRotateSpeed;
                this.currentX += ((-20 - this.currentX) * 0.05);
            } else {
                this.currentY += this.velocityX;
                this.currentX -= this.velocityY;

                this.velocityX *= this.friction;
                this.velocityY *= this.friction;

                if (Math.abs(this.velocityX) < 0.001) this.velocityX = 0;
                if (Math.abs(this.velocityY) < 0.001) this.velocityY = 0;
            }
        }

        this.element.style.transform = `translateZ(-50px) rotateX(${this.currentX}deg) rotateY(${this.currentY}deg)`;

        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}
