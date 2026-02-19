/**
 * Floating Particles - Lightweight canvas-based particle system for hero section
 * Renders soft, glowing dots that drift gently with subtle connections between nearby particles.
 */

export function initParticles(canvasId = 'hero-particles') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;
    let width, height;

    // Config
    const CONFIG = {
        count: 45,              // Number of particles
        minRadius: 1.5,
        maxRadius: 4,
        speed: 0.3,             // Max drift speed
        connectionDistance: 120, // Max distance to draw lines between particles
        connectionOpacity: 0.15,
        colors: [
            { r: 52, g: 152, b: 219 },   // Blue (primary)
            { r: 39, g: 174, b: 96 },     // Green (accent)
            { r: 155, g: 89, b: 182 },    // Purple
            { r: 243, g: 156, b: 18 },    // Orange
            { r: 231, g: 76, b: 60 },     // Red
        ]
    };

    // Resize handler
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Create a single particle
    function createParticle() {
        const color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            radius: CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius),
            vx: (Math.random() - 0.5) * CONFIG.speed * 2,
            vy: (Math.random() - 0.5) * CONFIG.speed * 2,
            color,
            opacity: 0.2 + Math.random() * 0.5,
            pulseSpeed: 0.005 + Math.random() * 0.01,
            pulseOffset: Math.random() * Math.PI * 2,
        };
    }

    // Initialize particles
    function initAll() {
        particles = [];
        for (let i = 0; i < CONFIG.count; i++) {
            particles.push(createParticle());
        }
    }

    // Update particle positions
    function update() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges smoothly
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;
        }
    }

    // Draw particles and connections
    function draw(time) {
        ctx.clearRect(0, 0, width, height);

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const opacityMultiplier = isDark ? 1.4 : 0.8;

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    const alpha = (1 - dist / CONFIG.connectionDistance) * CONFIG.connectionOpacity * opacityMultiplier;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${a.color.r}, ${a.color.g}, ${a.color.b}, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const p of particles) {
            // Gentle pulse
            const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.3 + 0.7;
            const alpha = p.opacity * pulse * opacityMultiplier;
            const r = p.radius * (0.9 + pulse * 0.1);

            // Soft glow
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.4})`);
            gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`;
            ctx.fill();
        }
    }

    // Animation loop
    function loop(time) {
        update();
        draw(time);
        animationId = requestAnimationFrame(loop);
    }

    // Pause when not visible (performance)
    function handleVisibility() {
        if (document.hidden) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            if (!animationId) {
                animationId = requestAnimationFrame(loop);
            }
        }
    }

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return; // Don't animate
    }

    // Start
    resize();
    initAll();
    animationId = requestAnimationFrame(loop);

    // Listeners
    window.addEventListener('resize', () => {
        resize();
        // Redistribute particles that might be out of bounds
        for (const p of particles) {
            if (p.x > width) p.x = Math.random() * width;
            if (p.y > height) p.y = Math.random() * height;
        }
    });

    document.addEventListener('visibilitychange', handleVisibility);
}
