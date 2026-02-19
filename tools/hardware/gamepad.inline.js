const els = {
    status: document.getElementById('status'),
    vibrate: document.getElementById('btnVibrate'),
    debug: document.getElementById('debug'),
    stickL: document.getElementById('stick-l'),
    stickR: document.getElementById('stick-r'),
    l2: document.getElementById('l2-fill'),
    r2: document.getElementById('r2-fill')
};

let activePadIndex = null;
let animationFrame = null;

window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad);
    activePadIndex = e.gamepad.index;
    els.status.textContent = `Connected: ${e.gamepad.id} (${e.gamepad.mapping || 'Unknown Mapping'})`;
    els.status.classList.add('connected');
    startLoop();
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected");
    activePadIndex = null;
    els.status.textContent = "Waiting for connection...";
    els.status.classList.remove('connected');
    cancelAnimationFrame(animationFrame);
});

function updateStatus() {
    if (activePadIndex === null) return;

    const gp = navigator.getGamepads()[activePadIndex];
    if (!gp) return;

    // Buttons
    gp.buttons.forEach((b, i) => {
        const btnEl = document.getElementById(`btn-${i}`);
        if (btnEl) {
            if (b.pressed) btnEl.classList.add('pressed');
            else btnEl.classList.remove('pressed');
        }

        // Triggers (Analog) - buttons 6 and 7
        if (i === 6) { // L2
            els.l2.style.height = `${b.value * 100}%`;
        }
        if (i === 7) { // R2
            els.r2.style.height = `${b.value * 100}%`;
        }
    });

    // Axes
    // 0: Left Stick X, 1: Left Stick Y
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;

    // Move Sticks (Limit movement to within circle)
    // 20px range (40px stick in 80px container)
    els.stickL.style.transform = `translate(calc(-50% + ${lx * 20}px), calc(-50% + ${ly * 20}px))`;
    els.stickR.style.transform = `translate(calc(-50% + ${rx * 20}px), calc(-50% + ${ry * 20}px))`;

    // Debug Info
    // els.debug.textContent = `Axes: ${gp.axes.map(a => a.toFixed(2)).join(', ')}`;

    animationFrame = requestAnimationFrame(updateStatus);
}

function startLoop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    updateStatus();
}

els.vibrate.addEventListener('click', () => {
    if (activePadIndex !== null) {
        const gp = navigator.getGamepads()[activePadIndex];
        if (gp && gp.vibrationActuator) {
            gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 1000,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0
            });
        } else {
            alert('Vibration not supported by browser or controller.');
        }
    }
});

// Polling if event doesn't fire (sometimes happens)
setInterval(() => {
    if (activePadIndex === null) {
        const gps = navigator.getGamepads();
        for (let i = 0; i < gps.length; i++) {
            if (gps[i]) {
                // Found one
                const event = new Event('gamepadconnected');
                event.gamepad = gps[i];
                window.dispatchEvent(event);
                break;
            }
        }
    }
}, 2000);