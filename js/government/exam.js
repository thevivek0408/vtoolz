import { Utils } from '../utils/common.js';
import { GovPresets } from './presets.js';
import { GovUtils } from './gov-utils.js';

document.addEventListener('DOMContentLoaded', () => {

    const examSelect = document.getElementById('exam-select');
    const reqTitle = document.getElementById('req-title');
    const reqList = document.getElementById('req-list');

    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });

            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.target);
            target.style.display = 'block';
            target.classList.add('active');
        });
    });

    let currentConfig = GovPresets.EXAM.SSC; // Default

    function updateRequirements() {
        const exam = examSelect.value;
        currentConfig = GovPresets.EXAM[exam] || GovPresets.EXAM.SSC;

        reqTitle.textContent = exam;
        reqList.innerHTML = `
            <li><strong>Photo:</strong> ${currentConfig.PHOTO.minSizeKB || 0} - ${currentConfig.PHOTO.maxSizeKB} KB (JPG)</li>
            <li><strong>Signature:</strong> ${currentConfig.SIGN.minSizeKB || 0} - ${currentConfig.SIGN.maxSizeKB} KB (JPG)</li>
        `;
    }

    examSelect.addEventListener('change', updateRequirements);
    updateRequirements(); // Init

    // --- PHOTO HANDLING ---
    const dropPhoto = document.getElementById('drop-photo');
    const inputPhoto = document.getElementById('input-photo');

    Utils.setupDragAndDrop(dropPhoto, inputPhoto, async (file) => {
        // Simple compress to max size logic
        Utils.showToast("Optimizing for " + examSelect.value + "...", "info");
        try {
            const blob = await GovUtils.compressImageToTarget(
                file,
                currentConfig.PHOTO.maxSizeKB,
                'image/jpeg'
            );

            const url = URL.createObjectURL(blob);
            document.getElementById('img-photo').src = url;
            document.getElementById('info-photo').textContent = Utils.formatBytes(blob.size);
            document.getElementById('result-photo').style.display = 'block';

            document.getElementById('btn-dl-photo').onclick = () => {
                Utils.downloadBlob(blob, `${examSelect.value}_Photo.jpg`);
            };

        } catch (err) {
            Utils.showToast("Error: " + err, "error");
        }
    });

    // --- SIG HANDLING ---
    const dropSig = document.getElementById('drop-sig');
    const inputSig = document.getElementById('input-sig');

    Utils.setupDragAndDrop(dropSig, inputSig, async (file) => {
        Utils.showToast("Optimizing Signature...", "info");
        try {
            const blob = await GovUtils.compressImageToTarget(
                file,
                currentConfig.SIGN.maxSizeKB,
                'image/jpeg'
            );

            const url = URL.createObjectURL(blob);
            document.getElementById('img-sig').src = url;
            document.getElementById('info-sig').textContent = Utils.formatBytes(blob.size);
            document.getElementById('result-sig').style.display = 'block';

            document.getElementById('btn-dl-sig').onclick = () => {
                Utils.downloadBlob(blob, `${examSelect.value}_Signature.jpg`);
            };

        } catch (err) {
            Utils.showToast("Error: " + err, "error");
        }
    });

});
