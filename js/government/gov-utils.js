/**
 * Shared Utilities for Government Tools
 */
import { Utils } from '../utils/common.js';

export const GovUtils = {

    /**
     * Compress image to target size (iterative approximation)
     * @param {File} file - Input file
     * @param {number} targetKB - Max size in KB
     * @param {string} format - 'image/jpeg' etc.
     * @param {number} width - Optional resize width
     * @param {number} height - Optional resize height
     */
    async compressImageToTarget(file, targetKB, format = 'image/jpeg', width = null, height = null) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = width || img.width;
                    let h = height || img.height;

                    // Maintain aspect ratio if one dim missing? Or force if both provided
                    // For now assume if provided, we resize (e.g. passport)

                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);

                    let minQ = 0.1;
                    let maxQ = 1.0;
                    let quality = 0.9;
                    let resultBlob = null;

                    // Binary search for quality
                    const attempt = (iteration) => {
                        if (iteration > 6) { // Max iterations
                            resolve(resultBlob);
                            return;
                        }

                        canvas.toBlob((blob) => {
                            if (!blob) { reject("Canvas error"); return; }

                            const sizeKB = blob.size / 1024;

                            if (sizeKB <= targetKB && sizeKB > targetKB * 0.8) {
                                // Sweet spot (80-100% of target)
                                resolve(blob);
                            } else if (sizeKB > targetKB) {
                                // Too big, lower quality
                                maxQ = quality;
                                quality = (minQ + maxQ) / 2;
                                attempt(iteration + 1);
                            } else {
                                // Too small (if we care about min size, valid, but usually small is ok unless specific min)
                                // But if it's WAY too small, maybe increase Q
                                resultBlob = blob; // Keep best passing so far
                                minQ = quality;
                                quality = (minQ + maxQ) / 2;
                                attempt(iteration + 1);
                            }
                        }, format, quality);
                    };

                    attempt(0);
                };
            };
        });
    },

    /**
     * Predict acceptance chance
     */
    predictAcceptance(currentKB, maxKB, currentFormat, requiredFormat) {
        if (currentFormat !== requiredFormat && requiredFormat !== 'any') return { status: 'fail', msg: 'Wrong Format' };
        if (currentKB > maxKB) return { status: 'fail', msg: 'Too Large' };
        if (currentKB < maxKB * 0.1) return { status: 'warning', msg: 'Suspiciously Small' }; // e.g. 1KB photo
        return { status: 'success', msg: 'Likely to be Accepted' };
    }
};
