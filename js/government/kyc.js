import { Utils } from '../utils/common.js';
import { GovUtils } from './gov-utils.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- RESUME ---
    const dropResume = document.getElementById('drop-resume');
    const inputResume = document.getElementById('input-resume');

    Utils.setupDragAndDrop(dropResume, inputResume, (file) => {
        const sizeKB = file.size / 1024;
        const msg = `${file.name} (${Utils.formatBytes(file.size)})`;
        document.getElementById('resume-info').innerText = msg;
        document.getElementById('result-resume').style.display = 'block';

        const badge = document.getElementById('resume-status');
        if (sizeKB <= 1024) { // 1MB typically
            badge.className = 'status-badge status-success';
            badge.textContent = "Perfect Size (<1MB)";
        } else if (sizeKB <= 2048) {
            badge.className = 'status-badge status-warning';
            badge.textContent = "Acceptable for some (<2MB)";
        } else {
            badge.className = 'status-badge status-fail';
            badge.textContent = "Too Large (>2MB)";
        }
    });

    // --- JOB PHOTO ---
    const dropPhoto = document.getElementById('drop-job-photo');
    const inputPhoto = document.getElementById('input-job-photo');

    Utils.setupDragAndDrop(dropPhoto, inputPhoto, async (file) => {
        try {
            Utils.showToast("Compressing...", "info");
            const blob = await GovUtils.compressImageToTarget(file, 100, 'image/jpeg'); // 100KB target

            const url = URL.createObjectURL(blob);
            document.getElementById('img-job-photo').src = url;
            document.getElementById('info-job-photo').innerText = Utils.formatBytes(blob.size);
            document.getElementById('result-job-photo').style.display = 'block';

            document.getElementById('btn-dl-job-photo').onclick = () => {
                Utils.downloadBlob(blob, `Job_Photo.jpg`);
            };

        } catch (err) {
            console.error(err);
            Utils.showToast("Error", "error");
        }
    });

});
