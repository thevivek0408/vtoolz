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
    if (!file.name.endsWith('.docx')) {
        alert('Please upload a .docx file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then(displayResult)
            .catch(handleError);
    };
    reader.readAsArrayBuffer(file);
}

function displayResult(result) {
    // Sanitize mammoth output to prevent XSS from malicious .docx files
    if (typeof DOMPurify !== 'undefined') {
        preview.innerHTML = DOMPurify.sanitize(result.value);
    } else {
        preview.textContent = result.value;
    }
    preview.style.display = 'block';
    controls.style.display = 'flex';

    // Basic messages
    const messages = result.messages;
    if (messages.length > 0) {
        // Suppressed in production
    }
}

function handleError(err) {
    console.error(err);
    alert('Error converting file: ' + err.message);
}

downloadBtn.addEventListener('click', () => {
    const opt = {
        margin: 1,
        filename: 'converted.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Use html2pdf
    html2pdf().set(opt).from(preview).save();
});