import '../../js/utils/common.js';

// State
const state = {
    mode: 'image', // image | video | text
    resolution: 100,
    fontSize: 10,
    matrix: false,
    fgColor: '#ffffff',
    bgColor: '#000000',
    charSet: 'simple',
    isCamRunning: false,
    textValue: 'VIBOX',
    textFont: 'monospace'
};

// Elements
const els = {
    output: document.getElementById('asciiOutput'),
    wrapper: document.getElementById('wrapper'),
    previewArea: document.querySelector('.preview-area'),
    fileInput: document.getElementById('fileInput'),
    video: document.getElementById('videoFeed'),
    resInput: document.getElementById('resolution'),
    sizeInput: document.getElementById('fontSize'),
    resDisp: document.getElementById('resDisp'),
    sizeDisp: document.getElementById('sizeDisp'),
    matrixToggle: document.getElementById('matrixToggle'),
    matrixToggle: document.getElementById('matrixToggle'),
    charSet: document.getElementById('charSet'),
    customCharInput: document.getElementById('customCharInput'),
    modeImg: document.getElementById('modeImg'),
    modeVid: document.getElementById('modeVid'),
    modeText: document.getElementById('modeText'),
    imgControls: document.getElementById('imgControls'),
    textControls: document.getElementById('textControls'),
    textInput: document.getElementById('textInput'),
    fontSelect: document.getElementById('fontSelect'),
    fgColor: document.getElementById('fgColor'),
    bgColor: document.getElementById('bgColor')
};

// Charsets (Ordered: Dark(0)/Low -> Light(255)/High)
// Since we draw White Text on Black BG, High Value (255) should be Dense Char
const charsets = {
    standard: " .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    simple: " .:-=+*#%@",
    minimal: " .@",
    blocks: " ░▒▓█",
    binary: "01"
};

let animationId;

// --- Init ---
function init() {
    // Event Listeners
    els.resInput.addEventListener('input', updateParams);
    els.sizeInput.addEventListener('input', updateParams);
    els.matrixToggle.addEventListener('change', updateParams);
    els.matrixToggle.addEventListener('change', updateParams);
    els.charSet.addEventListener('change', (e) => {
        if (e.target.value === 'custom') els.customCharInput.style.display = 'block';
        else els.customCharInput.style.display = 'none';
        updateParams();
    });
    els.customCharInput.addEventListener('input', updateParams);
    els.fgColor.addEventListener('input', updateParams);
    els.bgColor.addEventListener('input', updateParams);

    els.modeImg.addEventListener('click', () => setMode('image'));
    els.modeVid.addEventListener('click', () => setMode('video'));
    els.modeText.addEventListener('click', () => setMode('text'));

    els.fileInput.addEventListener('change', handleFile);

    // Text Mode Listeners
    els.textInput.addEventListener('input', (e) => { state.textValue = e.target.value; updateParams(); });
    els.fontSelect.addEventListener('change', (e) => { state.textFont = e.target.value; updateParams(); });

    document.getElementById('copyBtn').addEventListener('click', copyText);
    document.getElementById('dlBtn').addEventListener('click', saveToPNG);
}

function setMode(mode) {
    state.mode = mode;
    stopCamera();

    // Reset buttons
    [els.modeImg, els.modeVid, els.modeText].forEach(b => b.classList.replace('btn-primary', 'btn-secondary'));
    els.imgControls.style.display = 'none';
    els.textControls.style.display = 'none';

    if (mode === 'image') {
        els.modeImg.classList.replace('btn-secondary', 'btn-primary');
        els.imgControls.style.display = 'block';
        els.output.textContent = "Select an image...";
    } else if (mode === 'video') {
        els.modeVid.classList.replace('btn-secondary', 'btn-primary');
        startCamera();
    } else if (mode === 'text') {
        els.modeText.classList.replace('btn-secondary', 'btn-primary');
        els.textControls.style.display = 'block';
        renderTextMode();
    }
}

function updateParams() {
    state.resolution = parseInt(els.resInput.value);
    state.fontSize = parseInt(els.sizeInput.value);
    state.matrix = els.matrixToggle.checked;
    state.matrix = els.matrixToggle.checked;
    state.charSet = els.charSet.value;
    state.customChars = els.customCharInput.value;
    state.fgColor = els.fgColor.value;
    state.bgColor = els.bgColor.value;

    // Update UI Text
    els.resDisp.textContent = `${state.resolution} chars`;
    els.sizeDisp.textContent = `${state.fontSize}px`;

    // Update CSS Styles
    els.output.style.fontSize = `${state.fontSize}px`;
    els.output.style.lineHeight = `${state.fontSize * 0.6}px`; // Tight scaling

    if (state.matrix) {
        els.output.classList.add('matrix');
        // Matrix overrides custom colors
    } else {
        els.output.classList.remove('matrix');
        els.output.style.color = state.fgColor;
    }

    els.previewArea.style.setProperty('--preview-bg', state.bgColor);
    els.output.style.setProperty('--preview-fg', state.fgColor);

    // Re-render based on mode
    if (state.mode === 'image' && els.fileInput.files[0]) {
        handleFile({ target: els.fileInput });
    } else if (state.mode === 'text') {
        renderTextMode();
    }
}

// --- Camera ---
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        els.video.srcObject = stream;
        state.isCamRunning = true;
        loop();
    } catch (e) {
        alert("Camera Error: " + e);
    }
}

function stopCamera() {
    state.isCamRunning = false;
    cancelAnimationFrame(animationId);
    if (els.video.srcObject) {
        els.video.srcObject.getTracks().forEach(t => t.stop());
        els.video.srcObject = null;
    }
}

function loop() {
    if (!state.isCamRunning) return;
    renderASCII(els.video);
    animationId = requestAnimationFrame(loop);
}

// --- Image ---
function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => renderASCII(img);
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

// --- Core Engine ---
function renderASCII(source) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const w = state.resolution;
    const srcW = source.videoWidth || source.width;
    const srcH = source.videoHeight || source.height;

    if (!srcW || !srcH) return;

    const ratio = srcH / srcW;
    const h = Math.floor(w * ratio * 0.55); // Aspect fix

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(source, 0, 0, w, h);

    const data = ctx.getImageData(0, 0, w, h).data;
    let currentChars = charsets[state.charSet];
    if (state.charSet === 'custom') currentChars = state.customChars;
    if (!currentChars || currentChars.length === 0) currentChars = charsets.simple;

    // Ensure charset is ordered from Dark to Light (Density)
    // If user types "AB", we assume they want A=Dark, B=Light or vice versa.
    // But standard ascii algos use density maps. 
    // We just reverse if needed? No, let's keep it raw for custom.
    const chars = currentChars.split('');
    let str = "";

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const idx = Math.floor((avg / 255) * (chars.length - 1));
            str += chars[idx];
        }
        str += "\n";
    }
    els.output.textContent = str;

    // Update dimensions info
    document.getElementById('dims').textContent = `${w} x ${h}`;
}

// --- Text Mode ---
function renderTextMode() {
    const text = state.textValue || "";
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Measure roughly
    ctx.font = `bold 100px ${state.textFont}`;
    const metrics = ctx.measureText(text);
    const textW = Math.ceil(metrics.width) + 40;
    const textH = 150; // Padding

    canvas.width = textW;
    canvas.height = textH;

    // Draw White text on Black background (Engine expects brightness)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, textW, textH);
    ctx.fillStyle = "white";
    ctx.font = `bold 100px ${state.textFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, textW / 2, textH / 2);

    // Send to ASCII engine
    renderASCII(canvas);
}

// --- Actions ---
function copyText() {
    navigator.clipboard.writeText(els.output.textContent);
    alert("ASCII copied!");
}

function saveToPNG() {
    const lines = els.output.textContent.split('\n');
    // Render high-res
    const fontSize = state.fontSize * 2;
    const lineHeight = fontSize * 0.6;
    const charW = fontSize * 0.6;

    // Calculate canvas size
    const maxLine = Math.max(...lines.map(l => l.length));
    const cvsW = maxLine * charW + 40;
    const cvsH = lines.length * lineHeight + 40;

    const canvas = document.createElement('canvas');
    canvas.width = cvsW;
    canvas.height = cvsH;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, cvsW, cvsH);

    // Text
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = state.matrix ? '#0f0' : state.fgColor;

    if (state.matrix) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#0f0';
    }

    let y = 30; // padding top
    lines.forEach(line => {
        ctx.fillText(line, 20, y);
        y += lineHeight;
    });

    // Download
    const link = document.createElement('a');
    link.download = `ascii-${state.mode}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// Start
init();