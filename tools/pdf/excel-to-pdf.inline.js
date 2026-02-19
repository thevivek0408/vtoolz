const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const controls = document.getElementById('controls');
const downloadBtn = document.getElementById('downloadBtn');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--primary-color)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to HTML
        const html = XLSX.utils.sheet_to_html(worksheet);

        // Sanitize to prevent XSS from malicious spreadsheets
        if (typeof DOMPurify !== 'undefined') {
            preview.innerHTML = DOMPurify.sanitize(html);
        } else {
            preview.textContent = html;
        }
        preview.style.display = 'block';
        controls.style.display = 'flex';
    };
    reader.readAsArrayBuffer(file);
}

downloadBtn.addEventListener('click', () => {
    const opt = {
        margin: 0.5,
        filename: 'spreadsheet.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' } // Landscape for tables usually better
    };

    html2pdf().set(opt).from(preview).save();
});