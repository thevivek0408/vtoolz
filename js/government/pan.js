import { Utils } from '../utils/common.js';
import { GovPresets } from './presets.js';
import { GovUtils } from './gov-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // --- PAN PHOTO LOGIC ---
    const dropPhoto = document.getElementById('drop-photo');
    const inputPhoto = document.getElementById('input-photo');

    Utils.setupDragAndDrop(dropPhoto, inputPhoto, handlePhoto);

    async function handlePhoto(file) {
        if (!file.type.match('image/jpeg')) {
            Utils.showToast('Please upload a JPG/JPEG file.', 'error');
            return;
        }

        const preset = GovPresets.PAN.PHOTO;

        // Show Original
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('img-photo-orig').src = e.target.result;
            document.getElementById('info-photo-orig').innerText = `${Utils.formatBytes(file.size)}`;
            document.getElementById('result-photo').style.display = 'block';
        };
        reader.readAsDataURL(file);

        try {
            Utils.showToast('Compressing Photo...', 'info');
            const processedBlob = await GovUtils.compressImageToTarget(
                file,
                preset.maxSizeKB,
                preset.format,
                preset.width,
                preset.height
            );

            // Show Result
            const processedUrl = URL.createObjectURL(processedBlob);
            document.getElementById('img-photo-new').src = processedUrl;
            document.getElementById('info-photo-new').innerText = `${Utils.formatBytes(processedBlob.size)}`;

            const dlBtn = document.getElementById('dl-photo');
            dlBtn.href = processedUrl;
            dlBtn.download = `PAN_Photo_${Date.now()}.jpg`;

            // Acceptance Check
            const check = GovUtils.predictAcceptance(processedBlob.size / 1024, preset.maxSizeKB, processedBlob.type, preset.format);
            const badge = document.getElementById('badge-photo');
            badge.className = `status-badge status-${check.status}`;
            badge.innerHTML = `<i class="fas fa-check-circle"></i> ${check.msg}`;

            Utils.showToast('Photo Processed!', 'success');
        } catch (err) {
            console.error(err);
            Utils.showToast('Error processing photo', 'error');
        }
    }

    // --- PAN SIGNATURE LOGIC ---
    const dropSig = document.getElementById('drop-sig');
    const inputSig = document.getElementById('input-sig');

    Utils.setupDragAndDrop(dropSig, inputSig, handleSig);

    async function handleSig(file) {
        if (!file.type.match('image/jpeg')) {
            Utils.showToast('Please upload a JPG/JPEG file.', 'error');
            return;
        }

        const preset = GovPresets.PAN.SIGNATURE;

        // Show Original
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('img-sig-orig').src = e.target.result;
            document.getElementById('info-sig-orig').innerText = `${Utils.formatBytes(file.size)}`;
            document.getElementById('result-sig').style.display = 'block';
        };
        reader.readAsDataURL(file);

        try {
            Utils.showToast('Compressing Signature...', 'info');
            // Signature: resize logic is trickier, we usually just want to limit size. 
            // Passing null width/height means keep original dims (or maybe limit max width if needed in utils)
            // But GovUtils currently uses original dims if null.
            const processedBlob = await GovUtils.compressImageToTarget(
                file,
                preset.maxSizeKB,
                preset.format,
                null,
                null
            );

            // Show Result
            const processedUrl = URL.createObjectURL(processedBlob);
            document.getElementById('img-sig-new').src = processedUrl;
            document.getElementById('info-sig-new').innerText = `${Utils.formatBytes(processedBlob.size)}`;

            const dlBtn = document.getElementById('dl-sig');
            dlBtn.href = processedUrl;
            dlBtn.download = `PAN_Signature_${Date.now()}.jpg`;

            // Acceptance Check
            const check = GovUtils.predictAcceptance(processedBlob.size / 1024, preset.maxSizeKB, processedBlob.type, preset.format);
            const badge = document.getElementById('badge-sig');
            badge.className = `status-badge status-${check.status}`;
            badge.innerHTML = `<i class="fas fa-check-circle"></i> ${check.msg}`;

            Utils.showToast('Signature Processed!', 'success');
        } catch (err) {
            console.error(err);
            Utils.showToast('Error processing signature', 'error');
        }
    }

    // --- PAN DOCUMENT LOGIC ---
    const dropDoc = document.getElementById('drop-doc');
    const inputDoc = document.getElementById('input-doc');

    Utils.setupDragAndDrop(dropDoc, inputDoc, handleDoc);

    function handleDoc(file) {
        const preset = GovPresets.PAN.DOCUMENT;
        document.getElementById('result-doc').style.display = 'block';

        const sizeKB = file.size / 1024;
        const msg = `${file.name} (${Utils.formatBytes(file.size)})`;
        document.getElementById('info-doc').innerText = msg;

        const badge = document.getElementById('badge-doc');

        if (sizeKB <= preset.maxSizeKB) {
            badge.className = `status-badge status-success`;
            badge.innerHTML = `<i class="fas fa-check-circle"></i> Ready for Upload (Under 1MB)`;
        } else {
            badge.className = `status-badge status-fail`;
            badge.innerHTML = `<i class="fas fa-times-circle"></i> Too Large (>1MB)`;
        }
    }

    // --- PANIC BUTTON ---
    document.getElementById('panic-btn').addEventListener('click', () => {
        // Clear inputs
        if (inputPhoto) inputPhoto.value = '';
        if (inputSig) inputSig.value = '';
        if (inputDoc) inputDoc.value = '';

        // Hide results
        document.getElementById('result-photo').style.display = 'none';
        document.getElementById('result-sig').style.display = 'none';
        document.getElementById('result-doc').style.display = 'none';

        // Clear standard images sources to free memory?
        // Basic page reload is safest "Panic" but clearing DOM is smoother
        document.getElementById('img-photo-new').src = '';
        document.getElementById('img-sig-new').src = '';

        Utils.showToast('All Data Cleared', 'info');
    });

});
