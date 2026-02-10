import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const regexInput = document.getElementById('regex-input');
    const flagsInput = document.getElementById('flags-input');
    const testString = document.getElementById('test-string');
    const matchDisplay = document.getElementById('match-display');
    const errorMsg = document.getElementById('regex-error');

    function update() {
        const pattern = regexInput.value;
        const flags = flagsInput.value;
        const text = testString.value;

        errorMsg.textContent = '';

        if (!pattern) {
            matchDisplay.textContent = text;
            return;
        }

        try {
            const regex = new RegExp(pattern, flags);

            // Highlight matches
            // We use replace with a callback to wrap matches in span
            // But we need to be careful with overlapping matches or infinite loops if regex is empty/bad

            // Safe approach: split and rejoin? 
            // Or purely string replacement for display?
            // Simple approach for now:

            let html = text.replace(regex, (match) => {
                if (!match) return ''; // handle zero-width assertions gracefully-ish
                return `<span class="highlight">${match}</span>`;
            });

            // Escape HTML first? Ideally yes, but here we process raw text -> HTML.
            // Better: Escape text first, THEN highlight.
            // Complex to allow regex to work on unescaped text but display escaped.

            // Let's do: Find all matches with exec, store indices.
            // Then build HTML string manually.

            const matches = [];
            let match;
            // Reset lastIndex because of 'g' flag persistence
            // But we created new RegExp every time so it should be fine?
            // Only if 'g' is present.

            // Note: 'g' is needed for matchAll or loop exec. 
            // If user didn't type 'g', we might only find first.

            if (!flags.includes('g')) {
                // Force global for multiple highlighting? Or respect user intention?
                // Users usually expect "find all" in testers.
                // But let's stick to strict behavior.
            }

            // Actually, replace() works for global highlighting nicely.
            // To prevent XSS self-XSS, we should escape HTML chars in 'text' first, 
            // BUT regex needs to run on raw text.

            // Compromise:
            const safeText = Utils.escapeHtml(text);
            // This breaks indices.

            // Simplest XSS-safe way:
            // 1. exec() to find ranges on raw text
            // 2. build output string segment by segment, escaping content

            let lastIndex = 0;
            let output = '';

            // Re-instantiate with 'g' to find all for highlighting purposes?
            // Standard regex testers force 'g' or allow user.
            // If user omits 'g', we only highlight first match. Correct behavior.

            const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
            // Wait, if we force 'g', we might change behavior of ^ $.

            // Let's use the USER provided regex for match detection.

            let m;
            // Prevent infinite loop on zero-length matches (e.g. /.*/)
            // RegExp.exec loop needs care.

            while ((m = regex.exec(text)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                // Append text before match (escaped)
                output += Utils.escapeHtml(text.substring(lastIndex, m.index));

                // Append match (escaped + wrapped)
                output += `<span class="highlight">${Utils.escapeHtml(m[0])}</span>`;

                lastIndex = m.index + m[0].length;

                if (!flags.includes('g')) break; // Stop if not global
            }

            output += Utils.escapeHtml(text.substring(lastIndex));

            matchDisplay.innerHTML = output;

        } catch (e) {
            errorMsg.textContent = e.message;
            matchDisplay.textContent = text;
        }
    }

    regexInput.addEventListener('input', update);
    flagsInput.addEventListener('input', update);
    testString.addEventListener('input', update);

    // Add escapeHtml to Utils if missing (it usually is in common.js but verify)
    // Basic implementation here if needed
    if (!Utils.escapeHtml) {
        Utils.escapeHtml = (text) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, function (m) { return map[m]; });
        };
    }
});
