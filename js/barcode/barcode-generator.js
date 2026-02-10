import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const barcodeText = document.getElementById('barcode-text');
    const barcodeFormat = document.getElementById('barcode-format');
    const lineColor = document.getElementById('line-color');
    const bgColor = document.getElementById('bg-color');
    const showText = document.getElementById('show-text');
    const previewContainer = document.getElementById('preview-container');
    const errorMsg = document.getElementById('error-msg');
    const downloadSvgBtn = document.getElementById('download-svg-btn');

    function generateBarcode() {
        const text = barcodeText.value.trim();
        const format = barcodeFormat.value;

        errorMsg.style.display = 'none';

        if (!text) {
            // Clean slate
            return;
        }

        // Update container bg
        previewContainer.style.background = bgColor.value;

        try {
            JsBarcode("#barcode", text, {
                format: format,
                lineColor: lineColor.value,
                width: 2,
                height: 100,
                displayValue: showText.checked,
                background: bgColor.value // JsBarcode uses this too
            });
        } catch (e) {
            console.error(e);
            errorMsg.textContent = "Invalid content for this barcode format.";
            errorMsg.style.display = 'block';
        }
    }

    // Event Listeners
    [barcodeText, barcodeFormat, lineColor, bgColor, showText].forEach(el => {
        el.addEventListener('input', generateBarcode);
        el.addEventListener('change', generateBarcode);
    });

    // Download SVG
    downloadSvgBtn.addEventListener('click', () => {
        const svg = document.getElementById('barcode');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `barcode-${barcodeText.value || 'vtoolz'}.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Init
    generateBarcode();
});
