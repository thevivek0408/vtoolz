import { TextUtils } from '../../js/text/text-utils.js';
import '../../js/utils/common.js'; // Just for global utils

const input = document.getElementById('text-input');

// Debounce for performance on huge texts
let timeout;
input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(analyze, 100);
});

function analyze() {
    const text = input.value;

    document.getElementById('count-words').textContent = TextUtils.countWords(text);
    document.getElementById('count-chars').textContent = TextUtils.countChars(text);
    document.getElementById('count-sentences').textContent = TextUtils.countSentences(text);
    document.getElementById('count-paragraphs').textContent = TextUtils.countParagraphs(text);

    const time = TextUtils.calculateReadTime(text);
    let timeString = `${time.totalSeconds}s`;
    if (time.minutes > 0) timeString = `${time.minutes}m ${time.seconds}s`;
    document.getElementById('read-time').textContent = timeString;
}