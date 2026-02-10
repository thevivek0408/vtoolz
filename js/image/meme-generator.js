import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('meme-canvas');
    const ctx = canvas.getContext('2d');
    const imageInput = document.getElementById('image-input');
    const topTextInput = document.getElementById('top-text');
    const bottomTextInput = document.getElementById('bottom-text');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeVal = document.getElementById('font-size-val');
    const btnDownload = document.getElementById('btn-download');

    let currentImage = new Image();

    // Default Init
    currentImage.src = ''; // Empty start, draw placeholder
    currentImage.onload = drawMeme;

    // Draw Placeholder initially
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Impact';
    ctx.textAlign = 'center';
    ctx.fillText('Upload an Image', canvas.width / 2, canvas.height / 2);

    // Image Upload
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentImage = new Image();
                currentImage.onload = () => {
                    // Resize canvas to match image aspect ratio, max width 500
                    const maxWidth = 500;
                    const scale = maxWidth / currentImage.width;
                    canvas.width = maxWidth;
                    canvas.height = currentImage.height * scale;
                    drawMeme();
                };
                currentImage.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    // Inputs
    topTextInput.addEventListener('input', drawMeme);
    bottomTextInput.addEventListener('input', drawMeme);
    fontSizeInput.addEventListener('input', () => {
        fontSizeVal.textContent = fontSizeInput.value;
        drawMeme();
    });

    function drawMeme() {
        if (!currentImage.src) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Image
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

        // Text Settings
        const fontSize = fontSizeInput.value;
        ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const topText = topTextInput.value.toUpperCase();
        const bottomText = bottomTextInput.value.toUpperCase();

        const x = canvas.width / 2;

        // Top Text
        if (topText) {
            ctx.textBaseline = 'top';
            ctx.strokeText(topText, x, 20);
            ctx.fillText(topText, x, 20);
        }

        // Bottom Text
        if (bottomText) {
            ctx.textBaseline = 'bottom';
            ctx.strokeText(bottomText, x, canvas.height - 20);
            ctx.fillText(bottomText, x, canvas.height - 20);
        }
    }

    // Download
    btnDownload.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});
