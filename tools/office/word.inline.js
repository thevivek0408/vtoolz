// ── QUILL INIT ──
const quill = new Quill('#editor', {
    theme: 'snow', modules: { toolbar: false, history: { maxStack: 100 } },
    placeholder: 'Start typing or pick a template...'
});

// ── TOOLBAR BINDINGS ──
const $ = id => document.getElementById(id);
$('btnBold').onclick = () => toggleFmt('bold');
$('btnItalic').onclick = () => toggleFmt('italic');
$('btnUnderline').onclick = () => toggleFmt('underline');
$('btnStrike').onclick = () => toggleFmt('strike');
$('btnAlignL').onclick = () => quill.format('align', false);
$('btnAlignC').onclick = () => quill.format('align', 'center');
$('btnAlignR').onclick = () => quill.format('align', 'right');
$('btnAlignJ').onclick = () => quill.format('align', 'justify');
$('btnBullet').onclick = () => toggleFmt('list', 'bullet');
$('btnOrdered').onclick = () => toggleFmt('list', 'ordered');
$('btnBlockquote').onclick = () => toggleFmt('blockquote');
$('btnCode').onclick = () => toggleFmt('code-block');
$('btnUndo').onclick = () => quill.history.undo();
$('btnRedo').onclick = () => quill.history.redo();
$('btnClean').onclick = () => { const r = quill.getSelection(); if (r) quill.removeFormat(r.index, r.length); };
$('btnImage').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader(); r.onload = e => { const s = quill.getSelection(true); quill.insertEmbed(s.index, 'image', e.target.result); }; r.readAsDataURL(f); }; i.click(); };
$('btnLink').onclick = () => { const u = prompt('Enter URL:'); if (u) { const r = quill.getSelection(true); r.length > 0 ? quill.format('link', u) : quill.insertText(r.index, u, 'link', u); } };
$('btnDivider').onclick = () => { const r = quill.getSelection(true); quill.insertText(r.index, '\n'); quill.insertEmbed(r.index + 1, 'divider', true); quill.setSelection(r.index + 2); };
$('fontFamily').onchange = function () { quill.format('font', this.value); };
$('fontSize').onchange = function () { quill.format('size', this.value); };
$('heading').onchange = function () { quill.format('header', this.value ? parseInt(this.value) : false); };
$('textColor').oninput = function () { quill.format('color', this.value); };
$('bgColor').oninput = function () { quill.format('background', this.value); };

// ── TABLE INSERT ──
$('btnTable').onclick = () => {
    const rows = parseInt(prompt('Rows:', '3')) || 3;
    const cols = parseInt(prompt('Columns:', '3')) || 3;
    const r = quill.getSelection(true);
    let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;"><tbody>';
    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        for (let j = 0; j < cols; j++) html += '<td style="border:1px solid #ccc;padding:8px;min-width:60px;">&nbsp;</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';
    quill.clipboard.dangerouslyPasteHTML(r.index, html);
};

function toggleFmt(n, v) { const c = quill.getFormat(); v ? quill.format(n, c[n] === v ? false : v) : quill.format(n, !c[n]); }

// ── WORD COUNT ──
quill.on('text-change', () => {
    const t = quill.getText().trim();
    const w = t ? t.split(/\s+/).length : 0;
    $('wordCount').textContent = `Words: ${w}`;
    $('charCount').textContent = `Chars: ${t.length}`;
    $('lineCount').textContent = `Lines: ${t.split('\n').length}`;
    $('pageEst').textContent = `~${Math.max(1, Math.ceil(w / 250))} pages`;
});

// ── FIND & REPLACE ──
let findMatches = [], findIdx = -1;
$('btnFind').onclick = () => { $('findPanel').classList.toggle('open'); $('findInput').focus(); };
function closeFind() { $('findPanel').classList.remove('open'); clearHighlights(); }
$('findInput').oninput = () => doFind();

function doFind() {
    clearHighlights();
    const q = $('findInput').value;
    if (!q) { $('findCount').textContent = ''; findMatches = []; return; }
    const text = quill.getText();
    findMatches = []; let idx = 0;
    while ((idx = text.toLowerCase().indexOf(q.toLowerCase(), idx)) !== -1) {
        findMatches.push(idx); idx += q.length;
    }
    $('findCount').textContent = findMatches.length + ' found';
    findMatches.forEach(i => quill.formatText(i, q.length, { background: '#ffeb3b' }, 'silent'));
    findIdx = findMatches.length > 0 ? 0 : -1;
    if (findIdx >= 0) quill.setSelection(findMatches[0], q.length);
}
function clearHighlights() { quill.formatText(0, quill.getLength(), { background: false }, 'silent'); }
function findNext() { if (findMatches.length === 0) return; findIdx = (findIdx + 1) % findMatches.length; quill.setSelection(findMatches[findIdx], $('findInput').value.length); }
function findPrev() { if (findMatches.length === 0) return; findIdx = (findIdx - 1 + findMatches.length) % findMatches.length; quill.setSelection(findMatches[findIdx], $('findInput').value.length); }
function replaceOne() {
    if (findIdx < 0) return;
    const q = $('findInput').value, r = $('replaceInput').value;
    quill.deleteText(findMatches[findIdx], q.length);
    quill.insertText(findMatches[findIdx], r);
    doFind();
}
function replaceAll() {
    const q = $('findInput').value, r = $('replaceInput').value;
    if (!q) return; clearHighlights();
    let text = quill.getText(), offset = 0;
    findMatches.forEach(pos => {
        const adj = pos + offset;
        quill.deleteText(adj, q.length);
        quill.insertText(adj, r);
        offset += r.length - q.length;
    });
    doFind();
}

// Ctrl+F shortcut
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); $('btnFind').click(); }
});

// ── TEMPLATES ──
const templates = [
    {
        name: 'Resume', icon: 'fas fa-user-tie', desc: 'Professional CV template',
        content: `<h1 style="text-align:center;">Your Name</h1><p style="text-align:center;">📧 email@example.com | 📱 +91-9876543210 | 📍 City, India</p><hr><h2>Summary</h2><p>Experienced professional with expertise in...</p><h2>Experience</h2><h3>Job Title — Company Name</h3><p><em>Jan 2023 – Present</em></p><ul><li>Led a team of 5 engineers...</li><li>Increased revenue by 25%...</li></ul><h3>Previous Role — Company</h3><p><em>Jun 2020 – Dec 2022</em></p><ul><li>Developed key features...</li></ul><h2>Education</h2><h3>B.Tech Computer Science</h3><p><em>University Name, 2020</em></p><h2>Skills</h2><p>JavaScript, Python, React, Node.js, SQL, Git</p>`
    },
    {
        name: 'Cover Letter', icon: 'fas fa-envelope', desc: 'Formal letter template',
        content: `<p style="text-align:right;">Date: ${new Date().toLocaleDateString()}</p><p><strong>Hiring Manager</strong><br>Company Name<br>Address Line</p><p>Dear Hiring Manager,</p><p>I am writing to express my interest in the <strong>[Position Title]</strong> position at <strong>[Company Name]</strong>. With my background in...</p><p>In my previous role at [Previous Company], I successfully...</p><p>I am particularly drawn to this opportunity because...</p><p>Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with the needs of your team.</p><p>Sincerely,<br><strong>Your Name</strong></p>`
    },
    {
        name: 'Report', icon: 'fas fa-chart-bar', desc: 'Business report layout',
        content: `<h1 style="text-align:center;">Project Report</h1><p style="text-align:center;"><em>Prepared by: Your Name | Date: ${new Date().toLocaleDateString()}</em></p><hr><h2>1. Executive Summary</h2><p>This report presents the findings of...</p><h2>2. Introduction</h2><p>The purpose of this report is to...</p><h2>3. Methodology</h2><p>Data was collected through...</p><h2>4. Findings</h2><ul><li>Finding 1: ...</li><li>Finding 2: ...</li><li>Finding 3: ...</li></ul><h2>5. Recommendations</h2><ol><li>Recommendation 1</li><li>Recommendation 2</li></ol><h2>6. Conclusion</h2><p>In summary, the key takeaways are...</p>`
    },
    {
        name: 'Meeting Notes', icon: 'fas fa-clipboard', desc: 'Quick meeting template',
        content: `<h1>Meeting Notes</h1><p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br><strong>Attendees:</strong> Name1, Name2, Name3<br><strong>Location:</strong> Conference Room / Zoom</p><hr><h2>Agenda</h2><ol><li>Topic 1</li><li>Topic 2</li><li>Topic 3</li></ol><h2>Discussion</h2><p><strong>Topic 1:</strong> Key points discussed...</p><p><strong>Topic 2:</strong> Decision made to...</p><h2>Action Items</h2><ul><li>[ ] Task 1 — Owner — Due Date</li><li>[ ] Task 2 — Owner — Due Date</li></ul><h2>Next Meeting</h2><p>Scheduled for...</p>`
    },
    {
        name: 'Essay', icon: 'fas fa-pen-fancy', desc: 'Academic essay structure',
        content: `<h1 style="text-align:center;">Essay Title</h1><p style="text-align:center;"><em>Author Name | Course | Date</em></p><hr><h2>Introduction</h2><p>Begin with a hook to grab the reader's attention. Provide background context and end with your thesis statement...</p><h2>Body Paragraph 1</h2><p>Topic sentence supporting the thesis. Provide evidence, examples, and analysis...</p><h2>Body Paragraph 2</h2><p>Second supporting argument with evidence and explanation...</p><h2>Body Paragraph 3</h2><p>Third supporting argument or counter-argument rebuttal...</p><h2>Conclusion</h2><p>Restate your thesis in new words, summarize key points, and end with a closing thought or call to action...</p><h2>References</h2><ol><li>Author, Title, Journal/Publisher, Year</li></ol>`
    },
    {
        name: 'Blank', icon: 'fas fa-file', desc: 'Start fresh',
        content: ``
    }
];

$('btnTemplate').onclick = () => $('templateModal').classList.add('open');
function closeTemplateModal() { $('templateModal').classList.remove('open'); }

(function renderTemplates() {
    const grid = $('tplGrid');
    templates.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tpl-card';
        card.innerHTML = `<i class="${t.icon}"></i><h4>${t.name}</h4><p>${t.desc}</p>`;
        card.onclick = () => {
            if (t.content) quill.clipboard.dangerouslyPasteHTML(0, t.content);
            else quill.setText('');
            $('docTitle').value = t.name === 'Blank' ? 'Untitled Document' : t.name;
            closeTemplateModal();
        };
        grid.appendChild(card);
    });
})();

$('templateModal').onclick = e => { if (e.target === $('templateModal')) closeTemplateModal(); };

// ── IMPORT (TXT + DOCX) ──
function importFile() { $('fileInput').click(); }
$('fileInput').onchange = function () {
    const file = this.files[0]; if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'docx' || ext === 'doc') {
        const reader = new FileReader();
        reader.onload = e => {
            mammoth.convertToHtml({ arrayBuffer: e.target.result })
                .then(result => {
                    quill.clipboard.dangerouslyPasteHTML(0, result.value);
                    $('docTitle').value = file.name.replace(/\.[^.]+$/, '');
                }).catch(err => alert('DOCX import error: ' + err.message));
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = e => { quill.setText(e.target.result); $('docTitle').value = file.name.replace(/\.[^.]+$/, ''); };
        reader.readAsText(file);
    }
    this.value = '';
};

// ── FOCUS MODE ──
$('btnFocus').onclick = () => {
    $('focusEditor').innerHTML = quill.root.innerHTML;
    $('focusOverlay').classList.add('open');
    $('focusEditor').focus();
};
function exitFocus() {
    quill.clipboard.dangerouslyPasteHTML(0, $('focusEditor').innerHTML);
    $('focusOverlay').classList.remove('open');
}

// ── DARK EDITOR ──
$('btnDarkEditor').onclick = () => {
    $('editorWrap').classList.toggle('dark-mode');
    const icon = $('btnDarkEditor').querySelector('i');
    icon.classList.toggle('fa-moon'); icon.classList.toggle('fa-sun');
};

// ── SANITIZE HELPER ──
const sanitizeHTML = (html) => typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : html;
const escapeHTML = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── PRINT ──
$('btnPrint').onclick = () => {
    const w = window.open('', '', 'width=800,height=600');
    w.document.write(`<html><head><title>${escapeHTML($('docTitle').value)}</title><style>body{font-family:Georgia,serif;padding:40px;line-height:1.8;color:#1a1a2e;}h1{color:#2b5797;}h2{color:#2b5797;}img{max-width:100%;}blockquote{border-left:4px solid #2b5797;padding-left:12px;color:#555;}</style></head><body>${sanitizeHTML(quill.root.innerHTML)}</body></html>`);
    w.document.close(); w.print();
};

// ── EXPORTS ──
function exportTxt() { dlBlob(new Blob([quill.getText()], { type: 'text/plain' }), ($('docTitle').value || 'doc') + '.txt'); }
function exportDocx() {
    const html = quill.root.innerHTML, title = $('docTitle').value || 'document';
    const full = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:'Calibri',sans-serif;font-size:12pt;line-height:1.6;color:#1a1a2e;margin:1in;}h1{font-size:24pt;color:#2b5797;}h2{font-size:18pt;color:#2b5797;}h3{font-size:14pt;color:#2b5797;}img{max-width:100%;}blockquote{border-left:4px solid #2b5797;padding-left:12px;color:#555;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>${html}</body></html>`;
    dlBlob(new Blob(['\ufeff', full], { type: 'application/msword' }), title + '.doc');
}
function exportPdf() {
    const el = quill.root.cloneNode(true); el.style.padding = '30px'; el.style.background = '#fff'; el.style.color = '#1a1a2e'; el.style.fontFamily = 'Georgia,serif';
    html2pdf().set({ margin: [15, 15, 15, 15], filename: ($('docTitle').value || 'doc') + '.pdf', image: { type: 'jpeg', quality: .95 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(el).save();
}
function dlBlob(b, n) { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = n; a.click(); URL.revokeObjectURL(u); }

// ── HEADER / FOOTER ──
$('btnHF').onclick = () => {
    const show = $('headerBar').style.display === 'none';
    $('headerBar').style.display = show ? 'block' : 'none';
    $('footerBar').style.display = show ? 'block' : 'none';
    $('btnHF').classList.toggle('active', show);
};

// ── AUTO-SAVE ──
const SK = 'vibox-word-doc', VK = 'vibox-word-versions';
quill.on('text-change', debounce(() => {
    try {
        localStorage.setItem(SK, JSON.stringify({
            c: quill.getContents(), t: $('docTitle').value,
            hdr: $('headerInput').value, ftr: $('footerInput').value
        }));
    } catch (e) { }
}, 1000));

// Restore current save
try {
    const s = JSON.parse(localStorage.getItem(SK));
    if (s && s.c) { quill.setContents(s.c); if (s.t) $('docTitle').value = s.t; }
    if (s && s.hdr) $('headerInput').value = s.hdr;
    if (s && s.ftr) $('footerInput').value = s.ftr;
} catch (e) { }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ── VERSION HISTORY ──
function saveVersion() {
    try {
        let versions = JSON.parse(localStorage.getItem(VK) || '[]');
        versions.unshift({
            ts: Date.now(),
            c: quill.getContents(),
            t: $('docTitle').value
        });
        if (versions.length > 10) versions = versions.slice(0, 10);
        localStorage.setItem(VK, JSON.stringify(versions));
    } catch (e) { }
}
setInterval(saveVersion, 30000); // every 30s

$('btnVersions').onclick = () => {
    $('versionsModal').classList.add('open');
    renderVersions();
};
function closeVersions() { $('versionsModal').classList.remove('open'); }
$('versionsModal').onclick = e => { if (e.target === $('versionsModal')) closeVersions(); };

function renderVersions() {
    const list = $('versionsList');
    try {
        const versions = JSON.parse(localStorage.getItem(VK) || '[]');
        if (versions.length === 0) { list.innerHTML = '<p style="opacity:.5;font-size:13px;">No versions saved yet. Auto-saves every 30 seconds.</p>'; return; }
        list.innerHTML = '';
        versions.forEach((v, i) => {
            const d = document.createElement('div');
            d.className = 'ver-item';
            const date = new Date(v.ts);
            const text = quill.getText.call({ getContents: () => v.c }) || '';
            d.innerHTML = `<span>${date.toLocaleString()} — "${v.t || 'Untitled'}"</span><button onclick="restoreVersion(${i})">Restore</button>`;
            list.appendChild(d);
        });
    } catch (e) { list.innerHTML = '<p style="opacity:.5;">Error loading versions.</p>'; }
}
window.restoreVersion = function (i) {
    try {
        const versions = JSON.parse(localStorage.getItem(VK) || '[]');
        if (versions[i]) {
            quill.setContents(versions[i].c);
            if (versions[i].t) $('docTitle').value = versions[i].t;
            closeVersions();
        }
    } catch (e) { }
};

// Include header/footer in print
const origPrint = $('btnPrint').onclick;
$('btnPrint').onclick = () => {
    const hdr = $('headerInput').value, ftr = $('footerInput').value;
    const w = window.open('', '', 'width=800,height=600');
    w.document.write(`<html><head><title>${escapeHTML($('docTitle').value)}</title><style>body{font-family:Georgia,serif;padding:40px;line-height:1.8;color:#1a1a2e;}.hdr,.ftr{text-align:center;font-size:10px;color:#888;padding:8px;border-bottom:1px solid #eee;margin-bottom:16px;}.ftr{border-bottom:none;border-top:1px solid #eee;margin-top:16px;}h1,h2{color:#2b5797;}img{max-width:100%;}blockquote{border-left:4px solid #2b5797;padding-left:12px;color:#555;}</style></head><body>`);
    if (hdr) w.document.write(`<div class="hdr">${escapeHTML(hdr)}</div>`);
    w.document.write(sanitizeHTML(quill.root.innerHTML));
    if (ftr) w.document.write(`<div class="ftr">${escapeHTML(ftr)}</div>`);
    w.document.write('</body></html>');
    w.document.close(); w.print();
};