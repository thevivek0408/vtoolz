import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('markdown-input');
    const preview = document.getElementById('markdown-preview');
    const wordCount = document.getElementById('word-count');
    const clearBtn = document.getElementById('clear-btn');
    const downloadMdBtn = document.getElementById('download-md-btn');
    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    const importFile = document.getElementById('import-file');

    // Configure marked
    marked.setOptions({
        breaks: true, // Enable GFM line breaks
        gfm: true,
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    });

    function updatePreview() {
        const text = input.value;

        // Sanitize and Parse
        const rawHtml = marked.parse(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml);

        preview.innerHTML = cleanHtml;

        // Update stats
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCount.textContent = words;

        // Save to local storage
        localStorage.setItem('vtoolz_md_content', text);
    }

    // Debounce
    let timeout;
    input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(updatePreview, 300);
    });

    // Initial Load
    const saved = localStorage.getItem('vtoolz_md_content');
    if (saved) {
        input.value = saved;
        updatePreview();
    } else {
        // Default Welcome Text
        input.value = `# Welcome to VtoolZ Markdown Editor\n\nStart typing on the left to see the **preview** on the right.\n\n- [x] Real-time rendering\n- [x] Syntax Highlighting\n- [x] Secure (Client-side)\n\n\`\`\`javascript\nconsole.log("Hello World");\n\`\`\``;
        updatePreview();
    }

    // Helper to insert markdown from toolbar
    window.insertMarkdown = (prefix, suffix) => {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        input.value = before + prefix + selected + suffix + after;

        // Restore cursor
        input.selectionStart = start + prefix.length;
        input.selectionEnd = end + prefix.length;
        input.focus();

        updatePreview();
    };

    // Actions
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the editor?')) {
            input.value = '';
            updatePreview();
        }
    });

    downloadMdBtn.addEventListener('click', () => {
        Utils.downloadFile(input.value, `document-${Date.now()}.md`, 'text/markdown');
    });

    downloadHtmlBtn.addEventListener('click', () => {
        const page = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>VtoolZ Markdown Export</title>
<style>
body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
pre code { background: transparent; padding: 0; }
blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 15px; color: #666; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px; }
img { max-width: 100%; }
</style>
</head>
<body>
${preview.innerHTML}
</body>
</html>`;
        Utils.downloadFile(page, `document-${Date.now()}.html`, 'text/html');
    });

    copyHtmlBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(preview.innerHTML);
        Utils.showToast('HTML copied to clipboard!', 'success');
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            input.value = e.target.result;
            updatePreview();
        };
        reader.readAsText(file);
    });
});
