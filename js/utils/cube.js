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
        this.autoRotate = false;

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

        // Block all default click/drag behavior on cube face links.
        // Navigation is handled exclusively in onUp() via rotation-angle detection
        // because click events on 3D CSS-transformed elements are unreliable on mobile.
        const links = this.element.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
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

    /**
     * Returns the href of the front-facing cube face based on current rotation.
     * This is the only reliable way to know which face the user intends to click
     * on mobile, since 3D hit-testing is browser-specific.
     */
    getFrontFaceHref() {
        // Normalize X and Y into 0-360 range
        const normY = ((this.currentY % 360) + 360) % 360;
        const normX = ((this.currentX % 360) + 360) % 360;

        // Check if top or bottom face dominates (X tilt > 45 degrees)
        // Top face: currentX around 90 → normX 60-120
        if (normX > 60 && normX < 120) {
            return this.element.querySelector('.cube-face.top')?.getAttribute('href');
        }
        // Bottom face: currentX around -90 → normX 240-300
        if (normX > 240 && normX < 300) {
            return this.element.querySelector('.cube-face.bottom')?.getAttribute('href');
        }

        // Determine Y-axis face
        // When cube rotates +Y (auto-rotate direction):
        //   normY 0   (315-44):  front  face (PDF)
        //   normY 90  (45-134):  left   face (DEV)
        //   normY 180 (135-224): back   face (GAMES)
        //   normY 270 (225-314): right  face (IMG)
        let faceSelector;
        if (normY >= 315 || normY < 45) faceSelector = '.cube-face.front';
        else if (normY >= 45 && normY < 135) faceSelector = '.cube-face.left';
        else if (normY >= 135 && normY < 225) faceSelector = '.cube-face.back';
        else faceSelector = '.cube-face.right';

        return this.element.querySelector(faceSelector)?.getAttribute('href');
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

        this.startX = e.pageX ?? e.touches[0].pageX;
        this.startY = e.pageY ?? e.touches[0].pageY;

        this.lastX = this.startX;
        this.lastY = this.startY;

        this.element.style.cursor = 'grabbing';
    }

    onMove(e) {
        if (!this.isDragging) return;

        const x = e.pageX ?? e.touches[0].pageX;
        const y = e.pageY ?? e.touches[0].pageY;

        const deltaX = x - this.lastX;
        const deltaY = y - this.lastY;

        // 15px threshold — generous enough for mobile taps
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
        if (!this.isDragging) return;

        this.isDragging = false;
        this.element.style.cursor = 'grab';

        if (!this.wasDragging) {
            // It was a clean tap/click — navigate to the front-facing face
            const href = this.getFrontFaceHref();
            if (href) {
                window.location.href = href;
                return; // Don't resume auto-rotate — we're navigating away
            }
        }

        // It was a drag — resume auto-rotation after 2s
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = setTimeout(() => {
            this.autoRotate = true;
            this.wasDragging = false;
        }, 2000);
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
