export class Tilt {
    constructor(element, options = {}) {
        this.element = element;
        this.options = Object.assign({
            max: 15, // max tilt rotation (degrees)
            perspective: 1000, // transform perspective (lower is more extreme)
            scale: 1.05, // scale on hover
            speed: 400, // transition speed (ms)
            glare: true // add glare effect
        }, options);

        this.init();
    }

    init() {
        this.element.style.transformStyle = 'preserve-3d';
        this.element.style.transform = `perspective(${this.options.perspective}px)`;

        // Add glare element if enabled
        if (this.options.glare) {
            this.glareElement = document.createElement('div');
            this.glareElement.classList.add('tilt-glare');
            Object.assign(this.glareElement.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
                transform: 'translateZ(1px)', // lift slightly above
                opacity: '0',
                pointerEvents: 'none',
                borderRadius: 'inherit',
                mixBlendMode: 'overlay',
                transition: `opacity ${this.options.speed}ms cubic-bezier(.03,.98,.52,.99)`
            });
            this.element.appendChild(this.glareElement);
        }

        this.addEventListeners();
    }

    addEventListeners() {
        this.onMouseEnterBind = this.onMouseEnter.bind(this);
        this.onMouseMoveBind = this.onMouseMove.bind(this);
        this.onMouseLeaveBind = this.onMouseLeave.bind(this);

        this.element.addEventListener('mouseenter', this.onMouseEnterBind);
        this.element.addEventListener('mousemove', this.onMouseMoveBind);
        this.element.addEventListener('mouseleave', this.onMouseLeaveBind);
    }

    onMouseEnter() {
        this.element.style.transition = `transform 100ms cubic-bezier(.03,.98,.52,.99)`;
        if (this.glareElement) this.glareElement.style.opacity = '1';
    }

    onMouseMove(event) {
        const rect = this.element.getBoundingClientRect();
        const x = event.clientX - rect.left; // x position within the element
        const y = event.clientY - rect.top; // y position within the element
        const w = this.element.offsetWidth;
        const h = this.element.offsetHeight;

        // Calculate rotation
        const xPercentage = x / w;
        const yPercentage = y / h;

        // RotateX (up/down) is based on Y position (inverted). Top = positive rotation.
        const rotateX = (this.options.max * -1) + (yPercentage * this.options.max * 2);
        // RotateY (left/right) is based on X position.
        const rotateY = (this.options.max) - (xPercentage * this.options.max * 2);

        // Calculate glare opacity based on mouse position
        if (this.glareElement) {
            const opacity = xPercentage + yPercentage - 1; // crude approximation
            // actually better: distance from center? Or just angle.
            // Let's keep it simple: generic overlay
            // this.glareElement.style.backgroundPosition = ...
        }

        this.element.style.transform = `perspective(${this.options.perspective}px) rotateX(${-rotateX}deg) rotateY(${-rotateY}deg) scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})`;
    }

    onMouseLeave() {
        this.element.style.transition = `transform ${this.options.speed}ms cubic-bezier(.03,.98,.52,.99)`;
        this.element.style.transform = `perspective(${this.options.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        if (this.glareElement) this.glareElement.style.opacity = '0';
    }
}
