import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const resultArea = document.getElementById('result-area');
    const previewImg = document.getElementById('preview-img');
    const paletteDiv = document.getElementById('palette');

    // ColorThief is global from CDN script tag
    const colorThief = new ColorThief();

    Utils.setupDragAndDrop(dropArea, fileInput, (file) => {
        const url = URL.createObjectURL(file);
        previewImg.src = url;
        resultArea.style.display = 'block';

        previewImg.onload = () => {
            // Get Palette (10 colors)
            try {
                const palette = colorThief.getPalette(previewImg, 10);
                renderPalette(palette);
            } catch (e) {
                console.error(e); // Colors might fail on some cross-origin or weird formats
            }
        };
    });

    function renderPalette(colors) {
        paletteDiv.innerHTML = '';
        colors.forEach(rgb => {
            const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);

            const card = document.createElement('div');
            card.className = 'color-card';
            card.style.backgroundColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

            card.innerHTML = `<div class="color-info">${hex}</div>`;

            card.addEventListener('click', () => {
                navigator.clipboard.writeText(hex);
                Utils.showToast(`Copied ${hex}`, 'success');
            });

            paletteDiv.appendChild(card);
        });
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
});
