import { showToast } from '../../../js/utils/common.js';

const regexInput = document.getElementById('regex-input');
const flagsInput = document.getElementById('flags-input');
const testString = document.getElementById('test-string');
const highlights = document.getElementById('highlights');
const matchList = document.getElementById('match-list');

function runRegex() {
    const pattern = regexInput.value;
    const flags = flagsInput.value;
    const text = testString.value;

    // Sync scroll
    highlights.scrollTop = testString.scrollTop;
    highlights.scrollLeft = testString.scrollLeft;

    try {
        if (!pattern) {
            highlights.innerHTML = text.replace(/</g, '&lt;');
            matchList.innerHTML = '<div style="padding:10px; color:var(--text-muted)">Enter a pattern</div>';
            return;
        }

        const regex = new RegExp(pattern, flags);

        // Highlighting Logic
        // Note: Simple highlighting for "g" flag. Complex nested groups are hard in overlays.
        // We'll replace matches with <mark> tags for the overlay.

        let html = text.replace(/</g, '&lt;'); // Escape HTML

        // If global flag is present, we can use string.replace with a callback
        // If not, we only highlight the first match

        // We need to be careful not to break HTML entities or corrupt the structure.
        // A safer way is to find indices and build the HTML.

        const matches = [];
        let match;

        // Reset lastIndex if global
        if (regex.global) {
            regex.lastIndex = 0;
        }

        // Collect matches
        if (regex.global) {
            while ((match = regex.exec(text)) !== null) {
                matches.push(match);
                if (match.index === regex.lastIndex) regex.lastIndex++; // Avoid infinite loop
            }
        } else {
            match = regex.exec(text);
            if (match) matches.push(match);
        }

        renderMatches(matches);
        renderHighlights(text, matches);

        regexInput.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    } catch (e) {
        regexInput.style.borderColor = '#ff4757';
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'padding:10px; color:#ff4757';
        errDiv.textContent = `Invalid Regex: ${e.message}`;
        matchList.innerHTML = '';
        matchList.appendChild(errDiv);
        highlights.innerHTML = text.replace(/</g, '&lt;');
    }
}

function renderMatches(matches) {
    if (matches.length === 0) {
        matchList.innerHTML = '<div style="padding:10px; color:var(--text-muted)">No matches found</div>';
        return;
    }

    matchList.innerHTML = matches.map((m, i) => `
        <div class="match-item">
            <span class="match-index">#${i + 1}</span>
            <span class="match-content">${m[0].replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
            ${m.length > 1 ? `<br><small style="color:var(--text-muted)">Groups: ${m.slice(1).map(g => String(g).replace(/</g, '&lt;').replace(/>/g, '&gt;')).join(', ')}</small>` : ''}
        </div>
    `).join('');
}

function renderHighlights(text, matches) {
    // Reconstruct text with <mark> tags
    // We must traverse backwards to not mess up indices? Or just build a new string.
    // But matches might overlap (though JS Regex matches don't usually overlap in a single pass).
    // Logic: Iterate matches, slice text.

    if (matches.length === 0) {
        highlights.innerHTML = text.replace(/</g, '&lt;');
        return;
    }

    let lastIdx = 0;
    let html = '';

    matches.forEach(m => {
        // Text before match
        html += text.substring(lastIdx, m.index).replace(/</g, '&lt;');
        // Match
        html += `<mark>${m[0].replace(/</g, '&lt;')}</mark>`;
        lastIdx = m.index + m[0].length;
    });

    // Remaining text
    html += text.substring(lastIdx).replace(/</g, '&lt;');

    // Handle newlines for overlay alignment
    html = html.replace(/\n/g, '<br>'); // Simple adjustment, might need more for exact textarea match? 
    // Textarea uses pre-wrap, div uses pre-wrap. <br> is safe.

    highlights.innerHTML = html;
}

// Events
regexInput.addEventListener('input', runRegex);
flagsInput.addEventListener('input', runRegex);
testString.addEventListener('input', runRegex);
testString.addEventListener('scroll', () => {
    highlights.scrollTop = testString.scrollTop;
    highlights.scrollLeft = testString.scrollLeft;
});

// Init
runRegex();