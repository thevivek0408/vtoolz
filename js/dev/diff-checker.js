import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const btnCompare = document.getElementById('btn-compare');
    const btnClear = document.getElementById('btn-clear');
    const resultDisplay = document.getElementById('result-display');

    btnCompare.addEventListener('click', () => {
        const val1 = text1.value;
        const val2 = text2.value;

        if (!val1 && !val2) {
            Utils.showToast("Please enter text to compare", "warning");
            return;
        }

        const diff = Diff.diffWords(val1, val2);
        const fragment = document.createDocumentFragment();

        diff.forEach((part) => {
            // green for additions, red for deletions
            // grey for common parts
            const span = document.createElement('span');
            span.style.color = part.added ? 'var(--success-color)' : part.removed ? 'var(--error-color)' : 'var(--text-color)';
            span.className = part.added ? 'diff-added' : part.removed ? 'diff-removed' : '';
            span.textContent = part.value;
            fragment.appendChild(span);
        });

        resultDisplay.innerHTML = '';
        resultDisplay.appendChild(fragment);
        resultDisplay.style.display = 'block';
    });

    btnClear.addEventListener('click', () => {
        text1.value = '';
        text2.value = '';
        resultDisplay.innerHTML = '';
        resultDisplay.style.display = 'none';
    });
});
