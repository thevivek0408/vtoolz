const _$ = id => document.getElementById(id);
let slides = [], curSlide = 0, selEl = null;

// ── THEMES ──
const themes = [
    { name: 'Default', bg: '#ffffff', title: '#1a1a2e', text: '#333333', accent: '#4a90d9' },
    { name: 'Dark', bg: '#1a1a2e', title: '#ffffff', text: '#cccccc', accent: '#ff6f43' },
    { name: 'Corporate', bg: '#f8f9fa', title: '#2c3e50', text: '#34495e', accent: '#3498db' },
    { name: 'Creative', bg: '#fff3e0', title: '#e65100', text: '#4e342e', accent: '#ff9800' },
    { name: 'Nature', bg: '#e8f5e9', title: '#1b5e20', text: '#2e7d32', accent: '#4caf50' },
    { name: 'Ocean', bg: '#e3f2fd', title: '#0d47a1', text: '#1565c0', accent: '#2196f3' },
    { name: 'Midnight', bg: '#0d1117', title: '#58a6ff', text: '#c9d1d9', accent: '#f78166' },
    { name: 'Sunset', bg: '#1a0a2e', title: '#ff6b6b', text: '#dda0dd', accent: '#ffd93d' },
    { name: 'Minimal', bg: '#fafafa', title: '#212121', text: '#616161', accent: '#9e9e9e' },
];
let activeTheme = themes[0];

function openThemeModal() { _$('themeModal').classList.add('open'); }
function closeThemeModal() { _$('themeModal').classList.remove('open'); }
_$('themeModal').onclick = e => { if (e.target === _$('themeModal')) closeThemeModal(); };

(function renderThemes() {
    const g = _$('themeGrid');
    themes.forEach(t => {
        const c = document.createElement('div');
        c.className = 'theme-card';
        c.innerHTML = `<div class="preview" style="background:${t.bg};color:${t.title};">${t.name}</div><h4>${t.name}</h4>`;
        c.onclick = () => { applyTheme(t); closeThemeModal(); };
        g.appendChild(c);
    });
})();

function applyTheme(t) {
    activeTheme = t;
    slides.forEach(s => {
        s.background = t.bg;
        s.elements.forEach(el => {
            if (el.type === 'text') {
                if (el.isTitle) el.color = t.title;
                else el.color = t.text;
            }
            if (el.type === 'rect' || el.type === 'circle' || el.type === 'star' || el.type === 'triangle' || el.type === 'arrow' || el.type === 'line') el.fill = t.accent;
        });
    });
    renderSlidePanel(); renderSlide();
}

// ── SLIDE DATA ──
function mkSlide() { return { background: activeTheme.bg, elements: [], notes: '' }; }

function init() {
    const saved = loadFromStorage();
    if (!saved) addSlide();
}

function addSlide() {
    saveCurrentSlide();
    slides.push(mkSlide());
    curSlide = slides.length - 1;
    renderSlidePanel(); renderSlide(); updateNotes();
}

function duplicateSlide() {
    const dup = JSON.parse(JSON.stringify(slides[curSlide]));
    slides.splice(curSlide + 1, 0, dup);
    curSlide++;
    renderSlidePanel(); renderSlide(); updateNotes(); saveToStorage();
}

function selectSlide(i) {
    saveCurrentSlide();
    curSlide = i; selEl = null;
    renderSlidePanel(); renderSlide(); updateProps(); updateNotes();
}

function deleteSlide(i) {
    if (slides.length <= 1) return;
    slides.splice(i, 1);
    if (curSlide >= slides.length) curSlide = slides.length - 1;
    renderSlidePanel(); renderSlide(); updateNotes();
}

function saveCurrentSlide() { /* elements are mutated in-place */ }

// ── SPEAKER NOTES ──
function updateNotes() { _$('speakerNotes').value = slides[curSlide].notes || ''; }
function saveSpeakerNotes() { slides[curSlide].notes = _$('speakerNotes').value; saveToStorage(); }

// ── FIND ──
_$('btnFindPPT').onclick = () => { _$('findPanel').classList.toggle('open'); _$('findInput').focus(); };
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); _$('btnFindPPT').click(); } });

function findInSlides() {
    const q = _$('findInput').value.toLowerCase(); if (!q) return;
    let results = [];
    slides.forEach((s, si) => s.elements.forEach((el, ei) => {
        if (el.type === 'text' && (el.text || '').toLowerCase().includes(q)) results.push({ si, ei });
    }));
    _$('findCount').textContent = results.length + ' found';
    if (results.length > 0) { selectSlide(results[0].si); }
}

function closeFindPanel() { _$('findPanel').classList.remove('open'); }

// ── SLIDE PANEL ──
function renderSlidePanel() {
    const p = _$('slidePanel'); p.innerHTML = '';
    slides.forEach((s, i) => {
        const t = document.createElement('div');
        t.className = 'slide-thumb' + (i === curSlide ? ' active' : '');
        t.onclick = e => { if (!e.target.classList.contains('del-slide')) selectSlide(i); };
        t.style.background = s.gradient || s.background;
        const prev = document.createElement('div');
        prev.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;';
        s.elements.forEach(el => {
            const m = document.createElement('div');
            m.style.cssText = `position:absolute;left:${el.x / 7}px;top:${el.y / 5.5}px;font-size:5px;`;
            if (el.type === 'text') { m.textContent = (el.text || '').substring(0, 12); m.style.color = el.color || '#333'; }
            else { m.style.background = el.fill || '#4a90d9'; m.style.width = (el.w / 7) + 'px'; m.style.height = (el.h / 5.5) + 'px'; if (el.type === 'circle') m.style.borderRadius = '50%'; }
            prev.appendChild(m);
        });
        t.appendChild(prev);
        const num = document.createElement('span'); num.className = 'num'; num.textContent = i + 1; t.appendChild(num);
        const del = document.createElement('button'); del.className = 'del-slide'; del.innerHTML = '×'; del.onclick = e => { e.stopPropagation(); deleteSlide(i); }; t.appendChild(del);
        p.appendChild(t);
    });
    const ab = document.createElement('button'); ab.className = 'add-slide-btn'; ab.innerHTML = '<i class="fas fa-plus"></i> New'; ab.onclick = addSlide; p.appendChild(ab);
}

// ── RENDER SLIDE ──
function renderSlide() {
    const ed = _$('slideEditor'); ed.innerHTML = '';
    const s = slides[curSlide];
    ed.style.background = s.gradient || s.background;
    _$('slideBg').value = s.background;
    s.elements.forEach((el, i) => ed.appendChild(createElDOM(el, i)));
    // Apply transition
    const trans = _$('transition').value;
    if (trans === 'fade') { ed.classList.add('trans-fade'); setTimeout(() => ed.classList.remove('trans-fade'), 500); }
}

function createElDOM(el, idx) {
    const d = document.createElement('div');
    d.className = 'slide-element' + (el.type === 'text' ? ' text-el' : ' shape-el');
    d.dataset.idx = idx;
    d.style.left = el.x + 'px'; d.style.top = el.y + 'px'; d.style.width = el.w + 'px';
    d.style.height = el.type === 'text' ? 'auto' : el.h + 'px';
    d.style.minHeight = el.h + 'px';

    if (el.type === 'text') {
        d.textContent = el.text || 'Double-click to edit';
        d.style.fontSize = (el.fontSize || 18) + 'px';
        d.style.fontWeight = el.bold ? 'bold' : 'normal';
        d.style.fontStyle = el.italic ? 'italic' : 'normal';
        d.style.color = el.color || activeTheme.text;
        d.style.fontFamily = el.fontFamily || 'Arial';
        d.style.textAlign = el.align || 'left';
        d.style.lineHeight = (el.lineHeight || 1.4);
        if (el.underline) d.style.textDecoration = 'underline';
        d.ondblclick = () => { d.contentEditable = 'true'; d.focus(); d.style.cursor = 'text'; };
        d.onblur = () => { d.contentEditable = 'false'; d.style.cursor = 'move'; slides[curSlide].elements[idx].text = d.textContent; saveToStorage(); };
    } else if (el.type === 'rect') {
        d.style.background = el.fill || activeTheme.accent;
        d.style.borderRadius = (el.radius || 0) + 'px';
    } else if (el.type === 'circle') {
        d.style.background = el.fill || activeTheme.accent;
        d.style.borderRadius = '50%';
    } else if (el.type === 'triangle') {
        d.style.width = '0'; d.style.height = '0';
        d.style.borderLeft = (el.w / 2) + 'px solid transparent';
        d.style.borderRight = (el.w / 2) + 'px solid transparent';
        d.style.borderBottom = el.h + 'px solid ' + (el.fill || activeTheme.accent);
        d.style.background = 'transparent';
    } else if (el.type === 'line') {
        d.style.height = '3px'; d.style.background = el.fill || activeTheme.accent;
        d.style.borderRadius = '2px';
    } else if (el.type === 'arrow') {
        d.innerHTML = `<svg viewBox="0 0 100 30" style="width:100%;height:100%;"><polygon points="0,10 70,10 70,0 100,15 70,30 70,20 0,20" fill="${el.fill || activeTheme.accent}"/></svg>`;
        d.style.background = 'transparent';
    } else if (el.type === 'star') {
        d.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,5 63,35 95,35 70,57 80,90 50,70 20,90 30,57 5,35 37,35" fill="${el.fill || activeTheme.accent}"/></svg>`;
        d.style.background = 'transparent';
    } else if (el.type === 'image') {
        const img = document.createElement('img');
        img.src = el.src; img.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;';
        d.appendChild(img);
    }

    const handle = document.createElement('div'); handle.className = 'resize-handle'; d.appendChild(handle);
    d.onmousedown = e => {
        if (e.target === handle) { startResize(e, d, idx); return; }
        selectEl(d, idx);
        if (d.contentEditable !== 'true') startDrag(e, d, idx);
    };
    return d;
}

function selectEl(d, idx) {
    document.querySelectorAll('.slide-element.selected').forEach(e => e.classList.remove('selected'));
    d.classList.add('selected'); selEl = idx; updateProps();
}
function editorClick(e) { if (e.target.id === 'slideEditor') { selEl = null; document.querySelectorAll('.slide-element.selected').forEach(e => e.classList.remove('selected')); updateProps(); } }

// ── PROPERTIES ──
function updateProps() {
    const c = _$('propContents');
    if (selEl === null || !slides[curSlide].elements[selEl]) { c.innerHTML = '<p style="font-size:12px;opacity:.5;">Select an element to edit.</p>'; return; }
    const el = slides[curSlide].elements[selEl];
    let h = '';
    if (el.type === 'text') {
        h += `<div class="prop-row"><label>Font Size</label><input type="number" value="${el.fontSize || 18}" onchange="uProp('fontSize',+this.value)"></div>`;
        h += `<div class="prop-row"><label>Font</label><select onchange="uProp('fontFamily',this.value)">`;
        ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact', 'Comic Sans MS'].forEach(f => {
            h += `<option ${el.fontFamily === f ? 'selected' : ''}>${f}</option>`;
        });
        h += `</select></div>`;
        h += `<div class="prop-row"><label>Color</label><input type="color" value="${el.color || '#1a1a2e'}" onchange="uProp('color',this.value)"></div>`;
        h += `<div class="prop-row"><label>Align</label><select onchange="uProp('align',this.value)"><option ${el.align === 'left' ? 'selected' : ''}>left</option><option ${el.align === 'center' ? 'selected' : ''}>center</option><option ${el.align === 'right' ? 'selected' : ''}>right</option></select></div>`;
        h += `<div class="prop-row"><label><input type="checkbox" ${el.bold ? 'checked' : ''} onchange="uProp('bold',this.checked)"> Bold</label></div>`;
        h += `<div class="prop-row"><label><input type="checkbox" ${el.italic ? 'checked' : ''} onchange="uProp('italic',this.checked)"> Italic</label></div>`;
        h += `<div class="prop-row"><label><input type="checkbox" ${el.underline ? 'checked' : ''} onchange="uProp('underline',this.checked)"> Underline</label></div>`;
        h += `<div class="prop-row"><label>Line Height</label><input type="number" step="0.1" min="1" max="3" value="${el.lineHeight || 1.4}" onchange="uProp('lineHeight',+this.value)"></div>`;
    } else if (['rect', 'circle', 'triangle', 'star', 'arrow', 'line'].includes(el.type)) {
        h += `<div class="prop-row"><label>Fill</label><input type="color" value="${el.fill || '#4a90d9'}" onchange="uProp('fill',this.value)"></div>`;
        h += `<div class="prop-row"><label>Width</label><input type="number" value="${el.w}" onchange="uProp('w',+this.value)"></div>`;
        h += `<div class="prop-row"><label>Height</label><input type="number" value="${el.h}" onchange="uProp('h',+this.value)"></div>`;
        if (el.type === 'rect') h += `<div class="prop-row"><label>Radius</label><input type="number" value="${el.radius || 0}" onchange="uProp('radius',+this.value)"></div>`;
    } else if (el.type === 'image') {
        h += `<div class="prop-row"><label>Width</label><input type="number" value="${el.w}" onchange="uProp('w',+this.value)"></div>`;
        h += `<div class="prop-row"><label>Height</label><input type="number" value="${el.h}" onchange="uProp('h',+this.value)"></div>`;
    }
    h += `<div class="prop-row"><label>X</label><input type="number" value="${Math.round(el.x)}" onchange="uProp('x',+this.value)"></div>`;
    h += `<div class="prop-row"><label>Y</label><input type="number" value="${Math.round(el.y)}" onchange="uProp('y',+this.value)"></div>`;
    c.innerHTML = h;
}

function uProp(k, v) {
    if (selEl !== null && slides[curSlide].elements[selEl]) {
        slides[curSlide].elements[selEl][k] = v;
        renderSlide();
        const d = document.querySelector(`.slide-element[data-idx="${selEl}"]`);
        if (d) selectEl(d, selEl);
        saveToStorage();
    }
}

// ── DRAG & RESIZE ──
function startDrag(e, dom, idx) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = slides[curSlide].elements[idx].x, oy = slides[curSlide].elements[idx].y;
    function mv(ev) { const el = slides[curSlide].elements[idx]; el.x = Math.max(0, ox + (ev.clientX - sx)); el.y = Math.max(0, oy + (ev.clientY - sy)); dom.style.left = el.x + 'px'; dom.style.top = el.y + 'px'; }
    function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); saveToStorage(); renderSlidePanel(); }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
}
function startResize(e, dom, idx) {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, el = slides[curSlide].elements[idx], ow = el.w, oh = el.h;
    function mv(ev) { el.w = Math.max(30, ow + (ev.clientX - sx)); el.h = Math.max(20, oh + (ev.clientY - sy)); dom.style.width = el.w + 'px'; dom.style.height = el.h + 'px'; }
    function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); updateProps(); saveToStorage(); }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
}

// ── ADD ELEMENTS ──
function addTextBox(isTitle) {
    slides[curSlide].elements.push({ type: 'text', text: isTitle ? 'Title' : 'Click to edit', x: 50, y: isTitle ? 40 : 120, w: 500, h: 40, fontSize: isTitle ? 36 : 20, fontFamily: 'Arial', color: isTitle ? activeTheme.title : activeTheme.text, bold: !!isTitle, italic: false, align: isTitle ? 'center' : 'left', isTitle: !!isTitle });
    renderSlide(); renderSlidePanel();
}
function addShape(type) {
    const defaults = { rect: { w: 150, h: 100 }, circle: { w: 120, h: 120 }, triangle: { w: 120, h: 100 }, line: { w: 200, h: 4 }, arrow: { w: 150, h: 40 }, star: { w: 100, h: 100 } };
    const d = defaults[type] || { w: 100, h: 100 };
    slides[curSlide].elements.push({ type, x: 100, y: 100, w: d.w, h: d.h, fill: activeTheme.accent, radius: 0 });
    renderSlide(); renderSlidePanel();
}
function addImage() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = e => { slides[curSlide].elements.push({ type: 'image', src: e.target.result, x: 80, y: 80, w: 200, h: 150 }); renderSlide(); renderSlidePanel(); }; r.readAsDataURL(f); };
    inp.click();
}
function addImageURL() {
    const url = prompt('Enter image URL:');
    if (!url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        // Convert to data URL for PPTX export compatibility
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        try {
            const dataUrl = c.toDataURL('image/png');
            slides[curSlide].elements.push({ type: 'image', src: dataUrl, x: 80, y: 80, w: 200, h: 150 });
        } catch (e) {
            // CORS fallback: use URL directly
            slides[curSlide].elements.push({ type: 'image', src: url, x: 80, y: 80, w: 200, h: 150 });
        }
        renderSlide(); renderSlidePanel();
    };
    img.onerror = () => {
        // If load fails, still add as URL
        slides[curSlide].elements.push({ type: 'image', src: url, x: 80, y: 80, w: 200, h: 150 });
        renderSlide(); renderSlidePanel();
    };
    img.src = url;
}
function deleteSelected() {
    if (selEl === null) return;
    slides[curSlide].elements.splice(selEl, 1); selEl = null;
    renderSlide(); updateProps(); renderSlidePanel(); saveToStorage();
}
function bringForward() {
    if (selEl === null || selEl >= slides[curSlide].elements.length - 1) return;
    const els = slides[curSlide].elements;[els[selEl], els[selEl + 1]] = [els[selEl + 1], els[selEl]]; selEl++;
    renderSlide(); const d = document.querySelector(`.slide-element[data-idx="${selEl}"]`); if (d) selectEl(d, selEl);
}
function changeSlideBg(v) { slides[curSlide].background = v; slides[curSlide].gradient = null; _$('slideEditor').style.background = v; renderSlidePanel(); saveToStorage(); }
function applyGradientBg() {
    const c1 = _$('slideBg').value, c2 = _$('slideBg2').value;
    const grad = `linear-gradient(135deg, ${c1}, ${c2})`;
    slides[curSlide].background = c1; // fallback solid
    slides[curSlide].gradient = grad;
    _$('slideEditor').style.background = grad;
    renderSlidePanel(); saveToStorage();
}

// ── LAYOUTS ──
function applyLayout(layout) {
    if (!layout) return;
    const s = slides[curSlide]; s.elements = [];
    const c = activeTheme;
    if (layout === 'title') {
        s.elements.push({ type: 'text', text: 'Presentation Title', x: 60, y: 120, w: 500, h: 50, fontSize: 40, fontFamily: 'Arial', color: c.title, bold: true, align: 'center', isTitle: true });
        s.elements.push({ type: 'text', text: 'Subtitle text here', x: 100, y: 200, w: 420, h: 30, fontSize: 20, fontFamily: 'Arial', color: c.text, bold: false, align: 'center' });
    } else if (layout === 'titleContent') {
        s.elements.push({ type: 'text', text: 'Slide Title', x: 30, y: 20, w: 560, h: 40, fontSize: 30, fontFamily: 'Arial', color: c.title, bold: true, align: 'left', isTitle: true });
        s.elements.push({ type: 'text', text: '• Content point 1\n• Content point 2\n• Content point 3', x: 30, y: 80, w: 560, h: 200, fontSize: 18, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
    } else if (layout === 'twoCol') {
        s.elements.push({ type: 'text', text: 'Title', x: 30, y: 20, w: 560, h: 35, fontSize: 28, fontFamily: 'Arial', color: c.title, bold: true, align: 'center', isTitle: true });
        s.elements.push({ type: 'text', text: 'Left column content...', x: 20, y: 70, w: 275, h: 200, fontSize: 16, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
        s.elements.push({ type: 'text', text: 'Right column content...', x: 315, y: 70, w: 275, h: 200, fontSize: 16, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
    } else if (layout === 'sectionHeader') {
        s.elements.push({ type: 'rect', x: 0, y: 100, w: 620, h: 120, fill: c.accent, radius: 0 });
        s.elements.push({ type: 'text', text: 'Section Title', x: 40, y: 120, w: 540, h: 50, fontSize: 36, fontFamily: 'Arial', color: '#ffffff', bold: true, align: 'center', isTitle: true });
    } else if (layout === 'imageCaption') {
        s.elements.push({ type: 'rect', x: 30, y: 25, w: 350, h: 260, fill: '#e0e0e0', radius: 8 });
        s.elements.push({ type: 'text', text: '[Image Placeholder]', x: 100, y: 130, w: 200, h: 30, fontSize: 14, fontFamily: 'Arial', color: '#999', bold: false, align: 'center' });
        s.elements.push({ type: 'text', text: 'Caption Title', x: 400, y: 60, w: 200, h: 30, fontSize: 22, fontFamily: 'Arial', color: c.title, bold: true, align: 'left', isTitle: true });
        s.elements.push({ type: 'text', text: 'Description text here...', x: 400, y: 100, w: 200, h: 150, fontSize: 14, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
    } else if (layout === 'quote') {
        s.elements.push({ type: 'text', text: '"', x: 50, y: 40, w: 60, h: 80, fontSize: 80, fontFamily: 'Georgia', color: c.accent, bold: true, align: 'center' });
        s.elements.push({ type: 'text', text: 'Your inspiring quote goes here.', x: 60, y: 110, w: 500, h: 80, fontSize: 24, fontFamily: 'Georgia', color: c.title, bold: false, italic: true, align: 'center' });
        s.elements.push({ type: 'text', text: '— Author Name', x: 200, y: 210, w: 220, h: 25, fontSize: 16, fontFamily: 'Arial', color: c.text, bold: false, align: 'center' });
    } else if (layout === 'comparison') {
        s.elements.push({ type: 'text', text: 'Comparison', x: 30, y: 15, w: 560, h: 30, fontSize: 26, fontFamily: 'Arial', color: c.title, bold: true, align: 'center', isTitle: true });
        s.elements.push({ type: 'rect', x: 20, y: 55, w: 280, h: 230, fill: c.accent + '22', radius: 8 });
        s.elements.push({ type: 'text', text: 'Option A', x: 80, y: 65, w: 160, h: 25, fontSize: 18, fontFamily: 'Arial', color: c.accent, bold: true, align: 'center' });
        s.elements.push({ type: 'text', text: 'Details...', x: 40, y: 100, w: 240, h: 170, fontSize: 14, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
        s.elements.push({ type: 'rect', x: 320, y: 55, w: 280, h: 230, fill: c.accent + '22', radius: 8 });
        s.elements.push({ type: 'text', text: 'Option B', x: 380, y: 65, w: 160, h: 25, fontSize: 18, fontFamily: 'Arial', color: c.accent, bold: true, align: 'center' });
        s.elements.push({ type: 'text', text: 'Details...', x: 340, y: 100, w: 240, h: 170, fontSize: 14, fontFamily: 'Arial', color: c.text, bold: false, align: 'left' });
    }
    _$('slideLayout').value = '';
    renderSlide(); renderSlidePanel(); saveToStorage();
}

// ── PRESENTATION MODE ──
let presentIdx = 0;
function startPresentation() {
    presentIdx = 0; _$('presentOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderPresentSlide();
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { });
}
function exitPresentation() {
    _$('presentOverlay').classList.remove('active');
    document.body.style.overflow = '';
    if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
}
function nextSlideP() { if (presentIdx < slides.length - 1) { presentIdx++; renderPresentSlide(); } }
function prevSlideP() { if (presentIdx > 0) { presentIdx--; renderPresentSlide(); } }

function renderPresentSlide() {
    const c = _$('presentCanvas'); const ctx = c.getContext('2d');
    c.width = 1280; c.height = 720;
    const s = slides[presentIdx];
    ctx.fillStyle = s.background; ctx.fillRect(0, 0, 1280, 720);
    s.elements.forEach(el => {
        const sx = 1280 / 620, sy = 720 / 350; // scale from editor to canvas
        const x = el.x * sx, y = el.y * sy, w = el.w * sx, h = el.h * sy;
        if (el.type === 'text') {
            ctx.fillStyle = el.color || '#333';
            ctx.font = `${el.bold ? 'bold ' : ''} ${el.italic ? 'italic ' : ''}${(el.fontSize || 18) * sx}px ${el.fontFamily || 'Arial'}`;
            ctx.textAlign = el.align || 'left';
            const tx = el.align === 'center' ? x + w / 2 : el.align === 'right' ? x + w : x;
            const words = (el.text || '').split(' ');
            let line = '', ly = y + (el.fontSize || 18) * sy;
            words.forEach(word => {
                const test = line + word + ' ';
                if (ctx.measureText(test).width > w && line !== '') { ctx.fillText(line.trim(), tx, ly); ly += (el.fontSize || 18) * sy * 1.3; line = word + ' '; }
                else line = test;
            });
            ctx.fillText(line.trim(), tx, ly);
        } else if (el.type === 'rect') {
            ctx.fillStyle = el.fill || '#4a90d9';
            const r = (el.radius || 0) * sx;
            ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
        } else if (el.type === 'circle') {
            ctx.fillStyle = el.fill || '#4a90d9';
            ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
        } else if (el.type === 'image' && el.src) {
            try { const img = new Image(); img.src = el.src; ctx.drawImage(img, x, y, w, h); } catch (e) { }
        } else if (el.type === 'line') {
            ctx.strokeStyle = el.fill || '#4a90d9'; ctx.lineWidth = 3 * sx; ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
        } else if (el.type === 'star') {
            ctx.fillStyle = el.fill || '#4a90d9';
            drawStar(ctx, x + w / 2, y + h / 2, 5, w / 2, w / 4); ctx.fill();
        } else if (el.type === 'triangle') {
            ctx.fillStyle = el.fill || '#4a90d9';
            ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
        } else if (el.type === 'arrow') {
            ctx.fillStyle = el.fill || '#4a90d9';
            ctx.beginPath(); ctx.moveTo(x, y + h * 0.33); ctx.lineTo(x + w * 0.7, y + h * 0.33); ctx.lineTo(x + w * 0.7, y); ctx.lineTo(x + w, y + h / 2); ctx.lineTo(x + w * 0.7, y + h); ctx.lineTo(x + w * 0.7, y + h * 0.67); ctx.lineTo(x, y + h * 0.67); ctx.closePath(); ctx.fill();
        }
    });
    _$('presentNum').textContent = `${presentIdx + 1} / ${slides.length}`;
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3, x = cx, y = cy, step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) { x = cx + Math.cos(rot) * outerR; y = cy + Math.sin(rot) * outerR; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * innerR; y = cy + Math.sin(rot) * innerR; ctx.lineTo(x, y); rot += step; }
    ctx.closePath();
}

document.addEventListener('keydown', e => {
    if (!_$('presentOverlay').classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') nextSlideP();
    else if (e.key === 'ArrowLeft') prevSlideP();
    else if (e.key === 'Escape') exitPresentation();
});

// ── EXPORT PPTX ──
function exportPPTX() {
    const pptx = new PptxGenJS();
    pptx.title = _$('docTitle').value || 'Presentation';
    slides.forEach(s => {
        const sl = pptx.addSlide();
        sl.background = { fill: s.background.replace('#', '') };
        s.elements.forEach(el => {
            const xIn = el.x / 96, yIn = el.y / 96, wIn = el.w / 96, hIn = el.h / 96;
            if (el.type === 'text') {
                sl.addText(el.text || '', { x: xIn, y: yIn, w: wIn, h: hIn, fontSize: (el.fontSize || 18) * 0.75, fontFace: el.fontFamily || 'Arial', color: el.color ? el.color.replace('#', '') : '333333', bold: !!el.bold, italic: !!el.italic, align: el.align || 'left' });
            } else if (el.type === 'rect') {
                sl.addShape(pptx.ShapeType.rect, { x: xIn, y: yIn, w: wIn, h: hIn, fill: { color: (el.fill || '#4a90d9').replace('#', '') }, rectRadius: el.radius ? el.radius / 96 : 0 });
            } else if (el.type === 'circle') {
                sl.addShape(pptx.ShapeType.ellipse, { x: xIn, y: yIn, w: wIn, h: hIn, fill: { color: (el.fill || '#4a90d9').replace('#', '') } });
            } else if (el.type === 'image' && el.src) {
                try { sl.addImage({ data: el.src, x: xIn, y: yIn, w: wIn, h: hIn }); } catch (e) { }
            } else if (el.type === 'line') {
                sl.addShape(pptx.ShapeType.line, { x: xIn, y: yIn, w: wIn, h: 0, line: { color: (el.fill || '#4a90d9').replace('#', ''), width: 2 } });
            } else if (el.type === 'triangle') {
                sl.addShape(pptx.ShapeType.triangle, { x: xIn, y: yIn, w: wIn, h: hIn, fill: { color: (el.fill || '#4a90d9').replace('#', '') } });
            }
        });
        if (s.notes) sl.addNotes(s.notes);
    });
    pptx.writeFile({ fileName: (_$('docTitle').value || 'presentation') + '.pptx' });
}

// ── DELETE KEY ──
document.addEventListener('keydown', e => {
    if (e.key === 'Delete' && selEl !== null && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.contentEditable !== 'true') deleteSelected();
});

// ── AUTO-SAVE ──
function saveToStorage() { try { localStorage.setItem('vibox-ppt-doc', JSON.stringify({ s: slides, t: _$('docTitle').value })); } catch (e) { } }
function loadFromStorage() { try { const d = JSON.parse(localStorage.getItem('vibox-ppt-doc')); if (d && d.s && d.s.length) { slides = d.s; curSlide = 0; if (d.t) _$('docTitle').value = d.t; renderSlidePanel(); renderSlide(); updateNotes(); return true; } } catch (e) { } return false; }

init();
