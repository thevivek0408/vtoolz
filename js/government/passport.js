import { Utils } from '../utils/common.js';
import { GovPresets } from './presets.js';
import { GovUtils } from './gov-utils.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- PHOTO LOGIC ---
    const inputPhoto = document.getElementById('input-photo');
    const dropPhoto = document.getElementById('drop-photo');
    const imgPhoto = document.getElementById('img-photo-preview');
    const gridOverlay = document.getElementById('grid-overlay');
    const btnGrid = document.getElementById('btn-toggle-grid');
    const btnProcessPhoto = document.getElementById('btn-process-photo');
    const photoStatus = document.getElementById('photo-status');
    let currentPhotoFile = null;

    Utils.setupDragAndDrop(dropPhoto, inputPhoto, (file) => {
        currentPhotoFile = file;
        const url = URL.createObjectURL(file);
        imgPhoto.src = url;
        document.getElementById('result-photo').style.display = 'block';
        gridOverlay.style.display = 'block'; // Show grid by default
    });

    btnGrid.addEventListener('click', () => {
        gridOverlay.style.display = gridOverlay.style.display === 'none' ? 'block' : 'none';
    });

    btnProcessPhoto.addEventListener('click', async () => {
        if (!currentPhotoFile) return;

        const preset = GovPresets.PASSPORT.PHOTO;

        try {
            Utils.showToast("Processing Passport Photo...", "info");

            // 3.5cm x 4.5cm approx ratio.
            // We use preset width/height
            const blob = await GovUtils.compressImageToTarget(
                currentPhotoFile,
                preset.maxSizeKB,
                preset.format,
                preset.width,
                preset.height
            );

            // Double check min size
            const sizeKB = blob.size / 1024;
            let msg = `Final Size: ${sizeKB.toFixed(2)} KB`;

            if (sizeKB < preset.minSizeKB) {
                // If too small, we might want to warn, but usually smaller is fine unless pixelated.
                // However, Passport Seva sometimes rejects < 10KB.
                msg += " (Warning: Might be too small)";
                photoStatus.className = "text-warning";
            } else {
                msg += " (Compliance Range OK)";
                photoStatus.className = "text-success";
            }
            photoStatus.textContent = msg;

            Utils.downloadBlob(blob, `Passport_Photo.jpg`);
            Utils.showToast("Downloaded!", "success");

        } catch (err) {
            console.error(err);
            Utils.showToast("Error: " + err, "error");
        }
    });


    // --- SIGNATURE LOGIC ---
    const inputSig = document.getElementById('input-sig');
    const dropSig = document.getElementById('drop-sig');
    const imgSig = document.getElementById('img-sig-preview');
    const btnProcessSig = document.getElementById('btn-process-sig');
    let currentSigFile = null;

    Utils.setupDragAndDrop(dropSig, inputSig, (file) => {
        currentSigFile = file;
        const url = URL.createObjectURL(file);
        imgSig.src = url;
        document.getElementById('result-sig').style.display = 'block';
    });

    btnProcessSig.addEventListener('click', async () => {
        if (!currentSigFile) return;
        const preset = GovPresets.PASSPORT.SIGNATURE;

        try {
            Utils.showToast("Compressing Signature...", "info");
            const blob = await GovUtils.compressImageToTarget(
                currentSigFile,
                preset.maxSizeKB,
                preset.format
            );

            Utils.downloadBlob(blob, `Passport_Signature.jpg`);
            Utils.showToast("Signature Ready!", "success");
        } catch (err) {
            console.error(err);
            Utils.showToast("Error processing signature", "error");
        }
    });

});
