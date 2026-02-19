const _$ = id => document.getElementById(id);
// ── INIT SPREADSHEET ──
const ROWS = 40, COLS = 20;
const defaultData = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
const colHeaders = Array.from({ length: COLS }, (_, i) => ({ title: String.fromCharCode(65 + (i % 26)) + (i >= 26 ? '2' : ''), width: 90 }));
let table, frozenRow = false;

try {
    table = jspreadsheet(_$('spreadsheet'), {
        data: defaultData, columns: colHeaders,
        minDimensions: [COLS, ROWS], tableOverflow: true,
        tableWidth: '100%', tableHeight: '450px',
        onselection: onSel, onchange: onChange,
        contextMenu: () => false
    });
} catch (e) { _$('spreadsheet').innerHTML = '<p style="padding:20px;color:#333;">Spreadsheet engine loading... try refreshing.</p>'; }

function onSel(el, bL, bT) {
    if (!table) return;
    const col = String.fromCharCode(65 + (bL || 0));
    const row = (bT || 0) + 1;
    _$('cellRef').textContent = col + row;
    _$('formulaInput').value = table.getValueFromCoords(bL, bT) || '';
    updateSelStats();
}
function onChange() { saveToStorage(); updateSelStats(); }

function updateSelStats() {
    if (!table) return;
    const sel = table.getSelected(true);
    if (!sel || sel.length <= 1) { _$('selStats').textContent = ''; return; }
    let nums = [];
    sel.forEach(c => { const v = parseFloat(table.getValueFromCoords(c[0], c[1])); if (!isNaN(v)) nums.push(v); });
    if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        _$('selStats').textContent = `Sum: ${sum.toFixed(2)} | Avg: ${(sum / nums.length).toFixed(2)} | Count: ${nums.length}`;
    }
}

// ── FORMULA BAR ──
_$('formulaInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && table) {
        const s = table.getSelected(true);
        if (s && s.length > 0) table.setValueFromCoords(s[0][0], s[0][1], _$('formulaInput').value);
    }
});
_$('formulaInsert').onchange = function () { if (this.value) { _$('formulaInput').value = this.value; _$('formulaInput').focus(); this.value = ''; } };

// ── TOOLBAR ACTIONS ──
_$('btnAddRow').onclick = () => { if (table) table.insertRow(); };
_$('btnAddCol').onclick = () => { if (table) table.insertColumn(); };
_$('btnDelRow').onclick = () => { if (table) { const s = table.getSelected(true); if (s && s.length > 0) table.deleteRow(s[0][1]); } };
_$('btnDelCol').onclick = () => { if (table) { const s = table.getSelected(true); if (s && s.length > 0) table.deleteColumn(s[0][0]); } };

function styleCell(p, v) { if (!table) return; const c = table.getSelected(true); if (!c) return; c.forEach(s => { table.setStyle(jspreadsheet.getColumnNameFromId([s[0], s[1]]), p, v); }); }
_$('btnBold').onclick = () => styleCell('font-weight', 'bold');
_$('btnItalic').onclick = () => styleCell('font-style', 'italic');
_$('cellBg').oninput = function () { styleCell('background-color', this.value); };
_$('cellFg').oninput = function () { styleCell('color', this.value); };
_$('btnAlignL').onclick = () => styleCell('text-align', 'left');
_$('btnAlignC').onclick = () => styleCell('text-align', 'center');
_$('btnAlignR').onclick = () => styleCell('text-align', 'right');

// ── FREEZE ROW 1 ──
_$('btnFreeze').onclick = () => {
    frozenRow = !frozenRow;
    _$('btnFreeze').style.background = frozenRow ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)';
    // Visual indicator only — jspreadsheet CE doesn't support freeze natively
    const hdr = document.querySelector('.jexcel thead');
    if (hdr) hdr.style.position = frozenRow ? 'sticky' : '';
    if (hdr) hdr.style.top = frozenRow ? '0' : '';
    if (hdr) hdr.style.zIndex = frozenRow ? '10' : '';
    _$('cellInfo').textContent = frozenRow ? 'Row 1 frozen' : 'Ready';
};

// ── CONDITIONAL FORMATTING ──
_$('btnCondFmt').onclick = () => {
    const rule = prompt('Conditional Format Rule:\n1 = Highlight cells > value (green)\n2 = Highlight cells < value (red)\n3 = Highlight cells = text (blue)', '1');
    if (!rule) return;
    const val = prompt('Enter threshold/value:');
    if (val === null) return;
    if (!table) return;
    const data = table.getData();
    data.forEach((row, r) => {
        row.forEach((cell, c) => {
            const cn = jspreadsheet.getColumnNameFromId([c, r]);
            const num = parseFloat(cell);
            if (rule === '1' && !isNaN(num) && num > parseFloat(val)) {
                table.setStyle(cn, 'background-color', '#c6efce'); table.setStyle(cn, 'color', '#006100');
            } else if (rule === '2' && !isNaN(num) && num < parseFloat(val)) {
                table.setStyle(cn, 'background-color', '#ffc7ce'); table.setStyle(cn, 'color', '#9c0006');
            } else if (rule === '3' && cell.toString().toLowerCase() === val.toLowerCase()) {
                table.setStyle(cn, 'background-color', '#bdd7ee'); table.setStyle(cn, 'color', '#1f4e79');
            }
        });
    });
};

// ── FIND & REPLACE ──
_$('btnFind').onclick = () => { _$('findPanel').classList.toggle('open'); _$('findInput').focus(); };
function closeFindPanel() { _$('findPanel').classList.remove('open'); }
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); _$('btnFind').click(); } });

function findInSheet() {
    if (!table) return;
    const q = _$('findInput').value.toLowerCase(); if (!q) return;
    const data = table.getData(); let count = 0, first = null;
    data.forEach((row, r) => row.forEach((cell, c) => {
        if ((cell || '').toString().toLowerCase().includes(q)) {
            count++;
            if (!first) first = [c, r];
            table.setStyle(jspreadsheet.getColumnNameFromId([c, r]), 'background-color', '#ffeb3b');
        }
    }));
    _$('findCount').textContent = count + ' found';
    if (first) table.updateSelectionFromCoords(first[0], first[1], first[0], first[1]);
}
function replaceInSheet() {
    if (!table) return;
    const q = _$('findInput').value, r = _$('replaceInput').value; if (!q) return;
    const sel = table.getSelected(true);
    if (sel && sel.length > 0) {
        const val = table.getValueFromCoords(sel[0][0], sel[0][1]);
        if (val && val.toString().toLowerCase().includes(q.toLowerCase())) {
            table.setValueFromCoords(sel[0][0], sel[0][1], val.toString().replace(new RegExp(q, 'i'), r));
        }
    }
}
function replaceAllInSheet() {
    if (!table) return;
    const q = _$('findInput').value, r = _$('replaceInput').value; if (!q) return;
    const data = table.getData(); let count = 0;
    data.forEach((row, ri) => row.forEach((cell, ci) => {
        if ((cell || '').toString().toLowerCase().includes(q.toLowerCase())) {
            table.setValueFromCoords(ci, ri, cell.toString().replace(new RegExp(q, 'gi'), r));
            count++;
        }
    }));
    _$('findCount').textContent = count + ' replaced';
}

// ── CHARTS ──
let chartInstance = null;
_$('btnChart').onclick = () => _$('chartModal').classList.add('open');
function closeChartModal() { _$('chartModal').classList.remove('open'); }
_$('chartModal').onclick = e => { if (e.target === _$('chartModal')) closeChartModal(); };

function parseRange(range) {
    const m = range.match(/([A-Z])(\d+):([A-Z])(\d+)/i);
    if (!m) return null;
    return { c1: m[1].toUpperCase().charCodeAt(0) - 65, r1: parseInt(m[2]) - 1, c2: m[3].toUpperCase().charCodeAt(0) - 65, r2: parseInt(m[4]) - 1 };
}

function generateChart() {
    if (!table) return;
    const rng = parseRange(_$('chartRange').value);
    if (!rng) { alert('Invalid range. Use format like A1:D5'); return; }
    const data = table.getData();
    const type = _$('chartType').value;
    const labelsFrom = _$('chartLabels').value;

    let labels = [], datasets = [];
    if (labelsFrom === 'row') {
        // First row = labels
        for (let c = rng.c1 + 1; c <= rng.c2; c++) labels.push(data[rng.r1][c] || ('Col ' + (c + 1)));
        for (let r = rng.r1 + 1; r <= rng.r2; r++) {
            const vals = [];
            for (let c = rng.c1 + 1; c <= rng.c2; c++) vals.push(parseFloat(data[r][c]) || 0);
            datasets.push({
                label: data[r][rng.c1] || ('Row ' + (r + 1)), data: vals,
                backgroundColor: getColors(vals.length, .6), borderColor: getColors(vals.length, 1), borderWidth: 1
            });
        }
    } else {
        // First col = labels
        for (let r = rng.r1 + 1; r <= rng.r2; r++) labels.push(data[r][rng.c1] || ('Row ' + (r + 1)));
        for (let c = rng.c1 + 1; c <= rng.c2; c++) {
            const vals = [];
            for (let r = rng.r1 + 1; r <= rng.r2; r++) vals.push(parseFloat(data[r][c]) || 0);
            datasets.push({
                label: data[rng.r1][c] || ('Col ' + (c + 1)), data: vals,
                backgroundColor: getColors(vals.length, .6), borderColor: getColors(vals.length, 1), borderWidth: 1
            });
        }
    }

    if (chartInstance) chartInstance.destroy();
    const ctx = _$('chartCanvas').getContext('2d');

    // For pie/doughnut, flatten to single dataset
    let chartData;
    if ((type === 'pie' || type === 'doughnut') && datasets.length > 0) {
        chartData = { labels: labels, datasets: [{ data: datasets[0].data, backgroundColor: getColors(labels.length, .7), borderWidth: 1 }] };
    } else {
        chartData = { labels: labels, datasets: datasets };
    }

    chartInstance = new Chart(ctx, {
        type: type,
        data: chartData,
        options: { responsive: true, plugins: { legend: { position: 'top', labels: { color: '#333' } }, title: { display: true, text: _$('docTitle').value || 'Chart', color: '#333' } }, scales: type === 'pie' || type === 'doughnut' || type === 'radar' ? {} : { y: { beginAtZero: true } } }
    });
}

function getColors(n, a) {
    const palette = ['rgba(52,152,219,' + a + ')', 'rgba(231,76,60,' + a + ')', 'rgba(46,204,113,' + a + ')', 'rgba(155,89,182,' + a + ')', 'rgba(241,196,15,' + a + ')', 'rgba(230,126,34,' + a + ')', 'rgba(26,188,156,' + a + ')', 'rgba(52,73,94,' + a + ')', 'rgba(142,68,173,' + a + ')', 'rgba(22,160,133,' + a + ')'];
    return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

function downloadChart() {
    const c = _$('chartCanvas');
    const a = document.createElement('a'); a.download = (_$('docTitle').value || 'chart') + '.png'; a.href = c.toDataURL('image/png'); a.click();
}

// ── PRINT ──
const _esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function printSheet() {
    if (!table) return;
    const data = table.getData();
    let html = '<html><head><title>' + _esc(_$('docTitle').value || 'Sheet') + '</title><style>table{border-collapse:collapse;width:100%;font-family:Arial;font-size:12px;}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;}th{background:#f0f0f0;font-weight:bold;}@media print{body{margin:0;}}</style></head><body><h3>' + _esc(_$('docTitle').value || 'Spreadsheet') + '</h3><table>';
    data.forEach((row, i) => {
        html += '<tr>';
        row.forEach(cell => html += (i === 0 ? '<th>' : '<td>') + _esc(cell || '') + (i === 0 ? '</th>' : '</td>'));
        html += '</tr>';
    });
    html += '</table></body></html>';
    const w = window.open('', ''); w.document.write(html); w.document.close(); w.print();
}

// ── EXPORTS ──
function exportCSV() {
    if (!table) return;
    const data = table.getData(), title = _$('docTitle').value || 'sheet';
    let csv = '';
    data.forEach(row => { csv += row.map(c => { const v = (c || '').toString(); return v.includes(',') ? '"' + v + '"' : v; }).join(',') + '\n'; });
    dlBlob(new Blob([csv], { type: 'text/csv' }), title + '.csv');
}
function exportXLSX() {
    if (!table) return;
    const data = table.getData(), title = _$('docTitle').value || 'sheet';
    const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, title + '.xlsx');
}
function importFile() { _$('fileInput').click(); }
_$('fileInput').onchange = function () {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
            if (table) {
                while (json.length < ROWS) json.push([]);
                json.forEach(r => { while (r.length < COLS) r.push(''); });
                table.setData(json);
            }
            _$('docTitle').value = file.name.replace(/\.[^.]+$/, '');
        } catch (err) { alert('Error: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    this.value = '';
};

function dlBlob(b, n) { const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = n; a.click(); URL.revokeObjectURL(u); }

// ── AUTO-FILL ──
_$('btnAutoFill').onclick = () => {
    if (!table) return;
    const sel = table.getSelected(true);
    if (!sel || sel.length === 0) { alert('Select at least 2 cells (first cell is the pattern source, rest will be filled).'); return; }
    // Get bounding box
    let minC = Infinity, maxC = -1, minR = Infinity, maxR = -1;
    sel.forEach(s => { minC = Math.min(minC, s[0]); maxC = Math.max(maxC, s[2] || s[0]); minR = Math.min(minR, s[1]); maxR = Math.max(maxR, s[3] || s[1]); });
    // Fill column-wise
    for (let c = minC; c <= maxC; c++) {
        const first = table.getValueFromCoords(c, minR);
        const second = (minR + 1 <= maxR) ? table.getValueFromCoords(c, minR + 1) : null;
        const num1 = parseFloat(first), num2 = second !== null ? parseFloat(second) : NaN;
        const step = (!isNaN(num1) && !isNaN(num2)) ? num2 - num1 : 1;
        for (let r = minR; r <= maxR; r++) {
            if (r === minR) continue;
            if (r === minR + 1 && second !== null && !isNaN(num2)) continue;
            if (!isNaN(num1)) {
                const startVal = !isNaN(num2) ? num2 : num1;
                const offset = !isNaN(num2) ? (r - minR - 1) : (r - minR);
                table.setValueFromCoords(c, r, startVal + step * offset);
            } else {
                // Text pattern: repeat
                table.setValueFromCoords(c, r, first);
            }
        }
    }
};

// ── CELL COMMENTS ──
const cellComments = {}; // key: 'col,row' -> string
_$('btnComment').onclick = () => {
    if (!table) return;
    const sel = table.getSelected(true);
    if (!sel || sel.length === 0) { alert('Select a cell first.'); return; }
    const c = sel[0][0], r = sel[0][1];
    const key = c + ',' + r;
    const existing = cellComments[key] || '';
    const note = prompt('Cell Note (leave empty to remove):', existing);
    if (note === null) return;
    if (note.trim() === '') {
        delete cellComments[key];
    } else {
        cellComments[key] = note;
    }
    renderCommentIndicators();
    saveToStorage();
};

function renderCommentIndicators() {
    // Remove old indicators
    document.querySelectorAll('.comment-indicator').forEach(el => el.remove());
    if (!table) return;
    const tds = document.querySelectorAll('#spreadsheet td');
    Object.keys(cellComments).forEach(key => {
        const [c, r] = key.split(',').map(Number);
        // Find the corresponding td
        const rows = document.querySelectorAll('#spreadsheet tbody tr');
        if (rows[r]) {
            const cells = rows[r].querySelectorAll('td');
            if (cells[c]) {
                cells[c].style.position = 'relative';
                const ind = document.createElement('div');
                ind.className = 'comment-indicator';
                cells[c].appendChild(ind);
            }
        }
    });
}

// Tooltip on hover
let commentTooltip = null;
document.addEventListener('mouseover', e => {
    const td = e.target.closest('#spreadsheet td');
    if (!td) return;
    const row = td.parentElement;
    const tbody = row?.parentElement;
    if (!tbody) return;
    const ri = Array.from(tbody.children).indexOf(row);
    const ci = Array.from(row.children).indexOf(td);
    const key = ci + ',' + ri;
    if (cellComments[key]) {
        if (!commentTooltip) {
            commentTooltip = document.createElement('div');
            commentTooltip.className = 'comment-tooltip';
            document.body.appendChild(commentTooltip);
        }
        commentTooltip.textContent = cellComments[key];
        commentTooltip.style.display = 'block';
        const rect = td.getBoundingClientRect();
        commentTooltip.style.left = (rect.right + 4) + 'px';
        commentTooltip.style.top = (rect.top) + 'px';
    }
});
document.addEventListener('mouseout', e => {
    const td = e.target.closest('#spreadsheet td');
    if (td && commentTooltip) commentTooltip.style.display = 'none';
});

// ── AUTO-SAVE ──
function saveToStorage() {
    if (!table) return;
    try {
        localStorage.setItem('vibox-excel-doc', JSON.stringify({
            d: table.getData(), t: _$('docTitle').value,
            comments: cellComments
        }));
    } catch (e) { }
}
try {
    const s = JSON.parse(localStorage.getItem('vibox-excel-doc'));
    if (s && s.d && table) { table.setData(s.d); if (s.t) _$('docTitle').value = s.t; }
    if (s && s.comments) Object.assign(cellComments, s.comments);
    setTimeout(renderCommentIndicators, 500);
} catch (e) { }