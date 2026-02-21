export class CubeRotator {
    constructor(element) {
        this.element = element;
        this.isDragging = false;
        this.isVisible = true;
        this.rafId = null;
        this.hintHidden = false;

        // Rotation State — start facing Vibox (top face = rotateX -90)
        this.currentX = -90;
        this.currentY = 0;
        this.targetX = -90;
        this.targetY = 0;

        // Momentum
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastX = 0;
        this.lastY = 0;

        // Config
        this.sensitivity = 0.5;
        this.friction = 0.95;
        this.autoRotateSpeed = 0.2;
        this.autoRotate = false; // Hold on Vibox face for 2s, then rotate

        // Intro hold — show Vibox face for 2s then start spinning
        this.introHold = true;
        this.resumeTimeout = null;
        this.introTimeout = setTimeout(() => {
            this.introHold = false;
            this.autoRotate = true;
        }, 2000);

        this.init();
    }

    init() {
        this.element.style.cursor = 'grab';
        this.element.style.willChange = 'transform';

        // Detect cube size for translateZ offset
        this.zOffset = this.element.offsetWidth / 2 || 60;

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

        // Handle cube face link clicks directly — bypass loader.js view-transition
        // because 3D-transformed <a> elements have unreliable event delivery on mobile
        const links = this.element.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.wasDragging) {
                    // Clean tap/click → navigate
                    window.location.href = link.getAttribute('href');
                }
                // If it was a drag, do nothing (intended rotation)
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

        // Cancel intro hold if user interacts early
        if (this.introHold) {
            clearTimeout(this.introTimeout);
            this.introHold = false;
        }

        // Hide drag hint on first interaction
        if (!this.hintHidden) {
            this.hintHidden = true;
            const hint = this.element.closest('.hero-scene')?.querySelector('.cube-hint');
            if (hint) hint.classList.add('hidden');
        }

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

        // Click vs Drag threshold — 15px to avoid false drag on mobile taps
        if (Math.abs(x - this.startX) > 15 || Math.abs(y - this.startY) > 15) {
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
                this.wasDragging = false; // Reset so next tap navigates correctly
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

        this.element.style.transform = `translateZ(-${this.zOffset}px) rotateX(${this.currentX}deg) rotateY(${this.currentY}deg)`;

        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}
