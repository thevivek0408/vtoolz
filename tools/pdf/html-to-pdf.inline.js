        const htmlInput = document.getElementById('htmlInput');
        const preview = document.getElementById('preview');
        const previewBtn = document.getElementById('previewBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        function updatePreview() {
            // Sanitize to prevent XSS from pasted HTML
            if (typeof DOMPurify !== 'undefined') {
                preview.innerHTML = DOMPurify.sanitize(htmlInput.value);
            } else {
                preview.textContent = htmlInput.value;
            }
        }

        previewBtn.addEventListener('click', updatePreview);

        // Auto-update on type (debounced?) - for now manual or on blur
        htmlInput.addEventListener('blur', updatePreview);

        // Initial preview
        htmlInput.value = `<h1>Invoice #1234</h1>
<p><strong>Date:</strong> 2023-10-27</p>
<table border="1" style="width:100%; border-collapse: collapse;">
  <tr><th>Item</th><th>Cost</th></tr>
  <tr><td>Service A</td><td>$100</td></tr>
  <tr><td>Service B</td><td>$50</td></tr>
  <tr><td><strong>Total</strong></td><td><strong>$150</strong></td></tr>
</table>`;
        updatePreview();

        downloadBtn.addEventListener('click', () => {
            const opt = {
                margin: 0.5,
                filename: 'document.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(preview).save();
        });